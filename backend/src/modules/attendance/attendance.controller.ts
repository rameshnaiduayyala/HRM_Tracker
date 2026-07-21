import { Request, Response, NextFunction } from 'express';
import { attendanceService } from './attendance.service';

export class AttendanceController {
  async status(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await attendanceService.getStatus(req.userId!);
      return res.status(200).json({
        status: 'success',
        data: status,
      });
    } catch (error) {
      return next(error);
    }
  }

  async clockIn(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await attendanceService.clockIn(req.userId!);
      return res.status(200).json({
        status: 'success',
        data: { record },
      });
    } catch (error) {
      return next(error);
    }
  }

  async clockOut(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await attendanceService.clockOut(req.userId!);
      return res.status(200).json({
        status: 'success',
        data: { record },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const attendanceController = new AttendanceController();
