import React, { useState, useEffect, useMemo } from 'react';
import { ArrowDownTrayIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
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

  const [sedes, setSedes] = useState<any[]>([]); const [turnos, setTurnos] = useState<any[]>([]);
  const [fSede, setFSede] = useState(''); const [fTurno, setFTurno] = useState(''); const [fStatus, setFStatus] = useState('');
  const [rePending, setRePending] = useState<any[]>([]);

  const paginatedEnrollments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return enrollments.slice(start, start + pageSize);
  }, [enrollments, currentPage, pageSize]);

  useEffect(() => { setCurrentPage(1); }, [search, activePeriod, pageSize]);
  // Cargar sedes/turnos y rematrícula:
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
  (!fStatus || e.status === fStatus));

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await enrollmentService.create({
        studentId: form.studentId,
        sectionId: form.sectionId,
        periodId: activePeriod,
        paymentPlanId: form.paymentPlanId,
      });
      success('Matrícula creada y cuotas generadas');
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
      success('Matrícula eliminada');
      setDel(null);
      loadEnrollments(activePeriod);
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const changeStatus = async (id: string, status: string) => {
    try { await enrollmentService.updateStatus(id, status); loadEnrollments(activePeriod); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
  };

  const handleExport = async () => {
    try { await enrollmentService.exportExcel({ periodId: activePeriod, studentSearch: search }); success('📥 Matrículas exportadas'); }
    catch (err: any) { error(err.response?.data?.message || 'Error al exportar'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Card className="p-4">
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 4 }}>Total matrículas</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 4 }}>Activas</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-success-500)' }}>{stats.active}</div>
          </Card>
          <Card className="p-4">
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 4 }}>Cuotas pendientes</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-warning-500)' }}>{stats.pendingPayments}</div>
          </Card>
          <Card className="p-4">
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 4 }}>Cuotas vencidas</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-danger-500)' }}>{stats.overduePayments}</div>
          </Card>
          <Card className="p-4">
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 4 }}>Ingresos registrados</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-success-700)' }}>S/ {stats.totalPaid.toFixed(2)}</div>
          </Card>
          {rePending.length > 0 && (
            <Card style={{ background: 'var(--color-warning-50)', borderColor: 'var(--color-warning-500)' }}>
              <strong style={{ color: 'var(--color-warning-700)' }}>⚠️ {rePending.length} alumno(s) del período anterior sin matrícula activa:</strong>
              <div style={{ fontSize: 'var(--text-sm)', marginTop: 6 }}>{rePending.slice(0, 8).map((r) => r.name).join(' · ')}{rePending.length > 8 && ' …'}</div>
            </Card>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Select label="Período" value={activePeriod} onChange={(e) => setActivePeriod(e.target.value)} style={{ minWidth: 200 }}
          options={[{ value: '', label: 'Todos los períodos' }, ...periods.map((p: any) => ({ value: p.id, label: p.name }))]} />
        <Input placeholder="Buscar alumno..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        <Button onClick={() => setShowWizard(true)}><PlusIcon style={{ width: 16, height: 16 }} /> Nueva matrícula</Button>
        <Button variant="success" onClick={handleExport}><ArrowDownTrayIcon style={{ width: 16, height: 16 }} /> Exportar</Button>
      </div>

      <Card className="p-0">
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr><th>Alumno</th><th>Sección</th><th>Turno</th><th>Plan</th><th>Estado</th><th>Fecha</th><th></th></tr>
            </thead>
            <tbody>
              {paginatedEnrollments.map((e) => (
                <tr key={e.id}>
                  <td>
                    <strong>{e.student.lastName}, {e.student.firstName}</strong>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{e.student.dni}</div>
                  </td>
                  <td>{e.section.name}<br /><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{e.section.classroom.sede.name}</span></td>
                  <td><Badge color="primary">{e.section.turno.name}</Badge></td>
                  <td>{e.payments[0]?.paymentPlan?.name || '—'}</td>
                  <td><Badge color={STATUS_COLORS[e.status] || 'neutral'}>{e.status}</Badge></td>
                  <td style={{ fontSize: 'var(--text-sm)' }}>{new Date(e.enrolledAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    {e.status === 'ACTIVE' && (
                      <button onClick={() => changeStatus(e.id, 'WITHDRAWN')} className="btn btn-ghost btn-sm">Retirar</button>
                    )}
                    <button onClick={() => setDel(e)} style={{ color: 'var(--color-danger-500)', marginLeft: 4 }}><TrashIcon style={{ width: 16, height: 16 }} /></button>
                    <select className="select" style={{ width: 'auto', padding: '4px 8px', fontSize: 'var(--text-xs)' }} value={e.status}
                      onChange={async (ev) => { await enrollmentService.updateStatus(e.id, ev.target.value); loadEnrollments(activePeriod); }}>
                      <option value="ACTIVE">Activa</option><option value="TRANSFERRED">Trasladado</option><option value="WITHDRAWN">Retirado</option>
                    </select>
                  </td>
                </tr>
              ))}
              {enrollments.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--color-neutral-400)' }}>Sin matrículas</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={enrollments.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </Card>

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
        title="Eliminar matrícula" message={`¿Eliminar la matrícula de ${del?.student?.firstName} ${del?.student?.lastName}? (Solo si no tiene pagos registrados)`}
        isLoading={saving} />
      <EnrollmentWizard isOpen={showWizard} onClose={() => setShowWizard(false)} onDone={() => loadEnrollments(activePeriod)} />
    </div>
  );
};