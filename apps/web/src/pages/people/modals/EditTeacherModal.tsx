import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { peopleService } from '../../../api/people.service';

export const EditTeacherModal: React.FC<{ isOpen: boolean; teacher: any; onClose: () => void; onSaved: () => void }> = ({ isOpen, teacher, onClose, onSaved }) => {
  const { success, error } = useToast();
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (teacher) {
      setForm({
        firstName: teacher.firstName, lastName: teacher.lastName, dni: teacher.dni || '',
        phone: teacher.phone || '', email: teacher.email || '',
        priority: teacher.teacherProfile?.priority ?? 5,
        yearsExperience: teacher.teacherProfile?.yearsExperience ?? 0,
        maxSessionsPerWeek: teacher.teacherProfile?.maxSessionsPerWeek ?? 20,
        maxSections: teacher.teacherProfile?.maxSections ?? 5,
      });
    }
  }, [teacher]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.firstName || !form.lastName) { error('Nombres y apellidos obligatorios'); return; }
    setSaving(true);
    try {
      await peopleService.updateTeacherFull(teacher.teacherProfile.id, {
        firstName: form.firstName, lastName: form.lastName, dni: form.dni, phone: form.phone, email: form.email,
        priority: parseInt(form.priority) || 0,
        yearsExperience: parseInt(form.yearsExperience) || 0,
        maxSessionsPerWeek: parseInt(form.maxSessionsPerWeek) || 0,
        maxSections: parseInt(form.maxSections) || 0,
      });
      success('Docente actualizado');
      onSaved(); onClose();
    } catch (err: any) { error(err.response?.data?.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Docente" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Nombres" value={form.firstName || ''} onChange={(e) => set('firstName', e.target.value)} required />
          <Input label="Apellidos" value={form.lastName || ''} onChange={(e) => set('lastName', e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Documento" value={form.dni || ''} onChange={(e) => set('dni', e.target.value)} />
          <Input label="Celular" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <Input label="Email" type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <Input label="Prioridad (mayor = primero)" type="number" min={0} max={10} value={form.priority ?? 5} onChange={(e) => set('priority', e.target.value)} />
          <Input label="Años de experiencia" type="number" min={0} value={form.yearsExperience ?? 0} onChange={(e) => set('yearsExperience', e.target.value)} />
          <Input label="Máx. sesiones/semana" type="number" min={0} value={form.maxSessionsPerWeek ?? 20} onChange={(e) => set('maxSessionsPerWeek', e.target.value)} />
          <Input label="Máx. secciones (salones)" type="number" min={0} value={form.maxSections ?? 5} onChange={(e) => set('maxSections', e.target.value)} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} isLoading={saving}>Guardar cambios</Button>
        </div>
      </div>
    </Modal>
  );
};