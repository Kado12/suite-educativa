import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, ConfirmModal, Badge } from '@suite/ui';
import { ROLE_LABELS, type AppRole } from '@suite/shared';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { usersService, type SystemUser } from '../../api/users.service';

export const UsersPage: React.FC = () => {
  const { success, error } = useToast();
  const { can, user: me } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'COORDINADOR' as AppRole });
  const [del, setDel] = useState<SystemUser | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => usersService.list().then(setUsers).catch(() => error('Error'));
  useEffect(() => { load(); }, []);

  const canCreate = can('users.create');
  const canUpdate = can('users.update');
  const canDelete = can('users.delete');

  const openCreate = () => {
    setEditing(null);
    setForm({ firstName: '', lastName: '', email: '', password: '', role: 'COORDINADOR' });
    setShowForm(true);
  };
  const openEdit = (u: SystemUser) => {
    setEditing(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', role: u.role });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing && form.password.length < 6) { error('Contraseña mínimo 6 caracteres'); return; }
    setSaving(true);
    try {
      if (editing) {
        await usersService.update(editing.id, {
          firstName: form.firstName, lastName: form.lastName,
          email: form.email, role: form.role,
          ...(form.password ? { newPassword: form.password } : {}),
        });
      } else {
        await usersService.create(form);
      }
      success(editing ? 'Usuario actualizado' : 'Usuario creado');
      setShowForm(false); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!del) return; setSaving(true);
    try { await usersService.remove(del.id); success('Usuario desactivado'); setDel(null); load(); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios del sistema</h1>
          <p className="page-subtitle">Gestión de cuentas con acceso a la plataforma</p>
        </div>
        {canCreate && <Button onClick={openCreate}><PlusIcon style={{ width: 16, height: 16 }} /> Usuario</Button>}
      </div>

      <Card className="p-0">
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.lastName}, {u.firstName}</strong></td>
                  <td>{u.email}</td>
                  <td><Badge color={u.role === 'ADMIN' ? 'danger' : u.role === 'INFORMATICO' ? 'primary' : u.role === 'COORDINADOR' ? 'success' : 'warning'}>{ROLE_LABELS[u.role]}</Badge></td>
                  <td><Badge color={u.isActive ? 'success' : 'neutral'}>{u.isActive ? 'Activo' : 'Inactivo'}</Badge></td>
                  <td style={{ textAlign: 'right' }}>
                    {u.id === me?.id && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginRight: 8 }}>Tú</span>}
                    {canUpdate && u.id !== me?.id && (
                      <button onClick={() => openEdit(u)} style={{ color: 'var(--color-primary-600)', marginRight: 8 }}><PencilIcon style={{ width: 16, height: 16 }} /></button>
                    )}
                    {canDelete && u.isActive && u.id !== me?.id && (
                      <button onClick={() => setDel(u)} style={{ color: 'var(--color-danger-500)' }}><TrashIcon style={{ width: 16, height: 16 }} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Nombres" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <Input label="Apellidos" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Select label="Rol" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AppRole })}
            options={Object.entries(ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          <Input label={editing ? 'Nueva contraseña (vacío = sin cambios)' : 'Contraseña'} type="password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} />
          <Button type="submit" isLoading={saving}>Guardar</Button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!del} onClose={() => setDel(null)} onConfirm={handleDelete} title="Desactivar usuario" message={`¿Desactivar a ${del?.email}?`} isLoading={saving} />
    </div>
  );
};