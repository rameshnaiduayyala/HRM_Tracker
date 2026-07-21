import { api } from './request';

export const teamApi = {
  list:   (companyId) => api.get(`/teams?companyId=${companyId}`),
  get:    (id, departmentId) => api.get(`/teams/${id}?departmentId=${departmentId}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id, departmentId) => api.delete(`/teams/${id}?departmentId=${departmentId}`),
};
