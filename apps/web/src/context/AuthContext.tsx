import { hasPermission, Permission } from "@suite/shared";
import { authService, AuthUser } from "../api/auth.service";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (permission: Permission) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const profile = await authService.getProfile();
          setUser(profile);
        } catch {
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const profile = await authService.getProfile();
        setUser(profile);
      } catch {}
    }
  }, []);
  
  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, user: u } = await authService.login(email, password);
    localStorage.setItem('token', accessToken);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const can = useCallback(
    (permission: Permission) => (user ? hasPermission(user.role, permission) : false),
    [user],
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, can, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
