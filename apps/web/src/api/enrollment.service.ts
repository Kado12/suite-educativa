import api from './axios';

export const enrollmentService = {
  create: (d: any) => api.post('/api/enrollments', d).then((r) => r.data),
  list: (filters: any = {}) => api.get('/api/enrollments', { params: filters }).then((r) => r.data),
  stats: (periodId?: string) => api.get('/api/enrollments/stats', { params: { periodId } }).then((r) => r.data),
  updateStatus: (id: string, status: string) => api.patch(`/api/enrollments/${id}/status`, { status }).then((r) => r.data),
  delete: (id: string) => api.delete(`/api/enrollments/${id}`).then((r) => r.data),

  checkStudent: (dni: string, periodId: string) =>
    api.get('/api/enrollments/check-student', { params: { dni, periodId } }).then((r) => r.data),
  suggestSection: (sedeId: string, turnoId: string) =>
    api.get('/api/enrollments/suggest-section', { params: { sedeId, turnoId } }).then((r) => r.data),
  createWizard: (d: any) => api.post('/api/enrollments/wizard', d).then((r) => r.data),
  updateActiveSection: (studentId: string, sectionId: string) =>
    api.patch('/api/enrollments/active/section', { studentId, sectionId }).then((r) => r.data),
  changePaymentPlan: (enrollmentId: string, planId: string, forceRestore: boolean) =>
    api.patch(`/api/enrollments/${enrollmentId}/change-plan`, { planId, forceRestore }).then((r) => r.data),
  getActiveEnrollment: (studentId: string) =>
    api.get(`/api/enrollments/active/${studentId}`).then((r) => r.data),
  exportExcel: async (filters: any = {}) => {
    const res = await api.get('/api/enrollments/export', { params: filters, responseType: 'blob' });
    const url = window.URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url; link.download = 'matriculas.xlsx'; link.click();
    window.URL.revokeObjectURL(url);
  },
  reEnrollmentPending: (periodId: string) => api.get('/api/enrollments/re-enrollment-pending', { params: { periodId } }).then((r) => r.data),
};