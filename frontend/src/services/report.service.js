import { api } from './request';

export const reportApi = {
  getAttendance: (companyId, startDate, endDate) => 
    api.get(`/reports/attendance?companyId=${companyId}&startDate=${startDate}&endDate=${endDate}`),
  getProductivity: (companyId, startDate, endDate) => 
    api.get(`/reports/productivity?companyId=${companyId}&startDate=${startDate}&endDate=${endDate}`),
  getTasks: (companyId) => 
    api.get(`/reports/tasks?companyId=${companyId}`),
  getAiSummary: (companyId) => 
    api.get(`/reports/ai-summary?companyId=${companyId}`),
};
