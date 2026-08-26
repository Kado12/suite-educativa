import React, { useState, useEffect } from 'react';
import { Card, Button, Select } from '@suite/ui';
import { useToast } from '../../context/ToastContext';
import { importsService } from '../../api/imports.service';
import { academicService } from '../../api/academic.service';

const TYPES = [
  { value: 'sedes', label: 'Sedes' },
  { value: 'areas', label: 'Áreas' },
  { value: 'cursos', label: 'Cursos' },
  { value: 'turnos', label: 'Turnos' },
  { value: 'salones', label: 'Salones' },
  { value: 'sections', label: 'Secciones' },
  { value: 'teachers', label: 'Docentes' },
  { value: 'alumnos', label: 'Alumnos (con matrícula)' },
  { value: 'horario', label: 'Horario (por bloque)' },
];

export const ImportsPage: React.FC = () => {
  const { success, error } = useToast();
  const [type, setType] = useState('sedes');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);

  const [periods, setPeriods] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [periodId, setPeriodId] = useState('');
  const [blockId, setBlockId] = useState('');

  useEffect(() => { academicService.listPeriods().then(setPeriods); }, []);
  useEffect(() => { if (periodId) academicService.listBlocks(periodId).then(setBlocks); }, [periodId]);

  const handleImport = async () => {
    if (!file) { error('Selecciona un archivo'); return; }
    if (type === 'horario' && !blockId) { error('Selecciona un bloque para el horario'); return; }
    setUploading(true); setResult(null);
    try {
      const extra = type === 'horario' ? { blockId } : { blockId: '' };
      const r = await importsService.importFile(type, file, extra );
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
          <p className="page-subtitle">Carga sedes, áreas, cursos, turnos, salones, secciones, docentes, alumnos y horarios</p>
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'end' }}>
          <Select label="Tipo" value={type} onChange={(e) => { setType(e.target.value); setResult(null); }} options={TYPES} />

          {type === 'horario' && (
            <>
              <Select label="Período" value={periodId} onChange={(e) => { setPeriodId(e.target.value); setBlockId(''); }}
                options={[{ value: '', label: 'Selecciona bloque' }, ...periods.map((p) => ({ value: p.id, label: p.name }))]} />
              <Select label="Bloque" value={blockId} onChange={(e) => setBlockId(e.target.value)}
                options={[{ value: '', label: 'Selecciona bloque' }, ...blocks.map((b) => ({ value: b.id, label: b.name }))]} />
            </>
          )}

          <div>
            <label className="input-label">Archivo Excel</label>
            <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={handleImport} isLoading={uploading}>Importar</Button>
            <Button variant="secondary" onClick={() => importsService.downloadTemplate(type)}>Plantilla</Button>
          </div>
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 12, background: 'var(--color-info-50)', padding: 8, borderRadius: 8 }}>
          💡 Los duplicados se omiten. Alumnos: se crea persona + matrícula + cuotas (sin foto). Horario: se empareja por sección+día+slot y <strong>preserva asistencias</strong>.
        </p>
      </Card>

      {result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <Card className="p-4"><div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-success-500)' }}>{result.created}</div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Creados</div></Card>
            <Card className="p-4"><div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{result.skipped}</div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Omitidos/actualizados</div></Card>
            <Card className="p-4"><div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-danger-500)' }}>{result.errors.length}</div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Errores</div></Card>
          </div>
          {result.errors.length > 0 && (
            <Card>
              <h3 className="card-title" style={{ color: 'var(--color-danger-700)' }}>Errores</h3>
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