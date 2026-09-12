import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Modal, Select, SearchableSelect, Badge, ConfirmModal, Input } from '@suite/ui';
import { 
  PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, 
  XCircleIcon, CalendarIcon, ClockIcon, UserIcon,
  BookOpenIcon, BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import { useToast } from '../../context/ToastContext';
import { schedulingService } from '../../api/scheduling.service';
import { peopleService } from '../../api/people.service';
import { academicService } from '../../api/academic.service';

const DAY = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export const ScheduleEditor: React.FC<{ block: any; onExit?: () => void }> = ({ block, onExit }) => {
  const { success, error } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [blockCourses, setBlockCourses] = useState<any[]>([]);

  const [edit, setEdit] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [del, setDel] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Filtros
  const [search, setSearch] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterDay, setFilterDay] = useState('');

  const load = () => { if (block) schedulingService.listSessions(block.id).then(setSessions); };
  useEffect(() => { load(); }, [block?.id]);
  useEffect(() => {
    peopleService.listTeachers().then(setTeachers);
    academicService.listSections().then(setSections);

    if (block?.id) {
      academicService.listBlocks().then((blocks) => {
        const fullBlock = blocks.find((b: any) => b.id === block.id);
        if (fullBlock?.blockCourses) {
          setBlockCourses(fullBlock.blockCourses);
        }
      });
    }
  }, [block?.id]);

  const courseOptions = blockCourses.map((bc: any) => ({ 
    value: bc.courseId, 
    label: bc.course.name 
  }));
  
  const teacherOptions = teachers.map((t: any) => ({ 
    value: t.teacherProfile.id, 
    label: `${t.lastName}, ${t.firstName}` 
  }));

  // Filtrar sesiones
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch = !search || 
        s.section.name.toLowerCase().includes(search.toLowerCase()) ||
        s.course.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.teacherProfile?.person?.lastName || '').toLowerCase().includes(search.toLowerCase());
      const matchesTeacher = !filterTeacher || s.teacherProfileId === filterTeacher;
      const matchesSection = !filterSection || s.sectionId === filterSection;
      const matchesDay = !filterDay || String(s.dayOfWeek) === filterDay;
      return matchesSearch && matchesTeacher && matchesSection && matchesDay;
    });
  }, [sessions, search, filterTeacher, filterSection, filterDay]);

  const openEdit = (s: any) => {
    setEdit(s);
    setForm({ 
      courseId: s.courseId, 
      teacherProfileId: s.teacherProfileId || '', 
      dayOfWeek: String(s.dayOfWeek), 
      slot: String(s.slot) 
    });
  };
  const openCreate = () => {
    setShowCreate(true);
    setForm({ sectionId: '', courseId: '', teacherProfileId: '', dayOfWeek: '1', slot: '1' });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await schedulingService.updateSession(edit.id, { 
        ...form, 
        teacherProfileId: form.teacherProfileId || null, 
        dayOfWeek: parseInt(form.dayOfWeek), 
        slot: parseInt(form.slot) 
      });
      success('✅ Sesión actualizada (histórico preservado)');
      setEdit(null); 
      load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const saveCreate = async () => {
    if (!form.sectionId || !form.courseId) { error('Selecciona sección y curso'); return; }
    setSaving(true);
    try {
      await schedulingService.createSession({ 
        ...form, 
        blockId: block.id, 
        teacherProfileId: form.teacherProfileId || null, 
        dayOfWeek: parseInt(form.dayOfWeek), 
        slot: parseInt(form.slot) 
      });
      success('✅ Sesión creada');
      setShowCreate(false); 
      load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { 
      await schedulingService.deleteSession(del.id); 
      success('✅ Sesión eliminada'); 
      setDel(null); 
      load(); 
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterTeacher('');
    setFilterSection('');
    setFilterDay('');
  };

  const hasActiveFilters = search || filterTeacher || filterSection || filterDay;

  return (
    <Card className="p-0">
      <div style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid var(--color-neutral-200)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--color-neutral-50)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'var(--color-warning-100)',
            color: 'var(--color-warning-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <PencilIcon style={{ width: 20, height: 20 }} />
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
              Sesiones · {block?.name}
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
              Mostrando {filteredSessions.length} de {sessions.length} sesiones
            </p>
          </div>
        </div>
        <Button onClick={openCreate} icon={<PlusIcon />}>
          Nueva sesión
        </Button>
      </div>

      {/* Filtros */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-neutral-200)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <Input
              label="Buscar"
              placeholder="Buscar por sección, curso o docente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<MagnifyingGlassIcon />}
            />
          </div>
          <SearchableSelect
            label="Docente"
            value={filterTeacher}
            onChange={(v) => setFilterTeacher(v)}
            options={[
              { value: '', label: 'Todos los docentes' },
              ...teachers.map((t: any) => ({ value: t.teacherProfile.id, label: `${t.lastName}, ${t.firstName}` }))
            ]}
            placeholder="Buscar docente..."
          />
          <Select
            label="Día"
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            options={[
              { value: '', label: 'Todos los días' },
              ...[1, 2, 3, 4, 5].map((d) => ({ value: String(d), label: DAY[d] }))
            ]}
          />
        </div>
        {hasActiveFilters && (
          <div style={{ marginTop: 12 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              icon={<XCircleIcon />}
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      <div className="table-container" style={{ border: 'none' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Sección</th>
              <th>Día</th>
              <th>Slot</th>
              <th>Curso</th>
              <th>Docente</th>
              <th style={{ textAlign: 'center' }}>Asist.</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--color-neutral-400)' }}>
                  <CalendarIcon style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.3 }} />
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                    {hasActiveFilters ? 'No hay sesiones con estos filtros' : 'Sin sesiones en este bloque'}
                  </div>
                </td>
              </tr>
            ) : (
              filteredSessions.map((s) => (
                <tr key={s.id}>
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
                        <BuildingOffice2Icon style={{ width: 14, height: 14 }} />
                      </div>
                      <div>
                        <strong style={{ color: 'var(--color-neutral-900)' }}>{s.section.name}</strong>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                          {s.section.classroom.sede.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge color="neutral">{DAY[s.dayOfWeek]}</Badge>
                  </td>
                  <td>
                    <Badge color="neutral">Slot {s.slot}</Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BookOpenIcon style={{ width: 14, height: 14, color: 'var(--color-neutral-400)' }} />
                      <span style={{ fontWeight: 500 }}>{s.course.name}</span>
                    </div>
                  </td>
                  <td>
                    {s.teacherProfile ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <UserIcon style={{ width: 14, height: 14, color: 'var(--color-neutral-400)' }} />
                        <span style={{ fontSize: 'var(--text-sm)' }}>
                          {s.teacherProfile.person.lastName}, {s.teacherProfile.person.firstName}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-neutral-400)', fontStyle: 'italic', fontSize: 'var(--text-xs)' }}>
                        Sin asignar
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Badge color={s._count.attendances > 0 ? 'success' : 'neutral'}>
                      {s._count.attendances}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => openEdit(s)} 
                        className="btn btn-ghost btn-icon" 
                        title="Editar"
                        style={{ color: 'var(--color-primary-600)' }}
                      >
                        <PencilIcon style={{ width: 16, height: 16 }} />
                      </button>
                      <button 
                        onClick={() => s._count.attendances === 0 && setDel(s)} 
                        disabled={s._count.attendances > 0}
                        className="btn btn-ghost btn-icon" 
                        title={s._count.attendances > 0 ? 'Tiene asistencias (no se puede eliminar)' : 'Eliminar'}
                        style={{ 
                          opacity: s._count.attendances > 0 ? 0.35 : 1,
                          color: 'var(--color-danger-600)',
                          cursor: s._count.attendances > 0 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <TrashIcon style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal editar */}
      <Modal isOpen={!!edit} onClose={() => setEdit(null)} title={`Editar sesión: ${edit?.section?.name}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ 
            padding: 12, 
            background: 'var(--color-info-50)',
            border: '1px solid var(--color-info-200)',
            borderRadius: 8,
            fontSize: 'var(--text-sm)',
            color: 'var(--color-info-700)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8
          }}>
            <CalendarIcon style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
            <span>
              <strong>Original:</strong> {DAY[edit?.dayOfWeek]} · Slot {edit?.slot} · {edit?.course?.name} · {edit?.teacherProfile ? `${edit.teacherProfile.person.lastName}, ${edit.teacherProfile.person.firstName}` : 'Sin docente'}
            </span>
          </div>
          <Select 
            label="Curso" 
            value={form.courseId || ''} 
            onChange={(e) => setForm({ ...form, courseId: e.target.value })} 
            options={courseOptions} 
          />
          <SearchableSelect 
            label="Docente" 
            value={form.teacherProfileId || ''} 
            onChange={(v) => setForm({ ...form, teacherProfileId: v })} 
            options={teacherOptions} 
            placeholder="Buscar docente..." 
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select 
              label="Día" 
              value={form.dayOfWeek || '1'} 
              onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} 
              options={[1, 2, 3, 4, 5].map((d) => ({ value: String(d), label: DAY[d] }))} 
            />
            <Select 
              label="Slot" 
              value={form.slot || '1'} 
              onChange={(e) => setForm({ ...form, slot: e.target.value })} 
              options={[{ value: '1', label: 'Slot 1' }, { value: '2', label: 'Slot 2' }]} 
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setEdit(null)}>Cancelar</Button>
            <Button onClick={saveEdit} isLoading={saving} loadingText="Guardando...">
              Guardar cambios
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal crear */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nueva sesión">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SearchableSelect 
            label="Sección" 
            value={form.sectionId || ''} 
            onChange={(v) => setForm({ ...form, sectionId: v })} 
            options={sections.map((s: any) => ({ value: s.id, label: s.name, hint: s.classroom?.sede?.name }))} 
            placeholder="Buscar sección..." 
          />
          <Select 
            label="Curso" 
            value={form.courseId || ''} 
            onChange={(e) => setForm({ ...form, courseId: e.target.value })} 
            options={courseOptions} 
          />
          <SearchableSelect 
            label="Docente" 
            value={form.teacherProfileId || ''} 
            onChange={(v) => setForm({ ...form, teacherProfileId: v })} 
            options={teacherOptions} 
            placeholder="Buscar docente..." 
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select 
              label="Día" 
              value={form.dayOfWeek || '1'} 
              onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} 
              options={[1, 2, 3, 4, 5].map((d) => ({ value: String(d), label: DAY[d] }))} 
            />
            <Select 
              label="Slot" 
              value={form.slot || '1'} 
              onChange={(e) => setForm({ ...form, slot: e.target.value })} 
              options={[{ value: '1', label: 'Slot 1' }, { value: '2', label: 'Slot 2' }]} 
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={saveCreate} isLoading={saving} loadingText="Creando...">
              Crear sesión
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal 
        isOpen={!!del} 
        onClose={() => setDel(null)} 
        onConfirm={handleDelete} 
        title="Eliminar sesión" 
        message={`¿Eliminar la sesión de ${del?.course?.name} en ${del?.section?.name} (${DAY[del?.dayOfWeek]} Slot ${del?.slot})?\n\nEsta acción no se puede deshacer.`} 
        isLoading={saving} 
      />
    </Card>
  );
};