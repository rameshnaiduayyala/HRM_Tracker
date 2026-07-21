import { api } from './request';

export const companyApi = {
  list:   () => api.get('/companies'),
  get:    (id) => api.get(`/companies/${id}`),
  create: (name) => api.post('/companies', { name }),
  update: (id, name) => api.put(`/companies/${id}`, { name }),
  delete: (id) => api.delete(`/companies/${id}`),
};
