import api from './axios';

export const peopleService = {
  // Alumnos
  listStudents: (search?: string) => api.get('/api/people/students', { params: { search, _t: Date.now() } }).then((r) => r.data),
  createStudent: (d: any) => api.post('/api/people/students', d).then((r) => r.data),
  getStudentEnrollments: (id: string) => api.get(`/api/people/students/${id}/enrollments`).then((r) => r.data),
  updateStudent: (id: string, d: any) => api.patch(`/api/people/students/${id}`, d).then((r) => r.data),
  deleteStudent: (id: string) => api.delete(`/api/people/students/${id}`).then((r) => r.data),
  updateStudentFull: (id: string, d: any) => api.patch(`/api/people/students/${id}/full`, d).then((r) => r.data),
  getPhotoInfo: (id: string, newDni: string) => api.get(`/api/people/students/${id}/photo-info`, { params: { newDni } }).then((r) => r.data),
  exportStudents: async (search?: string) => {
    const res = await api.get('/api/people/students/export', { params: { search }, responseType: 'blob' });
    const url = window.URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url; link.download = 'alumnos.xlsx'; link.click();
    window.URL.revokeObjectURL(url);
  },
  exportAllPhotos: async () => {
    try {
      const res = await api.get('/api/people/students/export-photos', {
        responseType: 'blob',
        timeout: 0, // sin límite: con miles de fotos puede tardar más de 2 min
      });

      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'fotos-alumnos.zip';
      document.body.appendChild(link); // necesario en algunos navegadores (Firefox)
      link.click();
      document.body.removeChild(link);

      // Pequeño delay para asegurar que el navegador inició la descarga
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (err: any) {
      // Con responseType 'blob', el error del backend también llega como Blob
      let message = 'Error al descargar fotos';
      const data = err?.response?.data;

      if (data instanceof Blob) {
        try {
          const parsed = JSON.parse(await data.text());
          message = parsed.message || message;
        } catch {
          // no era JSON, dejamos el mensaje por defecto
        }
      } else if (data?.message) {
        message = data.message;
      }

      throw new Error(message);
    }
  },

  // Docentes
  listTeachers: (search?: string) => api.get('/api/people/teachers', { params: { search } }).then((r) => r.data),
  createTeacher: (d: any) => api.post('/api/people/teachers', d).then((r) => r.data),
  updateTeacher: (profileId: string, d: any) => api.patch(`/api/people/teachers/${profileId}`, d).then((r) => r.data),
  updateTeacherFull: (profileId: string, d: any) => api.patch(`/api/people/teachers/${profileId}/full`, d).then((r) => r.data),
  deleteTeacher: (profileId: string) => api.delete(`/api/people/teachers/${profileId}`).then((r) => r.data),
  setTeacherCourses: (profileId: string, courseIds: string[]) => api.put(`/api/people/teachers/${profileId}/courses`, { courseIds }).then((r) => r.data),
  setTeacherTurnos: (profileId: string, turnoIds: string[]) => api.put(`/api/people/teachers/${profileId}/turnos`, { turnoIds }).then((r) => r.data),
  setTeacherSedes: (profileId: string, sedeIds: string[]) => api.put(`/api/people/teachers/${profileId}/sedes`, { sedeIds }).then((r) => r.data),
  setTeacherUnavailableDays: (profileId: string, days: number[]) => api.put(`/api/people/teachers/${profileId}/unavailable-days`, { days }).then((r) => r.data),
  setTeacherSedeDays: (profileId: string, sedeId: string, days: number[]) =>
    api.put(`/api/people/teachers/${profileId}/sede-days`, { sedeId, days }).then((r) => r.data),
};