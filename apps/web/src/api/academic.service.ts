import api from './axios';

export const academicService = {
  // Sedes
  listSedes: () => api.get('/api/academic/sedes').then((r) => r.data),
  createSede: (name: string) => api.post('/api/academic/sedes', { name }).then((r) => r.data),
  deleteSede: (id: string) => api.delete(`/api/academic/sedes/${id}`).then((r) => r.data),
  // Turnos
  listTurnos: () => api.get('/api/academic/turnos').then((r) => r.data),
  createTurno: (d: any) => api.post('/api/academic/turnos', d).then((r) => r.data),
  deleteTurno: (id: string) => api.delete(`/api/academic/turnos/${id}`).then((r) => r.data),
  // Salones
  createClassroom: (d: { name: string; sedeId: string }) => api.post('/api/academic/classrooms', d).then((r) => r.data),
  deleteClassroom: (id: string) => api.delete(`/api/academic/classrooms/${id}`).then((r) => r.data),
  // Secciones
  listSections: () => api.get('/api/academic/sections').then((r) => r.data),
  createSection: (d: any) => api.post('/api/academic/sections', d).then((r) => r.data),
  deleteSection: (id: string) => api.delete(`/api/academic/sections/${id}`).then((r) => r.data),
  // Áreas/Cursos
  listAreas: () => api.get('/api/academic/areas').then((r) => r.data),
  createArea: (name: string) => api.post('/api/academic/areas', { name }).then((r) => r.data),
  deleteArea: (id: string) => api.delete(`/api/academic/areas/${id}`).then((r) => r.data),
  createCourse: (d: { name: string; areaId: string }) => api.post('/api/academic/courses', d).then((r) => r.data),
  deleteCourse: (id: string) => api.delete(`/api/academic/courses/${id}`).then((r) => r.data),
  // Períodos/Bloques
  listPeriods: () => api.get('/api/academic/periods').then((r) => r.data),
  createPeriod: (d: any) => api.post('/api/academic/periods', d).then((r) => r.data),
  togglePeriod: (id: string, isActive: boolean) => api.patch(`/api/academic/periods/${id}`, { isActive }).then((r) => r.data),
  deletePeriod: (id: string) => api.delete(`/api/academic/periods/${id}`).then((r) => r.data),
  createBlock: (d: any) => api.post('/api/academic/blocks', d).then((r) => r.data),
  deleteBlock: (id: string) => api.delete(`/api/academic/blocks/${id}`).then((r) => r.data),
  addCourseToBlock: (blockId: string, courseId: string) => api.post(`/api/academic/blocks/${blockId}/courses`, { courseId }).then((r) => r.data),
  removeCourseFromBlock: (blockId: string, courseId: string) => api.delete(`/api/academic/blocks/${blockId}/courses/${courseId}`).then((r) => r.data),
};