import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Modal, ConfirmModal, Badge } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { peopleService } from '../../../api/people.service';

export const StudentsTab: React.FC = () => {
  const { success, error } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', dni: '', phone: '', email: '', birthDate: '', gender: '', address: '' });
  const [del, setDel] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const load = (s?: string) => peopleService.listStudents(s).then(setStudents).catch(() => error('Error'));
  useEffect(() => {
    const t = setTimeout(() => load(search || undefined), 300);
    return () => clearTimeout(t);
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ firstName: '', lastName: '', dni: '', phone: '', email: '', birthDate: '', gender: '', address: '' });
    setShowForm(true);
  };
  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      firstName: s.firstName, lastName: s.lastName, dni: s.dni || '',
      phone: s.phone || '', email: s.email || '',
      birthDate: s.birthDate ? s.birthDate.split('T')[0] : '',
      gender: s.gender || '', address: s.address || '',
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, birthDate: form.birthDate || undefined };
      if (editing) await peopleService.updateStudent(editing.id, payload);
      else await peopleService.createStudent(payload);
      success(editing ? 'Alumno actualizado' : 'Alumno creado');
      setShowForm(false); load(search || undefined);
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!del) return; setSaving(true);
    try { await peopleService.deleteStudent(del.id); success('Eliminado'); setDel(null); load(search || undefined); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <Input placeholder="Buscar por nombre o DNI..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
        <Button onClick={openCreate}><PlusIcon style={{ width: 16, height: 16 }} /> Alumno</Button>
      </div>

      <Card className="p-0">
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr><th>Alumno</th><th>DNI</th><th>Contacto</th><th>Sección actual</th><th></th></tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const enr = s.enrollments[0];
                return (
                  <tr key={s.id}>
                    <td><strong>{s.lastName}, {s.firstName}</strong></td>
                    <td>{s.dni || '—'}</td>
                    <td>{s.phone || s.email || '—'}</td>
                    <td>{enr ? <Badge color="primary">{enr.section.name}</Badge> : <span style={{ color: 'var(--color-neutral-400)' }}>Sin matricular</span>}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => openEdit(s)} style={{ color: 'var(--color-primary-600)', marginRight: 8 }}><PencilIcon style={{ width: 16, height: 16 }} /></button>
                      <button onClick={() => setDel(s)} style={{ color: 'var(--color-danger-500)' }}><TrashIcon style={{ width: 16, height: 16 }} /></button>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--color-neutral-400)' }}>Sin alumnos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Editar Alumno' : 'Nuevo Alumno'}>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Nombres" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <Input label="Apellidos" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="DNI" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
            <Input label="Fecha nacimiento" type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <Input label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Button type="submit" isLoading={saving}>Guardar</Button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!del} onClose={() => setDel(null)} onConfirm={handleDelete} title="Eliminar alumno" message={`¿Eliminar a ${del?.firstName} ${del?.lastName}?`} isLoading={saving} />
    </div>
  );
};