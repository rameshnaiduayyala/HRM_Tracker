import { api } from './request';

export const attendanceApi = {
  status: () => api.get('/attendance/status'),
  clockIn: () => api.post('/attendance/clock-in'),
  clockOut: () => api.post('/attendance/clock-out'),
};
