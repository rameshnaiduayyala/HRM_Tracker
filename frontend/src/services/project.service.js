import { api } from './request';

export const projectApi = {
  list:            (companyId) => api.get(`/tasks/projects?companyId=${companyId}`),
  get:             (id) => api.get(`/tasks/projects/${id}`),
  create:          (data) => api.post('/tasks/projects', data),
  update:          (id, data) => api.put(`/tasks/projects/${id}`, data),
  delete:          (id) => api.delete(`/tasks/projects/${id}`),
  addMember:       (id, data) => api.post(`/tasks/projects/${id}/members`, data),
  removeMember:    (id, memberId) => api.delete(`/tasks/projects/${id}/members/${memberId}`),
  createMilestone: (id, data) => api.post(`/tasks/projects/${id}/milestones`, data),
  toggleMilestone: (milestoneId) => api.put(`/tasks/milestones/${milestoneId}`),
};

export const tasksEnhancedApi = {
  list: (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        cleanParams[key] = params[key];
      }
    });
    const q = new URLSearchParams(cleanParams).toString();
    return api.get(`/tasks?${q}`);
  },
  get:        (id) => api.get(`/tasks/${id}`),
  create:     (data) => api.post('/tasks', data),
  update:     (id, data) => api.put(`/tasks/${id}`, data),
  delete:     (id) => api.delete(`/tasks/${id}`),
  addComment: (id, data) => api.post(`/tasks/${id}/comments`, data),
  addTimeLog: (id, data) => api.post(`/tasks/${id}/time-logs`, data),
};

export const settingsApi = {
  get:    (companyId) => api.get(`/settings?companyId=${companyId}`),
  update: (companyId, data) => api.put(`/settings?companyId=${companyId}`, data),
};
