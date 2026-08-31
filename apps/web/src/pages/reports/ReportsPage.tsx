import React, { useState, useEffect } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Card, Button, Select } from '@suite/ui';
import { useToast } from '../../context/ToastContext';
import { reportsService } from '../../api/reports.service';
import { academicService } from '../../api/academic.service';
import { peopleService } from '../../api/people.service';

export const ReportsPage: React.FC = () => {
  const { success, error } = useToast();
  const [periods, setPeriods] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);

  const [params, setParams] = useState<any>({ periodId: '', mode: 'period', weekNumber: 1, month: '', blockId: '', groupBy: 'teacher', sedeId: '', areaId: '', courseId: '', teacherProfileId: '' });
  const [rows, setRows] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([academicService.listPeriods(), academicService.listSedes(), academicService.listAreas(), peopleService.listTeachers()]).then(([p, s, a, t]) => {
      setPeriods(p); setSedes(s); setAreas(a); setTeachers(t);
      const current = p.find((x: any) => x.isActive);
      if (current) setParams((prev: any) => ({ ...prev, periodId: current.id }));
    });
  }, []);

  useEffect(() => {
    if (params.periodId) academicService.listBlocks(params.periodId).then(setBlocks);
  }, [params.periodId]);

  const setParam = (k: string, v: any) => { setParams((p: any) => ({ ...p, [k]: v })); setLoaded(false); };

  const allCourses = areas.flatMap((a) => a.courses.map((c: any) => ({ ...c, areaName: a.name })));

  const handleLoad = async () => {
    setLoading(true);
    try {
      const r = await reportsService.getConsolidated(params);
      setRows(r); setLoaded(true);
      if (r.length === 0) error('Sin datos para los filtros');
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try { await reportsService.exportExcel(params); success('📥 Excel descargado'); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setExporting(false); }
  };

  const totals = rows.reduce((a, r) => ({ hours: a.hours + r.hours, presents: a.presents + r.presents, absents: a.absents + r.absents, lateMinutes: a.lateMinutes + r.lateMinutes }), { hours: 0, presents: 0, absents: 0, lateMinutes: 0 });
  const GROUP_LABELS: Record<string, string> = { teacher: 'Docente', course: 'Curso', sede: 'Sede', area: 'Área', sedeCourse: 'Sede + Curso' };
  const groupLabel = GROUP_LABELS[params.groupBy] || 'Docente'; 

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes y Consolidados</h1>
          <p className="page-subtitle">Asistencia consolidada con filtros y exportación Excel</p>
        </div>
        <Button variant="success" onClick={handleExport} isLoading={exporting} disabled={!params.periodId}>
          <ArrowDownTrayIcon style={{ width: 16, height: 16 }} /> Exportar Excel
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <Select label="Período" value={params.periodId} onChange={(e) => setParam('periodId', e.target.value)} options={periods.map((p) => ({ value: p.id, label: p.name }))} />
          <Select label="Modo" value={params.mode} onChange={(e) => setParam('mode', e.target.value)}
            options={[{ value: 'week', label: 'Semanal' }, { value: 'month', label: 'Mensual' }, { value: 'block', label: 'Por bloque' }, { value: 'period', label: 'Período completo' }]} />
          {params.mode === 'week' && (
            <Select label="Semana" value={String(params.weekNumber)} onChange={(e) => setParam('weekNumber', parseInt(e.target.value))}
              options={Array.from({ length: periods.find((p) => p.id === params.periodId)?.weeks || 12 }, (_, i) => ({ value: String(i + 1), label: `Semana ${i + 1}` }))} />
          )}
          {params.mode === 'month' && (
            <div><label className="input-label">Mes</label><input type="month" className="input" value={params.month} onChange={(e) => setParam('month', e.target.value)} /></div>
          )}
          {params.mode === 'block' && (
            <Select label="Bloque" value={params.blockId} onChange={(e) => setParam('blockId', e.target.value)}
              options={[{ value: '', label: 'Todos' }, ...blocks.map((b) => ({ value: b.id, label: b.name }))]} />
          )}
          <Select label="Agrupar por" value={params.groupBy} onChange={(e) => setParam('groupBy', e.target.value)}
            options={[
              { value: 'teacher', label: '👨 Docente' },
              { value: 'course', label: '📘 Curso' },
              { value: 'sede', label: '🏫 Sede' },
              { value: 'area', label: '📚 Área' },
              { value: 'sedeCourse', label: '🏫 Sede + Curso' },
            ]}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginTop: 12 }}>
          <Select label="Filtrar sede" value={params.sedeId} onChange={(e) => setParam('sedeId', e.target.value)} options={[{ value: '', label: 'Todas' }, ...sedes.map((s) => ({ value: s.id, label: s.name }))]} />
          <Select label="Filtrar área" value={params.areaId} onChange={(e) => { setParam('areaId', e.target.value); setParam('courseId', ''); }} options={[{ value: '', label: 'Todas' }, ...areas.map((a) => ({ value: a.id, label: a.name }))]} />
          <Select label="Filtrar curso" value={params.courseId} onChange={(e) => setParam('courseId', e.target.value)} options={[{ value: '', label: 'Todos' }, ...allCourses.filter((c) => !params.areaId || c.areaId === params.areaId).map((c) => ({ value: c.id, label: c.name }))]} />
          <Select label="Filtrar docente" value={params.teacherProfileId} onChange={(e) => setParam('teacherProfileId', e.target.value)} options={[{ value: '', label: 'Todos' }, ...teachers.map((t) => ({ value: t.teacherProfile.id, label: `${t.lastName}, ${t.firstName}` }))]} />
        </div>
        <Button onClick={handleLoad} isLoading={loading} style={{ marginTop: 16, width: '100%' }}>🔍 Generar consolidado</Button>
      </Card>

      {loaded && (
        <Card className="p-0">
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{groupLabel}</th>
                  {params.groupBy === 'teacher' && <><th>DNI</th><th>Curso</th></>}
                  {params.groupBy === 'course' && <th>Área</th>}
                  {params.groupBy === 'course' && <th>Área</th>}
                  {params.groupBy === 'sedeCourse' && <th>Área</th>}
                  <th>Horas</th><th>Asist.</th><th>Faltas</th><th>Tard.</th><th>% Asist.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <td><strong>{r.label}</strong></td>
                    {params.groupBy === 'teacher' && <><td>{r.dni}</td><td>{r.course}</td></>}
                    {params.groupBy === 'course' && <td>{r.area}</td>}
                    {params.groupBy === 'course' && <td>{r.area}</td>}
                    {params.groupBy === 'sedeCourse' && <td>{r.area}</td>}
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--color-primary-600)' }}>{r.hours}</td>
                    <td style={{ textAlign: 'center', color: 'var(--color-success-700)' }}>{r.presents}</td>
                    <td style={{ textAlign: 'center', color: 'var(--color-danger-700)' }}>{r.absents}</td>
                    <td style={{ textAlign: 'center', color: r.lateMinutes > 0 ? 'var(--color-warning-700)' : 'var(--color-neutral-400)', fontWeight: r.lateMinutes > 0 ? 700 : 400 }}>{r.lateMinutes}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${r.attendanceRate >= 90 ? 'badge-success' : r.attendanceRate >= 70 ? 'badge-warning' : 'badge-danger'}`}>{r.attendanceRate}%</span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--color-neutral-400)' }}>Sin datos</td></tr>}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'var(--color-primary-50)' }}>
                    <td><strong>TOTAL</strong></td>
                    {params.groupBy === 'teacher' && <td />}
                    {params.groupBy === 'course' && <td />}
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{totals.hours}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{totals.presents}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{totals.absents}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{totals.lateMinutes}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};