import React, { useState, useEffect } from 'react';
import { PlayIcon, TrashIcon, BuildingOffice2Icon, UserGroupIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Card, Button, Select, Badge, SearchableSelect } from '@suite/ui';
import { useToast } from '../../context/ToastContext';
import { schedulingService } from '../../api/scheduling.service';
import { academicService } from '../../api/academic.service';
import { peopleService } from '../../api/people.service';

const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export const SchedulingPage: React.FC = () => {
  const { success, error } = useToast();
  const [periods, setPeriods] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [view, setView] = useState<'section' | 'teacher'>('section');
  const [generating, setGenerating] = useState(false);

  const [areas, setAreas] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [exp, setExp] = useState({ sedeId: '', turnoId: '', areaId: '', teacherProfileId: '', sectionId: '' });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([academicService.listAreas(), peopleService.listTeachers(), academicService.listSections(), academicService.listSedes(), academicService.listTurnos()])
      .then(([a, t, s, se, tu]) => { setAreas(a); setTeachers(t); setSections(s); setSedes(se); setTurnos(tu) });
  }, []);

  useEffect(() => {
    academicService.listPeriods().then((p) => {
      setPeriods(p);
      const current = p.find((x: any) => x.isActive);
      if (current) setSelectedPeriod(current.id);
    });
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      academicService.listBlocks(selectedPeriod).then(setBlocks);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    if (selectedBlock) {
      schedulingService.getResult(selectedBlock).then(setSessions);
    } else setSessions([]);
  }, [selectedBlock]);

  const handleGenerate = async () => {
    if (!selectedBlock) { error('Selecciona un bloque'); return; }
    setGenerating(true);
    setResult(null);
    try {
      const r = await schedulingService.generate(selectedBlock);
      setResult(r);
      await schedulingService.getResult(selectedBlock).then(setSessions);
      if (r.unresolved.length === 0) success(`✅ Horario generado: ${r.totalSessions} sesiones`);
      else error(`⚠️ ${r.unresolved.length} secciones sin resolver`);
    } catch (err: any) { error(err.response?.data?.message || 'Error al generar'); }
    finally { setGenerating(false); }
  };

  const handleClear = async () => {
    if (!selectedBlock) return;
    try { await schedulingService.clear(selectedBlock); setSessions([]); setResult(null); success('Horario limpiado'); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
  };

  const handleExport = async () => {
    if (!selectedBlock) { error('Selecciona un bloque'); return; }
    setExporting(true);
    try {
      await schedulingService.exportExcel(selectedBlock, exp);
      success('📥 Horario exportado');
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setExporting(false); }
  };

  // ===== Vista por sección =====
  const renderBySection = () => {
    const bySection = new Map<string, any[]>();
    for (const s of sessions) {
      if (!bySection.has(s.section.id)) bySection.set(s.section.id, []);
      bySection.get(s.section.id)!.push(s);
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from(bySection.entries()).map(([secId, secs]) => {
          const section = secs[0].section;
          const grid: (any | null)[][] = Array.from({ length: 5 }, () => [null, null]);
          for (const s of secs) grid[s.dayOfWeek - 1][s.slot - 1] = s;
          return (
            <Card key={secId}>
              <div className="card-header">
                <h3 className="card-title">🚪 {section.name}</h3>
                <p className="card-subtitle">{section.classroom.sede.name} · {section.turno.name}</p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr><th>Slot</th>{[1, 2, 3, 4, 5].map((d) => <th key={d}>{DAY_NAMES[d]}</th>)}</tr>
                  </thead>
                  <tbody>
                    {[1, 2].map((slot) => (
                      <tr key={slot}>
                        <td style={{ fontWeight: 600 }}>Slot {slot}</td>
                        {[1, 2, 3, 4, 5].map((d) => {
                          const s = grid[d - 1][slot - 1];
                          return (
                            <td key={d} style={s ? { background: 'var(--color-primary-50)' } : {}}>
                              {s ? (
                                <>
                                  <div style={{ fontWeight: 600, color: 'var(--color-primary-900)' }}>{s.course.name}</div>
                                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)' }}>
                                    {s.teacherProfile.person.lastName}, {s.teacherProfile.person.firstName}
                                  </div>
                                </>
                              ) : <span style={{ color: 'var(--color-neutral-300)' }}>—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}
        {bySection.size === 0 && <Card><p style={{ color: 'var(--color-neutral-400)', textAlign: 'center' }}>Aún no hay horario generado para este bloque.</p></Card>}
      </div>
    );
  };

  // ===== Vista por docente =====
  const renderByTeacher = () => {
    const byTeacher = new Map<string, any[]>();
    for (const s of sessions) {
      if (!byTeacher.has(s.teacherProfile.id)) byTeacher.set(s.teacherProfile.id, []);
      byTeacher.get(s.teacherProfile.id)!.push(s);
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from(byTeacher.entries()).map(([tId, secs]) => {
          const person = secs[0].teacherProfile.person;
          const grid: (any | null)[][] = Array.from({ length: 5 }, () => [null, null]);
          for (const s of secs) grid[s.dayOfWeek - 1][s.slot - 1] = s;
          return (
            <Card key={tId}>
              <div className="card-header">
                <h3 className="card-title">👨‍ {person.lastName}, {person.firstName}</h3>
                <p className="card-subtitle">{secs.length} sesiones/semana</p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr><th>Slot</th>{[1, 2, 3, 4, 5].map((d) => <th key={d}>{DAY_NAMES[d]}</th>)}</tr>
                  </thead>
                  <tbody>
                    {[1, 2].map((slot) => (
                      <tr key={slot}>
                        <td style={{ fontWeight: 600 }}>Slot {slot}</td>
                        {[1, 2, 3, 4, 5].map((d) => {
                          const s = grid[d - 1][slot - 1];
                          return (
                            <td key={d} style={s ? { background: 'var(--color-success-50)' } : {}}>
                              {s ? (
                                <>
                                  <div style={{ fontWeight: 600, color: 'var(--color-success-700)' }}>{s.course.name}</div>
                                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)' }}>{s.section.name}</div>
                                </>
                              ) : <span style={{ color: 'var(--color-neutral-300)' }}>libre</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}
        {byTeacher.size === 0 && <Card><p style={{ color: 'var(--color-neutral-400)', textAlign: 'center' }}>Sin horario generado.</p></Card>}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Generador de Horarios</h1>
          <p className="page-subtitle">Asignación automática respetando disponibilidad y prioridades</p>
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Select label="Período" value={selectedPeriod} onChange={(e) => { setSelectedPeriod(e.target.value); setSelectedBlock(''); }}
            options={periods.map((p) => ({ value: p.id, label: p.name }))} style={{ minWidth: 160 }} />
          <Select label="Bloque" value={selectedBlock} onChange={(e) => setSelectedBlock(e.target.value)}
            options={[{ value: '', label: 'Selecciona bloque' }, ...blocks.map((b) => ({ value: b.id, label: `${b.name} (S${b.startWeek}-S${b.endWeek})` }))]} style={{ minWidth: 200 }} />
          <Button onClick={handleGenerate} isLoading={generating} disabled={!selectedBlock}>
            <PlayIcon style={{ width: 16, height: 16 }} /> Generar
          </Button>
          {selectedBlock && (
            <Button variant="danger" onClick={handleClear}><TrashIcon style={{ width: 16, height: 16 }} /> Limpiar</Button>
          )}
        </div>
      </Card>
          <Card style={{ marginBottom: 16 }}>
            <h3 className="card-title" style={{ marginBottom: 12 }}>Exportar horario a Excel</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <Select label="Sede" value={exp.sedeId} onChange={(e) => setExp({ ...exp, sedeId: e.target.value })}
                options={[{ value: '', label: 'Todas' }, ...sedes.map((s: any) => ({ value: s.id, label: s.name }))]} style={{ minWidth: 160 }} />
              <Select label="Turno" value={exp.turnoId} onChange={(e) => setExp({ ...exp, turnoId: e.target.value })}
                options={[{ value: '', label: 'Todos' }, ...turnos.map((t: any) => ({ value: t.id, label: t.name }))]} style={{ minWidth: 160 }} />
              <Select label="Área" value={exp.areaId} onChange={(e) => setExp({ ...exp, areaId: e.target.value })}
                options={[{ value: '', label: 'Todas' }, ...areas.map((a: any) => ({ value: a.id, label: a.name }))]} style={{ minWidth: 160 }} />
              <SearchableSelect label="Docente" value={exp.teacherProfileId} onChange={(v) => setExp({ ...exp, teacherProfileId: v })}
                options={teachers.map((t: any) => ({ value: t.teacherProfile.id, label: `${t.lastName}, ${t.firstName}` }))} placeholder="Buscar docente..." />
              <SearchableSelect label="Sección" value={exp.sectionId} onChange={(v) => setExp({ ...exp, sectionId: v })}
                options={sections.map((s: any) => ({ value: s.id, label: s.name, hint: s.classroom?.sede?.name }))} placeholder="Buscar sección..." />
              <Button variant="success" onClick={handleExport} isLoading={exporting} disabled={!selectedBlock}>
                <ArrowDownTrayIcon style={{ width: 16, height: 16 }} /> Exportar
              </Button>
            </div>
          </Card>

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
          <Card className="p-4"><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Secciones</div><div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{result.totalSections}</div></Card>
          <Card className="p-4"><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Resueltas</div><div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-success-500)' }}>{result.resolved}</div></Card>
          <Card className="p-4"><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Sin resolver</div><div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-danger-500)' }}>{result.unresolved.length}</div></Card>
          <Card className="p-4"><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Sesiones</div><div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-primary-600)' }}>{result.totalSessions}</div></Card>
          <Card className="p-4"><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Docentes usados</div><div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{result.teachersUsed}</div></Card>
        </div>
      )}

      {result && result.unresolved.length > 0 && (
        <Card style={{ marginBottom: 16, borderColor: 'var(--color-danger-500)' }}>
          <h3 className="card-title" style={{ color: 'var(--color-danger-700)' }}>⚠️ Secciones sin resolver</h3>
          <ul style={{ marginTop: 8 }}>
            {result.unresolved.map((u: any) => (
              <li key={u.sectionId} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-danger-700)' }}>
                <strong>{u.sectionName}</strong>: {u.reason}
              </li>
            ))}
          </ul>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 8 }}>
            Sugerencia: verifica que haya suficientes docentes con los cursos del bloque y disponibilidad compatible.
          </p>
        </Card>
      )}

      {sessions.length > 0 && (
        <>
          <div style={{
            display: 'flex', gap: 4, marginBottom: 24,
            background: 'var(--color-neutral-100)', padding: 4, borderRadius: 12,
            border: '1px solid var(--color-neutral-200)',
          }}>
            <button 
              onClick={() => setView('section')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 8,
                fontSize: 'var(--text-sm)', fontWeight: 600,
                transition: 'all 0.15s',
                background: view === 'section' ? 'var(--color-neutral-0)' : 'transparent',
                color: view === 'section' ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
                boxShadow: view === 'section' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <BuildingOffice2Icon style={{ width: 16, height: 16 }} /> Por sección
            </button>
            <button
              onClick={() => setView('teacher')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 8,
                fontSize: 'var(--text-sm)', fontWeight: 600,
                transition: 'all 0.15s',
                background: view === 'teacher' ? 'var(--color-neutral-0)' : 'transparent',
                color: view === 'teacher' ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
                boxShadow: view === 'teacher' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <UserGroupIcon style={{ width: 16, height: 16 }} /> Por docente
            </button>
          </div>
          {view === 'section' ? renderBySection() : renderByTeacher()}
        </>
      )}
    </div>
  );
};