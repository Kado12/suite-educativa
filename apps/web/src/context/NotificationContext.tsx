import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { passwordResetService } from '../api/passwordReset.service';

interface NotificationContextValue {
  pendingResetRequests: number;
  refreshPendingCount: () => Promise<void>;
  onNewResetRequest: (callback: () => void) => () => void;
  onResetRequestResolved: (callback: () => void) => () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [pendingResetRequests, setPendingResetRequests] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Listeners personalizados (para que componentes puedan suscribirse)
  const [newRequestListeners] = useState<Set<() => void>>(new Set());
  const [resolvedListeners] = useState<Set<() => void>>(new Set());

  const refreshPendingCount = useCallback(async () => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'INFORMATICO')) return;
    try {
      const { count } = await passwordResetService.getPendingCount();
      setPendingResetRequests(count);
    } catch {
      // silencioso
    }
  }, [user]);

  // Conectar WebSocket solo si el usuario es ADMIN o INFORMATICO
  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'INFORMATICO')) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    const newSocket = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('🔌 WebSocket conectado');
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket desconectado');
    });

    newSocket.on('new-password-request', () => {
      refreshPendingCount();
      newRequestListeners.forEach((cb) => cb());
    });

    newSocket.on('password-request-resolved', () => {
      refreshPendingCount();
      resolvedListeners.forEach((cb) => cb());
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, refreshPendingCount, newRequestListeners, resolvedListeners]);

  // Cargar contador inicial al montar o al cambiar usuario
  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  const onNewResetRequest = useCallback((callback: () => void) => {
    newRequestListeners.add(callback);
    return () => {
      newRequestListeners.delete(callback);
    };
  }, [newRequestListeners]);

  const onResetRequestResolved = useCallback((callback: () => void) => {
    resolvedListeners.add(callback);
    return () => {
      resolvedListeners.delete(callback);
    };
  }, [resolvedListeners]);

  return (
    <NotificationContext.Provider
      value={{
        pendingResetRequests,
        refreshPendingCount,
        onNewResetRequest,
        onResetRequestResolved,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  return ctx;
};