import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircleIcon, KeyIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input } from '@suite/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../api/auth.service';

export const ProfilePage: React.FC = () => {
  const { user, login, logout, refreshProfile } = useAuth();
  const { success, error } = useToast();
  const nav = useNavigate();

  const [tab, setTab] = useState<'profile' | 'password'>('profile');
  const [saving, setSaving] = useState(false);

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
      success('Perfil actualizado');
      // Actualizar datos locales
      await refreshProfile(); // Esto recargará el perfil
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      success('Contraseña actualizada. Por favor inicia sesión nuevamente.');
      logout();
      nav('/login');
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mi Perfil</h1>
          <p className="page-subtitle">Administra tus datos personales y contraseña</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--color-neutral-100)', padding: 4, borderRadius: 12, width: 'fit-content' }}>
        <button
          onClick={() => setTab('profile')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8,
            fontSize: 'var(--text-sm)', fontWeight: 600, transition: 'all 0.15s',
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
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8,
            fontSize: 'var(--text-sm)', fontWeight: 600, transition: 'all 0.15s',
            background: tab === 'password' ? 'var(--color-neutral-0)' : 'transparent',
            color: tab === 'password' ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
            boxShadow: tab === 'password' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <KeyIcon style={{ width: 18, height: 18 }} />
          Cambiar contraseña
        </button>
      </div>

      {tab === 'profile' && (
        <Card>
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
            <Input
              label="Nombres"
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              required
            />
            <Input
              label="Apellidos"
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              required
            />
            <div>
              <label className="input-label">Email</label>
              <div style={{ display: 'flex', gap: 0 }}>
                <input
                  type="text"
                  value={profile.emailPrefix}
                  onChange={(e) => setProfile({ ...profile, emailPrefix: e.target.value })}
                  className="input"
                  style={{ flex: 1, borderRadius: '8px 0 0 8px' }}
                  required
                />
                <div style={{
                  padding: '8px 12px', background: 'var(--color-neutral-100)',
                  border: '1px solid var(--color-neutral-300)', borderLeft: 'none',
                  borderRadius: '0 8px 8px 0', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)',
                  display: 'flex', alignItems: 'center',
                }}>
                  @suite.edu
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button type="submit" isLoading={saving}>Guardar cambios</Button>
              <Button variant="secondary" type="button" onClick={() => nav(-1)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {tab === 'password' && (
        <Card>
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
            <Input
              label="Contraseña actual"
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              required
            />
            <Input
              label="Nueva contraseña"
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              required
              minLength={6}
            />
            <Input
              label="Confirmar nueva contraseña"
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              required
            />
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
              ⚠️ Al cambiar tu contraseña, deberás iniciar sesión nuevamente.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button type="submit" isLoading={saving}>Cambiar contraseña</Button>
              <Button variant="secondary" type="button" onClick={() => nav(-1)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};