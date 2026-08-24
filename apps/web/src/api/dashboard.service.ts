import api from './axios';

export const dashboardService = {
  getOverview: () => api.get('/api/dashboard/overview').then((r) => r.data),
  getCharts: (periodId?: string, sedeId?: string) =>
    api.get('/api/dashboard/charts', { params: { periodId, sedeId } }).then((r) => r.data),
  exportStats: async () => {
    const res = await api.get('/api/dashboard/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url; link.download = 'estadisticas.xlsx'; link.click();
    window.URL.revokeObjectURL(url);
  },
};