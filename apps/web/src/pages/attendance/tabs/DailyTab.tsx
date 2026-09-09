import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Select, SearchableSelect, Badge } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { attendanceService } from '../../../api/attendance.service';
import { academicService } from '../../../api/academic.service';
import { peopleService } from '../../../api/people.service';
import { 
  CalendarIcon, MapPinIcon, CheckCircleIcon, XCircleIcon,
  ClockIcon, UsersIcon, BuildingOfficeIcon,
  ExclamationTriangleIcon, SparklesIcon
} from '@heroicons/react/24/outline';

interface Mark { status: 'PRESENT' | 'ABSENT'; lateMinutes: number; }
interface RowSelection { teacherId: string; courseId: string; }

const todayStr = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().split('T')[0];
};

export const DailyTab: React.FC = () => {
  const { success, error } = useToast();
  const [date, setDate] = useState(todayStr());
  const [sedes, setSedes] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [filterSede, setFilterSede] = useState('');
  const [data, setData] = useState<any | null>(null);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [rowSel, setRowSel] = useState<Record<string, RowSelection>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    academicService.listSedes().then(setSedes);
    peopleService.listTeachers().then(setTeachers);
    academicService.listAreas().then((areas) => {
      const allCourses = areas.flatMap((a: any) => a.courses.map((c: any) => ({ ...c, areaName: a.name })));
      setCourses(allCourses);
    });
  }, []);

  const load = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    try {
      const res = await attendanceService.getDaily(date, filterSede || undefined);
      setData(res);
      const init: Record<string, Mark> = {};
      const initSel: Record<string, RowSelection> = {};
      for (const c of res.classes) {
        if (c.attendance) init[c.id] = { status: c.attendance.status, lateMinutes: c.attendance.lateMinutes || 0 };
        initSel[c.id] = {
          teacherId: c.teacherProfile?.id || '',
          courseId: c.course?.id || '',
        };
      }
      setMarks(init);
      setRowSel(initSel);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al cargar el día');
      setData(null);
    } finally { setLoading(false); }
  }, [date, filterSede]);

  useEffect(() => { load(); }, [load]);

  const setMark = (id: string, mark: Partial<Mark>) => {
    setMarks((prev) => {
      const current = prev[id] || { status: 'PRESENT', lateMinutes: 0 };
      return { ...prev, [id]: { ...current, ...mark } };
    });
  };

  const markAll = () => {
    if (!data) return;
    const next: Record<string, Mark> = { ...marks };
    for (const c of data.classes) if (!next[c.id]) next[c.id] = { status: 'PRESENT', lateMinutes: 0 };
    setMarks(next);
  };

  const handleSave = async () => {
    if (!data) return;
    const records = Object.entries(marks)
      .filter(([id]) => data.classes.some((c: any) => c.id === id))
      .map(([sessionId, m]) => ({
        sessionId,
        status: m.status,
        lateMinutes: m.status === 'PRESENT' ? m.lateMinutes : 0,
        teacherProfileId: rowSel[sessionId]?.teacherId || null,
        courseId: rowSel[sessionId]?.courseId || null,
      }));
    if (records.length === 0) { error('No hay nada que guardar'); return; }
    setSaving(true);
    try {
      const r = await attendanceService.saveDaily(date, records);
      success(`✅ ${r.saved} registros guardados`);
      load();
    } catch (err: any) { error(err.response?.data?.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const markedCount = data ? data.classes.filter((c: any) => marks[c.id]).length : 0;

  const teacherOptions = teachers.map((t: any) => ({
    value: t.teacherProfile.id,
    label: `${t.lastName}, ${t.firstName}`,
  }));

  const courseOptions = courses.map((c: any) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Card de configuración */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
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
            <CalendarIcon style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
              Registro de asistencia diaria
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
              Selecciona fecha y sede para ver las clases del día
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          <Input 
            label="Fecha" 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            icon={<CalendarIcon />}
          />
          <Select 
            label="Sede" 
            value={filterSede} 
            onChange={(e) => setFilterSede(e.target.value)}
            options={[{ value: '', label: 'Todas las sedes' }, ...sedes.map((s) => ({ value: s.id, label: s.name }))]} 
          />
        </div>
        {data && (
          <div style={{ 
            padding: '12px 16px', 
            background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-info-50) 100%)',
            border: '1px solid var(--color-primary-200)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16
          }}>
            <CalendarIcon style={{ width: 20, height: 20, color: 'var(--color-primary-600)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary-900)' }}>
                {data.dayName} · Semana {data.weekNumber}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-700)' }}>
                {data.blockName}
              </div>
            </div>
            <Badge color="primary">{data.classes.length} clases</Badge>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button 
            variant="secondary" 
            onClick={markAll}
            icon={<SparklesIcon />}
            disabled={!data || data.classes.length === 0}
          >
            Marcar todas como asistidas
          </Button>
          <Button 
            variant="success" 
            onClick={handleSave} 
            isLoading={saving}
            loadingText="Guardando..."
            icon={<CheckCircleIcon />}
            disabled={!data || markedCount === 0}
          >
            Guardar ({markedCount}/{data?.classes.length || 0})
          </Button>
        </div>
      </Card>

      {/* Coverage por sede */}
      {data && data.coverage.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {data.coverage.map((c: any) => {
            const pct = c.total > 0 ? Math.round((c.marked / c.total) * 100) : 0;
            const isComplete = c.marked === c.total;
            return (
              <Card 
                key={c.sedeName} 
                className="p-4" 
                style={{ 
                  borderColor: isComplete ? 'var(--color-success-700)' : 'var(--color-warning-600)',
                  background: isComplete ? 'var(--color-success-50)' : 'var(--color-warning-50)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <BuildingOfficeIcon style={{ 
                    width: 20, 
                    height: 20, 
                    color: isComplete ? 'var(--color-success-600)' : 'var(--color-warning-600)' 
                  }} />
                  <span style={{ 
                    fontSize: 'var(--text-sm)', 
                    fontWeight: 600,
                    color: isComplete ? 'var(--color-success-700)' : 'var(--color-warning-700)'
                  }}>
                    {c.sedeName}
                  </span>
                </div>
                <div style={{ 
                  fontSize: 'var(--text-xs)', 
                  color: isComplete ? 'var(--color-success-600)' : 'var(--color-warning-600)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  {isComplete ? <CheckCircleIcon style={{ width: 14, height: 14 }} /> : <ExclamationTriangleIcon style={{ width: 14, height: 14 }} />}
                  <span>
                    {c.marked}/{c.total} marcadas ({pct}%)
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tabla de clases */}
      {loading ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-neutral-400)' }}>
            <ClockIcon style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>
              Cargando clases...
            </div>
          </div>
        </Card>
      ) : data && data.classes.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-neutral-400)' }}>
            <CalendarIcon style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>
              No hay clases programadas para este día
            </div>
            <div style={{ fontSize: 'var(--text-sm)' }}>
              Verifica que el horario esté generado para este bloque
            </div>
          </div>
        </Card>
      ) : data ? (
        <Card className="p-0">
          <div style={{ 
            padding: '16px 20px', 
            borderBottom: '1px solid var(--color-neutral-200)',
            background: 'var(--color-neutral-50)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UsersIcon style={{ width: 20, height: 20, color: 'var(--color-primary-600)' }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-neutral-700)' }}>
                  Clases del día
                </span>
              </div>
              <Badge color="primary">{data.classes.length} clases</Badge>
            </div>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Curso</th>
                  <th>Sección</th>
                  <th>Sede</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'center' }}>Tardanza</th>
                </tr>
              </thead>
              <tbody>
                {data.classes.map((c: any) => {
                  const m = marks[c.id];
                  const sel = rowSel[c.id];
                  return (
                    <tr key={c.id}>
                      <td style={{ minWidth: 220 }}>
                        <SearchableSelect
                          value={sel?.teacherId || ''}
                          onChange={(v) => setRowSel((p) => ({ ...p, [c.id]: { ...p[c.id], teacherId: v, courseId: p[c.id]?.courseId || c.course?.id || '' } }))}
                          options={teacherOptions}
                          placeholder="Seleccionar docente..."
                        />
                      </td>
                      <td style={{ minWidth: 200 }}>
                        <Select
                          value={sel?.courseId || ''}
                          onChange={(e) => setRowSel((p) => ({ ...p, [c.id]: { teacherId: p[c.id]?.teacherId || c.teacherProfile?.id || '', courseId: e.target.value } }))}
                          options={[{ value: '', label: 'Seleccionar curso...' }, ...courseOptions]}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <UsersIcon style={{ width: 14, height: 14, color: 'var(--color-neutral-400)' }} />
                          <span style={{ fontWeight: 500 }}>{c.section.name}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
                          <MapPinIcon style={{ width: 14, height: 14 }} />
                          {c.section.classroom.sede.name}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button 
                            onClick={() => setMark(c.id, { status: 'PRESENT' })}
                            className={`btn btn-sm ${m?.status === 'PRESENT' ? 'btn-success' : 'btn-ghost'}`}
                            style={{ minWidth: 80 }}
                          >
                            <CheckCircleIcon style={{ width: 14, height: 14, marginRight: 4 }} />
                            Asistió
                          </button>
                          <button 
                            onClick={() => setMark(c.id, { status: 'ABSENT' })}
                            className={`btn btn-sm ${m?.status === 'ABSENT' ? 'btn-danger' : 'btn-ghost'}`}
                            style={{ minWidth: 60 }}
                          >
                            <XCircleIcon style={{ width: 14, height: 14, marginRight: 4 }} />
                            Faltó
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {m?.status === 'PRESENT' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                            <ClockIcon style={{ width: 14, height: 14, color: 'var(--color-neutral-400)' }} />
                            <input 
                              type="number" 
                              min={0} 
                              value={m.lateMinutes}
                              onChange={(e) => setMark(c.id, { lateMinutes: parseInt(e.target.value) || 0 })}
                              style={{ width: 70 }} 
                              className="input"
                              placeholder="0"
                            />
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>min</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
};