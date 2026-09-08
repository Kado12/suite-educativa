import api from './axios';

export const reportsService = {
  getConsolidated: (p: any) => api.get('/api/reports/consolidated', { params: p }).then((r) => r.data),
  
  exportExcel: async (p: any) => {
    const res = await api.get('/api/reports/export', { params: p, responseType: 'blob' });
    const url = window.URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consolidado-${p.groupBy}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  },

  downloadPhysicalAttendance: async (params: any) => {
    const res = await api.get('/api/reports/physical-attendance', { params, responseType: 'blob' });
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement('a'); a.href = url; a.download = 'asistencia-fisica.xlsx'; a.click();
    window.URL.revokeObjectURL(url);
  },
};