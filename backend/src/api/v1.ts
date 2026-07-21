import { Router } from 'express';
import tenantsRoutes from '../modules/tenants/tenants.routes';
import authRoutes from '../modules/authentication/auth.routes';
import companiesRoutes from '../modules/companies/companies.routes';
import employeesRoutes from '../modules/employees/employees.routes';
import attendanceRoutes from '../modules/attendance/attendance.routes';
import workSessionsRoutes from '../modules/workSessions/workSessions.routes';
import tasksRoutes from '../modules/tasks/tasks.routes';
import plansRoutes from '../modules/tenants/plans.routes';
import devicesRoutes from '../modules/devices/devices.routes';

// New SaaS Module Routes
import departmentsRoutes from '../modules/departments/departments.routes';
import teamsRoutes from '../modules/teams/teams.routes';
import leaveRoutes from '../modules/leave/leave.routes';
import notificationsRoutes from '../modules/notifications/notifications.routes';
import announcementsRoutes from '../modules/announcements/announcements.routes';
import settingsRoutes from '../modules/settings/settings.routes';
import reportsRoutes from '../modules/reports/reports.routes';

const router = Router();

router.use('/tenants', tenantsRoutes);
router.use('/auth', authRoutes);
router.use('/companies', companiesRoutes);
router.use('/employees', employeesRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/work-sessions', workSessionsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/plans', plansRoutes);
router.use('/devices', devicesRoutes);

// Register New Modules
router.use('/departments', departmentsRoutes);
router.use('/teams', teamsRoutes);
router.use('/leave', leaveRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/announcements', announcementsRoutes);
router.use('/settings', settingsRoutes);
router.use('/reports', reportsRoutes);

export default router;
