import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '@suite/ui';
import { useToast } from '../../context/ToastContext';
import { useConfig } from '../../context/ConfigContext';
import { settingsService } from '../../api/settings.service';
import { 
  BuildingOfficeIcon,
  Cog6ToothIcon,
  PhotoIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

const FIELDS: { key: string; label: string; group: string; icon?: React.ReactNode; placeholder?: string }[] = [
  { key: 'institution.name', label: 'Nombre de la institución', group: 'Institución', icon: <BuildingOfficeIcon />, placeholder: 'Ej: Centro Pre-Universitario' },
  { key: 'institution.shortName', label: 'Nombre corto', group: 'Institución', placeholder: 'Ej: CEPU' },
  { key: 'institution.tagline', label: 'Lema / subtítulo', group: 'Institución', placeholder: 'Ej: Ingreso Directo a la Universidad' },
  { key: 'institution.legalName', label: 'Razón social', group: 'Institución', placeholder: 'Ej: Centro de Preparación Pre-Universitaria SAC' },
  { key: 'institution.docNumber', label: 'RUC / documento', group: 'Institución', placeholder: 'Ej: 20123456789' },
  { key: 'institution.address', label: 'Dirección', group: 'Institución', placeholder: 'Ej: Av. Universitaria 123' },
  { key: 'institution.phone', label: 'Teléfono', group: 'Institución', placeholder: 'Ej: (01) 123-4567' },
  { key: 'institution.email', label: 'Correo', group: 'Institución', placeholder: 'Ej: contacto@institucion.edu' },
  { key: 'institution.website', label: 'Sitio web', group: 'Institución', placeholder: 'Ej: https://www.institucion.edu' },
  { key: 'app.name', label: 'Nombre de la aplicación', group: 'Aplicación', icon: <Cog6ToothIcon />, placeholder: 'Ej: Suite Académica' },
];

export const SettingsPage: React.FC = () => {
  const { success, error } = useToast();
  const { reload } = useConfig();
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await settingsService.getAll();
      setRows(r);
      setForm(Object.fromEntries(r.map((x: any) => [x.key, x.value ?? ''])));
    } catch (e: any) { 
      error(e.response?.data?.message || 'Error al cargar ajustes'); 
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await settingsService.update(form);
      await reload();
      success('✅ Ajustes guardados correctamente');
      load();
    } catch (e: any) { 
      error(e.response?.data?.message || 'Error al guardar'); 
    } finally { 
      setSaving(false); 
    }
  };

  const resetKey = async (key: string) => {
    setResetting(key);
    try {
      await settingsService.reset(key);
      await reload();
      success('✅ Valor restaurado al predeterminado');
      load();
    } catch (e: any) { 
      error(e.response?.data?.message || 'Error al restaurar'); 
    } finally {
      setResetting(null);
    }
  };

  const uploadLogo = async (which: 'main' | 'second', file: File) => {
    setUploading(which);
    try {
      await settingsService.uploadLogo(which, file);
      await reload();
      success('✅ Logo actualizado correctamente');
      load();
    } catch (e: any) { 
      error(e.response?.data?.message || 'Error al subir logo'); 
    } finally { 
      setUploading(null); 
    }
  };

  const sourceOf = (key: string) => rows.find((r) => r.key === key)?.source;
  const groups = Array.from(new Set(FIELDS.map((f) => f.group)));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ajustes</h1>
          <p className="page-subtitle">Personalización de la institución (sobreescribe los valores por defecto/ENV)</p>
        </div>
        <Button 
          onClick={save} 
          isLoading={saving}
          loadingText="Guardando..."
          icon={<CheckCircleIcon />}
        >
          Guardar cambios
        </Button>
      </div>

      {groups.map((g) => (
        <Card key={g} style={{ marginBottom: 16 }}>
          <h3 className="card-title" style={{ marginBottom: 16, fontSize: 'var(--text-base)' }}>
            {g === 'Institución' && <BuildingOfficeIcon style={{ width: 20, height: 20, display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />}
            {g === 'Aplicación' && <Cog6ToothIcon style={{ width: 20, height: 20, display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />}
            {g}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {FIELDS.filter((f) => f.group === g).map((f) => {
              const source = sourceOf(f.key);
              const isResetting = resetting === f.key;
              
              return (
                <div key={f.key}>
                  <Input 
                    label={f.label} 
                    value={form[f.key] || ''} 
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    icon={f.icon}
                    placeholder={f.placeholder}
                    hint={source === 'db' ? 'Personalizado' : 'Valor predeterminado'}
                  />
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginTop: 8,
                    fontSize: 'var(--text-xs)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6,
                      color: source === 'db' ? 'var(--color-primary-600)' : 'var(--color-neutral-500)'
                    }}>
                      <div style={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%',
                        background: source === 'db' ? 'var(--color-primary-500)' : 'var(--color-neutral-400)'
                      }} />
                      <span style={{ fontWeight: 500 }}>
                        {source === 'db' ? 'Ajustes guardados' : 'Predeterminado'}
                      </span>
                    </div>
                    
                    {source === 'db' && (
                      <button
                        style={{ 
                          color: 'var(--color-danger-500)', 
                          background: 'none', 
                          border: 'none', 
                          cursor: isResetting ? 'not-allowed' : 'pointer', 
                          fontSize: 'var(--text-xs)',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          opacity: isResetting ? 0.5 : 1,
                          transition: 'opacity 0.2s'
                        }}
                        onClick={() => resetKey(f.key)}
                        disabled={isResetting}
                      >
                        <ArrowPathIcon style={{ 
                          width: 14, 
                          height: 14,
                          animation: isResetting ? 'spin 1s linear infinite' : 'none'
                        }} />
                        {isResetting ? 'Restaurando...' : 'Restaurar'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <Card>
        <h3 className="card-title" style={{ marginBottom: 8, fontSize: 'var(--text-base)' }}>
          <PhotoIcon style={{ width: 20, height: 20, display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
          Logos institucionales
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 16 }}>
          Se usan en carné, recibo y ficha de matrícula. Formatos recomendados: PNG o JPG con fondo transparente.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {(['main', 'second'] as const).map((w) => {
            const isUploading = uploading === w;
            const logoKey = `logo.${w}PublicId`;
            const currentLogo = rows.find((r) => r.key === logoKey);
            const hasCustomLogo = currentLogo?.source === 'db';
            
            return (
              <div key={w} style={{ 
                border: '1px solid var(--color-neutral-200)',
                borderRadius: 8,
                padding: 16,
                background: 'var(--color-neutral-50)'
              }}>
                <div style={{ 
                  fontSize: 'var(--text-sm)', 
                  fontWeight: 600,
                  color: 'var(--color-neutral-700)',
                  marginBottom: 12
                }}>
                  Logo {w === 'main' ? 'principal' : 'secundario'}
                </div>
                
                <label 
                  className="btn btn-secondary" 
                  style={{ 
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: isUploading ? 0.6 : 1
                  }}
                >
                  <CloudArrowUpIcon style={{ width: 18, height: 18 }} />
                  {isUploading ? 'Subiendo...' : `Subir logo ${w === 'main' ? 'principal' : 'secundario'}`}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && !isUploading) {
                        uploadLogo(w, f);
                      }
                      e.target.value = '';
                    }}
                    disabled={isUploading}
                  />
                </label>
                
                <div style={{ 
                  marginTop: 12,
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-neutral-600)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <div style={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%',
                    background: hasCustomLogo ? 'var(--color-primary-500)' : 'var(--color-neutral-400)'
                  }} />
                  <span>
                    {hasCustomLogo ? 'Logo personalizado cargado' : 'Logo predeterminado'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};