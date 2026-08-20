export type AppRole = 'ADMIN' | 'INFORMATICO' | 'COORDINADOR' | 'SECRETARIA';

export const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: 'Administrador',
  INFORMATICO: 'Informático',
  COORDINADOR: 'Coordinador',
  SECRETARIA: 'Secretaría',
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  ADMIN: 'Acceso total al sistema, incluyendo usuarios.',
  INFORMATICO: 'Acceso técnico total excepto crear, editar o eliminar usuarios.',
  COORDINADOR: 'Validación académica, asistencia y reportes.',
  SECRETARIA: 'Gestión de matrículas, alumnos y pagos.',
};

export type Permission =
  | 'dashboard.view'
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'academic.view'
  | 'academic.manage'
  | 'enrollment.view'
  | 'enrollment.manage'
  | 'payments.view'
  | 'payments.manage'
  | 'scheduling.view'
  | 'scheduling.manage'
  | 'attendance.view'
  | 'attendance.manage'
  | 'attendance.validate'
  | 'reports.view'
  | 'tools.view';

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  ADMIN: [
    'dashboard.view',
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'academic.view',
    'academic.manage',
    'enrollment.view',
    'enrollment.manage',
    'payments.view',
    'payments.manage',
    'scheduling.view',
    'scheduling.manage',
    'attendance.view',
    'attendance.manage',
    'attendance.validate',
    'reports.view',
    'tools.view',
  ],

  INFORMATICO: [
    'dashboard.view',
    'users.view',
    //! Importante: NO tiene users.create/update/delete
    'academic.view',
    'academic.manage',
    'enrollment.view',
    'enrollment.manage',
    'payments.view',
    'payments.manage',
    'scheduling.view',
    'scheduling.manage',
    'attendance.view',
    'attendance.manage',
    'attendance.validate',
    'reports.view',
    'tools.view',
  ],

  COORDINADOR: [
    'dashboard.view',
    'academic.view',
    'scheduling.view',
    'attendance.view',
    'attendance.manage',
    'attendance.validate',
    'reports.view',
    'tools.view',
  ],

  SECRETARIA: [
    'dashboard.view',
    'academic.view',
    'enrollment.view',
    'enrollment.manage',
    'payments.view',
    'payments.manage',
    'reports.view',
  ],
};

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export const APP_NAME = 'Suite Educativa';