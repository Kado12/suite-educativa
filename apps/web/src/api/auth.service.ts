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
};