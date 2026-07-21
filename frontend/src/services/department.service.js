import { api } from './request';

export const departmentApi = {
  list:   (companyId) => api.get(`/departments?companyId=${companyId}`),
  get:    (id, companyId) => api.get(`/departments/${id}?companyId=${companyId}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id, companyId) => api.delete(`/departments/${id}?companyId=${companyId}`),
};
