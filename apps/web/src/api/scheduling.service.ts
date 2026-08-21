import api from './axios';

export const schedulingService = {
  generate: (blockId: string) => api.post(`/api/scheduling/generate/${blockId}`).then((r) => r.data),
  getResult: (blockId: string) => api.get(`/api/scheduling/result/${blockId}`).then((r) => r.data),
  clear: (blockId: string) => api.delete(`/api/scheduling/clear/${blockId}`).then((r) => r.data),
};