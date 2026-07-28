import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { generateRelievingLetterHTML, generateExperienceLetterHTML, generateRelievingLetterEmailHTML } from '../../shared/utils/documentTemplates';
import { BadRequestError, NotFoundError } from '../../shared/errors';
import { sendEmail } from '../../shared/utils/email';

const prisma = new PrismaClient();

const initiateOffboardingSchema = z.object({
  employeeId: z.string().uuid(),
  companyId: z.string().uuid(),
  resignationDate: z.string(),
  lastWorkingDay: z.string(),
  reason: z.string().optional(),
  noticePeriodDays: z.number().default(30),
});

export class OffboardingController {
  async listRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyId } = req.query;
      if (!companyId) throw new BadRequestError('companyId is required');

      const records = await prisma.offboardingRecord.findMany({
        where: { companyId: companyId as string },
        include: {
          employee: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
              department: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ status: 'success', data: { records } });
    } catch (err) {
      return next(err);
    }
  }

  async initiateOffboarding(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = initiateOffboardingSchema.parse(req.body);

      const record = await prisma.offboardingRecord.create({
        data: {
          employeeId: parsed.employeeId,
          companyId: parsed.companyId,
          resignationDate: new Date(parsed.resignationDate),
          lastWorkingDay: new Date(parsed.lastWorkingDay),
          reason: parsed.reason,
          noticePeriodDays: parsed.noticePeriodDays,
          status: 'CLEARANCE_PENDING',
        },
        include: {
          employee: {
            include: { user: true, department: true },
          },
        },
      });

      return res.status(201).json({ status: 'success', data: { record } });
    } catch (err) {
      return next(err);
    }
  }

  async updateClearance(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { itClearance, hrClearance, financeClearance, exitInterviewNotes } = req.body;

      const record = await prisma.offboardingRecord.findUnique({ where: { id } });
      if (!record) throw new NotFoundError('Offboarding record not found');

      const newIt = itClearance !== undefined ? itClearance : record.itClearance;
      const newHr = hrClearance !== undefined ? hrClearance : record.hrClearance;
      const newFin = financeClearance !== undefined ? financeClearance : record.financeClearance;

      const allClear = newIt && newHr && newFin;

      const updated = await prisma.offboardingRecord.update({
        where: { id },
        data: {
          itClearance: newIt,
          hrClearance: newHr,
          financeClearance: newFin,
          exitInterviewNotes: exitInterviewNotes || record.exitInterviewNotes,
          status: allClear ? 'APPROVED' : 'CLEARANCE_PENDING',
        },
        include: {
          employee: { include: { user: true, department: true } },
        },
      });

      return res.status(200).json({ status: 'success', data: { record: updated } });
    } catch (err) {
      return next(err);
    }
  }

  async completeOffboardingAndDeactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const record = await prisma.offboardingRecord.findUnique({
        where: { id },
        include: { employee: true },
      });

      if (!record) throw new NotFoundError('Offboarding record not found');

      // Update record and set employee status to INACTIVE
      const result = await prisma.$transaction(async (tx) => {
        const completedRecord = await tx.offboardingRecord.update({
          where: { id },
          data: { status: 'COMPLETED' },
        });

        await tx.employee.update({
          where: { id: record.employeeId },
          data: { status: 'INACTIVE' },
        });

        return completedRecord;
      });

      // Send Relieving and Experience Letter Email asynchronously via Mail Broker
      try {
        const fullRecord = await prisma.offboardingRecord.findUnique({
          where: { id },
          include: {
            company: true,
            employee: { include: { user: true, department: true } },
          },
        });

        if (fullRecord) {
          const relievingHtml = generateRelievingLetterEmailHTML({
            employeeName: `${fullRecord.employee.user.firstName} ${fullRecord.employee.user.lastName}`,
            employeeNum: fullRecord.employee.employeeNum,
            designation: fullRecord.employee.designation || 'Team Member',
            department: fullRecord.employee.department ? fullRecord.employee.department.name : 'General',
            companyName: fullRecord.company.name,
            companyLogo: fullRecord.company.logo || undefined,
            joiningDate: fullRecord.employee.joiningDate.toISOString(),
            lastWorkingDay: fullRecord.lastWorkingDay.toISOString(),
            resignationDate: fullRecord.resignationDate.toISOString(),
          });

          sendEmail({
            to: fullRecord.employee.user.email,
            subject: `Official Relieving & Service Letter - ${fullRecord.company.name}`,
            html: relievingHtml,
          });
        }
      } catch (emailErr) {
        console.error('Failed to queue relieving letter email:', emailErr);
      }

      return res.status(200).json({
        status: 'success',
        message: 'Employee offboarding completed and account deactivated',
        data: { record: result },
      });
    } catch (err) {
      return next(err);
    }
  }

  async renderRelievingLetterHTML(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const record = await prisma.offboardingRecord.findUnique({
        where: { id },
        include: {
          company: true,
          employee: {
            include: {
              user: true,
              department: true,
            },
          },
        },
      });

      if (!record) throw new NotFoundError('Offboarding record not found');

      const html = generateRelievingLetterHTML({
        employeeName: `${record.employee.user.firstName} ${record.employee.user.lastName}`,
        employeeNum: record.employee.employeeNum,
        designation: record.employee.designation || 'Team Member',
        department: record.employee.department ? record.employee.department.name : 'General',
        companyName: record.company.name,
        companyLogo: record.company.logo || undefined,
        joiningDate: record.employee.joiningDate.toISOString(),
        lastWorkingDay: record.lastWorkingDay.toISOString(),
        resignationDate: record.resignationDate.toISOString(),
      });

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    } catch (err) {
      return next(err);
    }
  }

  async renderExperienceLetterHTML(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const record = await prisma.offboardingRecord.findUnique({
        where: { id },
        include: {
          company: true,
          employee: {
            include: {
              user: true,
              department: true,
            },
          },
        },
      });

      if (!record) throw new NotFoundError('Offboarding record not found');

      const html = generateExperienceLetterHTML({
        employeeName: `${record.employee.user.firstName} ${record.employee.user.lastName}`,
        employeeNum: record.employee.employeeNum,
        designation: record.employee.designation || 'Team Member',
        department: record.employee.department ? record.employee.department.name : 'General',
        companyName: record.company.name,
        companyLogo: record.company.logo || undefined,
        joiningDate: record.employee.joiningDate.toISOString(),
        lastWorkingDay: record.lastWorkingDay.toISOString(),
        resignationDate: record.resignationDate.toISOString(),
      });

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    } catch (err) {
      return next(err);
    }
  }
}
