import api from './axios';

export const dashboardService = {
  getOverview: () => api.get('/api/dashboard/overview').then((r) => r.data),
};