import { api } from './request';

export const leaveApi = {
  // Leave Types
  listTypes:   (companyId) => api.get(`/leave/types?companyId=${companyId}`),
  getType:     (id, companyId) => api.get(`/leave/types/${id}?companyId=${companyId}`),
  createType:  (data) => api.post('/leave/types', data),
  updateType:  (id, data) => api.put(`/leave/types/${id}`, data),
  deleteType:  (id, companyId) => api.delete(`/leave/types/${id}?companyId=${companyId}`),

  // Leave Requests
  listRequests:  (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        cleanParams[key] = params[key];
      }
    });
    const q = new URLSearchParams(cleanParams).toString();
    return api.get(`/leave/requests?${q}`);
  },
  getRequest:    (id, companyId) => api.get(`/leave/requests/${id}?companyId=${companyId}`),
  createRequest: (data) => api.post('/leave/requests', data),
  reviewRequest: (id, data) => api.put(`/leave/requests/${id}/review`, data),
  deleteRequest: (id, companyId) => api.delete(`/leave/requests/${id}?companyId=${companyId}`),

  // Leave Balances
  listBalances: (employeeId) => api.get(`/leave/balances?employeeId=${employeeId}`),

  // Holidays
  listHolidays:  (companyId) => api.get(`/leave/holidays?companyId=${companyId}`),
  createHoliday: (data) => api.post('/leave/holidays', data),
  deleteHoliday: (id, companyId) => api.delete(`/leave/holidays/${id}?companyId=${companyId}`),
};
