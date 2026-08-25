import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, Cog6ToothIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Modal, Badge, ConfirmModal, Select } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { peopleService } from '../../../api/people.service';
import { academicService } from '../../../api/academic.service';
import { EditTeacherModal } from '../modals/EditTeacherModal';

export const TeachersTab: React.FC = () => {
  const { success, error } = useToast();
  const [delTeacher, setDelTeacher] = useState<any | null>(null);
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
  const [sedeForDays, setSedeForDays] = useState('');

  const [showEditTeacher, setShowEditTeacher] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

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

  const refreshConfig = async () => {
    const list = await peopleService.listTeachers();
    setTeachers(list);
    const fresh = list.find((t: any) => t.teacherProfile.id === showConfig.teacherProfile.id);
    if (fresh) setShowConfig(fresh);
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

  const handleDeleteTeacher = async () => {
    if (!delTeacher) return; setSaving(true);
    try { await peopleService.deleteTeacher(delTeacher.teacherProfile.id); success('Docente eliminado'); setDelTeacher(null); load(search || undefined); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const openConfig = async (t: any) => {
    await loadRefs();
    setShowConfig(t);
  };

  // CURSOS: el botón pasa "¿está presente ahora?" → si está, quitar; si no, agregar
  const toggleCourse = async (cid: string, present: boolean) => {
    const current = showConfig.teacherProfile.courses.map((c: any) => c.course.id);
    const next = present ? current.filter((x: string) => x !== cid) : Array.from(new Set([...current, cid]));
    try { await peopleService.setTeacherCourses(showConfig.teacherProfile.id, next); await refreshConfig(); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
  };

  // TURNOS: el checkbox pasa "¿debe quedar marcado?" → si checked, agregar; si no, quitar
  const toggleTurno = async (tid: string, checked: boolean) => {
    const current = showConfig.teacherProfile.turnos.map((t: any) => t.turno.id);
    const next = checked ? Array.from(new Set([...current, tid])) : current.filter((x: string) => x !== tid);
    try { await peopleService.setTeacherTurnos(showConfig.teacherProfile.id, next); await refreshConfig(); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
  };

  // SEDES: igual que turnos (checkbox)
  const toggleSede = async (sid: string, checked: boolean) => {
    const current = showConfig.teacherProfile.sedes.map((s: any) => s.sede.id);
    const next = checked ? Array.from(new Set([...current, sid])) : current.filter((x: string) => x !== sid);
    try { await peopleService.setTeacherSedes(showConfig.teacherProfile.id, next); await refreshConfig(); }
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
                  <button onClick={() => { setSelectedTeacher(t); setShowEditTeacher(true); }} className="btn btn-ghost btn-sm" title="Editar datos">
                    <PencilIcon style={{ width: 16, height: 16, color: 'var(--color-success-500)'  }} />
                  </button>
                  <button onClick={() => openConfig(t)} className="btn btn-ghost btn-sm" title="Configurar disponibilidad">
                    <Cog6ToothIcon style={{ width: 16, height: 16, color: 'var(--color-primary-500)'  }} />
                  </button>
                  <button onClick={() => setDelTeacher(t)} className="btn btn-ghost btn-sm" title="Eliminar docente">
                    <TrashIcon style={{ width: 16, height: 16, color: 'var(--color-danger-500)' }} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <Badge color="warning">Prioridad: {p.priority}</Badge>
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
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 8 }}>📅 Días disponibles por sede</h4>
                <Select value={sedeForDays} onChange={(e) => setSedeForDays(e.target.value)}
                  options={[{ value: '', label: 'Selecciona sede' }, ...sedes.map((s: any) => ({ value: s.id, label: s.name }))]} />
                {sedeForDays && (() => {
                  const current = new Set(
                    p.sedeDays.filter((sd: any) => sd.sedeId === sedeForDays).map((sd: any) => sd.dayOfWeek),
                  );
                  return (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {[1, 2, 3, 4, 5].map((d) => (
                        <button key={d}
                          onClick={() => {
                            const next = current.has(d)
                              ? [1, 2, 3, 4, 5].filter((x) => x !== d)
                              : [1, 2, 3, 4, 5].filter((x) => current.has(x) || x === d);
                            peopleService.setTeacherSedeDays(p.id, sedeForDays, next).then(refreshConfig);
                          }}
                          className={`badge ${current.has(d) ? 'badge-success' : 'badge-neutral'}`}>
                          {current.has(d) ? '✓' : '+'} {DAY_NAMES[d]}
                        </button>
                      ))}
                    </div>
                  );
                })()}
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 6 }}>
                  Sin días marcados en una sede = disponible todos los días en esa sede.
                </p>
              </div>
            </div>
          );
        })()}
      </Modal>
      
      <EditTeacherModal isOpen={showEditTeacher} teacher={selectedTeacher} onClose={() => setShowEditTeacher(false)} onSaved={() => load(search || undefined)} />
      <ConfirmModal isOpen={!!delTeacher} onClose={() => setDelTeacher(null)} onConfirm={handleDeleteTeacher}
        title="Eliminar docente" message={`¿Eliminar a ${delTeacher?.firstName} ${delTeacher?.lastName}? Se eliminará su perfil y disponibilidad.`} isLoading={saving} />
    </div>
  );
};