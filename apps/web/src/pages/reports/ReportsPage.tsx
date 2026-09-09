import React, { useState, useEffect } from 'react';
import { 
  ArrowDownTrayIcon, DocumentChartBarIcon, CalendarIcon, 
  AcademicCapIcon, BookOpenIcon, BuildingOfficeIcon, MapPinIcon,
  UserGroupIcon, UsersIcon, ClockIcon, CheckCircleIcon,
  XCircleIcon, ExclamationCircleIcon, PrinterIcon,
  FunnelIcon, ChartBarIcon, SparklesIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Select, Input, Badge } from '@suite/ui';
import { useToast } from '../../context/ToastContext';
import { reportsService } from '../../api/reports.service';
import { academicService } from '../../api/academic.service';
import { peopleService } from '../../api/people.service';

const GROUP_LABELS: Record<string, string> = { 
  teacher: 'Docente', 
  course: 'Curso', 
  sede: 'Sede', 
  area: 'Área', 
  sedeCourse: 'Sede + Curso' 
};

const GROUP_ICONS: Record<string, React.ReactNode> = {
  teacher: <UsersIcon style={{ width: 16, height: 16 }} />,
  course: <BookOpenIcon style={{ width: 16, height: 16 }} />,
  sede: <BuildingOfficeIcon style={{ width: 16, height: 16 }} />,
  area: <AcademicCapIcon style={{ width: 16, height: 16 }} />,
  sedeCourse: <MapPinIcon style={{ width: 16, height: 16 }} />,
};

