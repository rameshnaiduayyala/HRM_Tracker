import { api } from './request';

export const notificationApi = {
  list:       () => api.get('/notifications'),
  markRead:   (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const announcementApi = {
  list:   (companyId) => api.get(`/announcements?companyId=${companyId}`),
  get:    (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

