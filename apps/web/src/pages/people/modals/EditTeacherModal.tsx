import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@suite/ui';
import { UserIcon, PhoneIcon, EnvelopeIcon, StarIcon, BriefcaseIcon, ClockIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../../context/ToastContext';
import { peopleService } from '../../../api/people.service';

export const EditTeacherModal: React.FC<{ 
  isOpen: boolean; 
  teacher: any; 
  onClose: () => void; 
  onSaved: () => void 
}> = ({ isOpen, teacher, onClose, onSaved }) => {
  const { success, error } = useToast();
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (teacher) {
      setForm({
        firstName: teacher.firstName, 
        lastName: teacher.lastName, 
        dni: teacher.dni || '',
        phone: teacher.phone || '', 
        email: teacher.email || '',
        priority: teacher.teacherProfile?.priority ?? 5,
        yearsExperience: teacher.teacherProfile?.yearsExperience ?? 0,
        maxSessionsPerWeek: teacher.teacherProfile?.maxSessionsPerWeek ?? 20,
        maxSections: teacher.teacherProfile?.maxSections ?? 5,
      });
    }
  }, [teacher]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.firstName || !form.lastName) { 
      error('Nombres y apellidos obligatorios'); 
      return; 
    }
    setSaving(true);
    try {
      await peopleService.updateTeacherFull(teacher.teacherProfile.id, {
        firstName: form.firstName, 
        lastName: form.lastName, 
        dni: form.dni, 
        phone: form.phone, 
        email: form.email,
        priority: parseInt(form.priority) || 0,
        yearsExperience: parseInt(form.yearsExperience) || 0,
        maxSessionsPerWeek: parseInt(form.maxSessionsPerWeek) || 0,
        maxSections: parseInt(form.maxSections) || 0,
      });
      success('✅ Docente actualizado');
      onSaved(); 
      onClose();
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error al guardar'); 
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar docente" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Información personal */}
        <div>
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, color: 'var(--color-neutral-700)' }}>
            Información personal
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input 
              label="Nombres" 
              value={form.firstName || ''} 
              onChange={(e) => set('firstName', e.target.value)} 
              required
              icon={<UserIcon />}
              placeholder="Ej: Juan Carlos"
            />
            <Input 
              label="Apellidos" 
              value={form.lastName || ''} 
              onChange={(e) => set('lastName', e.target.value)} 
              required
              icon={<UserIcon />}
              placeholder="Ej: Pérez García"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <Input 
              label="Documento" 
              value={form.dni || ''} 
              onChange={(e) => set('dni', e.target.value)}
              icon={<UserIcon />}
              placeholder="8 dígitos"
            />
            <Input 
              label="Celular" 
              value={form.phone || ''} 
              onChange={(e) => set('phone', e.target.value)}
              icon={<PhoneIcon />}
              placeholder="987654321"
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <Input 
              label="Email" 
              type="email" 
              value={form.email || ''} 
              onChange={(e) => set('email', e.target.value)}
              icon={<EnvelopeIcon />}
              placeholder="docente@suite.edu"
            />
          </div>
        </div>

        {/* Configuración profesional */}
        <div>
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, color: 'var(--color-neutral-700)' }}>
            Configuración profesional
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input 
              label="Prioridad" 
              type="number" 
              min={0} 
              max={10} 
              value={form.priority ?? 5} 
              onChange={(e) => set('priority', e.target.value)}
              icon={<StarIcon />}
              hint="Mayor número = más prioridad al asignar"
            />
            <Input 
              label="Años de experiencia" 
              type="number" 
              min={0} 
              value={form.yearsExperience ?? 0} 
              onChange={(e) => set('yearsExperience', e.target.value)}
              icon={<BriefcaseIcon />}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <Input 
              label="Máx. sesiones/semana" 
              type="number" 
              min={0} 
              value={form.maxSessionsPerWeek ?? 20} 
              onChange={(e) => set('maxSessionsPerWeek', e.target.value)}
              icon={<ClockIcon />}
            />
            <Input 
              label="Máx. secciones" 
              type="number" 
              min={0} 
              value={form.maxSections ?? 5} 
              onChange={(e) => set('maxSections', e.target.value)}
              icon={<AcademicCapIcon />}
              hint="Máximo de salones que puede tener"
            />
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} isLoading={saving} loadingText="Guardando...">
            Guardar cambios
          </Button>
        </div>
      </div>
    </Modal>
  );
};