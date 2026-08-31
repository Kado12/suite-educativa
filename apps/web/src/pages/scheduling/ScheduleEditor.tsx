import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Select, SearchableSelect, Badge, ConfirmModal } from '@suite/ui';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../context/ToastContext';
import { schedulingService } from '../../api/scheduling.service';
import { peopleService } from '../../api/people.service';

const DAY = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export const ScheduleEditor: React.FC<{ block: any }> = ({ block }) => {
  const { success, error } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  const [edit, setEdit] = useState<any | null>(null);   // sesión a editar
  const [showCreate, setShowCreate] = useState(false);
  const [del, setDel] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const load = () => { if (block) schedulingService.listSessions(block.id).then(setSessions); };
  useEffect(() => { load(); }, [block?.id]);
  useEffect(() => {
    peopleService.listTeachers().then(setTeachers);
    import('../../api/academic.service').then(({ academicService }) => academicService.listSections().then(setSections));
  }, []);

  const courseOptions = (block?.blockCourses || []).map((bc: any) => ({ value: bc.courseId, label: bc.course.name }));
  const teacherOptions = teachers.map((t: any) => ({ value: t.teacherProfile.id, label: `${t.lastName}, ${t.firstName}` }));

  const openEdit = (s: any) => {
    setEdit(s);
    setForm({ courseId: s.courseId, teacherProfileId: s.teacherProfileId || '', dayOfWeek: String(s.dayOfWeek), slot: String(s.slot) });
  };
  const openCreate = () => {
    setShowCreate(true);
    setForm({ sectionId: '', courseId: '', teacherProfileId: '', dayOfWeek: '1', slot: '1' });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await schedulingService.updateSession(edit.id, { ...form, teacherProfileId: form.teacherProfileId || null, dayOfWeek: parseInt(form.dayOfWeek), slot: parseInt(form.slot) });
      success('Sesión actualizada (histórico preservado)');
      setEdit(null); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const saveCreate = async () => {
    if (!form.sectionId || !form.courseId) { error('Selecciona sección y curso'); return; }
    setSaving(true);
    try {
      await schedulingService.createSession({ ...form, blockId: block.id, teacherProfileId: form.teacherProfileId || null, dayOfWeek: parseInt(form.dayOfWeek), slot: parseInt(form.slot) });
      success('Sesión creada');
      setShowCreate(false); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await schedulingService.deleteSession(del.id); success('Sesión eliminada'); setDel(null); load(); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <Card className="p-0">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="card-title">Editor de sesiones · {block?.name}</h3>
        <Button onClick={openCreate}><PlusIcon style={{ width: 16, height: 16 }} /> Nueva sesión</Button>
      </div>
      <div className="table-container" style={{ border: 'none' }}>
        <table className="table">
          <thead><tr><th>Sección</th><th>Día</th><th>Slot</th><th>Curso</th><th>Docente</th><th>Asist.</th><th></th></tr></thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.section.name}</strong><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{s.section.classroom.sede.name}</div></td>
                <td>{DAY[s.dayOfWeek]}</td>
                <td>{s.slot}</td>
                <td>{s.course.name}</td>
                <td>{s.teacherProfile ? `${s.teacherProfile.person.lastName}, ${s.teacherProfile.person.firstName}` : '—'}</td>
                <td><Badge color={s._count.attendances > 0 ? 'success' : 'neutral'}>{s._count.attendances}</Badge></td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => openEdit(s)} className="btn btn-ghost btn-icon" title="Editar"><PencilIcon style={{ width: 16, height: 16 }} /></button>
                  <button onClick={() => s._count.attendances === 0 && setDel(s)} disabled={s._count.attendances > 0}
                    className="btn btn-ghost btn-icon" title={s._count.attendances > 0 ? 'Tiene asistencias (preservado)' : 'Eliminar'}
                    style={{ opacity: s._count.attendances > 0 ? 0.35 : 1 }}>
                    <TrashIcon style={{ width: 16, height: 16, color: 'var(--color-danger-500)' }} />
                  </button>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--color-neutral-400)' }}>Sin sesiones en este bloque</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal editar */}
      <Modal isOpen={!!edit} onClose={() => setEdit(null)} title={`Editar: ${edit?.section?.name} · ${DAY[edit?.dayOfWeek]} slot ${edit?.slot}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Select label="Curso" value={form.courseId || ''} onChange={(e) => setForm({ ...form, courseId: e.target.value })} options={courseOptions} />
          <SearchableSelect label="Docente" value={form.teacherProfileId || ''} onChange={(v) => setForm({ ...form, teacherProfileId: v })} options={teacherOptions} placeholder="Buscar docente..." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select label="Día" value={form.dayOfWeek || '1'} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} options={[1, 2, 3, 4, 5].map((d) => ({ value: String(d), label: DAY[d] }))} />
            <Select label="Slot" value={form.slot || '1'} onChange={(e) => setForm({ ...form, slot: e.target.value })} options={[{ value: '1', label: 'Slot 1' }, { value: '2', label: 'Slot 2' }]} />
          </div>
          <Button onClick={saveEdit} isLoading={saving}>Guardar (preserva histórico)</Button>
        </div>
      </Modal>

      {/* Modal crear */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nueva sesión">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SearchableSelect label="Sección" value={form.sectionId || ''} onChange={(v) => setForm({ ...form, sectionId: v })} options={sections.map((s: any) => ({ value: s.id, label: s.name, hint: s.classroom?.sede?.name }))} placeholder="Buscar sección..." />
          <Select label="Curso" value={form.courseId || ''} onChange={(e) => setForm({ ...form, courseId: e.target.value })} options={courseOptions} />
          <SearchableSelect label="Docente" value={form.teacherProfileId || ''} onChange={(v) => setForm({ ...form, teacherProfileId: v })} options={teacherOptions} placeholder="Buscar docente..." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select label="Día" value={form.dayOfWeek || '1'} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} options={[1, 2, 3, 4, 5].map((d) => ({ value: String(d), label: DAY[d] }))} />
            <Select label="Slot" value={form.slot || '1'} onChange={(e) => setForm({ ...form, slot: e.target.value })} options={[{ value: '1', label: 'Slot 1' }, { value: '2', label: 'Slot 2' }]} />
          </div>
          <Button onClick={saveCreate} isLoading={saving}>Crear sesión</Button>
        </div>
      </Modal>

      <ConfirmModal isOpen={!!del} onClose={() => setDel(null)} onConfirm={handleDelete} title="Eliminar sesión" message={`¿Eliminar la sesión de ${del?.course?.name} en ${del?.section?.name}?`} isLoading={saving} />
    </Card>
  );
};