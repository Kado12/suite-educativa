import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckIcon, ExclamationCircleIcon, ArrowPathIcon, ArrowDownTrayIcon,
  CurrencyDollarIcon, CalendarIcon, UserIcon, DocumentTextIcon,
  CheckCircleIcon, ExclamationTriangleIcon, ClockIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, Badge, Pagination } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { paymentsService } from '../../../api/payments.service';
import { academicService } from '../../../api/academic.service';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  PAID: 'success',
  PENDING: 'warning',
  OVERDUE: 'danger',
};

const STATUS_LABELS: Record<string, string> = {
  PAID: '✓ Pagado',
  PENDING: '○ Pendiente',
  OVERDUE: '⚠ Vencido',
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
  const [payData, setPayData] = useState({ paidAmount: '', paidDate: new Date().toISOString().split('T')[0], reference: '' });
  const [saving, setSaving] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const paginatedPayments = useMemo(()=>{
    const start = (currentPage - 1) * pageSize;
    return payments.slice(start, start + pageSize);
  }, [payments, currentPage, pageSize]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, activePeriod, pageSize]);

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
        reference: payData.reference || undefined,
      });
      success('✅ Pago registrado');
      setPayModal(null);
      setPayData({ paidAmount: '', paidDate: new Date().toISOString().split('T')[0], reference: '' });
      loadPayments(activePeriod);
      paymentsService.stats(activePeriod).then(setStats);
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const markOverdue = async (id: string) => {
    try { 
      await paymentsService.markOverdue(id); 
      success('✅ Marcado como vencido');
      loadPayments(activePeriod); 
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    }
  };

  const resetPayment = async (id: string) => {
    try { 
      await paymentsService.reset(id); 
      success('✅ Pago restaurado a pendiente');
      loadPayments(activePeriod); 
      paymentsService.stats(activePeriod).then(setStats); 
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    }
  };

  const handleExport = async () => {
    try { 
      await paymentsService.exportExcel({ periodId: activePeriod, status: statusFilter, studentSearch: search }); 
      success('📥 Excel de pagos descargado'); 
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error al exportar'); 
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <Card className="p-4" style={{ background: 'var(--color-warning-50)', borderColor: 'var(--color-warning-500)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ClockIcon style={{ width: 20, height: 20, color: 'var(--color-warning-600)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning-700)', fontWeight: 500 }}>Por cobrar</span>
            </div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-warning-700)' }}>
              S/ {stats.pending.amount.toFixed(2)}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning-600)', marginTop: 4 }}>
              {stats.pending.count} cuota(s) pendiente(s)
            </div>
          </Card>
          <Card className="p-4" style={{ background: 'var(--color-success-50)', borderColor: 'var(--color-success-500)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <CheckCircleIcon style={{ width: 20, height: 20, color: 'var(--color-success-700)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success-700)', fontWeight: 500 }}>Cobrado</span>
            </div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-success-700)' }}>
              S/ {stats.paid.amount.toFixed(2)}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success-600)', marginTop: 4 }}>
              {stats.paid.count} cuota(s) pagada(s)
            </div>
          </Card>
          <Card className="p-4" style={{ background: 'var(--color-danger-50)', borderColor: 'var(--color-danger-500)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ExclamationTriangleIcon style={{ width: 20, height: 20, color: 'var(--color-danger-600)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger-700)', fontWeight: 500 }}>Vencido</span>
            </div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-danger-700)' }}>
              S/ {stats.overdue.amount.toFixed(2)}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger-600)', marginTop: 4 }}>
              {stats.overdue.count} cuota(s) vencida(s)
            </div>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
          <Select 
            label="Período" 
            value={activePeriod} 
            onChange={(e) => setActivePeriod(e.target.value)}
            options={[{ value: '', label: 'Todos los períodos' }, ...periods.map((p: any) => ({ value: p.id, label: p.name }))]} 
          />
          <Select 
            label="Estado" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'PENDING', label: 'Pendientes' },
              { value: 'PAID', label: 'Pagados' },
              { value: 'OVERDUE', label: 'Vencidos' },
            ]} 
          />
          <div style={{ gridColumn: 'span 2' }}>
            <Input
              label="Buscar alumno"
              placeholder="Buscar alumno por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<MagnifyingGlassIcon />}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="success" onClick={handleExport} icon={<ArrowDownTrayIcon />}>
            Exportar Excel
          </Button>
        </div>
        <div style={{ 
          marginTop: 12, 
          fontSize: 'var(--text-sm)', 
          color: 'var(--color-neutral-600)' 
        }}>
          Mostrando <strong>{payments.length}</strong> cuota(s)
        </div>
      </Card>

      {/* Tabla */}
      <Card className="p-0">
        {payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-neutral-400)' }}>
            <CurrencyDollarIcon style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>
              Sin pagos registrados
            </div>
          </div>
        ) : (
          <>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th style={{ textAlign: 'center' }}>Cuota</th>
                    <th>Monto</th>
                    <th>Vence</th>
                    <th style={{ textAlign: 'center' }}>Estado</th>
                    <th>Pagado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--color-success-100) 0%, var(--color-success-200) 100%)',
                            color: 'var(--color-success-700)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {p.enrollment.student.firstName[0]}{p.enrollment.student.lastName[0]}
                          </div>
                          <div>
                            <strong style={{ color: 'var(--color-neutral-900)' }}>
                              {p.enrollment.student.lastName}, {p.enrollment.student.firstName}
                            </strong>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                              {p.enrollment.section.name} · {p.enrollment.period.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge color="neutral">
                          {p.installment}/{p.paymentPlan?.installments || '?'}
                        </Badge>
                      </td>
                      <td>
                        <strong style={{ fontSize: 'var(--text-base)', color: 'var(--color-neutral-900)' }}>
                          S/ {Number(p.amount).toFixed(2)}
                        </strong>
                      </td>
                      <td style={{ fontSize: 'var(--text-sm)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CalendarIcon style={{ width: 14, height: 14, color: 'var(--color-neutral-400)' }} />
                          {new Date(p.dueDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge color={STATUS_COLORS[p.status] || 'neutral'}>
                          {STATUS_LABELS[p.status] || p.status}
                        </Badge>
                      </td>
                      <td style={{ fontSize: 'var(--text-sm)' }}>
                        {p.status === 'PAID' ? (
                          <div>
                            <strong style={{ color: 'var(--color-success-700)' }}>S/ {Number(p.paidAmount).toFixed(2)}</strong>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 2 }}>
                              {p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '—'}
                            </div>
                            {p.reference && (
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', marginTop: 2 }}>
                                Ref: {p.reference}
                              </div>
                            )}
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          {(p.status === 'PENDING' || p.status === 'OVERDUE') && (
                            <>
                              <Button 
                                size="sm" 
                                variant="success" 
                                onClick={() => { 
                                  setPayModal(p); 
                                  setPayData({ 
                                    paidAmount: String(Number(p.amount)), 
                                    paidDate: new Date().toISOString().split('T')[0], 
                                    reference: p.reference 
                                  }); 
                                }}
                                icon={<CheckIcon />}
                              >
                                Pagar
                              </Button>
                              {p.status === 'PENDING' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => markOverdue(p.id)}
                                  icon={<ExclamationCircleIcon />}
                                  style={{ color: 'var(--color-danger-600)' }}
                                >
                                  Marcar vencido
                                </Button>
                              )}
                            </>
                          )}
                          {p.status === 'PAID' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => resetPayment(p.id)}
                                icon={<ArrowPathIcon />}
                                style={{ color: 'var(--color-warning-600)' }}
                              >
                                Restaurar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                onClick={() => paymentsService.downloadReceipt(p.id)}
                                icon={<DocumentTextIcon />}
                              >
                                Recibo
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {payments.length > 0 && (
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={payments.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            )}
          </>
        )}
      </Card>

      {/* Modal de pago */}
      <Modal isOpen={!!payModal} onClose={() => setPayModal(null)} title="Registrar pago">
        {payModal && (
          <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ 
              padding: 16, 
              background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-info-50) 100%)', 
              border: '1px solid var(--color-primary-200)',
              borderRadius: 8 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--color-primary-100)',
                  color: 'var(--color-primary-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                }}>
                  {payModal.enrollment.student.firstName[0]}{payModal.enrollment.student.lastName[0]}
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                    {payModal.enrollment.student.firstName} {payModal.enrollment.student.lastName}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)' }}>
                    {payModal.enrollment.section.name} · {payModal.enrollment.period.name}
                  </div>
                </div>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                paddingTop: 8,
                borderTop: '1px solid var(--color-primary-200)',
                fontSize: 'var(--text-sm)'
              }}>
                <span style={{ color: 'var(--color-neutral-600)' }}>Cuota {payModal.installment} de {payModal.paymentPlan?.installments}</span>
                <strong style={{ color: 'var(--color-primary-700)' }}>S/ {Number(payModal.amount).toFixed(2)}</strong>
              </div>
            </div>
            <Input 
              label="Monto pagado" 
              type="number" 
              step="0.01" 
              value={payData.paidAmount}
              onChange={(e) => setPayData({ ...payData, paidAmount: e.target.value })} 
              required
              icon={<CurrencyDollarIcon />}
            />
            <Input 
              label="Fecha de pago" 
              type="date" 
              value={payData.paidDate}
              onChange={(e) => setPayData({ ...payData, paidDate: e.target.value })} 
              required
              icon={<CalendarIcon />}
            />
            <Input 
              label="Referencia / N° operación (opcional)" 
              value={payData.reference}
              onChange={(e) => setPayData({ ...payData, reference: e.target.value })}
              icon={<DocumentTextIcon />}
              placeholder="Ej: VOU123456789"
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setPayModal(null)}>Cancelar</Button>
              <Button type="submit" isLoading={saving} icon={<CheckCircleIcon />}>
                Confirmar pago
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};