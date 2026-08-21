import api from './axios';

export const paymentsService = {
  list: (filters: any = {}) => api.get('/api/payments', { params: filters }).then((r) => r.data),
  stats: (periodId?: string) => api.get('/api/payments/stats', { params: { periodId } }).then((r) => r.data),
  markPaid: (id: string, d: any) => api.patch(`/api/payments/${id}/paid`, d).then((r) => r.data),
  markOverdue: (id: string) => api.patch(`/api/payments/${id}/overdue`).then((r) => r.data),
  reset: (id: string) => api.patch(`/api/payments/${id}/reset`).then((r) => r.data),
};