import React, { useState, useEffect } from 'react';
import { Card, Button, Modal } from '@suite/ui';
import {
  ArrowPathIcon, DocumentDuplicateIcon, UsersIcon, InformationCircleIcon,
  EyeIcon, ArrowDownTrayIcon, ClockIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../context/ToastContext';
import { toolsService } from '../../api/tools.service';
import { auditService } from '../../api/audit.service';
import { Squares2X2Icon } from '@heroicons/react/24/outline';

const FileInput: React.FC<{ label: string; file: File | null; onFile: (f: File | null) => void; onPreview: () => void }> = ({ label, file, onFile, onPreview }) => (
  <div>
    <label className="input-label">{label}</label>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input type="file" accept=".xlsx,.xls" onChange={(e) => onFile(e.target.files?.[0] || null)} className="input" style={{ flex: 1 }} />
      {file && (
        <Button variant="secondary" size="sm" onClick={onPreview} title="Vista previa">
          <EyeIcon style={{ width: 14, height: 14 }} />
        </Button>
      )}
    </div>
    {file && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 4 }}>📄 {file.name}</div>}
  </div>
);

const ResultTable: React.FC<{ headers: string[]; rows: any[]; max?: number }> = ({ headers, rows, max = 50 }) => (
  <Card className="p-0" style={{ marginTop: 16 }}>
    <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
      <table className="table">
        <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.slice(0, max).map((r, i) => (
            <tr key={i}>{headers.map((h, j) => <td key={j}>{Array.isArray(r) ? r[j] : String(r[h] ?? '')}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
    {rows.length > max && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', padding: '8px 12px' }}>Mostrando {max} de {rows.length}.</p>}
  </Card>
);

export const ToolsPage: React.FC = () => {
  const { success, error } = useToast();
  const [tab, setTab] = useState<'compare' | 'schedule' | 'cross' | 'assignments' | 'history'>('compare');
  const [busy, setBusy] = useState(false);

  // Preview modal
  const [previewData, setPreviewData] = useState<{ headers: string[]; rows: any[][] } | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  // Compare
  const [cA, setCA] = useState<File | null>(null);
  const [cB, setCB] = useState<File | null>(null);
  const [cRes, setCRes] = useState<any>(null);

  // Schedule
  const [sF, setSF] = useState<File | null>(null);
  const [sRes, setSRes] = useState<any>(null);

  // Cross
  const [xI, setXI] = useState<File | null>(null);
  const [xS, setXS] = useState<File | null>(null);
  const [xRes, setXRes] = useState<any>(null);

  // History
  const [history, setHistory] = useState<any[]>([]);

  // Estados:
  const [aS, setAS] = useState<File | null>(null);
  const [aC, setAC] = useState<File | null>(null);
  const [aRes, setARes] = useState<any>(null);

  useEffect(() => {
    if (tab === 'history') {
      auditService.list({ entity: 'Tool', pageSize: 100 }).then((r) => setHistory(r.logs));
    }
  }, [tab]);

  const handlePreview = async (file: File, title: string) => {
    try {
      const data = await toolsService.preview(file);
      setPreviewData(data);
      setPreviewTitle(`Vista previa: ${title}`);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al leer archivo');
    }
  };

  const run = async (fn: () => Promise<any>, setter: (r: any) => void) => {
    setBusy(true);
    try {
      const r = await fn();
      setter(r);
      success('✅ Procesado correctamente');
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al procesar');
    } finally {
      setBusy(false);
    }
  };

  const tools = [
    { id: 'compare', label: 'Comparar por DNI', icon: DocumentDuplicateIcon, templateType: 'compare', description: 'Compara dos listas de personas y muestra quiénes están en ambas, solo en una, o solo en la otra.', useCase: 'Útil para cruzar registros de inscripción contra listas de asistencia o bases externas.' },
    { id: 'schedule', label: 'Transformar horario', icon: ArrowPathIcon, templateType: 'schedule', description: 'Convierte un horario en formato de tabla (salones × días) a una lista ordenada de asignaciones.', useCase: 'Ideal cuando recibes horarios en formato visual y necesitas estructurarlos.' },
    { id: 'cross', label: 'Cruzar con docentes', icon: UsersIcon, templateType: 'cross-info', description: 'Toma un horario y le agrega el DNI de cada docente usando coincidencia exacta o fuzzy.', useCase: 'Para vincular horarios externos con la base de datos de docentes.' },
    { id: 'assignments', label: 'Secciones × Cursos', icon: Squares2X2Icon, templateType: null, description: 'Genera una fila por cada combinación sección-curso (producto cartesiano), igual que el script de Python.', useCase: 'Asignaciones masivas sección-curso a partir de dos listados con CODIGO_SECCION y CODIGO_CURSO.' },
    { id: 'history', label: 'Historial', icon: ClockIcon, templateType: null, description: 'Registro de operaciones realizadas.', useCase: '' },
  ];

  const activeTool = tools.find((t) => t.id === tab)!;

  const ACTION_LABELS: Record<string, string> = {
    COMPARE: 'Comparar por DNI',
    TRANSFORM: 'Transformar horario',
    CROSS: 'Cruzar con docentes',
    ASSIGNMENTS: 'Secciones × Cursos',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Herramientas</h1>
          <p className="page-subtitle">Utilidades Excel para procesamiento de datos</p>
        </div>
      </div>

      <Card style={{ marginBottom: 24, background: 'var(--color-info-50)', border: '1px solid var(--color-info-200)' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <InformationCircleIcon style={{ width: 24, height: 24, color: 'var(--color-info-600)', flexShrink: 0 }} />
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-info-900)', lineHeight: 1.6 }}>
            Estas herramientas procesan archivos Excel para tareas comunes. Puedes descargar plantillas de ejemplo para ver el formato esperado y usar la vista previa para verificar tus archivos antes de procesarlos.
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--color-neutral-100)', padding: 4, borderRadius: 12, width: 'fit-content', flexWrap: 'wrap' }}>
        {tools.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8,
              fontSize: 'var(--text-sm)', fontWeight: 600, transition: 'all 0.15s',
              background: tab === t.id ? 'var(--color-neutral-0)' : 'transparent',
              color: tab === t.id ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
              boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
            }}>
            <t.icon style={{ width: 18, height: 18 }} />
            {t.label}
          </button>
        ))}
      </div>

      {tab !== 'history' && (
        <>
          <Card style={{ marginBottom: 16, background: 'var(--color-neutral-50)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 8 }}>{activeTool.label}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', marginBottom: 8, lineHeight: 1.6 }}>{activeTool.description}</p>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', fontStyle: 'italic' }}>
                  <strong>Caso de uso:</strong> {activeTool.useCase}
                </div>
              </div>
              {activeTool.templateType && (
                <Button variant="secondary" size="sm" onClick={() => toolsService.downloadTemplate(activeTool.templateType!)}>
                  <ArrowDownTrayIcon style={{ width: 14, height: 14 }} /> Plantilla de ejemplo
                </Button>
              )}
            </div>
          </Card>
        </>
      )}

      {/* COMPARE */}
      {tab === 'compare' && (
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <FileInput label="Archivo A" file={cA} onFile={setCA} onPreview={() => cA && handlePreview(cA, 'Archivo A')} />
            <FileInput label="Archivo B" file={cB} onFile={setCB} onPreview={() => cB && handlePreview(cB, 'Archivo B')} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => run(() => toolsService.compare(cA!, cB!), setCRes)} isLoading={busy} disabled={!cA || !cB}>Comparar</Button>
              {cRes && <Button variant="success" onClick={() => toolsService.compareExport(cA!, cB!)}>📥</Button>}
            </div>
          </div>
          {cRes && (
            <>
              <div style={{ marginTop: 16, padding: 12, background: 'var(--color-neutral-50)', borderRadius: 8, fontSize: 'var(--text-sm)' }}>
                <strong>Resumen:</strong> {cRes.summary.both} en ambos · {cRes.summary.onlyA} solo en A · {cRes.summary.onlyB} solo en B
              </div>
              <ResultTable headers={cRes.onlyA.headers} rows={cRes.onlyA.rows} />
            </>
          )}
        </Card>
      )}

      {/* SCHEDULE */}
      {tab === 'schedule' && (
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
            <FileInput label="Archivo de horario" file={sF} onFile={setSF} onPreview={() => sF && handlePreview(sF, 'Horario')} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => run(() => toolsService.transform(sF!), setSRes)} isLoading={busy} disabled={!sF}>Transformar</Button>
              {sRes && <Button variant="success" onClick={() => toolsService.transformExport(sF!)}>📥</Button>}
            </div>
          </div>
          {sRes && (
            <div style={{ marginTop: 16, padding: 12, background: 'var(--color-neutral-50)', borderRadius: 8, fontSize: 'var(--text-sm)' }}>
              <strong>Resultado:</strong> {sRes.total} asignaciones transformadas
            </div>
          )}
          { sRes && <ResultTable headers={['AULA', 'SLOT', 'DOCENTE', 'CURSO', 'DIA_SEMANA']} rows={sRes.rows} /> }
        </Card>
      )}

      {/* CROSS */}
      {tab === 'cross' && (
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <FileInput label="Docentes" file={xI} onFile={setXI} onPreview={() => xI && handlePreview(xI, 'Docentes')} />
            <FileInput label="Horario transformado" file={xS} onFile={setXS} onPreview={() => xS && handlePreview(xS, 'Horario')} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => run(() => toolsService.cross(xI!, xS!), setXRes)} isLoading={busy} disabled={!xI || !xS}>Cruzar</Button>
              {xRes && <Button variant="success" onClick={() => toolsService.crossExport(xI!, xS!)}>📥</Button>}
            </div>
          </div>
          {xRes && (
            <>
              <div style={{ marginTop: 16, padding: 12, background: 'var(--color-neutral-50)', borderRadius: 8, fontSize: 'var(--text-sm)' }}>
                <strong>Resumen:</strong> {xRes.summary.exact} exactos · {xRes.summary.fuzzy} fuzzy · {xRes.summary.notFound} no encontrados
              </div>
              <ResultTable headers={xRes.rows.length ? Object.keys(xRes.rows[0]) : []} rows={xRes.rows} />
            </>
          )}
        </Card>
      )}

            {/* ASSIGNMENTS */}
      {tab === 'assignments' && (
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <FileInput label="Secciones (CODIGO_SECCION)" file={aS} onFile={setAS} onPreview={() => aS && handlePreview(aS, 'Secciones')} />
            <FileInput label="Cursos (CODIGO_CURSO)" file={aC} onFile={setAC} onPreview={() => aC && handlePreview(aC, 'Cursos')} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => run(() => toolsService.assignments(aS!, aC!), setARes)} isLoading={busy} disabled={!aS || !aC}>Generar</Button>
              {aRes && <Button variant="success" onClick={() => toolsService.assignmentsExport(aS!, aC!)}>📥</Button>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button size="sm" variant="secondary" onClick={() => toolsService.downloadTemplate('assignments-sections')}>Plantilla Secciones</Button>
            <Button size="sm" variant="secondary" onClick={() => toolsService.downloadTemplate('assignments-courses')}>Plantilla Cursos</Button>
          </div>

          {aRes && (
            <>
              <div style={{ marginTop: 16, padding: 12, background: 'var(--color-neutral-50)', borderRadius: 8, fontSize: 'var(--text-sm)' }}>
                <strong>Resumen:</strong> {aRes.summary.sections} secciones × {aRes.summary.courses} cursos = <strong>{aRes.summary.total.toLocaleString()} filas</strong>
              </div>
              <ResultTable headers={['CODIGO_SECCION', 'CODIGO_CURSO']} rows={aRes.sample} />
            </>
          )}
        </Card>
      )}

      {/* HISTORY */}
      {tab === 'history' && (
        <Card className="p-0">
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr><th>Fecha/Hora</th><th>Usuario</th><th>Herramienta</th><th>Detalles</th><th>IP</th></tr>
              </thead>
              <tbody>
                {history.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{log.userName || '—'}</td>
                    <td><span className="badge badge-primary">{ACTION_LABELS[log.action] || log.action}</span></td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                      {log.details?.file || log.details?.fileA || '—'}
                      {log.details?.summary && ` · ${JSON.stringify(log.details.summary)}`}
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{log.ipAddress || '—'}</td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--color-neutral-400)' }}>Sin operaciones registradas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Preview Modal */}
      <Modal isOpen={!!previewData} onClose={() => setPreviewData(null)} title={previewTitle} size="lg">
        {previewData && (
          <ResultTable headers={previewData.headers} rows={previewData.rows} max={5} />
        )}
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 12 }}>
          Mostrando las primeras 5 filas del archivo.
        </p>
      </Modal>
    </div>
  );
};