import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCircleIcon, KeyIcon, EnvelopeIcon, UserIcon, 
  ShieldCheckIcon, InformationCircleIcon, CheckCircleIcon,
  EyeIcon, EyeSlashIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Input, Badge } from '@suite/ui';
import { ROLE_LABELS } from '@suite/shared';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../api/auth.service';

export const ProfilePage: React.FC = () => {
  const { user, logout, refreshProfile } = useAuth();
  const { success, error } = useToast();
  const nav = useNavigate();

  const [tab, setTab] = useState<'profile' | 'password'>('profile');
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    emailPrefix: user?.email.split('@')[0] || '',
  });

  // Password form
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authService.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        emailPrefix: profile.emailPrefix,
      });
      success('✅ Perfil actualizado correctamente');
      await refreshProfile();
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.newPassword.length < 6) {
      error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      error('Las contraseñas no coinciden');
      return;
    }
    
    setSaving(true);
    try {
      await authService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      success('✅ Contraseña actualizada. Por favor inicia sesión nuevamente.');
      logout();
      nav('/login');
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const ROLE_COLORS: Record<string, 'danger' | 'primary' | 'success' | 'warning'> = {
    ADMIN: 'danger',
    INFORMATICO: 'primary',
    COORDINADOR: 'success',
    SECRETARIA: 'warning',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mi Perfil</h1>
          <p className="page-subtitle">Administra tus datos personales y seguridad de la cuenta</p>
        </div>
      </div>

      {/* Header con información del usuario */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div 
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary-100) 0%, var(--color-primary-200) 100%)',
              color: 'var(--color-primary-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-2xl)',
              fontWeight: 700,
              flexShrink: 0,
              border: '3px solid var(--color-primary-50)',
            }}
          >
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
                {user.firstName} {user.lastName}
              </h2>
              <Badge color={ROLE_COLORS[user.role] || 'neutral'}>
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
              <EnvelopeIcon style={{ width: 16, height: 16 }} />
              {user.email}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs modernos */}
      <div style={{ 
        display: 'inline-flex', 
        gap: 4, 
        marginBottom: 24, 
        background: 'var(--color-neutral-100)', 
        padding: 4, 
        borderRadius: 12 
      }}>
        <button
          onClick={() => setTab('profile')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8,
            fontSize: 'var(--text-sm)', fontWeight: 600, transition: 'all 0.2s',
            background: tab === 'profile' ? 'var(--color-neutral-0)' : 'transparent',
            color: tab === 'profile' ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
            boxShadow: tab === 'profile' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <UserCircleIcon style={{ width: 18, height: 18 }} />
          Datos personales
        </button>
        <button
          onClick={() => setTab('password')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8,
            fontSize: 'var(--text-sm)', fontWeight: 600, transition: 'all 0.2s',
            background: tab === 'password' ? 'var(--color-neutral-0)' : 'transparent',
            color: tab === 'password' ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
            boxShadow: tab === 'password' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <KeyIcon style={{ width: 18, height: 18 }} />
          Cambiar contraseña
        </button>
      </div>

      {/* ============== TAB: DATOS PERSONALES ============== */}
      {tab === 'profile' && (
        <Card>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4, color: 'var(--color-neutral-900)' }}>
              Información personal
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', margin: 0 }}>
              Actualiza tu nombre y email de contacto
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <Input
                label="Nombres"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                required
                icon={<UserIcon />}
                placeholder="Ej: Juan Carlos"
              />
              <Input
                label="Apellidos"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                required
                icon={<UserIcon />}
                placeholder="Ej: Pérez García"
              />
            </div>
            
            <div>
              <label className="input-label">Email institucional</label>
              <div style={{ display: 'flex', gap: 0 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ 
                    position: 'absolute', 
                    left: 12, 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: 'var(--color-neutral-400)',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <EnvelopeIcon style={{ width: 18, height: 18 }} />
                  </span>
                  <input
                    type="text"
                    value={profile.emailPrefix}
                    onChange={(e) => setProfile({ ...profile, emailPrefix: e.target.value })}
                    className="input"
                    style={{ 
                      flex: 1, 
                      borderRadius: '8px 0 0 8px',
                      paddingLeft: 40,
                    }}
                    required
                    placeholder="usuario"
                  />
                </div>
                <div style={{
                  padding: '8px 16px', 
                  background: 'var(--color-neutral-100)',
                  border: '1px solid var(--color-neutral-300)', 
                  borderLeft: 'none',
                  borderRadius: '0 8px 8px 0', 
                  fontSize: 'var(--text-sm)', 
                  color: 'var(--color-neutral-600)',
                  display: 'flex', 
                  alignItems: 'center',
                  fontWeight: 500,
                }}>
                  @suite.edu
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 6 }}>
                Tu email completo será: <strong>{profile.emailPrefix}@suite.edu</strong>
              </div>
            </div>

            <div style={{ 
              padding: 12, 
              background: 'var(--color-info-50)', 
              border: '1px solid var(--color-info-200, var(--color-neutral-200))',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: 'var(--text-sm)',
              color: 'var(--color-info-700, var(--color-neutral-700))'
            }}>
              <InformationCircleIcon style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2 }} />
              <span>Los cambios se aplicarán inmediatamente a tu cuenta.</span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button 
                type="submit" 
                isLoading={saving}
                loadingText="Guardando..."
                icon={<CheckCircleIcon />}
              >
                Guardar cambios
              </Button>
              <Button 
                variant="secondary" 
                type="button" 
                onClick={() => nav(-1)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ============== TAB: CONTRASEÑA ============== */}
      {tab === 'password' && (
        <Card>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4, color: 'var(--color-neutral-900)' }}>
              Seguridad de la cuenta
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', margin: 0 }}>
              Cambia tu contraseña periódicamente para mantener tu cuenta segura
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
            <div>
              <Input
                label="Contraseña actual"
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                required
                icon={<KeyIcon />}
                placeholder="Ingresa tu contraseña actual"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  marginTop: 6,
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-primary-600)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 500,
                }}
              >
                {showCurrentPassword ? <EyeSlashIcon style={{ width: 14, height: 14 }} /> : <EyeIcon style={{ width: 14, height: 14 }} />}
                {showCurrentPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              </button>
            </div>

            <div style={{ height: 1, background: 'var(--color-neutral-200)', margin: '8px 0' }} />

            <div>
              <Input
                label="Nueva contraseña"
                type={showNewPassword ? 'text' : 'password'}
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                required
                minLength={6}
                icon={<KeyIcon />}
                placeholder="Mínimo 6 caracteres"
                hint="Debe tener al menos 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  marginTop: 6,
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-primary-600)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 500,
                }}
              >
                {showNewPassword ? <EyeSlashIcon style={{ width: 14, height: 14 }} /> : <EyeIcon style={{ width: 14, height: 14 }} />}
                {showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              </button>
            </div>

            <div>
              <Input
                label="Confirmar nueva contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                required
                icon={<KeyIcon />}
                placeholder="Repite la nueva contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  marginTop: 6,
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-primary-600)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 500,
                }}
              >
                {showConfirmPassword ? <EyeSlashIcon style={{ width: 14, height: 14 }} /> : <EyeIcon style={{ width: 14, height: 14 }} />}
                {showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              </button>
            </div>

            <div style={{ 
              padding: 12, 
              background: 'var(--color-warning-50)', 
              border: '1px solid var(--color-warning-200, var(--color-neutral-200))',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: 'var(--text-sm)',
              color: 'var(--color-warning-700, var(--color-neutral-700))'
            }}>
              <ShieldCheckIcon style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2 }} />
              <span>
                <strong>Importante:</strong> Al cambiar tu contraseña, deberás iniciar sesión nuevamente en todos tus dispositivos.
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button 
                type="submit" 
                isLoading={saving}
                loadingText="Cambiando..."
                icon={<KeyIcon />}
                disabled={!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword}
              >
                Cambiar contraseña
              </Button>
              <Button 
                variant="secondary" 
                type="button" 
                onClick={() => nav(-1)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};