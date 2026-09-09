import api from './axios';

export const settingsService = {
  getPublic: () => api.get('/api/settings/public').then((r) => r.data),
  getAll: () => api.get('/api/settings').then((r) => r.data),
  update: (data: Record<string, string>) => api.patch('/api/settings', data).then((r) => r.data),
  reset: (key: string) => api.delete(`/api/settings/${encodeURIComponent(key)}`).then((r) => r.data),
  uploadLogo: (which: 'main' | 'second', file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/api/settings/logo/${which}`, fd).then((r) => r.data);
  },
};