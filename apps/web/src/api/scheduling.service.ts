import api from './axios';

export const schedulingService = {
  generate: (blockId: string) => api.post(`/api/scheduling/generate/${blockId}`).then((r) => r.data),
  getResult: (blockId: string) => api.get(`/api/scheduling/result/${blockId}`).then((r) => r.data),
  clear: (blockId: string) => api.delete(`/api/scheduling/clear/${blockId}`).then((r) => r.data),
  exportExcel: async (blockId: string, filters: any = {}) => {
    const res = await api.get(`/api/scheduling/export/${blockId}`, { params: filters, responseType: 'blob' });
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement('a'); a.href = url; a.download = 'horario.xlsx'; a.click();
    window.URL.revokeObjectURL(url);
  },
  validate: (blockId: string) => api.get(`/api/scheduling/validate/${blockId}`).then((r) => r.data),
  listSessions: (blockId: string) => api.get(`/api/scheduling/sessions/${blockId}`).then((r) => r.data),
  updateSession: (id: string, d: any) => api.patch(`/api/scheduling/sessions/${id}`, d).then((r) => r.data),
  createSession: (d: any) => api.post('/api/scheduling/sessions', d).then((r) => r.data),
  deleteSession: (id: string) => api.delete(`/api/scheduling/sessions/${id}`).then((r) => r.data),
};