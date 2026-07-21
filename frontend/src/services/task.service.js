import { api } from './request';

export const taskApi = {
  listProjects: (companyId) => api.get(`/tasks/projects?companyId=${companyId}`),
  createProject: (name, companyId) => api.post('/tasks/projects', { name, companyId }),
  listTasks: (projectId) => api.get(`/tasks?projectId=${projectId}`),
  createTask: (data) => api.post('/tasks', data),
};
