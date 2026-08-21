import React, { useState } from 'react';
import { Card, Button } from '@suite/ui';
import { ArrowPathIcon, DocumentDuplicateIcon, UsersIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../context/ToastContext';
import { toolsService } from '../../api/tools.service';

const FileInput: React.FC<{ label: string; onFile: (f: File | null) => void }> = ({ label, onFile }) => (
  <div>
    <label className="input-label">{label}</label>
    <input type="file" accept=".xlsx,.xls" onChange={(e) => onFile(e.target.files?.[0] || null)} className="input" />
  </div>
);

const ResultTable: React.FC<{ headers: string[]; rows: any[]; max?: number }> = ({ headers, rows, max = 50 }) => (
  <Card className="p-0" style={{ marginTop: 16 }}>
    <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
      <table className="table">
        <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.slice(0, max).map((r, i) => (
            <tr key={i}>{headers.map((h) => <td key={h}>{String(r[h] ?? '')}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
    {rows.length > max && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', padding: '8px 12px' }}>Mostrando {max} de {rows.length}. Descarga el Excel para ver todo.</p>}
  </Card>
);

export const ToolsPage: React.FC = () => {
  const { success, error } = useToast();
  const [tab, setTab] = useState<'compare' | 'schedule' | 'cross'>('compare');
  const [busy, setBusy] = useState(false);

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
    {
      id: 'compare',
      label: 'Comparar por DNI',
      icon: DocumentDuplicateIcon,
      description: 'Compara dos listas de personas (alumnos, docentes, etc.) y muestra quiénes están en ambas, solo en una, o solo en la otra.',
      useCase: 'Útil para cruzar registros de inscripción contra listas de asistencia, nómina, o cualquier base de datos externa.',
    },
    {
      id: 'schedule',
      label: 'Transformar horario',
      icon: ArrowPathIcon,
      description: 'Convierte un horario en formato de tabla (salones × días) a una lista ordenada de asignaciones (salón, docente, curso, día).',
      useCase: 'Ideal cuando recibes horarios desde otras áreas en formato visual y necesitas estructurarlos para el sistema.',
    },
    {
      id: 'cross',
      label: 'Cruzar con docentes',
      icon: UsersIcon,
      description: 'Toma un horario transformado y le agrega el DNI de cada docente usando coincidencia exacta o búsqueda fuzzy.',
      useCase: 'Para vincular horarios externos con la base de datos de docentes de la institución.',
    },
  ];

  const activeTool = tools.find((t) => t.id === tab)!;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Herramientas</h1>
          <p className="page-subtitle">Utilidades Excel para procesamiento de datos</p>
        </div>
      </div>

      {/* Descripción general */}
      <Card style={{ marginBottom: 24, background: 'var(--color-info-50)', border: '1px solid var(--color-info-200)' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <InformationCircleIcon style={{ width: 24, height: 24, color: 'var(--color-info-600)', flexShrink: 0 }} />
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-info-900)', lineHeight: 1.6 }}>
            Estas herramientas te permiten procesar archivos Excel para tareas comunes como comparar listas, transformar horarios y cruzar datos con docentes.
            Cada herramienta tiene un propósito específico y puede descargarse el resultado en formato Excel para su uso en otros sistemas.
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--color-neutral-100)', padding: 4, borderRadius: 12, width: 'fit-content' }}>
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8,
              fontSize: 'var(--text-sm)', fontWeight: 600, transition: 'all 0.15s',
              background: tab === t.id ? 'var(--color-neutral-0)' : 'transparent',
              color: tab === t.id ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
              boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <t.icon style={{ width: 18, height: 18 }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Descripción de la herramienta activa */}
      <Card style={{ marginBottom: 16, background: 'var(--color-neutral-50)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 8, color: 'var(--color-neutral-900)' }}>
          {activeTool.label}
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', marginBottom: 12, lineHeight: 1.6 }}>
          {activeTool.description}
        </p>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', fontStyle: 'italic' }}>
          <strong>Caso de uso:</strong> {activeTool.useCase}
        </div>
      </Card>

      {/* Comparar por DNI */}
      {tab === 'compare' && (
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <FileInput label="Archivo A (lista completa)" onFile={setCA} />
            <FileInput label="Archivo B (lista parcial)" onFile={setCB} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => run(() => toolsService.compare(cA!, cB!), setCRes)} isLoading={busy} disabled={!cA || !cB}>
                Comparar
              </Button>
              {cRes && (
                <Button variant="success" onClick={() => toolsService.compareExport(cA!, cB!)}>
                  📥 Descargar
                </Button>
              )}
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

      {/* Transformar horario */}
      {tab === 'schedule' && (
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
            <FileInput label="Archivo de horario (formato visual)" onFile={setSF} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => run(() => toolsService.transform(sF!), setSRes)} isLoading={busy} disabled={!sF}>
                Transformar
              </Button>
              {sRes && (
                <Button variant="success" onClick={() => toolsService.transformExport(sF!)}>
                  📥 Descargar
                </Button>
              )}
            </div>
          </div>
          {sRes && (
            <div style={{ marginTop: 16, padding: 12, background: 'var(--color-neutral-50)', borderRadius: 8, fontSize: 'var(--text-sm)' }}>
              <strong>Resultado:</strong> {sRes.total} asignaciones transformadas
            </div>
          )}
          {sRes && <ResultTable headers={['AULA', 'DOCENTE', 'CURSO', 'DIA_SEMANA']} rows={sRes.rows} />}
        </Card>
      )}

      {/* Cruzar con docentes */}
      {tab === 'cross' && (
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <FileInput label="Docentes (NOMBRES, APELLIDOS, DNI)" onFile={setXI} />
            <FileInput label="Horario transformado (DOCENTE)" onFile={setXS} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => run(() => toolsService.cross(xI!, xS!), setXRes)} isLoading={busy} disabled={!xI || !xS}>
                Cruzar
              </Button>
              {xRes && (
                <Button variant="success" onClick={() => toolsService.crossExport(xI!, xS!)}>
                  📥 Descargar
                </Button>
              )}
            </div>
          </div>
          {xRes && (
            <>
              <div style={{ marginTop: 16, padding: 12, background: 'var(--color-neutral-50)', borderRadius: 8, fontSize: 'var(--text-sm)' }}>
                <strong>Resumen:</strong> {xRes.summary.exact} coincidencias exactas · {xRes.summary.fuzzy} coincidencias fuzzy · {xRes.summary.notFound} no encontrados
              </div>
              <ResultTable headers={xRes.rows.length ? Object.keys(xRes.rows[0]) : []} rows={xRes.rows} />
            </>
          )}
        </Card>
      )}
    </div>
  );
};