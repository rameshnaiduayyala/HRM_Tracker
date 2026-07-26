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

// SaaS Module Routes
import departmentsRoutes from '../modules/departments/departments.routes';
import teamsRoutes from '../modules/teams/teams.routes';
import leaveRoutes from '../modules/leave/leave.routes';
import notificationsRoutes from '../modules/notifications/notifications.routes';
import announcementsRoutes from '../modules/announcements/announcements.routes';
import settingsRoutes from '../modules/settings/settings.routes';
import reportsRoutes from '../modules/reports/reports.routes';
import timesheetsRoutes from '../modules/timesheets/timesheets.routes';
import systemRoutes from '../modules/system/system.routes';

import { authenticate } from '../modules/authentication/auth.middleware';
import { requireModule } from '../modules/authorization/module.middleware';

const router = Router();

// Core Platform & Administrative Routes
router.use('/system', systemRoutes);
router.use('/tenants', tenantsRoutes);
router.use('/auth', authRoutes);
router.use('/plans', plansRoutes);
router.use('/companies', authenticate, companiesRoutes);
router.use('/employees', authenticate, employeesRoutes);
router.use('/notifications', authenticate, notificationsRoutes);
router.use('/announcements', authenticate, announcementsRoutes);
router.use('/settings', authenticate, settingsRoutes);

// Module 1: HRM (Human Resource Management)
router.use('/departments', authenticate, requireModule('HRM'), departmentsRoutes);
router.use('/teams', authenticate, requireModule('HRM'), teamsRoutes);
router.use('/attendance', authenticate, requireModule('HRM'), attendanceRoutes);
router.use('/leave', authenticate, requireModule('HRM'), leaveRoutes);
router.use('/timesheets', authenticate, requireModule('HRM'), timesheetsRoutes);

// Module 2: PROJECTS & TASKS (Jira-like Management)
router.use('/tasks', authenticate, requireModule('PROJECTS_TASKS'), tasksRoutes);
router.use('/reports', authenticate, requireModule('PROJECTS_TASKS'), reportsRoutes);

// Module 3: WORK TRACKER (Desktop Sessions & Monitoring)
router.use('/work-sessions', authenticate, requireModule('WORK_TRACKER'), workSessionsRoutes);
router.use('/devices', authenticate, requireModule('WORK_TRACKER'), devicesRoutes);

export default router;
