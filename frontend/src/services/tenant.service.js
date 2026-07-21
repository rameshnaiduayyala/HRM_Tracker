import { api } from './request';

export const tenantApi = {
  create: (data) => api.post('/tenants', data),
  list: () => api.get('/tenants'),
  updateStatus: (id, status) => api.patch(`/tenants/${id}/status`, { status }),
  update: (id, data) => api.patch(`/tenants/${id}`, data),
  subscribe: (companyId, planId) => api.post(`/tenants/companies/${companyId}/subscribe`, { planId }),
};
