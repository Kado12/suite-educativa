import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Modal, Badge } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { peopleService } from '../../../api/people.service';
import { academicService } from '../../../api/academic.service';

export const TeachersTab: React.FC = () => {
  const { success, error } = useToast();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', dni: '', phone: '', email: '',
    priority: '5', yearsExperience: '', maxSessionsPerWeek: '', notes: '',
  });
  const [showConfig, setShowConfig] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const load = (s?: string) => peopleService.listTeachers(s).then(setTeachers).catch(() => error('Error'));
  useEffect(() => {
    const t = setTimeout(() => load(search || undefined), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadRefs = () => Promise.all([
    academicService.listAreas().then((areas: any[]) => setCourses(areas.flatMap((a) => a.courses))),
    academicService.listTurnos().then(setTurnos),
    academicService.listSedes().then(setSedes),
  ]);

  const openCreate = () => {
    setForm({ firstName: '', lastName: '', dni: '', phone: '', email: '', priority: '5', yearsExperience: '', maxSessionsPerWeek: '', notes: '' });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await peopleService.createTeacher({
        ...form,
        priority: parseInt(form.priority),
        yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : null,
        maxSessionsPerWeek: form.maxSessionsPerWeek ? parseInt(form.maxSessionsPerWeek) : null,
      });
      success('Docente creado'); setShowForm(false); load(search || undefined);
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const openConfig = async (t: any) => {
    await loadRefs();
    setShowConfig(t);
  };

  const toggleCourse = async (cid: string, present: boolean) => {
    const profile = showConfig.teacherProfile;
    const current = profile.courses.map((c: any) => c.course.id);
    const next = present ? current.filter((x: string) => x !== cid) : [...current, cid];
    try { await peopleService.setTeacherCourses(profile.id, next); await load(search || undefined); setShowConfig((prev: any) => prev ? { ...prev, teacherProfile: { ...prev.teacherProfile, courses: next.map((id: any) => ({ course: courses.find((c) => c.id === id) })) } } : null); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
  };
  const toggleTurno = async (tid: string, present: boolean) => {
    const profile = showConfig.teacherProfile;
    const current = profile.turnos.map((t: any) => t.turno.id);
    const next = present ? current.filter((x: string) => x !== tid) : [...current, tid];
    try { await peopleService.setTeacherTurnos(profile.id, next); await load(search || undefined); loadRefs(); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
  };
  const toggleSede = async (sid: string, present: boolean) => {
    const profile = showConfig.teacherProfile;
    const current = profile.sedes.map((s: any) => s.sede.id);
    const next = present ? current.filter((x: string) => x !== sid) : [...current, sid];
    try { await peopleService.setTeacherSedes(profile.id, next); await load(search || undefined); loadRefs(); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
  };
  const toggleDay = async (day: number, present: boolean) => {
    const profile = showConfig.teacherProfile;
    const current = profile.unavailableDays.map((d: any) => d.dayOfWeek);
    const next = present ? current.filter((x: number) => x !== day) : [...current, day];
    try { await peopleService.setTeacherUnavailableDays(profile.id, next); await load(search || undefined); loadRefs(); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
  };

  const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <Input placeholder="Buscar por nombre o DNI..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
        <Button onClick={openCreate}><PlusIcon style={{ width: 16, height: 16 }} /> Docente</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {teachers.map((t) => {
          const p = t.teacherProfile;
          return (
            <Card key={t.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0 }}>{t.lastName}, {t.firstName}</h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>DNI: {t.dni}</p>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openConfig(t)} className="btn btn-ghost btn-sm" title="Configurar disponibilidad">
                    <Cog6ToothIcon style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <Badge color="primary">Prioridad: {p.priority}</Badge>
                {p.yearsExperience && <Badge color="neutral">{p.yearsExperience} años exp.</Badge>}
                <Badge color="success">{p.courses.length} cursos</Badge>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {p.courses.slice(0, 4).map((c: any) => <span key={c.course.id} className="badge badge-primary" style={{ fontSize: 'var(--text-xs)' }}>{c.course.name}</span>)}
                {p.courses.length > 4 && <span className="badge badge-neutral" style={{ fontSize: 'var(--text-xs)' }}>+{p.courses.length - 4}</span>}
              </div>
            </Card>
          );
        })}
        {teachers.length === 0 && (
          <Card><p style={{ color: 'var(--color-neutral-400)', textAlign: 'center', padding: 16 }}>Sin docentes</p></Card>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nuevo Docente">
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Nombres" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <Input label="Apellidos" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </div>
          <Input label="DNI (obligatorio)" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Input label="Prioridad (1-10)" type="number" min={1} max={10} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
            <Input label="Años exp." type="number" min={0} value={form.yearsExperience} onChange={(e) => setForm({ ...form, yearsExperience: e.target.value })} />
            <Input label="Máx sesiones/sem" type="number" min={1} value={form.maxSessionsPerWeek} onChange={(e) => setForm({ ...form, maxSessionsPerWeek: e.target.value })} />
          </div>
          <Button type="submit" isLoading={saving}>Crear</Button>
        </form>
      </Modal>

      <Modal isOpen={!!showConfig} onClose={() => setShowConfig(null)} title={`Configurar: ${showConfig?.firstName} ${showConfig?.lastName}`} size="lg">
        {showConfig && (() => {
          const p = showConfig.teacherProfile;
          const courseIds = new Set(p.courses.map((c: any) => c.course.id));
          const turnoIds = new Set(p.turnos.map((t: any) => t.turno.id));
          const sedeIds = new Set(p.sedes.map((s: any) => s.sede.id));
          const unavailDays = new Set(p.unavailableDays.map((d: any) => d.dayOfWeek));
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 8 }}>📘 Cursos que puede dictar</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {courses.map((c) => (
                    <button key={c.id} onClick={() => toggleCourse(c.id, courseIds.has(c.id))}
                      className={`badge ${courseIds.has(c.id) ? 'badge-success' : 'badge-neutral'}`}>
                      {courseIds.has(c.id) ? '✓' : '+'} {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 8 }}>🕐 Turnos (vacío = todos)</h4>
                  {turnos.map((t) => (
                    <label key={t.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 4 }}>
                      <input type="checkbox" checked={turnoIds.has(t.id)} onChange={(e) => toggleTurno(t.id, e.target.checked)} />
                      <span style={{ fontSize: 'var(--text-sm)' }}>{t.name}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 8 }}>🏫 Sedes (vacío = todas)</h4>
                  {sedes.map((s) => (
                    <label key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 4 }}>
                      <input type="checkbox" checked={sedeIds.has(s.id)} onChange={(e) => toggleSede(s.id, e.target.checked)} />
                      <span style={{ fontSize: 'var(--text-sm)' }}>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 8 }}>🚫 Días no disponibles</h4>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5].map((d) => (
                    <button key={d} onClick={() => toggleDay(d, unavailDays.has(d))}
                      className={`badge ${unavailDays.has(d) ? 'badge-danger' : 'badge-neutral'}`}>
                      {unavailDays.has(d) ? '🚫' : '✓'} {DAY_NAMES[d]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};