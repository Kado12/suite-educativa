import React, { useState, useEffect, useMemo } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, ConfirmModal, Badge, Pagination } from '@suite/ui';
import { ROLE_LABELS, type AppRole } from '@suite/shared';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { usersService, type SystemUser } from '../../api/users.service';
import { auditService } from '../../api/audit.service';

export const UsersPage: React.FC = () => {
  const { success, error } = useToast();
  const { can, user: me } = useAuth();
  const [tab, setTab] = useState<'users' | 'audit'>('users');

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'COORDINADOR' as AppRole });
  const [del, setDel] = useState<SystemUser | null>(null);
  const [saving, setSaving] = useState(false);

  // Audit
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditStats, setAuditStats] = useState<any>(null);
  const [auditFilters, setAuditFilters] = useState({ userId: '', entity: '', action: '', startDate: '', endDate: '' });
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(50);
  const [auditTotal, setAuditTotal] = useState(0);

  const load = () => usersService.list().then(setUsers).catch(() => error('Error'));
  const loadAudit = () => {
    auditService.list({ ...auditFilters, page: auditPage, pageSize: auditPageSize }).then((r) => {
      setAuditLogs(r.logs);
      setAuditTotal(r.total);
    });
    auditService.getStats(30).then(setAuditStats);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (tab === 'audit') loadAudit(); }, [tab, auditFilters, auditPage, auditPageSize]);

  const canCreate = can('users.create');
  const canUpdate = can('users.update');
  const canDelete = can('users.delete');
  const canViewAudit = can('users.view');

  const openCreate = () => { setEditing(null); setForm({ firstName: '', lastName: '', email: '', password: '', role: 'COORDINADOR' }); setShowForm(true); };
  const openEdit = (u: SystemUser) => { setEditing(u); setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', role: u.role }); setShowForm(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing && form.password.length < 6) { error('Contraseña mínimo 6 caracteres'); return; }
    setSaving(true);
    try {
      if (editing) {
        await usersService.update(editing.id, {
          firstName: form.firstName, lastName: form.lastName, email: form.email, role: form.role,
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

  const ACTION_LABELS: Record<string, { label: string; color: 'success' | 'warning' | 'danger' | 'primary' | 'neutral' }> = {
    CREATE: { label: 'Crear', color: 'success' },
    UPDATE: { label: 'Actualizar', color: 'primary' },
    DELETE: { label: 'Eliminar', color: 'danger' },
    TOGGLE: { label: 'Activar/Desactivar', color: 'warning' },
    UPDATE_PROFILE: { label: 'Editar perfil', color: 'primary' },
    CHANGE_PASSWORD: { label: 'Cambiar contraseña', color: 'warning' },
    MARK_PAID: { label: 'Marcar pagado', color: 'success' },
    GENERATE: { label: 'Generar', color: 'primary' },
    CLEAR: { label: 'Limpiar', color: 'danger' },
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
          <p className="page-subtitle">Administración de cuentas y registro de auditoría</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--color-neutral-100)', padding: 4, borderRadius: 12, width: 'fit-content' }}>
        <button
          onClick={() => setTab('users')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8,
            fontSize: 'var(--text-sm)', fontWeight: 600, transition: 'all 0.15s',
            background: tab === 'users' ? 'var(--color-neutral-0)' : 'transparent',
            color: tab === 'users' ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
            boxShadow: tab === 'users' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <ShieldCheckIcon style={{ width: 18, height: 18 }} />
          Usuarios
        </button>
        {canViewAudit && (
          <button
            onClick={() => setTab('audit')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8,
              fontSize: 'var(--text-sm)', fontWeight: 600, transition: 'all 0.15s',
              background: tab === 'audit' ? 'var(--color-neutral-0)' : 'transparent',
              color: tab === 'audit' ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
              boxShadow: tab === 'audit' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <ClockIcon style={{ width: 18, height: 18 }} />
            Auditoría
          </button>
        )}
      </div>

      {tab === 'users' && (
        <>
          {canCreate && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <Button onClick={openCreate}><PlusIcon style={{ width: 16, height: 16 }} /> Usuario</Button>
            </div>
          )}

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
                          <button onClick={() => openEdit(u)} style={{ color: 'var(--color-primary-600)', marginRight: 8 }}><PencilIcon style={{ width: 16, height: 16, color: 'var(--color-success-700)'  }} /></button>
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
              <Select label="Rol" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AppRole })} options={Object.entries(ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
              <Input label={editing ? 'Nueva contraseña (vacío = sin cambios)' : 'Contraseña'} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} />
              <Button type="submit" isLoading={saving}>Guardar</Button>
            </form>
          </Modal>

          <ConfirmModal isOpen={!!del} onClose={() => setDel(null)} onConfirm={handleDelete} title="Desactivar usuario" message={`¿Desactivar a ${del?.email}?`} isLoading={saving} />
        </>
      )}

      {tab === 'audit' && canViewAudit && (
        <>
          {auditStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
              <Card className="p-4">
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 4 }}>Total acciones (30 días)</div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{auditStats.total}</div>
              </Card>
              {auditStats.byAction.slice(0, 3).map((a: any) => (
                <Card key={a.action} className="p-4">
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 4 }}>{ACTION_LABELS[a.action]?.label || a.action}</div>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{a.count}</div>
                </Card>
              ))}
            </div>
          )}

          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <Select label="Entidad" value={auditFilters.entity} onChange={(e) => { setAuditFilters({ ...auditFilters, entity: e.target.value }); setAuditPage(1); }}
                options={[{ value: '', label: 'Todas' }, ...['User', 'Sede', 'Turno', 'Classroom', 'Section', 'Area', 'Course', 'Period', 'Block', 'Student', 'Teacher', 'Enrollment', 'Payment', 'Schedule'].map((e) => ({ value: e, label: e }))]} />
              <Select label="Acción" value={auditFilters.action} onChange={(e) => { setAuditFilters({ ...auditFilters, action: e.target.value }); setAuditPage(1); }}
                options={[{ value: '', label: 'Todas' }, ...Object.entries(ACTION_LABELS).map(([k, v]) => ({ value: k, label: v.label }))]} />
              <Input label="Desde" type="date" value={auditFilters.startDate} onChange={(e) => { setAuditFilters({ ...auditFilters, startDate: e.target.value }); setAuditPage(1); }} />
              <Input label="Hasta" type="date" value={auditFilters.endDate} onChange={(e) => { setAuditFilters({ ...auditFilters, endDate: e.target.value }); setAuditPage(1); }} />
            </div>
          </Card>

          <Card className="p-0">
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr><th>Fecha/Hora</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>IP</th></tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => {
                    const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'neutral' };
                    return (
                      <tr key={log.id}>
                        <td style={{ fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{log.userName || 'Usuario desconocido'}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{log.userEmail || ''}</div>
                        </td>
                        <td><Badge color={actionInfo.color}>{actionInfo.label}</Badge></td>
                        <td>{log.entity}</td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{log.ipAddress || '—'}</td>
                      </tr>
                    );
                  })}
                  {auditLogs.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--color-neutral-400)' }}>Sin registros</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {auditTotal > 0 && (
              <Pagination currentPage={auditPage} pageSize={auditPageSize} totalItems={auditTotal} onPageChange={setAuditPage} onPageSizeChange={setAuditPageSize} />
            )}
          </Card>
        </>
      )}
    </div>
  );
};