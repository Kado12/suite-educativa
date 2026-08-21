import React, { useState, useEffect } from 'react';
import { CheckIcon, ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, Badge } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { paymentsService } from '../../../api/payments.service';
import { academicService } from '../../../api/academic.service';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  PAID: 'success',
  PENDING: 'warning',
  OVERDUE: 'danger',
};

export const PaymentsTab: React.FC = () => {
  const { success, error } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [activePeriod, setActivePeriod] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [payModal, setPayModal] = useState<any | null>(null);
  const [payData, setPayData] = useState({ paidAmount: '', paidDate: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [p, stats] = await Promise.all([
      academicService.listPeriods(),
      paymentsService.stats(activePeriod || undefined),
    ]);
    setPeriods(p);
    setStats(stats);
    if (!activePeriod) {
      const current = p.find((x: any) => x.isActive);
      if (current) setActivePeriod(current.id);
    }
    loadPayments(activePeriod || p.find((x: any) => x.isActive)?.id);
  };

  const loadPayments = (periodId?: string) => {
    paymentsService.list({
      periodId,
      status: statusFilter || undefined,
      studentSearch: search || undefined,
    }).then(setPayments);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (activePeriod) {
      loadPayments(activePeriod);
      paymentsService.stats(activePeriod).then(setStats);
    }
  }, [activePeriod]);
  useEffect(() => { loadPayments(activePeriod || undefined); }, [statusFilter]);
  useEffect(() => {
    const t = setTimeout(() => loadPayments(activePeriod || undefined), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await paymentsService.markPaid(payModal.id, {
        paidAmount: payData.paidAmount ? parseFloat(payData.paidAmount) : undefined,
        paidDate: payData.paidDate,
      });
      success('Pago registrado');
      setPayModal(null);
      setPayData({ paidAmount: '', paidDate: new Date().toISOString().split('T')[0] });
      loadPayments(activePeriod);
      paymentsService.stats(activePeriod).then(setStats);
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const markOverdue = async (id: string) => {
    try { await paymentsService.markOverdue(id); loadPayments(activePeriod); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
  };

  const resetPayment = async (id: string) => {
    try { await paymentsService.reset(id); loadPayments(activePeriod); paymentsService.stats(activePeriod).then(setStats); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <Card className="p-4">
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 4 }}>Por cobrar</div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-warning-700)' }}>
              S/ {stats.pending.amount.toFixed(2)}
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 400, marginLeft: 4 }}>({stats.pending.count} cuotas)</span>
            </div>
          </Card>
          <Card className="p-4">
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 4 }}>Cobrado</div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-success-700)' }}>
              S/ {stats.paid.amount.toFixed(2)}
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 400, marginLeft: 4 }}>({stats.paid.count} cuotas)</span>
            </div>
          </Card>
          <Card className="p-4">
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 4 }}>Vencido</div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-danger-700)' }}>
              S/ {stats.overdue.amount.toFixed(2)}
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 400, marginLeft: 4 }}>({stats.overdue.count} cuotas)</span>
            </div>
          </Card>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Select label="Período" value={activePeriod} onChange={(e) => setActivePeriod(e.target.value)} style={{ minWidth: 180 }}
          options={[{ value: '', label: 'Todos' }, ...periods.map((p: any) => ({ value: p.id, label: p.name }))]} />
        <Select label="Estado" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ minWidth: 160 }}
          options={[
            { value: '', label: 'Todos' },
            { value: 'PENDING', label: 'Pendientes' },
            { value: 'PAID', label: 'Pagados' },
            { value: 'OVERDUE', label: 'Vencidos' },
          ]} />
        <Input placeholder="Buscar alumno..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
      </div>

      <Card className="p-0">
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr><th>Alumno</th><th>Cuota</th><th>Monto</th><th>Vence</th><th>Estado</th><th>Pagado</th><th></th></tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.enrollment.student.lastName}, {p.enrollment.student.firstName}</strong>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                      {p.enrollment.section.name} · {p.enrollment.period.name}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Badge color="neutral">{p.installment}/{p.paymentPlan?.installments || '?'}</Badge>
                  </td>
                  <td style={{ fontWeight: 600 }}>S/ {Number(p.amount).toFixed(2)}</td>
                  <td style={{ fontSize: 'var(--text-sm)' }}>{new Date(p.dueDate).toLocaleDateString()}</td>
                  <td><Badge color={STATUS_COLORS[p.status] || 'neutral'}>{p.status}</Badge></td>
                  <td style={{ fontSize: 'var(--text-sm)' }}>
                    {p.status === 'PAID' ? (
                      <span>
                        S/ {Number(p.paidAmount).toFixed(2)} <br />
                        <span style={{ color: 'var(--color-neutral-500)' }}>{p.paidDate ? new Date(p.paidDate).toLocaleDateString() : ''}</span>
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {p.status === 'PENDING' && (
                      <>
                        <Button size="sm" variant="success" onClick={() => { setPayModal(p); setPayData({ paidAmount: String(Number(p.amount)), paidDate: new Date().toISOString().split('T')[0] }); }}>
                          <CheckIcon style={{ width: 14, height: 14 }} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => markOverdue(p.id)} style={{ marginLeft: 4 }}>
                          <ExclamationCircleIcon style={{ width: 14, height: 14 }} />
                        </Button>
                      </>
                    )}
                    {p.status === 'PAID' && (
                      <Button size="sm" variant="ghost" onClick={() => resetPayment(p.id)}>
                        <ArrowPathIcon style={{ width: 14, height: 14 }} />
                      </Button>
                    )}
                    {p.status === 'OVERDUE' && (
                      <Button size="sm" variant="success" onClick={() => { setPayModal(p); setPayData({ paidAmount: String(Number(p.amount)), paidDate: new Date().toISOString().split('T')[0] }); }}>
                        <CheckIcon style={{ width: 14, height: 14 }} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--color-neutral-400)' }}>Sin pagos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={!!payModal} onClose={() => setPayModal(null)} title="Registrar pago">
        {payModal && (
          <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--color-neutral-50)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 'var(--text-sm)' }}>
                <strong>{payModal.enrollment.student.firstName} {payModal.enrollment.student.lastName}</strong>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 4 }}>
                Cuota {payModal.installment} de {payModal.paymentPlan?.installments} · Monto: S/ {Number(payModal.amount).toFixed(2)}
              </div>
            </div>
            <Input label="Monto pagado" type="number" step="0.01" value={payData.paidAmount}
              onChange={(e) => setPayData({ ...payData, paidAmount: e.target.value })} required />
            <Input label="Fecha de pago" type="date" value={payData.paidDate}
              onChange={(e) => setPayData({ ...payData, paidDate: e.target.value })} required />
            <Button type="submit" isLoading={saving}>Confirmar pago</Button>
          </form>
        )}
      </Modal>
    </div>
  );
};