import React, { useState } from 'react';
import { Card, Button, Select } from '@suite/ui';
import { useToast } from '../../context/ToastContext';
import { importsService } from '../../api/imports.service';

const TYPES = [
  { value: 'teachers', label: '👨‍ Docentes' },
  { value: 'students', label: '🧑🎓 Alumnos' },
  { value: 'sections', label: '📋 Secciones' },
];

export const ImportsPage: React.FC = () => {
  const { success, error } = useToast();
  const [type, setType] = useState('teachers');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImport = async () => {
    if (!file) { error('Selecciona un archivo'); return; }
    setUploading(true); setResult(null);
    try {
      const r = await importsService.importFile(type, file);
      setResult(r);
      r.errors.length === 0 ? success(`✅ ${r.created} creados, ${r.skipped} omitidos`) : error(`⚠️ ${r.created} creados, ${r.errors.length} errores`);
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Importación masiva</h1>
          <p className="page-subtitle">Carga docentes, alumnos y secciones desde Excel</p>
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'end' }}>
          <Select label="Tipo" value={type} onChange={(e) => { setType(e.target.value); setResult(null); }} options={TYPES} />
          <div>
            <label className="input-label">Archivo Excel</label>
            <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={handleImport} isLoading={uploading}>📥 Importar</Button>
            <Button variant="secondary" onClick={() => importsService.downloadTemplate(type)}>📄 Plantilla</Button>
          </div>
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 12, background: 'var(--color-info-50)', padding: 8, borderRadius: 8 }}>
          💡 Los duplicados se omiten. Para secciones: si la sede o salón no existen, se crean; el turno debe existir.
        </p>
      </Card>

      {result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <Card className="p-4"><div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-success-500)' }}>{result.created}</div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Creados</div></Card>
            <Card className="p-4"><div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{result.skipped}</div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Omitidos</div></Card>
            <Card className="p-4"><div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-danger-500)' }}>{result.errors.length}</div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Errores</div></Card>
          </div>
          {result.errors.length > 0 && (
            <Card>
              <h3 className="card-title" style={{ color: 'var(--color-danger-700)' }}>❌ Errores</h3>
              <ul style={{ marginTop: 8 }}>
                {result.errors.map((e: any, i: number) => (
                  <li key={i} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-danger-700)' }}>Fila {e.row}: {e.reason}</li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
};