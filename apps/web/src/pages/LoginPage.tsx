import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AcademicCapIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  DocumentChartBarIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { APP_NAME } from '@suite/shared';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success } = useToast();
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      success('Bienvenido a la plataforma');
      nav('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: UserGroupIcon, text: 'Gestión integral de alumnos, docentes y personal' },
    { icon: CalendarDaysIcon, text: 'Generador automático de horarios inteligentes' },
    { icon: DocumentChartBarIcon, text: 'Reportes, consolidados y exportación Excel' },
  ];

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <AcademicCapIcon />
          </div>
          <div className="auth-brand-name">{APP_NAME}</div>
        </div>

        <h1 className="auth-headline">
          La plataforma educativa que tu institución necesita
        </h1>
        <p className="auth-subheadline">
          Gestiona matrículas, pagos, horarios y asistencia docente desde un solo lugar.
          Diseñada para ser rápida, clara y escalable.
        </p>

        <div className="auth-features">
          {features.map((f, i) => (
            <div key={i} className="auth-feature">
              <div className="auth-feature-icon">
                <f.icon />
              </div>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-card-title">Inicia sesión</h2>
          <p className="auth-card-subtitle">Ingresa tus credenciales para continuar</p>

          {error && (
            <div className="auth-error">
              <ExclamationCircleIcon style={{ width: 18, height: 18 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@suite.edu"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="input-label">Contraseña</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="auth-footer">
            ¿Olvidaste tus credenciales? Contacta al administrador del sistema.
          </div>
        </div>
      </div>
    </div>
  );
};