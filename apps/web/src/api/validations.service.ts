import api from './axios';

export const validationsService = {
  getWeekStatus: (periodId: string, weekNumber: number) =>
    api.get('/api/validations', { params: { periodId, weekNumber } }).then((r) => r.data),
  setStatus: (d: any) => api.post('/api/validations', d).then((r) => r.data),
};