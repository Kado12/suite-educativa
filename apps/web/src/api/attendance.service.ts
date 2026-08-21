import api from './axios';

export const attendanceService = {
  getDaily: (date: string, sedeId?: string) =>
    api.get('/api/attendance/daily', { params: { date, sedeId } }).then((r) => r.data),
  saveDaily: (date: string, records: any[]) =>
    api.post('/api/attendance/daily', { date, records }).then((r) => r.data),
  getWeekly: (teacherProfileId: string, periodId: string, weekNumber: number) =>
    api.get('/api/attendance/weekly', { params: { teacherProfileId, periodId, weekNumber } }).then((r) => r.data),
};