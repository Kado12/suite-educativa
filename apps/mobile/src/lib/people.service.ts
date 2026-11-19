import { api } from './api';

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dni: string | null;
  docType: 'DNI' | 'CARNET' | string;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  gender: string | null;
  isActive: boolean;
  enrollments: {
    id: string;
    status: string;
    section: {
      id: string;
      name: string;
      turno: { id: string; name: string };
      classroom: {
        id: string;
        name: string;
        sede: { id: string; name: string };
      };
    };
  }[];
  _count?: { enrollments: number };
}

export interface Sede { id: string; name: string }
export interface Turno { id: string; name: string }

export const peopleService = {
  listStudents: (search?: string) =>
    api.get<Student[]>('/api/people/students', search ? `?search=${encodeURIComponent(search)}` : ''),

  getStudentEnrollments: (id: string) =>
    api.get<any[]>(`/api/people/students/${id}/enrollments`),
};

export const academicService = {
  listSedes: () => api.get<Sede[]>('/api/academic/sedes'),
  listTurnos: () => api.get<Turno[]>('/api/academic/turnos'),
};