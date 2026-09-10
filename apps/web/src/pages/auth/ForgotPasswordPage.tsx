import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../context/ToastContext';
import { passwordResetService } from '../../api/passwordReset.service';
import { APP_NAME } from '@suite/shared';
import { useConfig } from '../../context/ConfigContext';

export const ForgotPasswordPage: React.FC = () => {
  const { success, error } = useToast();
  const { settings } = useConfig();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const institutionName = settings?.['institution.name'] || APP_NAME;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      error('Ingresa tu correo electrónico');
      return;
    }
    setLoading(true);
    try {
      const res = await passwordResetService.requestReset(email);
      setSent(true);
      success(res.message || 'Solicitud enviada');
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <EnvelopeIcon />
          </div>
          <div>
            <div className="auth-brand-name">{institutionName}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-600)', marginTop: 4 }}>
              Recuperación de acceso
            </div>
          </div>
        </div>

        <h1 className="auth-headline">
          Recuperar contraseña
        </h1>
        <p className="auth-subheadline">
          Tu solicitud será enviada al equipo de TI. Un administrador procesará tu solicitud
          y recibirás un correo con tu nueva contraseña temporal.
        </p>

        <div style={{
          marginTop: 'auto',
          paddingTop: 32,
          padding: 16,
          background: 'var(--color-primary-50)',
          border: '1px solid var(--color-primary-800)',
          borderRadius: 8,
          fontSize: 'var(--text-sm)',
          color: 'var(--color-primary-700)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}>
          <ExclamationCircleIcon style={{ width: 20, height: 20, flexShrink: 0 }} />
          <div>
            <strong>¿Cómo funciona?</strong>
            <ol style={{ margin: '8px 0 0', paddingLeft: 16 }}>
              <li>Envías la solicitud con tu email</li>
              <li>Un administrador la revisa</li>
              <li>Recibes la nueva contraseña por correo</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card" style={{ maxWidth: 500 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: 'var(--color-neutral-600)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              marginBottom: 24,
            }}
          >
            <ArrowLeftIcon style={{ width: 16, height: 16 }} />
            Volver al login
          </button>

          {sent ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--color-success-100)',
                color: 'var(--color-success-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <CheckCircleIcon style={{ width: 32, height: 32 }} />
              </div>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 8 }}>
                Solicitud enviada
              </h2>
              <p style={{ color: 'var(--color-neutral-600)', marginBottom: 16 }}>
                Tu solicitud fue enviada al equipo de TI. Recibirás un correo en{' '}
                <strong>{email}</strong> cuando sea procesada.
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 24 }}>
                Revisa tu bandeja de entrada y la carpeta de spam.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Volver al login
              </button>
            </div>
          ) : (
            <>
              <h2 className="auth-card-title">Recuperar contraseña</h2>
              <p className="auth-card-subtitle">
                Ingresa tu correo electrónico para solicitar una nueva contraseña
              </p>

              <form onSubmit={handleSubmit} className="auth-form" style={{ gap: 20, marginTop: 24 }}>
                <div>
                  <label className="input-label">Email</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-neutral-400)',
                    }}>
                      <EnvelopeIcon style={{ width: 18, height: 18 }} />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      autoFocus
                      className="input"
                      style={{ paddingLeft: 40 }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  {loading ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};