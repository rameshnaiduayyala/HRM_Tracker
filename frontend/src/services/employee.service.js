import { api } from './request';

export const employeeApi = {
  list:   (companyId) => api.get(`/employees?companyId=${companyId}`),
  get:    (id, companyId) => api.get(`/employees/${id}?companyId=${companyId}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.patch(`/employees/${id}`, data),
  delete: (id, companyId) => api.delete(`/employees/${id}?companyId=${companyId}`),
  reset:  (id) => api.post(`/employees/${id}/reset`),
};

export const payslipApi = {
  list: (companyId) => api.get(`/employees/payslips?companyId=${companyId}`),
  create: (data) => api.post('/employees/payslips', data),
  delete: (id) => api.delete(`/employees/payslips/${id}`),
};
