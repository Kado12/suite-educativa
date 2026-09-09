import React, { useState, useEffect } from 'react';
import { Card, Button, Select, FileInput } from '@suite/ui';
import { useToast } from '../../context/ToastContext';
import { importsService } from '../../api/imports.service';
import { academicService } from '../../api/academic.service';
import { 
  ArrowDownTrayIcon, 
  DocumentArrowDownIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon
} from '@heroicons/react/24/outline';

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
  const [sedes, setSedes] = useState<any[]>([]);
  const [periodId, setPeriodId] = useState('');
  const [blockId, setBlockId] = useState('');
  const [sedeForSchedule, setSedeForSchedule] = useState('');

  useEffect(() => { 
    academicService.listPeriods().then(setPeriods); 
    academicService.listSedes().then(setSedes); 
  }, []);

  useEffect(() => { 
    if (periodId) {
      academicService.listBlocks(periodId).then(setBlocks);
      setBlockId('');
    }
  }, [periodId]);

  const handleImport = async () => {
    if (!file) { error('Selecciona un archivo'); return; }
    if (type === 'horario' && !blockId) { error('Selecciona un bloque para el horario'); return; }

    setUploading(true);
    setResult(null);

    try {
      const extra: Record<string, string> = {};
      if (type === 'horario') {
        extra.blockId = blockId;
        if (sedeForSchedule) extra.sedeId = sedeForSchedule;
      }

      const r = await importsService.importFile(type, file, extra);
      setResult(r);
      
      if (r.errors.length === 0) {
        success(`✅ ${r.created} registros creados, ${r.skipped} omitidos`);
      } else {
        error(`⚠️ ${r.created} creados, ${r.errors.length} errores encontrados`);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al importar');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    importsService.downloadTemplate(type);
    success('📥 Plantilla descargada');
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Configuración de importación */}
          <div>
            <h3 className="card-title" style={{ marginBottom: 12, fontSize: 'var(--text-base)' }}>
              <CloudArrowUpIcon style={{ width: 20, height: 20, display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
              Configuración
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <Select 
                label="Tipo de datos" 
                value={type} 
                onChange={(e) => { setType(e.target.value); setResult(null); }} 
                options={TYPES} 
              />

              {type === 'horario' && (
                <>
                  <Select 
                    label="Período" 
                    value={periodId} 
                    onChange={(e) => { setPeriodId(e.target.value); setBlockId(''); }}
                    options={[{ value: '', label: 'Selecciona período' }, ...periods.map((p) => ({ value: p.id, label: p.name }))]} 
                  />
                  <Select 
                    label="Bloque" 
                    value={blockId} 
                    onChange={(e) => setBlockId(e.target.value)}
                    options={[{ value: '', label: 'Selecciona bloque' }, ...blocks.map((b) => ({ value: b.id, label: b.name }))]} 
                  />  
                  <Select 
                    label="Sede (opcional)" 
                    value={sedeForSchedule} 
                    onChange={(e) => setSedeForSchedule(e.target.value)}
                    options={[{ value: '', label: 'Todas las sedes' }, ...sedes.map((s) => ({ value: s.id, label: s.name }))]} 
                    hint="Importa solo esta sede"
                  />
                </>
              )}
            </div>
          </div>

          {/* Archivo a importar */}
          <div>
            <h3 className="card-title" style={{ marginBottom: 12, fontSize: 'var(--text-base)' }}>
              <DocumentArrowDownIcon style={{ width: 20, height: 20, display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
              Archivo
            </h3>
            
            <FileInput
              label="Archivo Excel"
              accept=".xlsx,.xls"
              value={file}
              onChange={setFile}
              hint="Arrastra tu archivo aquí o haz clic para seleccionarlo"
              maxSizeMB={10}
            />
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button 
              onClick={handleImport} 
              isLoading={uploading}
              loadingText="Importando..."
              icon={<ArrowDownTrayIcon />}
              disabled={!file || (type === 'horario' && !blockId)}
            >
              Importar datos
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleDownloadTemplate}
              icon={<DocumentArrowDownIcon />}
            >
              Descargar plantilla
            </Button>
          </div>

          {/* Información */}
          <div style={{ 
            fontSize: 'var(--text-xs)', 
            color: 'var(--color-neutral-600)', 
            background: 'var(--color-info-54, var(--color-info-50))', 
            padding: '12px 16px', 
            borderRadius: 8,
            border: '1px solid var(--color-info-100, var(--color-neutral-200))'
          }}>
            <strong>💡 Información:</strong> Los duplicados se omiten automáticamente. 
            {type === 'alumnos' && ' Se crea persona + matrícula + cuotas (sin foto).'}
            {type === 'horario' && ' Se empareja por sección+día+slot y preserva asistencias existentes.'}
          </div>
        </div>
      </Card>

      {/* Resultados */}
      {result && (
        <>
          <Card>
            <h3 className="card-title" style={{ marginBottom: 16, fontSize: 'var(--text-base)' }}>
              Resultados de la importación
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
              <Card className="p-4" style={{ background: 'var(--color-success-50)', borderColor: 'var(--color-success-200, var(--color-neutral-200))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CheckCircleIcon style={{ width: 20, height: 20, color: 'var(--color-success-500)' }} />
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success-700)', fontWeight: 500 }}>Creados</div>
                </div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-success-600)' }}>{result.created}</div>
              </Card>
              
              <Card className="p-4" style={{ background: 'var(--color-neutral-50)', borderColor: 'var(--color-neutral-200)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <MinusCircleIcon style={{ width: 20, height: 20, color: 'var(--color-neutral-500)' }} />
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)', fontWeight: 500 }}>Omitidos</div>
                </div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-neutral-700)' }}>{result.skipped}</div>
              </Card>
              
              <Card className="p-4" style={{ background: 'var(--color-danger-50)', borderColor: 'var(--color-danger-200, var(--color-neutral-200))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <XCircleIcon style={{ width: 20, height: 20, color: 'var(--color-danger-500)' }} />
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger-700)', fontWeight: 500 }}>Errores</div>
                </div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-danger-600)' }}>{result.errors.length}</div>
              </Card>
            </div>

            {result.errors.length > 0 && (
              <div style={{ 
                background: 'var(--color-danger-50)', 
                border: '1px solid var(--color-danger-200, var(--color-neutral-200))',
                borderRadius: 8,
                padding: 16
              }}>
                <h4 style={{ 
                  fontSize: 'var(--text-sm)', 
                  fontWeight: 600, 
                  color: 'var(--color-danger-700)',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <XCircleIcon style={{ width: 18, height: 18 }} />
                  Errores encontrados ({result.errors.length})
                </h4>
                <div style={{ 
                  maxHeight: 300, 
                  overflowY: 'auto',
                  fontSize: 'var(--text-sm)'
                }}>
                  {result.errors.map((e: any, i: number) => (
                    <div 
                      key={i} 
                      style={{ 
                        padding: '8px 12px',
                        color: 'var(--color-danger-700)',
                        borderBottom: i < result.errors.length - 1 ? '1px solid var(--color-danger-100, var(--color-neutral-200))' : 'none'
                      }}
                    >
                      <strong>Fila {e.row}:</strong> {e.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};