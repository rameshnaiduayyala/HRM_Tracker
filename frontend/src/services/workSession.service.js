import { api } from './request';

export const workSessionApi = {
  start: () => api.post('/work-sessions/start'),
  stop: () => api.post('/work-sessions/stop'),
  heartbeat: (data) => api.post('/work-sessions/heartbeat', data),
  screenshot: (data) => api.post('/work-sessions/screenshot', data),
};
