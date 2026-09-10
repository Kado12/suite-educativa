import api from './axios';

export interface PasswordResetRequest {
  id: string;
  userEmail: string;
  userName: string | null;
  status: 'PENDING' | 'RESOLVED' | 'EXPIRED';
  resolvedById: string | null;
  resolvedAt: string | null;
  createdAt: string;
  expiresAt: string;
}

export const passwordResetService = {
  requestReset: (email: string) =>
    api.post('/api/password-reset/request', { email }).then((r) => r.data),

  listPending: () =>
    api.get<PasswordResetRequest[]>('/api/password-reset/pending').then((r) => r.data),

  getPendingCount: () =>
    api.get<{ count: number }>('/api/password-reset/pending/count').then((r) => r.data),

  resolve: (id: string) =>
    api.post(`/api/password-reset/${id}/resolve`, {}).then((r) => r.data),
};