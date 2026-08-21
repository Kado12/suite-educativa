import api from './axios';
import type { AppRole } from '@suite/shared';

export interface SystemUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AppRole;
  isActive: boolean;
  createdAt: string;
  personId?: string | null;
}

export const usersService = {
  list: () => api.get('/api/users').then((r) => r.data),
  create: (d: any) => api.post('/api/users', d).then((r) => r.data),
  update: (id: string, d: any) => api.patch(`/api/users/${id}`, d).then((r) => r.data),
  remove: (id: string) => api.delete(`/api/users/${id}`).then((r) => r.data),
};