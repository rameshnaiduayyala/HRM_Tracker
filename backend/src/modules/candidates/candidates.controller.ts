import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateOfferLetterHTML } from '../../shared/utils/documentTemplates';
import { BadRequestError, NotFoundError } from '../../shared/errors';

const prisma = new PrismaClient();

const createCandidateSchema = z.object({
  companyId: z.string().uuid(),
  departmentId: z.string().uuid().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  designation: z.string().min(1, 'Designation is required'),
  ctc: z.number().positive('CTC must be positive'),
  expectedJoiningDate: z.string().min(1, 'Expected joining date is required'),
});

export class CandidatesController {
  async listCandidates(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyId } = req.query;
      if (!companyId) {
        throw new BadRequestError('companyId is required');
      }

      const candidates = await prisma.candidate.findMany({
        where: { companyId: companyId as string },
        include: {
          department: { select: { id: true, name: true } },
          onboardingTasks: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ status: 'success', data: { candidates } });
    } catch (err) {
      return next(err);
    }
  }

  async createCandidate(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createCandidateSchema.parse(req.body);
      const candidate = await prisma.candidate.create({
        data: {
          companyId: parsed.companyId,
          departmentId: parsed.departmentId,
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          email: parsed.email,
          phone: parsed.phone,
          designation: parsed.designation,
          ctc: parsed.ctc,
          expectedJoiningDate: new Date(parsed.expectedJoiningDate),
          offerStatus: 'OFFER_SENT',
          onboardingTasks: {
            create: [
              { title: 'Submit Identification Proof (Passport/Aadhaar)', category: 'DOCUMENTATION' },
              { title: 'Submit Previous Employment & Relieving Proof', category: 'DOCUMENTATION' },
              { title: 'IT Hardware & Work Laptop Allocation', category: 'HARDWARE' },
              { title: 'Corporate Email & Slack Account Provisioning', category: 'IT_ACCESS' },
              { title: 'Company Orientation & HR Onboarding Session', category: 'TRAINING' },
            ],
          },
        },
        include: {
          department: true,
          onboardingTasks: true,
        },
      });

      return res.status(201).json({ status: 'success', data: { candidate } });
    } catch (err) {
      return next(err);
    }
  }

  async getOfferDetailsByToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const candidate = await prisma.candidate.findUnique({
        where: { offerToken: token },
        include: {
          company: { select: { id: true, name: true, logo: true } },
          department: { select: { id: true, name: true } },
          onboardingTasks: true,
        },
      });

      if (!candidate) {
        throw new NotFoundError('Candidate offer not found or invalid token');
      }

      return res.status(200).json({ status: 'success', data: { candidate } });
    } catch (err) {
      return next(err);
    }
  }

  async renderOfferLetterHTML(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const candidate = await prisma.candidate.findUnique({
        where: { id },
        include: { company: true, department: true },
      });

      if (!candidate) {
        throw new NotFoundError('Candidate not found');
      }

      const settings = await prisma.companySettings.findUnique({
        where: { companyId: candidate.companyId },
      });

      const html = generateOfferLetterHTML({
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        designation: candidate.designation,
        department: candidate.department ? candidate.department.name : 'General',
        companyName: candidate.company.name,
        companyLogo: candidate.company.logo || undefined,
        ctc: candidate.ctc,
        expectedJoiningDate: candidate.expectedJoiningDate.toISOString(),
        offerToken: candidate.offerToken,
        customHeader: settings?.customOfferHeader || undefined,
        customTerms: settings?.customOfferTerms || undefined,
        customSignatory: settings?.customOfferSignatory || undefined,
      });

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    } catch (err) {
      return next(err);
    }
  }

  async respondToOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const { action } = req.body; // ACCEPT or REJECT

      if (!['ACCEPT', 'REJECT'].includes(action)) {
        throw new BadRequestError('Invalid action. Must be ACCEPT or REJECT.');
      }

      const candidate = await prisma.candidate.findUnique({ where: { offerToken: token } });
      if (!candidate) throw new NotFoundError('Candidate not found');

      const updated = await prisma.candidate.update({
        where: { id: candidate.id },
        data: { offerStatus: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED' },
      });

      return res.status(200).json({ status: 'success', data: { candidate: updated } });
    } catch (err) {
      return next(err);
    }
  }

  async convertToEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { employeeNum: customEmpNum, joiningDate: customJoiningDate, designation: customDesignation, managerId, roleName } = req.body || {};

      const candidate = await prisma.candidate.findUnique({
        where: { id },
        include: { company: true },
      });

      if (!candidate) throw new NotFoundError('Candidate not found');
      if (candidate.offerStatus !== 'ACCEPTED') {
        throw new BadRequestError('Candidate must accept the offer letter in portal before HR can complete joining conversion');
      }

      const employeeNum = customEmpNum || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      const joiningDate = customJoiningDate ? new Date(customJoiningDate) : candidate.expectedJoiningDate;
      const designation = customDesignation || candidate.designation;
      const defaultPassword = 'Password@123';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      // Create User & Employee in transaction
      const result = await prisma.$transaction(async (tx) => {
        let role = await tx.role.findFirst({
          where: { name: roleName || 'EMPLOYEE' },
        });

        const user = await tx.user.create({
          data: {
            email: candidate.email,
            passwordHash,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            tenantId: candidate.company.tenantId,
            roleId: role ? role.id : undefined,
          },
        });

        const employee = await tx.employee.create({
          data: {
            employeeNum,
            userId: user.id,
            companyId: candidate.companyId,
            departmentId: candidate.departmentId,
            designation,
            joiningDate,
            managerId: managerId || undefined,
            status: 'ACTIVE',
          },
        });

        const updatedCandidate = await tx.candidate.update({
          where: { id: candidate.id },
          data: {
            offerStatus: 'JOINED',
            joinedEmployeeId: employee.id,
          },
        });

        // Relink candidate onboarding tasks to new employee
        await tx.onboardingTask.updateMany({
          where: { candidateId: candidate.id },
          data: { employeeId: employee.id },
        });

        return { user, employee, candidate: updatedCandidate };
      });

      return res.status(201).json({
        status: 'success',
        message: 'Candidate converted to active employee successfully',
        data: {
          employee: result.employee,
          loginCredentials: {
            email: candidate.email,
            temporaryPassword: defaultPassword,
          },
        },
      });
    } catch (err) {
      return next(err);
    }
  }

  async updateOnboardingTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const { status } = req.body; // PENDING, IN_PROGRESS, COMPLETED

      const task = await prisma.onboardingTask.update({
        where: { id: taskId },
        data: { status },
      });

      return res.status(200).json({ status: 'success', data: { task } });
    } catch (err) {
      return next(err);
    }
  }
}
