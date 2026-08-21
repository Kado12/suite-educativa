import api from "./axios";
import type { AppRole } from "@suite/shared";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AppRole;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data;
  },

  async getProfile(): Promise<AuthUser> {
    const res = await api.get('/api/auth/profile');
    return res.data;
  },

  updateProfile: async (data: { firstName?: string; lastName?: string; emailPrefix?: string }) =>
    api.patch('/api/auth/profile', data).then((r) => r.data),
  changePassword: async (data: { currentPassword: string; newPassword: string }) =>
    api.post('/api/auth/change-password', data).then((r) => r.data),
};