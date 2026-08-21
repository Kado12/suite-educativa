import api from './axios';

export const auditService = {
  list: (filters: any = {}) => api.get('/api/audit', { params: filters }).then((r) => r.data),
  getStats: (days?: number) => api.get('/api/audit/stats', { params: { days } }).then((r) => r.data),
};