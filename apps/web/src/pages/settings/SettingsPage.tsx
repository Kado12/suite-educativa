import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '@suite/ui';
import { useToast } from '../../context/ToastContext';
import { useConfig } from '../../context/ConfigContext';
import { settingsService } from '../../api/settings.service';

const FIELDS: { key: string; label: string; group: string }[] = [
  { key: 'institution.name', label: 'Nombre de la institución', group: 'Institución' },
  { key: 'institution.shortName', label: 'Nombre corto', group: 'Institución' },
  { key: 'institution.tagline', label: 'Lema / subtítulo', group: 'Institución' },
  { key: 'institution.legalName', label: 'Razón social', group: 'Institución' },
  { key: 'institution.docNumber', label: 'RUC / documento', group: 'Institución' },
  { key: 'institution.address', label: 'Dirección', group: 'Institución' },
  { key: 'institution.phone', label: 'Teléfono', group: 'Institución' },
  { key: 'institution.email', label: 'Correo', group: 'Institución' },
  { key: 'institution.website', label: 'Sitio web', group: 'Institución' },
  { key: 'app.name', label: 'Nombre de la aplicación', group: 'Aplicación' },
];

export const SettingsPage: React.FC = () => {
  const { success, error } = useToast();
  const { reload } = useConfig();
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await settingsService.getAll();
      setRows(r);
      setForm(Object.fromEntries(r.map((x: any) => [x.key, x.value ?? ''])));
    } catch (e: any) { error(e.response?.data?.message || 'Error al cargar ajustes'); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await settingsService.update(form);
      await reload();
      success('✅ Ajustes guardados');
      load();
    } catch (e: any) { error(e.response?.data?.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const resetKey = async (key: string) => {
    try {
      await settingsService.reset(key);
      await reload();
      success('Valor restaurado al predeterminado');
      load();
    } catch (e: any) { error(e.response?.data?.message || 'Error'); }
  };

  const uploadLogo = async (which: 'main' | 'second', file: File) => {
    setUploading(which);
    try {
      await settingsService.uploadLogo(which, file);
      await reload();
      success('✅ Logo actualizado');
      load();
    } catch (e: any) { error(e.response?.data?.message || 'Error al subir logo'); }
    finally { setUploading(null); }
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
        <Button onClick={save} isLoading={saving}>💾 Guardar cambios</Button>
      </div>

      {groups.map((g) => (
        <Card key={g} style={{ marginBottom: 16 }}>
          <h3 className="card-title">{g}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 12 }}>
            {FIELDS.filter((f) => f.group === g).map((f) => (
              <div key={f.key}>
                <Input label={f.label} value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 4 }}>
                  Origen: <strong>{sourceOf(f.key) === 'db' ? 'Ajustes' : 'Predeterminado'}</strong>
                  {sourceOf(f.key) === 'db' && (
                    <button
                      style={{ marginLeft: 8, color: 'var(--color-danger-500)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)' }}
                      onClick={() => resetKey(f.key)}
                    >
                      restaurar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card>
        <h3 className="card-title">Logos</h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 4 }}>
          Se usan en carné, recibo y ficha de matrícula.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          {(['main', 'second'] as const).map((w) => (
            <label key={w} className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              {uploading === w ? 'Subiendo...' : `Subir logo ${w === 'main' ? 'principal' : 'secundario'}`}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadLogo(w, f);
                  e.target.value = '';
                }}
              />
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
};