import { api } from './request';

export const companyApi = {
  list:   () => api.get('/companies'),
  get:    (id) => api.get(`/companies/${id}`),
  create: (name) => api.post('/companies', { name }),
  update: (id, data) => api.put(`/companies/${id}`, typeof data === 'string' ? { name: data } : data),
  uploadLogo: (id, logoBase64) => api.post(`/companies/${id}/logo`, { logoBase64 }),
  delete: (id) => api.delete(`/companies/${id}`),
};
