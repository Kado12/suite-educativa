import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, PencilIcon, Cog6ToothIcon, TrashIcon,
  UserIcon, PhoneIcon, EnvelopeIcon, AcademicCapIcon,
  ClockIcon, MapPinIcon, CalendarIcon, StarIcon,
  BookOpenIcon, BriefcaseIcon
} from '@heroicons/react/24/outline';
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
    setForm({ 
      firstName: '', lastName: '', dni: '', phone: '', email: '', 
      priority: '5', yearsExperience: '', maxSessionsPerWeek: '', notes: '' 
    });
    setShowForm(true);
  };

  const refreshConfig = async () => {
    const list = await peopleService.listTeachers();
    setTeachers(list);
    const fresh = list.find((t: any) => t.teacherProfile.id === showConfig.teacherProfile.id);
    if (fresh) setShowConfig(fresh);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setSaving(true);
    try {
      await peopleService.createTeacher({
        ...form,
        priority: parseInt(form.priority),
        yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : null,
        maxSessionsPerWeek: form.maxSessionsPerWeek ? parseInt(form.maxSessionsPerWeek) : null,
      });
      success('✅ Docente creado'); 
      setShowForm(false); 
      load(search || undefined);
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDeleteTeacher = async () => {
    if (!delTeacher) return; 
    setSaving(true);
    try { 
      await peopleService.deleteTeacher(delTeacher.teacherProfile.id); 
      success('✅ Docente eliminado'); 
      setDelTeacher(null); 
      load(search || undefined); 
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    } finally { 
      setSaving(false); 
    }
  };

  const openConfig = async (t: any) => {
    await loadRefs();
    setShowConfig(t);
  };

  const toggleCourse = async (cid: string, present: boolean) => {
    const current = showConfig.teacherProfile.courses.map((c: any) => c.course.id);
    const next = present ? current.filter((x: string) => x !== cid) : Array.from(new Set([...current, cid]));
    try { 
      await peopleService.setTeacherCourses(showConfig.teacherProfile.id, next); 
      await refreshConfig(); 
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    }
  };

  const toggleTurno = async (tid: string, checked: boolean) => {
    const current = showConfig.teacherProfile.turnos.map((t: any) => t.turno.id);
    const next = checked ? Array.from(new Set([...current, tid])) : current.filter((x: string) => x !== tid);
    try { 
      await peopleService.setTeacherTurnos(showConfig.teacherProfile.id, next); 
      await refreshConfig(); 
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    }
  };

  const toggleSede = async (sid: string, checked: boolean) => {
    const current = showConfig.teacherProfile.sedes.map((s: any) => s.sede.id);
    const next = checked ? Array.from(new Set([...current, sid])) : current.filter((x: string) => x !== sid);
    try { 
      await peopleService.setTeacherSedes(showConfig.teacherProfile.id, next); 
      await refreshConfig(); 
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    }
  };

  const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Búsqueda y acción */}
      <Card>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Input 
              placeholder="Buscar por nombre o DNI..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              icon={<UserIcon />}
            />
          </div>
          <Button 
            onClick={openCreate}
            icon={<PlusIcon />}
          >
            Nuevo docente
          </Button>
        </div>
        <div style={{ 
          marginTop: 12, 
          fontSize: 'var(--text-sm)', 
          color: 'var(--color-neutral-600)' 
        }}>
          <strong>{teachers.length}</strong> docentes registrados
        </div>
      </Card>

      {/* Grid de tarjetas de docentes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {teachers.map((t) => {
          const p = t.teacherProfile;
          return (
            <Card key={t.id} style={{ transition: 'all 0.2s' }}>
              {/* Header con nombre y acciones */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-success-100) 0%, var(--color-success-200) 100%)',
                    color: 'var(--color-success-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {t.firstName[0]}{t.lastName[0]}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0, color: 'var(--color-neutral-900)' }}>
                      {t.lastName}, {t.firstName}
                    </h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
                      DNI: {t.dni || '—'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button 
                    onClick={() => { setSelectedTeacher(t); setShowEditTeacher(true); }} 
                    className="btn btn-ghost btn-icon" 
                    title="Editar datos"
                    style={{ color: 'var(--color-success-500)' }}
                  >
                    <PencilIcon style={{ width: 16, height: 16 }} />
                  </button>
                  <button 
                    onClick={() => openConfig(t)} 
                    className="btn btn-ghost btn-icon" 
                    title="Configurar disponibilidad"
                    style={{ color: 'var(--color-primary-600)' }}
                  >
                    <Cog6ToothIcon style={{ width: 16, height: 16 }} />
                  </button>
                  <button 
                    onClick={() => setDelTeacher(t)} 
                    className="btn btn-ghost btn-icon" 
                    title="Eliminar docente"
                    style={{ color: 'var(--color-danger-600)' }}
                  >
                    <TrashIcon style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>

              {/* Contacto */}
              {(t.phone || t.email) && (
                <div style={{ marginBottom: 12, fontSize: 'var(--text-sm)' }}>
                  {t.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <PhoneIcon style={{ width: 14, height: 14, color: 'var(--color-neutral-400)' }} />
                      <span>{t.phone}</span>
                    </div>
                  )}
                  {t.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <EnvelopeIcon style={{ width: 14, height: 14, color: 'var(--color-neutral-400)' }} />
                      <span style={{ fontSize: 'var(--text-xs)' }}>{t.email}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Estadísticas */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <Badge color="warning">
                  <StarIcon style={{ width: 12, height: 12, marginRight: 4 }} />
                  Prioridad: {p.priority}
                </Badge>
                {p.yearsExperience && (
                  <Badge color="neutral">
                    <BriefcaseIcon style={{ width: 12, height: 12, marginRight: 4 }} />
                    {p.yearsExperience} años exp.
                  </Badge>
                )}
                <Badge color="success">
                  <BookOpenIcon style={{ width: 12, height: 12, marginRight: 4 }} />
                  {p.courses.length} cursos
                </Badge>
              </div>

              {/* Cursos */}
              {p.courses.length > 0 && (
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 6, fontWeight: 600 }}>
                    Cursos asignados:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {p.courses.slice(0, 4).map((c: any) => (
                      <span 
                        key={c.course.id} 
                        className="badge badge-primary" 
                        style={{ fontSize: 'var(--text-xs)' }}
                      >
                        {c.course.name}
                      </span>
                    ))}
                    {p.courses.length > 4 && (
                      <span className="badge badge-neutral" style={{ fontSize: 'var(--text-xs)' }}>
                        +{p.courses.length - 4} más
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {teachers.length === 0 && (
          <Card>
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-neutral-400)' }}>
              <AcademicCapIcon style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>
                Sin docentes registrados
              </div>
              <div style={{ fontSize: 'var(--text-sm)' }}>
                Crea el primer docente o importa desde la sección de importaciones
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Modal de crear docente */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nuevo docente">
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input 
              label="Nombres" 
              value={form.firstName} 
              onChange={(e) => setForm({ ...form, firstName: e.target.value })} 
              required
              icon={<UserIcon />}
              placeholder="Ej: Juan Carlos"
            />
            <Input 
              label="Apellidos" 
              value={form.lastName} 
              onChange={(e) => setForm({ ...form, lastName: e.target.value })} 
              required
              icon={<UserIcon />}
              placeholder="Ej: Pérez García"
            />
          </div>
          <Input 
            label="DNI (obligatorio)" 
            value={form.dni} 
            onChange={(e) => setForm({ ...form, dni: e.target.value })} 
            required
            icon={<UserIcon />}
            placeholder="8 dígitos"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input 
              label="Teléfono" 
              value={form.phone} 
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              icon={<PhoneIcon />}
              placeholder="987654321"
            />
            <Input 
              label="Email" 
              type="email" 
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              icon={<EnvelopeIcon />}
              placeholder="docente@suite.edu"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Input 
              label="Prioridad (1-10)" 
              type="number" 
              min={1} 
              max={10} 
              value={form.priority} 
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              icon={<StarIcon />}
              hint="Mayor = más prioridad"
            />
            <Input 
              label="Años exp." 
              type="number" 
              min={0} 
              value={form.yearsExperience} 
              onChange={(e) => setForm({ ...form, yearsExperience: e.target.value })}
              icon={<BriefcaseIcon />}
            />
            <Input 
              label="Máx sesiones/sem" 
              type="number" 
              min={1} 
              value={form.maxSessionsPerWeek} 
              onChange={(e) => setForm({ ...form, maxSessionsPerWeek: e.target.value })}
              icon={<ClockIcon />}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" isLoading={saving} icon={<PlusIcon />}>Crear docente</Button>
          </div>
        </form>
      </Modal>

      {/* Modal de configuración */}
      <Modal isOpen={!!showConfig} onClose={() => setShowConfig(null)} title={`Configurar: ${showConfig?.firstName} ${showConfig?.lastName}`} size="lg">
        {showConfig && (() => {
          const p = showConfig.teacherProfile;
          const courseIds = new Set(p.courses.map((c: any) => c.course.id));
          const turnoIds = new Set(p.turnos.map((t: any) => t.turno.id));
          const sedeIds = new Set(p.sedes.map((s: any) => s.sede.id));
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Cursos */}
              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpenIcon style={{ width: 18, height: 18, color: 'var(--color-primary-600)' }} />
                  Cursos que puede dictar
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {courses.map((c) => (
                    <button 
                      key={c.id} 
                      onClick={() => toggleCourse(c.id, courseIds.has(c.id))}
                      className={`badge ${courseIds.has(c.id) ? 'badge-success' : 'badge-neutral'}`}
                      style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                      {courseIds.has(c.id) ? '✓' : '+'} {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Turnos y Sedes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ClockIcon style={{ width: 18, height: 18, color: 'var(--color-primary-600)' }} />
                    Turnos disponibles
                  </h4>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 8 }}>
                    Sin seleccionar = todos los turnos
                  </p>
                  {turnos.map((t) => (
                    <label 
                      key={t.id} 
                      style={{ 
                        display: 'flex', 
                        gap: 8, 
                        alignItems: 'center', 
                        padding: '8px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        background: turnoIds.has(t.id) ? 'var(--color-primary-50)' : 'var(--color-neutral-50)',
                        marginBottom: 6,
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={turnoIds.has(t.id)} 
                        onChange={(e) => toggleTurno(t.id, e.target.checked)} 
                      />
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{t.name}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPinIcon style={{ width: 18, height: 18, color: 'var(--color-primary-600)' }} />
                    Sedes disponibles
                  </h4>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 8 }}>
                    Sin seleccionar = todas las sedes
                  </p>
                  {sedes.map((s) => (
                    <label 
                      key={s.id} 
                      style={{ 
                        display: 'flex', 
                        gap: 8, 
                        alignItems: 'center', 
                        padding: '8px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        background: sedeIds.has(s.id) ? 'var(--color-primary-50)' : 'var(--color-neutral-50)',
                        marginBottom: 6,
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={sedeIds.has(s.id)} 
                        onChange={(e) => toggleSede(s.id, e.target.checked)} 
                      />
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Días por sede */}
              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CalendarIcon style={{ width: 18, height: 18, color: 'var(--color-primary-600)' }} />
                  Días disponibles por sede
                </h4>
                <Select 
                  label="Selecciona sede"
                  value={sedeForDays} 
                  onChange={(e) => setSedeForDays(e.target.value)}
                  options={[{ value: '', label: 'Selecciona una sede' }, ...sedes.map((s: any) => ({ value: s.id, label: s.name }))]} 
                />
                {sedeForDays && (() => {
                  const current = new Set(
                    p.sedeDays.filter((sd: any) => sd.sedeId === sedeForDays).map((sd: any) => sd.dayOfWeek),
                  );
                  return (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                      {[1, 2, 3, 4, 5].map((d) => (
                        <button 
                          key={d}
                          onClick={() => {
                            const next = current.has(d)
                              ? [1, 2, 3, 4, 5].filter((x) => x !== d)
                              : [1, 2, 3, 4, 5].filter((x) => current.has(x) || x === d);
                            peopleService.setTeacherSedeDays(p.id, sedeForDays, next).then(refreshConfig);
                          }}
                          className={`badge ${current.has(d) ? 'badge-success' : 'badge-neutral'}`}
                          style={{ cursor: 'pointer', padding: '8px 16px', transition: 'all 0.15s' }}
                        >
                          {current.has(d) ? '✓' : '+'} {DAY_NAMES[d]}
                        </button>
                      ))}
                    </div>
                  );
                })()}
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 8 }}>
                  Sin días marcados en una sede = disponible todos los días en esa sede.
                </p>
              </div>
            </div>
          );
        })()}
      </Modal>
      
      <EditTeacherModal 
        isOpen={showEditTeacher} 
        teacher={selectedTeacher} 
        onClose={() => setShowEditTeacher(false)} 
        onSaved={() => load(search || undefined)} 
      />
      
      <ConfirmModal 
        isOpen={!!delTeacher} 
        onClose={() => setDelTeacher(null)} 
        onConfirm={handleDeleteTeacher}
        title="Eliminar docente" 
        message={`¿Eliminar a ${delTeacher?.firstName} ${delTeacher?.lastName}?\n\nSe eliminará su perfil y toda su configuración de disponibilidad.`} 
        isLoading={saving} 
      />
    </div>
  );
};