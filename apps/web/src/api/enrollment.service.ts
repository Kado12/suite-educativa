import api from './axios';

export const enrollmentService = {
  create: (d: any) => api.post('/api/enrollments', d).then((r) => r.data),
  list: (filters: any = {}) => api.get('/api/enrollments', { params: filters }).then((r) => r.data),
  stats: (periodId?: string) => api.get('/api/enrollments/stats', { params: { periodId } }).then((r) => r.data),
  updateStatus: (id: string, status: string) => api.patch(`/api/enrollments/${id}/status`, { status }).then((r) => r.data),
  delete: (id: string) => api.delete(`/api/enrollments/${id}`).then((r) => r.data),
};