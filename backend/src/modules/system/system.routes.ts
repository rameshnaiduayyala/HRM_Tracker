import { Router } from 'express';
import { getSystemHealth, getAuditLogs } from './system.controller';
import { authenticate } from '../authentication/auth.middleware';
import { requireSuperAdmin } from '../authorization/authz.middleware';

const router = Router();

// Platform Health Endpoint (Super Admin)
router.get('/health', authenticate, requireSuperAdmin, getSystemHealth);

// Enterprise Audit Logs Endpoint (Super Admin & Admins)
router.get('/audit-logs', authenticate, getAuditLogs);

export default router;
