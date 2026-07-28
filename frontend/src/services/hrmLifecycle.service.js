import { api } from './request';

export const hrmLifecycleService = {
  // Candidates & Onboarding
  getCandidates: (companyId) => api.get(`/candidates?companyId=${companyId}`),
  createCandidate: (candidateData) => api.post('/candidates', candidateData),
  getOfferByToken: (token) => api.get(`/candidates/portal/offer/${token}`),
  respondToOffer: (token, action) => api.post(`/candidates/portal/offer/${token}/respond`, { action }),
  convertToEmployee: (candidateId) => api.post(`/candidates/${candidateId}/convert`),
  updateOnboardingTask: (taskId, status) => api.patch(`/candidates/tasks/${taskId}`, { status }),

  // Offboarding & Relieving
  getOffboardingRecords: (companyId) => api.get(`/offboarding?companyId=${companyId}`),
  initiateOffboarding: (data) => api.post('/offboarding/initiate', data),
  updateClearance: (recordId, clearanceData) => api.patch(`/offboarding/${recordId}/clearance`, clearanceData),
  completeOffboarding: (recordId) => api.post(`/offboarding/${recordId}/complete`),

  // Payslips
  getPayslips: (companyId, employeeId) => {
    let url = `/employees/payslips?companyId=${companyId}`;
    if (employeeId) url += `&employeeId=${employeeId}`;
    return api.get(url);
  },
  createPayslip: (payslipData) => api.post('/employees/payslips', payslipData),
  deletePayslip: (payslipId) => api.delete(`/employees/payslips/${payslipId}`),
};
