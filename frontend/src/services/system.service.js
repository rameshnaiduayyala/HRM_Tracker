import { api } from './request';

export const systemApi = {
  getHealth: () => api.get('/system/health'),
  getAuditLogs: (params) => api.get('/system/audit-logs', { params }),
};
