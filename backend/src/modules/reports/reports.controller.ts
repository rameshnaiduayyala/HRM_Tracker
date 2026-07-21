import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service';
import { BadRequestError } from '../../shared/errors';

export class ReportsController {
  async getAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.query.companyId as string;
      const startStr = req.query.startDate as string;
      const endStr = req.query.endDate as string;

      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }

      const startDate = startStr ? new Date(startStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = endStr ? new Date(endStr) : new Date();

      const report = await reportsService.getAttendanceReport(companyId, startDate, endDate);
      return res.status(200).json({
        status: 'success',
        data: { report },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getProductivity(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.query.companyId as string;
      const startStr = req.query.startDate as string;
      const endStr = req.query.endDate as string;

      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }

      const startDate = startStr ? new Date(startStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = endStr ? new Date(endStr) : new Date();

      const report = await reportsService.getProductivityReport(companyId, startDate, endDate);
      return res.status(200).json({
        status: 'success',
        data: { report },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }

      const report = await reportsService.getTasksReport(companyId);
      return res.status(200).json({
        status: 'success',
        data: { report },
      });
    } catch (error) {
      return next(error);
    }
  }

  async exportAttendanceCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.query.companyId as string;
      const startStr = req.query.startDate as string;
      const endStr = req.query.endDate as string;

      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }

      const startDate = startStr ? new Date(startStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = endStr ? new Date(endStr) : new Date();

      const report = await reportsService.getAttendanceReport(companyId, startDate, endDate);

      let csv = 'Employee ID,Name,Designation,Clock In,Clock Out,Work Hours,Break Minutes,Overtime Minutes\n';
      report.forEach((emp) => {
        if (emp.records.length === 0) {
          csv += `"${emp.employeeNum}","${emp.name}","${emp.designation || '-'}","No records","-",0,0,0\n`;
        } else {
          emp.records.forEach((rec) => {
            csv += `"${emp.employeeNum}","${emp.name}","${emp.designation || '-'}","${rec.clockIn instanceof Date ? rec.clockIn.toISOString() : rec.clockIn}","${rec.clockOut instanceof Date ? rec.clockOut.toISOString() : (rec.clockOut || 'Running')}",${rec.workDurationHours},${rec.breakDurationMinutes},${rec.overtimeMinutes}\n`;
          });
        }
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${Date.now()}.csv`);
      return res.status(200).send(csv);
    } catch (error) {
      return next(error);
    }
  }

  async getAiAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }

      const report = await reportsService.getAiAnalytics(companyId);
      return res.status(200).json({
        status: 'success',
        data: { report },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const reportsController = new ReportsController();

