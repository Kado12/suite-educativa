import api from './axios';

export const importsService = {
  downloadTemplate: async (type: string) => {
    const res = await api.get(`/api/imports/template/${type}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url; link.download = `plantilla-${type}.xlsx`; link.click();
    window.URL.revokeObjectURL(url);
  },
  importFile: (type: string, file: File, extra: Record<string, string> = {}) => {
    const fd = new FormData();
    fd.append('file', file);
    Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
    return api.post(`/api/imports/${type}`, fd).then((r) => r.data);
  },
};