export const ReportsPage: React.FC = () => {
  const { success, error } = useToast();
  const [periods, setPeriods] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);

  const [params, setParams] = useState<any>({ 
    periodId: '', mode: 'period', weekNumber: 1, month: '', 
    blockId: '', groupBy: 'teacher', sedeId: '', areaId: '', 
    courseId: '', teacherProfileId: '' 
  });
  const [rows, setRows] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [phys, setPhys] = useState<any>({ periodId: '', weekNumber: 1, sedeId: '', turnoId: '', sectionId: '' });
  const [turnos, setTurnos] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [physLoading, setPhysLoading] = useState(false);

  useEffect(() => {
    academicService.listTurnos().then(setTurnos);
    academicService.listSections().then(setSections);
    Promise.all([
      academicService.listPeriods(), 
      academicService.listSedes(), 
      academicService.listAreas(), 
      peopleService.listTeachers()
    ]).then(([p, s, a, t]) => {
      setPeriods(p); setSedes(s); setAreas(a); setTeachers(t);
      const current = p.find((x: any) => x.isActive);
      if (current) setParams((prev: any) => ({ ...prev, periodId: current.id }));
    });
  }, []);

  useEffect(() => {
    if (params.periodId) academicService.listBlocks(params.periodId).then(setBlocks);
  }, [params.periodId]);

  const setParam = (k: string, v: any) => { 
    setParams((p: any) => ({ ...p, [k]: v })); 
    setLoaded(false); 
  };

  const allCourses = areas.flatMap((a) => a.courses.map((c: any) => ({ ...c, areaName: a.name })));

  const physSections = sections.filter((s) =>
    (!phys.sedeId || s.classroom?.sede?.id === phys.sedeId) &&
    (!phys.turnoId || s.turno?.id === phys.turnoId));
    
  const handlePhys = async () => {
    if (!phys.periodId) { error('Selecciona período'); return; }
    setPhysLoading(true);
    try { 
      await reportsService.downloadPhysicalAttendance(phys); 
      success('📥 Asistencia física descargada'); 
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    } finally { 
      setPhysLoading(false); 
    }
  };

  const handleLoad = async () => {
    if (!params.periodId) { error('Selecciona un período'); return; }
    setLoading(true);
    try {
      const r = await reportsService.getConsolidated(params);
      setRows(r); setLoaded(true);
      if (r.length === 0) error('Sin datos para los filtros seleccionados');
      else success(`✅ ${r.length} registro(s) encontrado(s)`);
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleExport = async () => {
    if (!params.periodId) { error('Selecciona un período antes de exportar'); return; }
    setExporting(true);
    try { 
      await reportsService.exportExcel(params); 
      success('📥 Excel descargado'); 
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    } finally { 
      setExporting(false); 
    }
  };

  const handleClearFilters = () => {
    setParams((p: any) => ({ 
      ...p, 
      sedeId: '', 
      areaId: '', 
      courseId: '', 
      teacherProfileId: '' 
    }));
    setLoaded(false);
  };

  const totals = rows.reduce((a, r) => ({ 
    hours: a.hours + r.hours, 
    presents: a.presents + r.presents, 
    absents: a.absents + r.absents, 
    lateMinutes: a.lateMinutes + r.lateMinutes 
  }), { hours: 0, presents: 0, absents: 0, lateMinutes: 0 });

  const totalRecords = totals.presents + totals.absents;
  const avgAttendanceRate = totalRecords > 0 
    ? Math.round((totals.presents / totalRecords) * 100) 
    : 0;

  const groupLabel = GROUP_LABELS[params.groupBy] || 'Docente';

  const hasActiveFilters = params.sedeId || params.areaId || params.courseId || params.teacherProfileId;

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DocumentChartBarIcon style={{ width: 24, height: 24, color: 'var(--color-primary-600)' }} />
            <h1 className="page-title">Reportes y Consolidados</h1>
          </div>
          <p className="page-subtitle">Asistencia consolidada con filtros y exportación Excel</p>
        </div>
      </div>

      {/* ============== SECCIÓN 1: CONSOLIDADO ============== */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%)',
              color: 'var(--color-primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ChartBarIcon style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
                Reporte consolidado
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
                Configura filtros y genera el consolidado de asistencia
              </p>
            </div>
          </div>
          <Button 
            variant="success" 
            onClick={handleExport} 
            isLoading={exporting} 
            loadingText="Exportando..."
            disabled={!params.periodId}
            icon={<ArrowDownTrayIcon />}
          >
            Exportar Excel
          </Button>
        </div>

        {/* Rango de fechas */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ 
            fontSize: 'var(--text-sm)', 
            fontWeight: 600, 
            marginBottom: 12, 
            color: 'var(--color-neutral-700)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingBottom: 8,
            borderBottom: '1px solid var(--color-neutral-200)'
          }}>
            <CalendarIcon style={{ width: 16, height: 16, color: 'var(--color-primary-600)' }} />
            Rango de fechas
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Select 
              label="Período" 
              value={params.periodId} 
              onChange={(e) => setParam('periodId', e.target.value)} 
              options={periods.map((p) => ({ value: p.id, label: p.name }))} 
            />
            <Select 
              label="Modo" 
              value={params.mode} 
              onChange={(e) => setParam('mode', e.target.value)}
              options={[
                { value: 'week', label: '📅 Semanal' }, 
                { value: 'month', label: '🗓️ Mensual' }, 
                { value: 'block', label: '📦 Por bloque' }, 
                { value: 'period', label: '📊 Período completo' }
              ]} 
            />
            {params.mode === 'week' && (
              <Select 
                label="Semana" 
                value={String(params.weekNumber)} 
                onChange={(e) => setParam('weekNumber', parseInt(e.target.value))}
                options={Array.from({ length: periods.find((p) => p.id === params.periodId)?.weeks || 12 }, (_, i) => ({ 
                  value: String(i + 1), 
                  label: `Semana ${i + 1}` 
                }))} 
              />
            )}
            {params.mode === 'month' && (
              <Input 
                label="Mes" 
                type="month" 
                value={params.month} 
                onChange={(e) => setParam('month', e.target.value)}
                icon={<CalendarIcon />}
              />
            )}
            {params.mode === 'block' && (
              <Select 
                label="Bloque" 
                value={params.blockId} 
                onChange={(e) => setParam('blockId', e.target.value)}
                options={[{ value: '', label: 'Todos los bloques' }, ...blocks.map((b) => ({ value: b.id, label: b.name }))]} 
              />
            )}
          </div>
        </div>

        {/* Agrupación */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ 
            fontSize: 'var(--text-sm)', 
            fontWeight: 600, 
            marginBottom: 12, 
            color: 'var(--color-neutral-700)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingBottom: 8,
            borderBottom: '1px solid var(--color-neutral-200)'
          }}>
            <FunnelIcon style={{ width: 16, height: 16, color: 'var(--color-primary-600)' }} />
            Agrupación
          </h4>
          <Select 
            label="Agrupar por" 
            value={params.groupBy} 
            onChange={(e) => setParam('groupBy', e.target.value)}
            options={[
              { value: 'teacher', label: '👨 Docente' },
              { value: 'course', label: '📘 Curso' },
              { value: 'sede', label: '🏫 Sede' },
              { value: 'area', label: '📚 Área' },
              { value: 'sedeCourse', label: '🏫📘 Sede + Curso' },
            ]} 
          />
        </div>

        {/* Filtros adicionales */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ 
              fontSize: 'var(--text-sm)', 
              fontWeight: 600, 
              margin: 0,
              color: 'var(--color-neutral-700)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <SparklesIcon style={{ width: 16, height: 16, color: 'var(--color-primary-600)' }} />
              Filtros adicionales
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', fontWeight: 400 }}>
                (opcional)
              </span>
            </h4>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearFilters}
                icon={<XCircleIcon />}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Select 
              label="Sede" 
              value={params.sedeId} 
              onChange={(e) => setParam('sedeId', e.target.value)} 
              options={[{ value: '', label: 'Todas las sedes' }, ...sedes.map((s) => ({ value: s.id, label: s.name }))]} 
            />
            <Select 
              label="Área" 
              value={params.areaId} 
              onChange={(e) => { setParam('areaId', e.target.value); setParam('courseId', ''); }} 
              options={[{ value: '', label: 'Todas las áreas' }, ...areas.map((a) => ({ value: a.id, label: a.name }))]} 
            />
            <Select 
              label="Curso" 
              value={params.courseId} 
              onChange={(e) => setParam('courseId', e.target.value)} 
              options={[{ value: '', label: 'Todos los cursos' }, ...allCourses.filter((c) => !params.areaId || c.areaId === params.areaId).map((c) => ({ value: c.id, label: `${c.name} (${c.areaName})` }))]} 
            />
            <Select 
              label="Docente" 
              value={params.teacherProfileId} 
              onChange={(e) => setParam('teacherProfileId', e.target.value)} 
              options={[{ value: '', label: 'Todos los docentes' }, ...teachers.map((t) => ({ value: t.teacherProfile.id, label: `${t.lastName}, ${t.firstName}` }))]} 
            />
          </div>
        </div>

        <Button 
          onClick={handleLoad} 
          isLoading={loading}
          loadingText="Generando..."
          icon={<DocumentChartBarIcon />}
          style={{ width: '100%', marginTop: 8 }}
        >
          Generar consolidado
        </Button>
      </Card>

      {/* ============== STATS DE RESULTADOS ============== */}
      {loaded && rows.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, margin: '16px 0' }}>
          <Card className="p-4" style={{ background: 'var(--color-primary-50)', borderColor: 'var(--color-primary-600)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ClockIcon style={{ width: 20, height: 20, color: 'var(--color-primary-600)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-700)', fontWeight: 500 }}>Total horas</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-primary-700)' }}>
              {totals.hours}
            </div>
          </Card>
          <Card className="p-4" style={{ background: 'var(--color-success-50)', borderColor: 'var(--color-success-700)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <CheckCircleIcon style={{ width: 20, height: 20, color: 'var(--color-success-600)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success-700)', fontWeight: 500 }}>Asistencias</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-success-700)' }}>
              {totals.presents}
            </div>
          </Card>
          <Card className="p-4" style={{ background: 'var(--color-danger-50)', borderColor: 'var(--color-danger-600)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <XCircleIcon style={{ width: 20, height: 20, color: 'var(--color-danger-600)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger-700)', fontWeight: 500 }}>Faltas</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-danger-700)' }}>
              {totals.absents}
            </div>
          </Card>
          <Card className="p-4" style={{ background: 'var(--color-warning-50)', borderColor: 'var(--color-warning-600)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ExclamationCircleIcon style={{ width: 20, height: 20, color: 'var(--color-warning-600)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning-700)', fontWeight: 500 }}>Tardanzas (min)</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-warning-700)' }}>
              {totals.lateMinutes}
            </div>
          </Card>
          <Card className="p-4" style={{ 
            background: avgAttendanceRate >= 90 ? 'var(--color-success-50)' : avgAttendanceRate >= 70 ? 'var(--color-warning-50)' : 'var(--color-danger-50)',
            borderColor: avgAttendanceRate >= 90 ? 'var(--color-success-200)' : avgAttendanceRate >= 70 ? 'var(--color-warning-200)' : 'var(--color-danger-200)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ChartBarIcon style={{ width: 20, height: 20, color: avgAttendanceRate >= 90 ? 'var(--color-success-600)' : avgAttendanceRate >= 70 ? 'var(--color-warning-600)' : 'var(--color-danger-600)' }} />
              <span style={{ 
                fontSize: 'var(--text-xs)', 
                color: avgAttendanceRate >= 90 ? 'var(--color-success-700)' : avgAttendanceRate >= 70 ? 'var(--color-warning-700)' : 'var(--color-danger-700)', 
                fontWeight: 500 
              }}>
                Asistencia promedio
              </span>
            </div>
            <div style={{ 
              fontSize: 'var(--text-2xl)', 
              fontWeight: 700, 
              color: avgAttendanceRate >= 90 ? 'var(--color-success-700)' : avgAttendanceRate >= 70 ? 'var(--color-warning-700)' : 'var(--color-danger-700)'
            }}>
              {avgAttendanceRate}%
            </div>
          </Card>
        </div>
      )}

      {/* ============== TABLA DE RESULTADOS ============== */}
      {loaded && (
        <Card className="p-0">
          <div style={{ 
            padding: '16px 20px', 
            borderBottom: '1px solid var(--color-neutral-200)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--color-neutral-50)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {GROUP_ICONS[params.groupBy]}
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-neutral-700)' }}>
                Consolidado por {groupLabel}
              </span>
            </div>
            <Badge color="primary">{rows.length} registro(s)</Badge>
          </div>

          {rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-neutral-400)' }}>
              <DocumentChartBarIcon style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>
                Sin datos para los filtros seleccionados
              </div>
              <div style={{ fontSize: 'var(--text-sm)' }}>
                Intenta ajustar el rango de fechas o los filtros
              </div>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{groupLabel}</th>
                    {params.groupBy === 'teacher' && <><th>DNI</th><th>Curso</th></>}
                    {(params.groupBy === 'course' || params.groupBy === 'sedeCourse') && <th>Área</th>}
                    <th style={{ textAlign: 'center' }}>Horas</th>
                    <th style={{ textAlign: 'center' }}>Asist.</th>
                    <th style={{ textAlign: 'center' }}>Faltas</th>
                    <th style={{ textAlign: 'center' }}>Tard. (min)</th>
                    <th style={{ textAlign: 'center' }}>% Asist.</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: 'var(--color-primary-100)',
                            color: 'var(--color-primary-700)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {GROUP_ICONS[params.groupBy]}
                          </div>
                          <strong style={{ color: 'var(--color-neutral-900)' }}>{r.label}</strong>
                        </div>
                      </td>
                      {params.groupBy === 'teacher' && (
                        <>
                          <td style={{ color: 'var(--color-neutral-600)', fontSize: 'var(--text-sm)' }}>{r.dni}</td>
                          <td style={{ color: 'var(--color-neutral-600)', fontSize: 'var(--text-sm)' }}>{r.course}</td>
                        </>
                      )}
                      {(params.groupBy === 'course' || params.groupBy === 'sedeCourse') && (
                        <td style={{ color: 'var(--color-neutral-600)', fontSize: 'var(--text-sm)' }}>{r.area}</td>
                      )}
                      <td style={{ textAlign: 'center' }}>
                        <strong style={{ color: 'var(--color-primary-600)', fontSize: 'var(--text-base)' }}>
                          {r.hours}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ color: 'var(--color-success-700)', fontWeight: 600 }}>
                          {r.presents}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          color: r.absents > 0 ? 'var(--color-danger-700)' : 'var(--color-neutral-400)', 
                          fontWeight: r.absents > 0 ? 600 : 400 
                        }}>
                          {r.absents}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          color: r.lateMinutes > 0 ? 'var(--color-warning-700)' : 'var(--color-neutral-400)', 
                          fontWeight: r.lateMinutes > 0 ? 600 : 400 
                        }}>
                          {r.lateMinutes}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge color={r.attendanceRate >= 90 ? 'success' : r.attendanceRate >= 70 ? 'warning' : 'danger'}>
                          {r.attendanceRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--color-primary-50)' }}>
                    <td>
                      <strong style={{ color: 'var(--color-primary-700)' }}>TOTAL</strong>
                    </td>
                    {params.groupBy === 'teacher' && <><td></td><td></td></>}
                    {(params.groupBy === 'course' || params.groupBy === 'sedeCourse') && <td></td>}
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--color-primary-700)' }}>
                      {totals.hours}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--color-success-700)' }}>
                      {totals.presents}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--color-danger-700)' }}>
                      {totals.absents}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--color-warning-700)' }}>
                      {totals.lateMinutes}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge color={avgAttendanceRate >= 90 ? 'success' : avgAttendanceRate >= 70 ? 'warning' : 'danger'}>
                        {avgAttendanceRate}%
                      </Badge>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ============== SECCIÓN 2: ASISTENCIA FÍSICA ============== */}
      <Card style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--color-success-50) 0%, var(--color-success-100) 100%)',
            color: 'var(--color-success-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <PrinterIcon style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
              Asistencia física semanal
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
              Genera hoja imprimible por sección para control de asistencia manual
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Select 
            label="Período" 
            value={phys.periodId} 
            onChange={(e) => setPhys({ ...phys, periodId: e.target.value })} 
            options={[{ value: '', label: 'Seleccionar período' }, ...periods.map((p) => ({ value: p.id, label: p.name }))]} 
          />
          <Select 
            label="Semana" 
            value={String(phys.weekNumber)} 
            onChange={(e) => setPhys({ ...phys, weekNumber: parseInt(e.target.value) })}
            options={Array.from({ length: periods.find((p) => p.id === phys.periodId)?.weeks || 12 }, (_, i) => ({ 
              value: String(i + 1), 
              label: `Semana ${i + 1}` 
            }))} 
          />
          <Select 
            label="Sede" 
            value={phys.sedeId} 
            onChange={(e) => setPhys({ ...phys, sedeId: e.target.value, sectionId: '' })} 
            options={[{ value: '', label: 'Todas las sedes' }, ...sedes.map((s) => ({ value: s.id, label: s.name }))]} 
          />
          <Select 
            label="Turno" 
            value={phys.turnoId} 
            onChange={(e) => setPhys({ ...phys, turnoId: e.target.value, sectionId: '' })} 
            options={[{ value: '', label: 'Todos los turnos' }, ...turnos.map((t) => ({ value: t.id, label: t.name }))]} 
          />
          <Select 
            label="Sección" 
            value={phys.sectionId} 
            onChange={(e) => setPhys({ ...phys, sectionId: e.target.value })} 
            options={[{ value: '', label: 'Todas las secciones' }, ...physSections.map((s) => ({ value: s.id, label: s.name }))]} 
          />
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button 
              variant="success" 
              onClick={handlePhys} 
              isLoading={physLoading}
              loadingText="Generando..."
              icon={<PrinterIcon />}
              style={{ width: '100%' }}
            >
              Descargar PDF
            </Button>
          </div>
        </div>
        <div style={{ 
          marginTop: 12, 
          padding: '10px 12px', 
          background: 'var(--color-info-50)',
          border: '1px solid var(--color-info-200)',
          borderRadius: 8,
          fontSize: 'var(--text-xs)',
          color: 'var(--color-info-700)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <ExclamationCircleIcon style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span>
            Genera una hoja por sección con alumnos ordenados alfabéticamente y 5 casillas (LUN–VIE) para firma.
          </span>
        </div>
      </Card>
    </div>
  );
};