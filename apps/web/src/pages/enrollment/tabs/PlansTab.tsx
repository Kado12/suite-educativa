import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Modal, ConfirmModal } from '@suite/ui';
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
      success(editing ? 'Plan actualizado' : 'Plan creado');
      setShowForm(false); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (p: any) => {
    try { await academicService.updatePaymentPlan(p.id, { isActive: !p.isActive }); load(); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async () => {
    if (!del) return; setSaving(true);
    try { await academicService.deletePaymentPlan(del.id); success('Eliminado'); setDel(null); load(); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={openCreate}><PlusIcon style={{ width: 16, height: 16 }} /> Nuevo plan</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {plans.map((p) => (
          <Card key={p.id} style={{ opacity: p.isActive ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0 }}>{p.name}</h3>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => openEdit(p)} style={{ color: 'var(--color-primary-600)' }}><PencilIcon style={{ width: 16, height: 16 }} /></button>
                <button onClick={() => setDel(p)} style={{ color: 'var(--color-danger-500)' }}><TrashIcon style={{ width: 16, height: 16 }} /></button>
              </div>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-primary-600)', margin: '12px 0' }}>
              S/ {Number(p.amount).toFixed(2)}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
              {p.installments} {p.installments === 1 ? 'cuota' : 'cuotas'}
              {p.installments > 1 && <span> · S/ {(Number(p.amount) / p.installments).toFixed(2)} c/u</span>}
            </div>
            <button onClick={() => toggleActive(p)} className={`btn ${p.isActive ? 'btn-ghost' : 'btn-success'} btn-sm`} style={{ marginTop: 12, width: '100%' }}>
              {p.isActive ? 'Desactivar' : 'Activar'}
            </button>
          </Card>
        ))}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Editar plan' : 'Nuevo plan'}>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mensual · 2026" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Monto total" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <Input label="Cuotas" type="number" min={1} max={12} value={form.installments} onChange={(e) => setForm({ ...form, installments: e.target.value })} required />
          </div>
          <Button type="submit" isLoading={saving}>Guardar</Button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!del} onClose={() => setDel(null)} onConfirm={handleDelete}
        title="Eliminar plan" message={`¿Eliminar el plan "${del?.name}"? (No se puede si tiene pagos asociados)`}
        isLoading={saving} />
    </div>
  );
};