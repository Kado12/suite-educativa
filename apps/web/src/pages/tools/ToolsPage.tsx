import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, FileInput, Badge } from '@suite/ui';
import {
  ArrowPathIcon, DocumentDuplicateIcon, UsersIcon, InformationCircleIcon,
  EyeIcon, ArrowDownTrayIcon, ClockIcon, Squares2X2Icon,
  MagnifyingGlassIcon, TableCellsIcon, ChartBarIcon, CheckCircleIcon,
  XCircleIcon, SparklesIcon, DocumentTextIcon, ArrowTopRightOnSquareIcon,
  Cog6ToothIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../context/ToastContext';
import { toolsService } from '../../api/tools.service';
import { auditService } from '../../api/audit.service';

// Tabla de resultados mejorada
const ResultTable: React.FC<{ 
  headers: string[]; 
  rows: any[]; 
  max?: number;
  title?: string;
}> = ({ headers, rows, max = 50, title }) => {
  const [showAll, setShowAll] = useState(false);
  const displayedRows = showAll ? rows : rows.slice(0, max);
  
  return (
    <Card className="p-0" style={{ marginTop: 16 }}>
      {title && (
        <div style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid var(--color-neutral-200)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--color-neutral-50)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TableCellsIcon style={{ width: 18, height: 18, color: 'var(--color-primary-600)' }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-neutral-700)' }}>
              {title}
            </span>
          </div>
          <Badge color="primary">{rows.length} filas</Badge>
        </div>
      )}
      <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} style={{ position: 'sticky', top: 0, background: 'var(--color-neutral-50)', zIndex: 1 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((r, i) => (
              <tr key={i}>
                {headers.map((h, j) => (
                  <td key={j} style={{ fontSize: 'var(--text-xs)' }}>
                    {Array.isArray(r) ? r[j] : String(r[h] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > max && (
        <div style={{ 
          padding: '12px 16px', 
          borderTop: '1px solid var(--color-neutral-200)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--color-neutral-50)'
        }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)' }}>
            Mostrando {displayedRows.length} de {rows.length} filas
          </span>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Mostrar menos' : `Ver todas (${rows.length})`}
          </Button>
        </div>
      )}
    </Card>
  );
};

// Card de estadística
const StatCard: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  value: number | string; 
  color: 'success' | 'warning' | 'danger' | 'primary' | 'neutral' 
}> = ({ icon, label, value, color }) => {
  const colorMap: any = {
    success: { bg: 'var(--color-success-50)', text: 'var(--color-success-700)', border: 'var(--color-success-200)' },
    warning: { bg: 'var(--color-warning-50)', text: 'var(--color-warning-700)', border: 'var(--color-warning-200)' },
    danger: { bg: 'var(--color-danger-50)', text: 'var(--color-danger-700)', border: 'var(--color-danger-200)' },
    primary: { bg: 'var(--color-primary-50)', text: 'var(--color-primary-700)', border: 'var(--color-primary-200)' },
    neutral: { bg: 'var(--color-neutral-50)', text: 'var(--color-neutral-700)', border: 'var(--color-neutral-200)' },
  };
  const c = colorMap[color];
  
  return (
    <Card className="p-4" style={{ background: c.bg, borderColor: c.border }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: c.text }}>
        {icon}
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: c.text }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </Card>
  );
};

export const ToolsPage: React.FC = () => {
  const { success, error } = useToast();
  const [tab, setTab] = useState<'overview' | 'compare' | 'schedule' | 'cross' | 'assignments' | 'history'>('overview');
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

  // Assignments
  const [aS, setAS] = useState<File | null>(null);
  const [aC, setAC] = useState<File | null>(null);
  const [aRes, setARes] = useState<any>(null);

  // History
  const [history, setHistory] = useState<any[]>([]);

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
    { 
      id: 'compare', 
      label: 'Comparar por DNI', 
      icon: DocumentDuplicateIcon, 
      templateType: 'compare', 
      description: 'Compara dos listas de personas y muestra coincidencias y diferencias.', 
      useCase: 'Cruzar registros de inscripción contra listas de asistencia o bases externas.',
      color: 'primary'
    },
    { 
      id: 'schedule', 
      label: 'Transformar horario', 
      icon: ArrowPathIcon, 
      templateType: 'schedule', 
      description: 'Convierte un horario en formato tabla a lista ordenada de asignaciones.', 
      useCase: 'Estructurar horarios visuales para importación.',
      color: 'success'
    },
    { 
      id: 'cross', 
      label: 'Cruzar con docentes', 
      icon: UsersIcon, 
      templateType: 'cross-info', 
      description: 'Agrega DNI de docentes a un horario usando coincidencia exacta o fuzzy.', 
      useCase: 'Vincular horarios externos con la base de datos de docentes.',
      color: 'warning'
    },
    { 
      id: 'assignments', 
      label: 'Secciones × Cursos', 
      icon: Squares2X2Icon, 
      templateType: null, 
      description: 'Genera producto cartesiano de secciones y cursos.', 
      useCase: 'Asignaciones masivas sección-curso.',
      color: 'danger'
    },
    { 
      id: 'history', 
      label: 'Historial', 
      icon: ClockIcon, 
      templateType: null, 
      description: 'Registro de operaciones realizadas.', 
      useCase: '',
      color: 'neutral'
    },
  ];

  const activeTool = tools.find((t) => t.id === tab);

  const ACTION_LABELS: Record<string, { label: string; color: 'success' | 'warning' | 'danger' | 'primary' | 'neutral' }> = {
    COMPARE: { label: 'Comparar', color: 'primary' },
    TRANSFORM: { label: 'Transformar', color: 'success' },
    CROSS: { label: 'Cruzar', color: 'warning' },
    ASSIGNMENTS: { label: 'Asignaciones', color: 'danger' },
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Herramientas</h1>
          <p className="page-subtitle">Utilidades Excel para procesamiento y análisis de datos</p>
        </div>
      </div>

      {/* Info banner */}
      {tab === 'overview' && (
        <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-info-50) 100%)', border: '1px solid var(--color-primary-200)' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 12, 
              background: 'var(--color-primary-100)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <SparklesIcon style={{ width: 24, height: 24, color: 'var(--color-primary-600)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 4, color: 'var(--color-primary-900)' }}>
                Herramientas de procesamiento Excel
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary-700)', lineHeight: 1.6, margin: 0 }}>
                Automatiza tareas comunes de procesamiento de datos. Descarga plantillas de ejemplo, 
                usa la vista previa para verificar tus archivos antes de procesarlos, y exporta los resultados en formato Excel.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs modernos */}
      <div style={{ 
        display: 'inline-flex', 
        gap: 4, 
        marginBottom: 24, 
        background: 'var(--color-neutral-100)', 
        padding: 4, 
        borderRadius: 12,
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setTab('overview')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8,
            fontSize: 'var(--text-sm)', fontWeight: 600, transition: 'all 0.2s',
            background: tab === 'overview' ? 'var(--color-neutral-0)' : 'transparent',
            color: tab === 'overview' ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
            boxShadow: tab === 'overview' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <Cog6ToothIcon style={{ width: 18, height: 18 }} />
          Herramientas
        </button>
        {tools.filter(t => t.id !== 'history').map((t) => (
          <button 
            key={t.id} 
            onClick={() => setTab(t.id as any)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8,
              fontSize: 'var(--text-sm)', fontWeight: 600, transition: 'all 0.2s',
              background: tab === t.id ? 'var(--color-neutral-0)' : 'transparent',
              color: tab === t.id ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
              boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <t.icon style={{ width: 18, height: 18 }} />
            {t.label}
          </button>
        ))}
        <button
          onClick={() => setTab('history')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8,
            fontSize: 'var(--text-sm)', fontWeight: 600, transition: 'all 0.2s',
            background: tab === 'history' ? 'var(--color-neutral-0)' : 'transparent',
            color: tab === 'history' ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
            boxShadow: tab === 'history' ? 'var(--shadow-sm)' : 'none',
            marginLeft: 'auto'
          }}
        >
          <ClockIcon style={{ width: 18, height: 18 }} />
          Historial
          {history.length > 0 && (
            <span style={{
              background: tab === 'history' ? 'var(--color-primary-100)' : 'var(--color-neutral-200)',
              color: tab === 'history' ? 'var(--color-primary-700)' : 'var(--color-neutral-600)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 10,
            }}>
              {history.length}
            </span>
          )}
        </button>
      </div>

      {/* ============== OVERVIEW ============== */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {tools.filter(t => t.id !== 'history').map((t) => {
            const colorMap: any = {
              primary: { bg: 'var(--color-primary-50)', icon: 'var(--color-primary-600)', border: 'var(--color-primary-200)' },
              success: { bg: 'var(--color-success-50)', icon: 'var(--color-success-600)', border: 'var(--color-success-200)' },
              warning: { bg: 'var(--color-warning-50)', icon: 'var(--color-warning-600)', border: 'var(--color-warning-200)' },
              danger: { bg: 'var(--color-danger-50)', icon: 'var(--color-danger-600)', border: 'var(--color-danger-200)' },
            };
            const colors = colorMap[t.color];
            
            return (
              <Card 
                key={t.id} 
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: `2px solid ${colors.border}`,
                }}
                onClick={() => setTab(t.id as any)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 12, 
                    background: colors.bg, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <t.icon style={{ width: 24, height: 24, color: colors.icon }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 4, color: 'var(--color-neutral-900)' }}>
                      {t.label}
                    </h3>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', lineHeight: 1.5, margin: 0 }}>
                      {t.description}
                    </p>
                    <div style={{ 
                      marginTop: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 'var(--text-xs)',
                      color: colors.icon,
                      fontWeight: 600
                    }}>
                      Usar herramienta
                      <ArrowTopRightOnSquareIcon style={{ width: 14, height: 14 }} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ============== HERRAMIENTAS ============== */}
      {tab !== 'overview' && tab !== 'history' && activeTool && (
        <>
          {/* Header de herramienta */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 300 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <activeTool.icon style={{ width: 28, height: 28, color: 'var(--color-primary-600)' }} />
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>{activeTool.label}</h3>
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', lineHeight: 1.6, marginBottom: 8 }}>
                  {activeTool.description}
                </p>
                {activeTool.useCase && (
                  <div style={{ 
                    fontSize: 'var(--text-xs)', 
                    color: 'var(--color-neutral-600)', 
                    background: 'var(--color-neutral-100)',
                    padding: '8px 12px',
                    borderRadius: 6,
                    display: 'inline-block'
                  }}>
                    <strong>💡 Caso de uso:</strong> {activeTool.useCase}
                  </div>
                )}
              </div>
              {activeTool.templateType && (
                <Button 
                  variant="secondary" 
                  onClick={() => toolsService.downloadTemplate(activeTool.templateType!)}
                  icon={<ArrowDownTrayIcon />}
                >
                  Descargar plantilla
                </Button>
              )}
            </div>
          </Card>

          {/* COMPARE */}
          {tab === 'compare' && (
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <FileInput
                  label="Archivo A"
                  accept=".xlsx,.xls"
                  value={cA}
                  onChange={setCA}
                  hint="Primera lista de personas"
                />
                <FileInput
                  label="Archivo B"
                  accept=".xlsx,.xls"
                  value={cB}
                  onChange={setCB}
                  hint="Segunda lista de personas"
                />
              </div>
              
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                {cA && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handlePreview(cA, 'Archivo A')}
                    icon={<EyeIcon />}
                  >
                    Vista previa A
                  </Button>
                )}
                {cB && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handlePreview(cB, 'Archivo B')}
                    icon={<EyeIcon />}
                  >
                    Vista previa B
                  </Button>
                )}
                <Button 
                  onClick={() => run(() => toolsService.compare(cA!, cB!), setCRes)} 
                  isLoading={busy} 
                  disabled={!cA || !cB}
                  icon={<MagnifyingGlassIcon />}
                >
                  Comparar archivos
                </Button>
                {cRes && (
                  <Button 
                    variant="success" 
                    onClick={() => toolsService.compareExport(cA!, cB!)}
                    icon={<ArrowDownTrayIcon />}
                  >
                    Exportar resultado
                  </Button>
                )}
              </div>

              {cRes && (
                <>
                  <div style={{ marginTop: 24 }}>
                    <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 12, color: 'var(--color-neutral-800)' }}>
                      Resultados de la comparación
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                      <StatCard 
                        icon={<CheckCircleIcon style={{ width: 20, height: 20 }} />}
                        label="En ambos archivos"
                        value={cRes.summary.both}
                        color="success"
                      />
                      <StatCard 
                        icon={<DocumentTextIcon style={{ width: 20, height: 20 }} />}
                        label="Solo en archivo A"
                        value={cRes.summary.onlyA}
                        color="primary"
                      />
                      <StatCard 
                        icon={<DocumentTextIcon style={{ width: 20, height: 20 }} />}
                        label="Solo en archivo B"
                        value={cRes.summary.onlyB}
                        color="warning"
                      />
                    </div>
                  </div>
                  <ResultTable 
                    headers={cRes.onlyA.headers} 
                    rows={cRes.onlyA.rows} 
                    title="Registros únicos en Archivo A"
                  />
                </>
              )}
            </Card>
          )}

          {/* SCHEDULE */}
          {tab === 'schedule' && (
            <Card>
              <FileInput
                label="Archivo de horario"
                accept=".xlsx,.xls"
                value={sF}
                onChange={setSF}
                hint="Horario en formato tabla (salones × días)"
              />
              
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                {sF && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handlePreview(sF, 'Horario')}
                    icon={<EyeIcon />}
                  >
                    Vista previa
                  </Button>
                )}
                <Button 
                  onClick={() => run(() => toolsService.transform(sF!), setSRes)} 
                  isLoading={busy} 
                  disabled={!sF}
                  icon={<ArrowPathIcon />}
                >
                  Transformar horario
                </Button>
                {sRes && (
                  <Button 
                    variant="success" 
                    onClick={() => toolsService.transformExport(sF!)}
                    icon={<ArrowDownTrayIcon />}
                  >
                    Exportar resultado
                  </Button>
                )}
              </div>

              {sRes && (
                <>
                  <div style={{ marginTop: 24 }}>
                    <StatCard 
                      icon={<TableCellsIcon style={{ width: 20, height: 20 }} />}
                      label="Asignaciones transformadas"
                      value={sRes.total}
                      color="success"
                    />
                  </div>
                  <ResultTable 
                    headers={['AULA', 'SLOT', 'DOCENTE', 'CURSO', 'DIA_SEMANA']} 
                    rows={sRes.rows} 
                    title="Horario transformado"
                  />
                </>
              )}
            </Card>
          )}

          {/* CROSS */}
          {tab === 'cross' && (
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <FileInput
                  label="Lista de docentes"
                  accept=".xlsx,.xls"
                  value={xI}
                  onChange={setXI}
                  hint="Docentes con nombre y DNI"
                />
                <FileInput
                  label="Horario transformado"
                  accept=".xlsx,.xls"
                  value={xS}
                  onChange={setXS}
                  hint="Horario en formato lista"
                />
              </div>
              
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                {xI && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handlePreview(xI, 'Docentes')}
                    icon={<EyeIcon />}
                  >
                    Vista previa docentes
                  </Button>
                )}
                {xS && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handlePreview(xS, 'Horario')}
                    icon={<EyeIcon />}
                  >
                    Vista previa horario
                  </Button>
                )}
                <Button 
                  onClick={() => run(() => toolsService.cross(xI!, xS!), setXRes)} 
                  isLoading={busy} 
                  disabled={!xI || !xS}
                  icon={<UsersIcon />}
                >
                  Cruzar datos
                </Button>
                {xRes && (
                  <Button 
                    variant="success" 
                    onClick={() => toolsService.crossExport(xI!, xS!)}
                    icon={<ArrowDownTrayIcon />}
                  >
                    Exportar resultado
                  </Button>
                )}
              </div>

              {xRes && (
                <>
                  <div style={{ marginTop: 24 }}>
                    <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 12, color: 'var(--color-neutral-800)' }}>
                      Resultados del cruce
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                      <StatCard 
                        icon={<CheckCircleIcon style={{ width: 20, height: 20 }} />}
                        label="Coincidencias exactas"
                        value={xRes.summary.exact}
                        color="success"
                      />
                      <StatCard 
                        icon={<ExclamationTriangleIcon style={{ width: 20, height: 20 }} />}
                        label="Coincidencias fuzzy"
                        value={xRes.summary.fuzzy}
                        color="warning"
                      />
                      <StatCard 
                        icon={<XCircleIcon style={{ width: 20, height: 20 }} />}
                        label="No encontrados"
                        value={xRes.summary.notFound}
                        color="danger"
                      />
                    </div>
                  </div>
                  <ResultTable 
                    headers={xRes.rows.length ? Object.keys(xRes.rows[0]) : []} 
                    rows={xRes.rows} 
                    title="Horario con DNI de docentes"
                  />
                </>
              )}
            </Card>
          )}

          {/* ASSIGNMENTS */}
          {tab === 'assignments' && (
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <FileInput
                  label="Secciones (CODIGO_SECCION)"
                  accept=".xlsx,.xls"
                  value={aS}
                  onChange={setAS}
                  hint="Lista de códigos de sección"
                />
                <FileInput
                  label="Cursos (CODIGO_CURSO)"
                  accept=".xlsx,.xls"
                  value={aC}
                  onChange={setAC}
                  hint="Lista de códigos de curso"
                />
              </div>
              
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => toolsService.downloadTemplate('assignments-sections')}
                  icon={<ArrowDownTrayIcon />}
                >
                  Plantilla Secciones
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => toolsService.downloadTemplate('assignments-courses')}
                  icon={<ArrowDownTrayIcon />}
                >
                  Plantilla Cursos
                </Button>
              </div>
              
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                {aS && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handlePreview(aS, 'Secciones')}
                    icon={<EyeIcon />}
                  >
                    Vista previa secciones
                  </Button>
                )}
                {aC && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handlePreview(aC, 'Cursos')}
                    icon={<EyeIcon />}
                  >
                    Vista previa cursos
                  </Button>
                )}
                <Button 
                  onClick={() => run(() => toolsService.assignments(aS!, aC!), setARes)} 
                  isLoading={busy} 
                  disabled={!aS || !aC}
                  icon={<Squares2X2Icon />}
                >
                  Generar asignaciones
                </Button>
                {aRes && (
                  <Button 
                    variant="success" 
                    onClick={() => toolsService.assignmentsExport(aS!, aC!)}
                    icon={<ArrowDownTrayIcon />}
                  >
                    Exportar resultado
                  </Button>
                )}
              </div>

              {aRes && (
                <>
                  <div style={{ marginTop: 24 }}>
                    <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 12, color: 'var(--color-neutral-800)' }}>
                      Producto cartesiano generado
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                      <StatCard 
                        icon={<TableCellsIcon style={{ width: 20, height: 20 }} />}
                        label="Secciones"
                        value={aRes.summary.sections}
                        color="primary"
                      />
                      <StatCard 
                        icon={<DocumentTextIcon style={{ width: 20, height: 20 }} />}
                        label="Cursos"
                        value={aRes.summary.courses}
                        color="success"
                      />
                      <StatCard 
                        icon={<ChartBarIcon style={{ width: 20, height: 20 }} />}
                        label="Total de filas"
                        value={aRes.summary.total}
                        color="warning"
                      />
                    </div>
                  </div>
                  <ResultTable 
                    headers={['CODIGO_SECCION', 'CODIGO_CURSO']} 
                    rows={aRes.sample} 
                    title="Muestra de asignaciones generadas"
                  />
                </>
              )}
            </Card>
          )}
        </>
      )}

      {/* ============== HISTORY ============== */}
      {tab === 'history' && (
        <Card className="p-0">
          <div style={{ 
            padding: '16px', 
            borderBottom: '1px solid var(--color-neutral-200)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--color-neutral-50)'
          }}>
            <ClockIcon style={{ width: 20, height: 20, color: 'var(--color-primary-600)' }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-neutral-700)' }}>
              Historial de operaciones
            </span>
            <Badge color="primary">{history.length} registros</Badge>
          </div>
          
          {history.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-neutral-500)' }}>
              <ClockIcon style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>
                Sin operaciones registradas
              </div>
              <div style={{ fontSize: 'var(--text-sm)' }}>
                Las operaciones de herramientas aparecerán aquí
              </div>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha/Hora</th>
                    <th>Usuario</th>
                    <th>Herramienta</th>
                    <th>Detalles</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((log) => {
                    const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'neutral' };
                    return (
                      <tr key={log.id}>
                        <td style={{ fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600 }}>
                            {new Date(log.createdAt).toLocaleDateString()}
                          </div>
                          <div style={{ color: 'var(--color-neutral-500)' }}>
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                            {log.userName || '—'}
                          </div>
                        </td>
                        <td>
                          <Badge color={actionInfo.color}>
                            {actionInfo.label}
                          </Badge>
                        </td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)' }}>
                          <div style={{ fontWeight: 500 }}>
                            {log.details?.file || log.details?.fileA || '—'}
                          </div>
                          {log.details?.summary && (
                            <div style={{ marginTop: 4, color: 'var(--color-neutral-500)' }}>
                              {JSON.stringify(log.details.summary)}
                            </div>
                          )}
                        </td>
                        <td>
                          {log.ipAddress ? (
                            <span style={{ 
                              fontSize: 'var(--text-xs)', 
                              fontFamily: 'monospace',
                              background: 'var(--color-neutral-100)',
                              padding: '2px 8px',
                              borderRadius: 4,
                              color: 'var(--color-neutral-600)'
                            }}>
                              {log.ipAddress}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-neutral-400)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Preview Modal mejorado */}
      <Modal isOpen={!!previewData} onClose={() => setPreviewData(null)} title={previewTitle} size="lg">
        {previewData && (
          <>
            <div style={{ 
              marginBottom: 16, 
              padding: '12px 16px', 
              background: 'var(--color-info-50)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 'var(--text-sm)',
              color: 'var(--color-info-700)'
            }}>
              <InformationCircleIcon style={{ width: 18, height: 18 }} />
              Vista previa de las primeras 5 filas del archivo
            </div>
            <ResultTable headers={previewData.headers} rows={previewData.rows} max={5} />
          </>
        )}
      </Modal>
    </div>
  );
};