import React, { useState, useEffect, useMemo } from 'react';
import {
  PlusIcon, PencilIcon, TrashIcon, ShieldCheckIcon, ClockIcon,
  UserIcon, MagnifyingGlassIcon, EnvelopeIcon, KeyIcon, UserGroupIcon,
  ChartBarIcon, CalendarIcon, GlobeAltIcon, XCircleIcon,
  CheckCircleIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, ConfirmModal, Badge, Pagination } from '@suite/ui';
import { ROLE_LABELS, type AppRole } from '@suite/shared';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { usersService, type SystemUser } from '../../api/users.service';
import { auditService } from '../../api/audit.service';
import { useNotifications } from '../../context/NotificationContext';
import { ResetRequestsTab } from './tabs/ResetRequestTab';

const ROLE_COLORS: Record<AppRole, 'danger' | 'primary' | 'success' | 'warning'> = {
  ADMIN: 'danger',
  INFORMATICO: 'primary',
  COORDINADOR: 'success',
  SECRETARIA: 'warning',
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

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  User: <UserIcon style={{ width: 14, height: 14 }} />,
  Student: <UserGroupIcon style={{ width: 14, height: 14 }} />,
  Teacher: <UserIcon style={{ width: 14, height: 14 }} />,
};

export const UsersPage: React.FC = () => {
  const { success, error } = useToast();
  const { can, user: me } = useAuth();
  const [tab, setTab] = useState<'users' | 'audit' | 'reset-requests'>('users');
  const { pendingResetRequests } = useNotifications();
  const canViewResetRequests = can('users.update');

  // Users
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [activating, setActivating] = useState<SystemUser | null>(null);
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

  const load = () => usersService.list().then(setUsers).catch(() => error('Error al cargar usuarios'));
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

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const s = search.toLowerCase();
    return users.filter((u) =>
      u.firstName.toLowerCase().includes(s) ||
      u.lastName.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      ROLE_LABELS[u.role].toLowerCase().includes(s)
    );
  }, [users, search]);

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
    if (!editing && form.password.length < 6) {
      error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
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
      success(editing ? '✅ Usuario actualizado' : '✅ Usuario creado');
      setShowForm(false);
      load();
    } catch (err: any) {
      error(err.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!del) return;
    setSaving(true);
    try {
      await usersService.remove(del.id);
      success('✅ Usuario desactivado');
      setDel(null);
      load();
    } catch (err: any) {
      error(err.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!activating) return;
    setSaving(true);
    try {
      await usersService.activate(activating.id);
      success('✅ Usuario activado correctamente');
      setActivating(null);
      load();
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al activar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
          <p className="page-subtitle">Administración de cuentas del sistema y registro de auditoría</p>
        </div>
      </div>

      {/* Tabs modernos */}
      <div style={{
        display: 'inline-flex',
        gap: 4,
        marginBottom: 24,
        background: 'var(--color-neutral-100)',
        padding: 4,
        borderRadius: 12
      }}>
        <button
          onClick={() => setTab('users')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8,
            fontSize: 'var(--text-sm)', fontWeight: 600, transition: 'all 0.2s',
            background: tab === 'users' ? 'var(--color-neutral-0)' : 'transparent',
            color: tab === 'users' ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
            boxShadow: tab === 'users' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <ShieldCheckIcon style={{ width: 18, height: 18 }} />
          Usuarios
          <span style={{
            background: tab === 'users' ? 'var(--color-primary-100)' : 'var(--color-neutral-200)',
            color: tab === 'users' ? 'var(--color-primary-700)' : 'var(--color-neutral-600)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 10,
          }}>
            {users.length}
          </span>
        </button>
        {canViewAudit && (
          <button
            onClick={() => setTab('audit')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8,
              fontSize: 'var(--text-sm)', fontWeight: 600, transition: 'all 0.2s',
              background: tab === 'audit' ? 'var(--color-neutral-0)' : 'transparent',
              color: tab === 'audit' ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
              boxShadow: tab === 'audit' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <ClockIcon style={{ width: 18, height: 18 }} />
            Auditoría
          </button>
        )}
        {canViewResetRequests && (
          <button
            onClick={() => setTab('reset-requests')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8,
              fontSize: 'var(--text-sm)', fontWeight: 600, transition: 'all 0.2s',
              background: tab === 'reset-requests' ? 'var(--color-neutral-0)' : 'transparent',
              color: tab === 'reset-requests' ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
              boxShadow: tab === 'reset-requests' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <BellAlertIcon style={{ width: 18, height: 18 }} />
            Solicitudes de acceso
            {pendingResetRequests > 0 && (
              <span style={{
                background: 'var(--color-danger-500)',
                color: 'white',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 10,
                minWidth: 20,
                textAlign: 'center',
              }}>
                {pendingResetRequests}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ============== TAB: USUARIOS ============== */}
      {tab === 'users' && (
        <>
          {/* Barra de búsqueda + acción */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 12,
            marginBottom: 16,
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: 240, maxWidth: 400 }}>
              <Input
                placeholder="Buscar por nombre, email o rol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<MagnifyingGlassIcon />}
              />
            </div>
            {canCreate && (
              <Button onClick={openCreate} icon={<PlusIcon />}>
                Nuevo usuario
              </Button>
            )}
          </div>

          <Card className="p-0">
            {filteredUsers.length === 0 ? (
              <div style={{
                padding: 48,
                textAlign: 'center',
                color: 'var(--color-neutral-500)'
              }}>
                <UserIcon style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>
                  {search ? 'No se encontraron usuarios' : 'Sin usuarios registrados'}
                </div>
                <div style={{ fontSize: 'var(--text-sm)' }}>
                  {search ? 'Intenta con otros términos de búsqueda' : 'Crea el primer usuario del sistema'}
                </div>
              </div>
            ) : (
              <>
                <div className="table-container" style={{ border: 'none' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th style={{ textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const isMe = u.id === me?.id;
                        const fullName = `${u.firstName} ${u.lastName}`;
                        return (
                          <tr key={u.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: isMe
                                      ? 'var(--color-primary-100)'
                                      : `hsl(${u.firstName.charCodeAt(0) * 10}, 50%, 88%)`,
                                    color: isMe ? 'var(--color-primary-700)' : 'var(--color-neutral-700)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: 600,
                                    flexShrink: 0,
                                  }}
                                >
                                  {u.firstName[0]}{u.lastName[0]}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--color-neutral-900)' }}>
                                    {u.lastName}, {u.firstName}
                                  </div>
                                  {isMe && (
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-600)', fontWeight: 500 }}>
                                      ✓ Tu cuenta
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ color: 'var(--color-neutral-600)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <EnvelopeIcon style={{ width: 14, height: 14, color: 'var(--color-neutral-400)' }} />
                                {u.email}
                              </div>
                            </td>
                            <td>
                              <Badge color={ROLE_COLORS[u.role]}>
                                {ROLE_LABELS[u.role]}
                              </Badge>
                            </td>
                            <td>
                              <Badge color={u.isActive ? 'success' : 'neutral'}>
                                {u.isActive ? '● Activo' : '○ Inactivo'}
                              </Badge>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                {canUpdate && u.id !== me?.id && (
                                  <button
                                    onClick={() => openEdit(u)}
                                    style={{
                                      padding: '6px 10px',
                                      borderRadius: 6,
                                      background: 'var(--color-neutral-100)',
                                      color: 'var(--color-primary-600)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: 'var(--text-xs)',
                                      fontWeight: 500,
                                      transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-50)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-neutral-100)'; }}
                                  >
                                    <PencilIcon style={{ width: 14, height: 14 }} />
                                    Editar
                                  </button>
                                )}
                                {canDelete && u.isActive && u.id !== me?.id && (
                                  <button
                                    onClick={() => setDel(u)}
                                    style={{
                                      padding: '6px 10px',
                                      borderRadius: 6,
                                      background: 'var(--color-danger-50)',
                                      color: 'var(--color-danger-600)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: 'var(--text-xs)',
                                      fontWeight: 500,
                                      transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-danger-100)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-danger-50)'; }}
                                  >
                                    <TrashIcon style={{ width: 14, height: 14 }} />
                                    Desactivar
                                  </button>
                                )}
                                {canUpdate && !u.isActive && u.id !== me?.id && (
                                  <button
                                    onClick={() => setActivating(u)}
                                    style={{
                                      padding: '6px 10px',
                                      borderRadius: 6,
                                      background: 'var(--color-success-50)',
                                      color: 'var(--color-success-600)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: 'var(--text-xs)',
                                      fontWeight: 500,
                                      transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-success-100)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-success-50)'; }}
                                  >
                                    <CheckCircleIcon style={{ width: 14, height: 14 }} />
                                    Activar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{
                  padding: '12px 16px',
                  borderTop: '1px solid var(--color-neutral-200)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-neutral-500)',
                }}>
                  Mostrando <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> usuarios
                </div>
              </>
            )}
          </Card>

          {/* Modal de crear/editar */}
          <Modal
            isOpen={showForm}
            onClose={() => setShowForm(false)}
            title={editing ? 'Editar usuario' : 'Nuevo usuario'}
          >
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {editing && (
                <div style={{
                  background: 'var(--color-info-50)',
                  border: '1px solid var(--color-info-200, var(--color-neutral-200))',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-info-700, var(--color-neutral-700))',
                }}>
                  <strong>ℹ️ Editando:</strong> {editing.firstName} {editing.lastName}
                </div>
              )}

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
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                icon={<EnvelopeIcon />}
                placeholder="usuario@institucion.edu"
              />
              <Select
                label="Rol"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as AppRole })}
                options={Object.entries(ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
              />
              <Input
                label={editing ? 'Nueva contraseña (vacío = sin cambios)' : 'Contraseña'}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editing}
                icon={<KeyIcon />}
                placeholder={editing ? 'Dejar vacío para mantener la actual' : 'Mínimo 6 caracteres'}
                hint={!editing ? 'La contraseña debe tener al menos 6 caracteres' : undefined}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <Button variant="secondary" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={saving}
                  loadingText={editing ? 'Actualizando...' : 'Creando...'}
                  icon={editing ? <PencilIcon /> : <PlusIcon />}
                >
                  {editing ? 'Actualizar' : 'Crear usuario'}
                </Button>
              </div>
            </form>
          </Modal>

          <ConfirmModal
            isOpen={!!del}
            onClose={() => setDel(null)}
            onConfirm={handleDelete}
            title="Desactivar usuario"
            message={`¿Estás seguro de desactivar a ${del?.firstName} ${del?.lastName}?\n\nEl usuario no podrá acceder al sistema pero sus datos se conservarán.`}
            isLoading={saving}
          />
          <ConfirmModal
            isOpen={!!activating}
            onClose={() => setActivating(null)}
            onConfirm={handleActivate}
            title="Activar usuario"
            message={`¿Activar nuevamente a ${activating?.firstName} ${activating?.lastName}?\n\nEl usuario podrá acceder al sistema con sus credenciales anteriores.`}
            isLoading={saving}
          />
        </>
      )}

      {/* ============== TAB: AUDITORÍA ============== */}
      {tab === 'audit' && canViewAudit && (
        <>
          {/* Stats */}
          {auditStats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 16
            }}>
              <Card className="p-4" style={{ background: 'var(--color-primary-50)', borderColor: 'var(--color-primary-200, var(--color-neutral-200))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <ChartBarIcon style={{ width: 20, height: 20, color: 'var(--color-primary-600)' }} />
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-700)', fontWeight: 500 }}>
                    Total (30 días)
                  </div>
                </div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-primary-700)' }}>
                  {auditStats.total}
                </div>
              </Card>
              {auditStats.byAction.slice(0, 3).map((a: any) => {
                const actionInfo = ACTION_LABELS[a.action];
                const colorMap: any = {
                  success: { bg: 'var(--color-success-50)', text: 'var(--color-success-700)', border: 'var(--color-success-200, var(--color-neutral-200))' },
                  primary: { bg: 'var(--color-primary-50)', text: 'var(--color-primary-700)', border: 'var(--color-primary-200, var(--color-neutral-200))' },
                  warning: { bg: 'var(--color-warning-50)', text: 'var(--color-warning-700)', border: 'var(--color-warning-200, var(--color-neutral-200))' },
                  danger: { bg: 'var(--color-danger-50)', text: 'var(--color-danger-700)', border: 'var(--color-danger-200, var(--color-neutral-200))' },
                  neutral: { bg: 'var(--color-neutral-50)', text: 'var(--color-neutral-700)', border: 'var(--color-neutral-200)' },
                };
                const colors = colorMap[actionInfo?.color || 'neutral'];
                return (
                  <Card key={a.action} className="p-4" style={{ background: colors.bg, borderColor: colors.border }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: colors.text, fontWeight: 500, marginBottom: 8 }}>
                      {actionInfo?.label || a.action}
                    </div>
                    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: colors.text }}>
                      {a.count}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Filtros */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--color-neutral-700)'
            }}>
              <MagnifyingGlassIcon style={{ width: 18, height: 18 }} />
              Filtros
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <Select
                label="Entidad"
                value={auditFilters.entity}
                onChange={(e) => { setAuditFilters({ ...auditFilters, entity: e.target.value }); setAuditPage(1); }}
                options={[{ value: '', label: 'Todas' }, ...['User', 'Sede', 'Turno', 'Classroom', 'Section', 'Area', 'Course', 'Period', 'Block', 'Student', 'Teacher', 'Enrollment', 'Payment', 'Schedule'].map((e) => ({ value: e, label: e }))]}
              />
              <Select
                label="Acción"
                value={auditFilters.action}
                onChange={(e) => { setAuditFilters({ ...auditFilters, action: e.target.value }); setAuditPage(1); }}
                options={[{ value: '', label: 'Todas' }, ...Object.entries(ACTION_LABELS).map(([k, v]) => ({ value: k, label: v.label }))]}
              />
              <Input
                label="Desde"
                type="date"
                value={auditFilters.startDate}
                onChange={(e) => { setAuditFilters({ ...auditFilters, startDate: e.target.value }); setAuditPage(1); }}
                icon={<CalendarIcon />}
              />
              <Input
                label="Hasta"
                type="date"
                value={auditFilters.endDate}
                onChange={(e) => { setAuditFilters({ ...auditFilters, endDate: e.target.value }); setAuditPage(1); }}
                icon={<CalendarIcon />}
              />
            </div>
            {(auditFilters.entity || auditFilters.action || auditFilters.startDate || auditFilters.endDate) && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Filtros activos:</span>
                <button
                  onClick={() => { setAuditFilters({ userId: '', entity: '', action: '', startDate: '', endDate: '' }); setAuditPage(1); }}
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-danger-600)',
                    background: 'var(--color-danger-50)',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontWeight: 500,
                  }}
                >
                  <XCircleIcon style={{ width: 14, height: 14 }} />
                  Limpiar filtros
                </button>
              </div>
            )}
          </Card>

          {/* Tabla de logs */}
          <Card className="p-0">
            {auditLogs.length === 0 ? (
              <div style={{
                padding: 48,
                textAlign: 'center',
                color: 'var(--color-neutral-500)'
              }}>
                <ClockIcon style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>
                  Sin registros de auditoría
                </div>
                <div style={{ fontSize: 'var(--text-sm)' }}>
                  Las acciones del sistema aparecerán aquí
                </div>
              </div>
            ) : (
              <>
                <div className="table-container" style={{ border: 'none' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Fecha/Hora</th>
                        <th>Usuario</th>
                        <th>Acción</th>
                        <th>Entidad</th>
                        <th>IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => {
                        const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'neutral' };
                        return (
                          <tr key={log.id}>
                            <td style={{ fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: 600 }}>
                                {new Date(log.createdAt).toLocaleDateString()}
                              </div>
                              <div style={{ color: 'var(--color-neutral-500)' }}>
                                {new Date(log.createdAt).toLocaleTimeString()}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: 'var(--color-neutral-200)',
                                    color: 'var(--color-neutral-700)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 'var(--text-xs)',
                                    fontWeight: 600,
                                    flexShrink: 0,
                                  }}
                                >
                                  {(log.userName || '??').split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                                    {log.userName || 'Usuario desconocido'}
                                  </div>
                                  {log.userEmail && (
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                                      {log.userEmail}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <Badge color={actionInfo.color}>
                                {actionInfo.label}
                              </Badge>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)' }}>
                                {ENTITY_ICONS[log.entity] || <ShieldCheckIcon style={{ width: 14, height: 14, color: 'var(--color-neutral-400)' }} />}
                                <span style={{ fontWeight: 500 }}>{log.entity}</span>
                                {log.entityId && (
                                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
                                    #{log.entityId.slice(0, 6)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              {log.ipAddress ? (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 'var(--text-xs)',
                                  fontFamily: 'monospace',
                                  color: 'var(--color-neutral-600)',
                                  background: 'var(--color-neutral-100)',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  width: 'fit-content'
                                }}>
                                  <GlobeAltIcon style={{ width: 12, height: 12 }} />
                                  {log.ipAddress}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--color-neutral-400)' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {auditTotal > 0 && (
                  <Pagination
                    currentPage={auditPage}
                    pageSize={auditPageSize}
                    totalItems={auditTotal}
                    onPageChange={setAuditPage}
                    onPageSizeChange={setAuditPageSize}
                  />
                )}
              </>
            )}
          </Card>
        </>
      )}

      {tab === 'reset-requests' && canViewResetRequests && <ResetRequestsTab />}
    </div>
  );
};