import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowDownTrayIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon,
  AcademicCapIcon, CurrencyDollarIcon, ExclamationTriangleIcon,
  CheckCircleIcon, CalendarIcon, MapPinIcon, XCircleIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, ConfirmModal, Badge, Pagination } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { enrollmentService } from '../../../api/enrollment.service';
import { peopleService } from '../../../api/people.service';
import { academicService } from '../../../api/academic.service';
import { EnrollmentWizard } from '../EnrollmentWizard';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ACTIVE: 'success',
  TRANSFERRED: 'warning',
  WITHDRAWN: 'danger',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: '● Activa',
  TRANSFERRED: '↔ Trasladado',
  WITHDRAWN: '✕ Retirado',
};

export const MatriculasTab: React.FC = () => {
  const { success, error } = useToast();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  const [activePeriod, setActivePeriod] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ studentId: '', sectionId: '', paymentPlanId: '' });
  const [del, setDel] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [sectionInfo, setSectionInfo] = useState<string>('');
  const [showWizard, setShowWizard] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [sedes, setSedes] = useState<any[]>([]); 
  const [turnos, setTurnos] = useState<any[]>([]);
  const [fSede, setFSede] = useState(''); 
  const [fTurno, setFTurno] = useState(''); 
  const [fStatus, setFStatus] = useState('');
  const [rePending, setRePending] = useState<any[]>([]);

  const paginatedEnrollments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return enrollments.slice(start, start + pageSize);
  }, [enrollments, currentPage, pageSize]);

  useEffect(() => { setCurrentPage(1); }, [search, activePeriod, pageSize]);
  useEffect(() => { academicService.listSedes().then(setSedes); academicService.listTurnos().then(setTurnos); }, []);
  useEffect(() => { if (activePeriod) enrollmentService.reEnrollmentPending(activePeriod).then(setRePending); }, [activePeriod]);

  const load = async () => {
    const [p, s, stu, pl, stats] = await Promise.all([
      academicService.listPeriods(),
      academicService.listSections(true),
      peopleService.listStudents(),
      academicService.listPaymentPlans(),
      enrollmentService.stats(activePeriod || undefined),
    ]);
    setPeriods(p);
    setSections(s);
    setStudents(stu);
    setPlans(pl);
    setStats(stats);
    if (!activePeriod) {
      const current = p.find((x: any) => x.isActive);
      if (current) setActivePeriod(current.id);
    }
    loadEnrollments(activePeriod || p.find((x: any) => x.isActive)?.id);
  };

  const loadEnrollments = (periodId?: string) => {
    enrollmentService.list({ periodId, studentSearch: search || undefined }).then(setEnrollments);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (activePeriod) {
      loadEnrollments(activePeriod);
      enrollmentService.stats(activePeriod).then(setStats);
    }
  }, [activePeriod]);
  useEffect(() => {
    const t = setTimeout(() => loadEnrollments(activePeriod || undefined), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!form.sectionId) { setSectionInfo(''); return; }
    const s = sections.find((x) => x.id === form.sectionId);
    if (!s) return;
    enrollmentService.list({ sectionId: s.id, status: 'ACTIVE' }).then((list: any) => {
      setSectionInfo(`${list.length}/${s.capacity} alumnos matriculados · Prioridad: ${s.enrollmentPriority}`);
    });
  }, [form.sectionId]);

  const filtered = enrollments.filter((e) =>
    (!fSede || e.section.classroom.sede.id === fSede) &&
    (!fTurno || e.section.turno.id === fTurno) &&
    (!fStatus || e.status === fStatus)
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await enrollmentService.create({
        studentId: form.studentId,
        sectionId: form.sectionId,
        periodId: activePeriod,
        paymentPlanId: form.paymentPlanId,
      });
      success('✅ Matrícula creada y cuotas generadas');
      setShowForm(false);
      setForm({ studentId: '', sectionId: '', paymentPlanId: '' });
      loadEnrollments(activePeriod);
      enrollmentService.stats(activePeriod).then(setStats);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al matricular');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!del) return; setSaving(true);
    try {
      await enrollmentService.delete(del.id);
      success('✅ Matrícula eliminada');
      setDel(null);
      loadEnrollments(activePeriod);
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleExport = async () => {
    try { 
      await enrollmentService.exportExcel({ periodId: activePeriod, studentSearch: search }); 
      success('📥 Matrículas exportadas'); 
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error al exportar'); 
    }
  };

  const clearFilters = () => {
    setFSede('');
    setFTurno('');
    setFStatus('');
    setSearch('');
  };

  const hasActiveFilters = fSede || fTurno || fStatus || search;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <Card className="p-4" style={{ background: 'var(--color-primary-50)', borderColor: 'var(--color-primary-500)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <AcademicCapIcon style={{ width: 20, height: 20, color: 'var(--color-primary-600)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-700)', fontWeight: 500 }}>Total matrículas</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-primary-700)' }}>{stats.total}</div>
          </Card>
          <Card className="p-4" style={{ background: 'var(--color-success-50)', borderColor: 'var(--color-success-500)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <CheckCircleIcon style={{ width: 20, height: 20, color: 'var(--color-success-700)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success-700)', fontWeight: 500 }}>Activas</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-success-700)' }}>{stats.active}</div>
          </Card>
          <Card className="p-4" style={{ background: 'var(--color-warning-50)', borderColor: 'var(--color-warning-500)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <CurrencyDollarIcon style={{ width: 20, height: 20, color: 'var(--color-warning-600)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning-700)', fontWeight: 500 }}>Cuotas pendientes</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-warning-700)' }}>{stats.pendingPayments}</div>
          </Card>
          <Card className="p-4" style={{ background: 'var(--color-danger-50)', borderColor: 'var(--color-danger-500)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ExclamationTriangleIcon style={{ width: 20, height: 20, color: 'var(--color-danger-600)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger-700)', fontWeight: 500 }}>Cuotas vencidas</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-danger-700)' }}>{stats.overduePayments}</div>
          </Card>
          <Card className="p-4" style={{ background: 'var(--color-success-50)', borderColor: 'var(--color-success-500)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <CurrencyDollarIcon style={{ width: 20, height: 20, color: 'var(--color-success-700)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success-700)', fontWeight: 500 }}>Ingresos</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-success-700)' }}>S/ {stats.totalPaid.toFixed(2)}</div>
          </Card>
        </div>
      )}

      {/* Alerta de rematrícula */}
      {rePending.length > 0 && (
        <Card style={{ 
          background: 'var(--color-warning-50)', 
          borderColor: 'var(--color-warning-300)',
          border: '1px solid var(--color-warning-300)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <ExclamationTriangleIcon style={{ width: 24, height: 24, color: 'var(--color-warning-600)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--color-warning-900)', marginBottom: 4, fontSize: 'var(--text-sm)' }}>
                ⚠️ {rePending.length} alumno(s) del período anterior sin matrícula activa
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-warning-800)' }}>
                {rePending.slice(0, 8).map((r) => r.name).join(' · ')}
                {rePending.length > 8 && ` · y ${rePending.length - 8} más...`}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Filtros y acciones */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
          <Select 
            label="Período" 
            value={activePeriod} 
            onChange={(e) => setActivePeriod(e.target.value)}
            options={[{ value: '', label: 'Todos los períodos' }, ...periods.map((p: any) => ({ value: p.id, label: p.name }))]} 
          />
          <Select
            label="Sede"
            value={fSede}
            onChange={(e) => setFSede(e.target.value)}
            options={[{ value: '', label: 'Todas las sedes' }, ...sedes.map((s) => ({ value: s.id, label: s.name }))]}
          />
          <Select
            label="Turno"
            value={fTurno}
            onChange={(e) => setFTurno(e.target.value)}
            options={[{ value: '', label: 'Todos los turnos' }, ...turnos.map((t) => ({ value: t.id, label: t.name }))]}
          />
          <Select
            label="Estado"
            value={fStatus}
            onChange={(e) => setFStatus(e.target.value)}
            options={[
              { value: '', label: 'Todos' },
              { value: 'ACTIVE', label: 'Activas' },
              { value: 'TRANSFERRED', label: 'Trasladados' },
              { value: 'WITHDRAWN', label: 'Retirados' },
            ]}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Input
              placeholder="Buscar alumno por nombre o documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<MagnifyingGlassIcon />}
            />
          </div>
          <Button onClick={() => setShowWizard(true)} icon={<PlusIcon />}>
            Nueva matrícula
          </Button>
          <Button variant="success" onClick={handleExport} icon={<ArrowDownTrayIcon />}>
            Exportar Excel
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} icon={<XCircleIcon />}>
              Limpiar filtros
            </Button>
          )}
        </div>
        <div style={{ 
          marginTop: 12, 
          fontSize: 'var(--text-sm)', 
          color: 'var(--color-neutral-600)' 
        }}>
          Mostrando <strong>{filtered.length}</strong> de <strong>{enrollments.length}</strong> matrículas
        </div>
      </Card>

      {/* Tabla */}
      <Card className="p-0">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-neutral-400)' }}>
            <AcademicCapIcon style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>
              {hasActiveFilters ? 'No se encontraron matrículas' : 'Sin matrículas registradas'}
            </div>
            <div style={{ fontSize: 'var(--text-sm)' }}>
              {hasActiveFilters ? 'Intenta ajustar los filtros' : 'Crea la primera matrícula del período'}
            </div>
          </div>
        ) : (
          <>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Sección</th>
                    <th>Turno</th>
                    <th>Plan</th>
                    <th style={{ textAlign: 'center' }}>Estado</th>
                    <th>Fecha</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEnrollments.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--color-primary-100) 0%, var(--color-primary-200) 100%)',
                            color: 'var(--color-primary-700)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {e.student.firstName[0]}{e.student.lastName[0]}
                          </div>
                          <div>
                            <strong style={{ color: 'var(--color-neutral-900)' }}>{e.student.lastName}, {e.student.firstName}</strong>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{e.student.dni}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{e.section.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <MapPinIcon style={{ width: 12, height: 12 }} />
                          {e.section.classroom.sede.name}
                        </div>
                      </td>
                      <td><Badge color="primary">{e.section.turno.name}</Badge></td>
                      <td style={{ fontSize: 'var(--text-sm)' }}>{e.payments[0]?.paymentPlan?.name || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge color={STATUS_COLORS[e.status] || 'neutral'}>
                          {STATUS_LABELS[e.status] || e.status}
                        </Badge>
                      </td>
                      <td style={{ fontSize: 'var(--text-sm)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CalendarIcon style={{ width: 14, height: 14, color: 'var(--color-neutral-400)' }} />
                          {new Date(e.enrolledAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <select 
                            className="select" 
                            style={{ width: 'auto', padding: '4px 8px', fontSize: 'var(--text-xs)' }} 
                            value={e.status}
                            onChange={async (ev) => { 
                              await enrollmentService.updateStatus(e.id, ev.target.value); 
                              success('✅ Estado actualizado');
                              loadEnrollments(activePeriod); 
                            }}
                          >
                            <option value="ACTIVE">Activa</option>
                            <option value="TRANSFERRED">Trasladado</option>
                            <option value="WITHDRAWN">Retirado</option>
                          </select>
                          <button 
                            onClick={() => setDel(e)} 
                            className="btn btn-ghost btn-icon"
                            style={{ color: 'var(--color-danger-600)' }}
                            title="Eliminar"
                          >
                            <TrashIcon style={{ width: 16, height: 16 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > 0 && (
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            )}
          </>
        )}
      </Card>

      {/* Modal de matrícula manual */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nueva matrícula">
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Select label="Alumno" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required
            options={[{ value: '', label: 'Selecciona alumno' }, ...students.map((s: any) => ({ value: s.id, label: `${s.lastName}, ${s.firstName} (${s.dni || 'sin DNI'})` }))]} />
          <div>
            <Select label="Sección" value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} required
              options={[{ value: '', label: 'Selecciona sección' }, ...sections.map((s: any) => ({ value: s.id, label: `${s.name} · ${s.classroom?.sede?.name || ''} · ${s.turno?.name || ''}` }))]} />
            {sectionInfo && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-600)', marginTop: 4 }}>{sectionInfo}</div>}
          </div>
          <Select label="Plan de pago" value={form.paymentPlanId} onChange={(e) => setForm({ ...form, paymentPlanId: e.target.value })} required
            options={[{ value: '', label: 'Selecciona plan' }, ...plans.map((p: any) => ({ value: p.id, label: `${p.name} — S/ ${Number(p.amount).toFixed(2)} en ${p.installments} cuota(s)` }))]} />
          <Button type="submit" isLoading={saving}>Matricular y generar cuotas</Button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!del} onClose={() => setDel(null)} onConfirm={handleDelete}
        title="Eliminar matrícula" message={`¿Eliminar la matrícula de ${del?.student?.firstName} ${del?.student?.lastName}?\n\nSolo es posible si no tiene pagos registrados.`}
        isLoading={saving} />
      <EnrollmentWizard isOpen={showWizard} onClose={() => setShowWizard(false)} onDone={() => loadEnrollments(activePeriod)} />
    </div>
  );
};