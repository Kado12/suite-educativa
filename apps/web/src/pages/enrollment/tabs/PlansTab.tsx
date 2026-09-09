import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, TrashIcon, PencilIcon, CurrencyDollarIcon, 
  CheckCircleIcon, PowerIcon, CreditCardIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Input, Modal, ConfirmModal, Badge } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { academicService } from '../../../api/academic.service';

export const PlansTab: React.FC = () => {
  const { success, error } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', installments: '1', amount: '' });
  const [del, setDel] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => academicService.listPaymentPlans(true).then(setPlans);
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', installments: '1', amount: '' });
    setShowForm(true);
  };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ name: p.name, installments: String(p.installments), amount: String(p.amount) });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const data = { name: form.name, installments: parseInt(form.installments), amount: parseFloat(form.amount) };
      if (editing) await academicService.updatePaymentPlan(editing.id, data);
      else await academicService.createPaymentPlan(data);
      success(editing ? '✅ Plan actualizado' : '✅ Plan creado');
      setShowForm(false); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (p: any) => {
    try { 
      await academicService.updatePaymentPlan(p.id, { isActive: !p.isActive }); 
      success(p.isActive ? '✅ Plan desactivado' : '✅ Plan activado');
      load(); 
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    }
  };

  const handleDelete = async () => {
    if (!del) return; setSaving(true);
    try { 
      await academicService.deletePaymentPlan(del.id); 
      success('✅ Plan eliminado'); 
      setDel(null); 
      load(); 
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={openCreate} icon={<PlusIcon />}>
          Nuevo plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-neutral-400)' }}>
            <CreditCardIcon style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>
              Sin planes de pago
            </div>
            <div style={{ fontSize: 'var(--text-sm)' }}>
              Crea el primer plan para comenzar a matricular
            </div>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {plans.map((p) => (
            <Card 
              key={p.id} 
              className="card-elevated"
              style={{ 
                opacity: p.isActive ? 1 : 0.6,
                transition: 'all 0.2s',
                border: p.isActive ? '1px solid var(--color-success-200)' : '1px solid var(--color-neutral-200)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: p.isActive 
                      ? 'linear-gradient(135deg, var(--color-success-50) 0%, var(--color-success-100) 100%)'
                      : 'var(--color-neutral-100)',
                    color: p.isActive ? 'var(--color-success-600)' : 'var(--color-neutral-500)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <CurrencyDollarIcon style={{ width: 22, height: 22 }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
                      {p.name}
                    </h3>
                    <Badge color={p.isActive ? 'success' : 'neutral'}>
                      {p.isActive ? <><CheckCircleIcon style={{ width: 12, height: 12, marginRight: 4 }} /> Activo</> : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button 
                    onClick={() => openEdit(p)} 
                    className="btn btn-ghost btn-icon"
                    style={{ color: 'var(--color-success-500)' }}
                    title="Editar"
                  >
                    <PencilIcon style={{ width: 16, height: 16 }} />
                  </button>
                  <button 
                    onClick={() => setDel(p)} 
                    className="btn btn-ghost btn-icon"
                    style={{ color: 'var(--color-danger-600)' }}
                    title="Eliminar"
                  >
                    <TrashIcon style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>

              <div style={{ 
                padding: '16px 0', 
                margin: '12px 0',
                borderTop: '1px solid var(--color-neutral-200)',
                borderBottom: '1px solid var(--color-neutral-200)'
              }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Monto total
                </div>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-primary-600)' }}>
                  S/ {Number(p.amount).toFixed(2)}
                </div>
              </div>

              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>N° de cuotas:</span>
                  <strong>{p.installments} {p.installments === 1 ? 'cuota' : 'cuotas'}</strong>
                </div>
                {p.installments > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Monto por cuota:</span>
                    <strong>S/ {(Number(p.amount) / p.installments).toFixed(2)}</strong>
                  </div>
                )}
              </div>

              <Button
                variant={p.isActive ? 'ghost' : 'success'}
                onClick={() => toggleActive(p)}
                icon={<PowerIcon />}
                style={{ width: '100%' }}
              >
                {p.isActive ? 'Desactivar' : 'Activar'}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Editar plan' : 'Nuevo plan'}>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input 
            label="Nombre del plan" 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
            placeholder="Ej: Mensual · 2026-II" 
            required
            icon={<CreditCardIcon />}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input 
              label="Monto total" 
              type="number" 
              step="0.01" 
              value={form.amount} 
              onChange={(e) => setForm({ ...form, amount: e.target.value })} 
              required
              icon={<CurrencyDollarIcon />}
              placeholder="0.00"
            />
            <Input 
              label="N° de cuotas" 
              type="number" 
              min={1} 
              max={12} 
              value={form.installments} 
              onChange={(e) => setForm({ ...form, installments: e.target.value })} 
              required
              icon={<CreditCardIcon />}
            />
          </div>
          {form.amount && form.installments && parseInt(form.installments) > 0 && (
            <div style={{ 
              padding: 12, 
              background: 'var(--color-info-50)',
              border: '1px solid var(--color-info-200)',
              borderRadius: 8,
              fontSize: 'var(--text-sm)',
              color: 'var(--color-info-700)'
            }}>
              <strong>Vista previa:</strong> {form.installments} {parseInt(form.installments) === 1 ? 'cuota' : 'cuotas'} de{' '}
              <strong>S/ {(parseFloat(form.amount) / parseInt(form.installments)).toFixed(2)}</strong> c/u
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" isLoading={saving} loadingText="Guardando...">
              {editing ? 'Guardar cambios' : 'Crear plan'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={!!del} 
        onClose={() => setDel(null)} 
        onConfirm={handleDelete}
        title="Eliminar plan" 
        message={`¿Eliminar el plan "${del?.name}"?\n\nNo se puede eliminar si tiene pagos asociados.`}
        isLoading={saving} 
      />
    </div>
  );
};