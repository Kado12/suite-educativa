import React, { useState, useEffect, useCallback } from 'react';
import {
  BellAlertIcon,
  ClockIcon,
  UserIcon,
  EnvelopeIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, Badge } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { useNotifications } from '../../../context/NotificationContext';
import { passwordResetService, type PasswordResetRequest } from '../../../api/passwordReset.service';

export const ResetRequestsTab: React.FC = () => {
  const { success, error } = useToast();
  const { refreshPendingCount } = useNotifications();
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await passwordResetService.listPending();
      setRequests(data);
    } catch {
      error('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    load();
  }, [load]);

  const handleResolve = async (request: PasswordResetRequest) => {
    if (!window.confirm(`¿Resetear la contraseña de ${request.userName || request.userEmail}?\n\nSe generará una contraseña segura y se enviará por correo.`)) {
      return;
    }
    setResolvingId(request.id);
    try {
      await passwordResetService.resolve(request.id);
      success('✅ Contraseña restablecida y correo enviado');
      await load();
      await refreshPendingCount();
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al resetear');
    } finally {
      setResolvingId(null);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} d`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Banner de información */}
      <Card style={{
        background: 'linear-gradient(135deg, var(--color-warning-50) 0%, var(--color-warning-100) 100%)',
        border: '1px solid var(--color-warning-300)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'var(--color-warning-200)',
            color: 'var(--color-warning-700)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <BellAlertIcon style={{ width: 22, height: 22 }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-warning-900)' }}>
              Panel de solicitudes de acceso
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-warning-800)', margin: 0 }}>
              Cuando un usuario solicita recuperar su contraseña, aparece aquí en tiempo real.
              Al hacer clic en "Resetear contraseña" se genera una nueva contraseña segura y se envía por correo al usuario.
            </p>
          </div>
        </div>
      </Card>

      {/* Lista de solicitudes */}
      <Card className="p-0">
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-neutral-200)',
          background: 'var(--color-neutral-50)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BellAlertIcon style={{ width: 20, height: 20, color: 'var(--color-warning-600)' }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-neutral-700)' }}>
              Solicitudes pendientes
            </span>
            <Badge color="warning">{requests.length}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>

        {requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-neutral-400)' }}>
            <CheckCircleIcon style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.4, color: 'var(--color-success-400)' }} />
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4, color: 'var(--color-neutral-600)' }}>
              No hay solicitudes pendientes
            </div>
            <div style={{ fontSize: 'var(--text-sm)' }}>
              Cuando un usuario solicite recuperar su contraseña, aparecerá aquí automáticamente.
            </div>
          </div>
        ) : (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {requests.map((req) => (
              <div
                key={req.id}
                style={{
                  padding: 16,
                  background: 'var(--color-neutral-50)',
                  border: '1px solid var(--color-neutral-200)',
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 240 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-warning-100) 0%, var(--color-warning-200) 100%)',
                    color: 'var(--color-warning-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    <UserIcon style={{ width: 20, height: 20 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-neutral-900)', marginBottom: 2 }}>
                      {req.userName || 'Usuario'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 2 }}>
                      <EnvelopeIcon style={{ width: 12, height: 12 }} />
                      {req.userEmail}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                      <ClockIcon style={{ width: 12, height: 12 }} />
                      {formatRelativeTime(req.createdAt)}
                    </div>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  onClick={() => handleResolve(req)}
                  isLoading={resolvingId === req.id}
                  loadingText="Procesando..."
                  icon={<KeyIcon />}
                >
                  Resetear contraseña
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Nota de seguridad */}
      <div style={{
        padding: 12,
        background: 'var(--color-info-50)',
        border: '1px solid var(--color-info-200)',
        borderRadius: 8,
        fontSize: 'var(--text-xs)',
        color: 'var(--color-info-700)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
      }}>
        <ExclamationTriangleIcon style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
        <span>
          <strong>Importante:</strong> La contraseña se genera automáticamente y se envía de forma segura al usuario.
          No se almacena en la base de datos. Solo tú y el usuario verán la contraseña en el correo.
        </span>
      </div>
    </div>
  );
};