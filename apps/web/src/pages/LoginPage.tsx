import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AcademicCapIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  DocumentChartBarIcon,
  ExclamationCircleIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { APP_NAME } from '@suite/shared';
import { Input, Button } from '@suite/ui';
import { useConfig } from '../context/ConfigContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success } = useToast();
  const { settings } = useConfig();
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const institutionName = settings?.['institution.name'] || APP_NAME;
  const tagline = settings?.['institution.tagline'] || 'Plataforma educativa integral';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }
    
    setLoading(true);
    try {
      await login(email, password);
      success(`¡Bienvenido de vuelta!`);
      nav('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { 
      icon: UserGroupIcon, 
      text: 'Gestión integral de alumnos, docentes y personal',
      color: 'var(--color-primary-600)'
    },
    { 
      icon: CalendarDaysIcon, 
      text: 'Generador automático de horarios inteligentes',
      color: 'var(--color-success-600)'
    },
    { 
      icon: DocumentChartBarIcon, 
      text: 'Reportes, consolidados y exportación Excel',
      color: 'var(--color-warning-600)'
    },
  ];

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <AcademicCapIcon />
          </div>
          <div>
            <div className="auth-brand-name">{institutionName}</div>
            <div style={{ 
              fontSize: 'var(--text-xs)', 
              color: 'var(--color-neutral-400)',
              marginTop: 4
            }}>
              {tagline}
            </div>
          </div>
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
              <div className="auth-feature-icon" style={{ color: f.color }}>
                <f.icon />
              </div>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        <div style={{ 
          marginTop: 'auto', 
          paddingTop: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 'var(--text-sm)',
          color: 'var(--color-neutral-400)'
        }}>
          <SparklesIcon style={{ width: 18, height: 18 }} />
          <span>Desarrollado con tecnología moderna</span>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div style={{ marginBottom: 32 }}>
            <h2 className="auth-card-title">Inicia sesión</h2>
            <p className="auth-card-subtitle">Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <div 
              className="auth-error"
              style={{
                animation: 'shake 0.4s ease-in-out',
              }}
            >
              <ExclamationCircleIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" style={{ gap: 20 }}>
            <div>
              <Input 
                label="Email" 
                icon={<EnvelopeIcon />}
                placeholder="admin@suite.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                type="email"
              />
            </div>

            <div>
              <Input 
                label="Contraseña" 
                icon={<LockClosedIcon />}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                type={showPassword ? 'text' : 'password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
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
                {showPassword ? <EyeSlashIcon style={{ width: 14, height: 14 }} /> : <EyeIcon style={{ width: 14, height: 14 }} />}
                {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              </button>
            </div>

            <Button 
              type="submit" 
              className="btn-lg"
              isLoading={loading}
              loadingText="Ingresando..."
              style={{ width: '100%', marginTop: 8 }}
            >
              Iniciar sesión
            </Button>
          </form>

          <div className="auth-footer" style={{ marginTop: 24 }}>
            <div style={{ 
              padding: 12, 
              background: 'var(--color-neutral-50)', 
              borderRadius: 8,
              fontSize: 'var(--text-sm)',
              color: 'var(--color-neutral-600)',
              textAlign: 'center'
            }}>
              ¿Olvidaste tus credenciales? 
              <br />
              Contacta al administrador del sistema.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
};