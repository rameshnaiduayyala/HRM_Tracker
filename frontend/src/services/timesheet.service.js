import { api } from './request';

export const timesheetApi = {
  submit: (startDate, endDate) => api.post('/timesheets', { startDate, endDate }),
  list: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.status) params.append('status', filters.status);
    const queryString = params.toString();
    return api.get(`/timesheets${queryString ? `?${queryString}` : ''}`);
  },
  get: (id) => api.get(`/timesheets/${id}`),
  review: (id, status, comments) => api.post(`/timesheets/${id}/review`, { status, comments }),
};
