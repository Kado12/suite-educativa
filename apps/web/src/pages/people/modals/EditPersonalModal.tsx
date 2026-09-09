import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select } from '@suite/ui';
import { PhotoIcon, UserIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../../context/ToastContext';
import { peopleService } from '../../../api/people.service';
import { uploadService } from '../../../api/upload.service';

interface Props {
  isOpen: boolean;
  student: any;
  onClose: () => void;
  onSaved: () => void;
}

export const EditPersonalModal: React.FC<Props> = ({ isOpen, student, onClose, onSaved }) => {
  const { success, error } = useToast();
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setForm({
        firstName: student.firstName, 
        lastName: student.lastName,
        docType: student.docType || 'DNI', 
        dni: student.dni || '',
        phone: student.phone || '', 
        email: student.email || '',
        birthDate: student.birthDate ? student.birthDate.split('T')[0] : '',
        gender: student.gender || '', 
        address: student.address || '',
      });
      setPreviewUrl(student.photoUrl || null);
      setPendingPhoto(null);
    }
  }, [student]);

  const autoEmail = form.firstName && form.dni
    ? `${form.firstName.charAt(0).toLowerCase()}${form.dni}@suite.edu`
    : '';

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName) { 
      error('Nombres y apellidos obligatorios'); 
      return; 
    }
    if (form.docType === 'DNI' && !/^\d{8}$/.test(form.dni)) { 
      error('DNI debe tener 8 dígitos'); 
      return; 
    }
    if (form.docType === 'CARNET' && !/^0\d{0,8}$/.test(form.dni)) { 
      error('Carnet debe comenzar con 0'); 
      return; 
    }

    setSaving(true);
    try {
      let photoUrlToSend: string | undefined;
      if (pendingPhoto) {
        const { oldPublicId, newPublicId } = await peopleService.getPhotoInfo(student.id, form.dni);
        const { url } = await uploadService.replaceImage(pendingPhoto, oldPublicId, newPublicId);
        photoUrlToSend = url;
      }

      await peopleService.updateStudentFull(student.id, {
        ...form,
        email: autoEmail,
        ...(photoUrlToSend ? { photoUrl: photoUrlToSend } : {}),
        birthDate: form.birthDate || undefined,
      });

      success('✅ Datos personales actualizados');
      onSaved();
      onClose();
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar datos personales" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Foto */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 200, 
            height: 200, 
            borderRadius: 12, 
            background: 'var(--color-neutral-100)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            overflow: 'hidden',
            border: '2px dashed var(--color-neutral-300)', 
            flexShrink: 0,
          }}>
            {previewUrl ? (
              <img src={previewUrl} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <PhotoIcon style={{ width: 48, height: 48, color: 'var(--color-neutral-400)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>Sin foto</span>
              </div>
            )}
          </div>
          <div>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <PhotoIcon style={{ width: 18, height: 18 }} />
              {previewUrl ? 'Cambiar foto' : 'Subir foto'}
              <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
            </label>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 8, maxWidth: 200 }}>
              La foto se guarda asociada al número de documento del alumno.
            </p>
          </div>
        </div>

        {/* Datos personales */}
        <div>
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, color: 'var(--color-neutral-700)' }}>
            Información personal
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input 
              label="Nombres" 
              value={form.firstName || ''} 
              onChange={(e) => setForm({ ...form, firstName: e.target.value })} 
              required
              icon={<UserIcon />}
              placeholder="Ej: Juan Carlos"
            />
            <Input 
              label="Apellidos" 
              value={form.lastName || ''} 
              onChange={(e) => setForm({ ...form, lastName: e.target.value })} 
              required
              icon={<UserIcon />}
              placeholder="Ej: Pérez García"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, marginTop: 12 }}>
            <Select 
              label="Tipo doc." 
              value={form.docType || 'DNI'} 
              onChange={(e) => setForm({ ...form, docType: e.target.value })}
              options={[{ value: 'DNI', label: 'DNI' }, { value: 'CARNET', label: 'Carnet Ext.' }]} 
            />
            <Input 
              label="N° de documento" 
              value={form.dni || ''} 
              onChange={(e) => setForm({ ...form, dni: e.target.value })} 
              required
              icon={<UserIcon />}
              placeholder={form.docType === 'DNI' ? '8 dígitos' : 'Comienza con 0'}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="input-label">Correo electrónico (autogenerado)</label>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              padding: '8px 12px',
              background: 'var(--color-neutral-100)',
              borderRadius: 8,
              fontSize: 'var(--text-sm)',
              color: 'var(--color-neutral-600)'
            }}>
              <EnvelopeIcon style={{ width: 16, height: 16 }} />
              {autoEmail || 'Completa nombre y DNI para generar'}
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div>
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, color: 'var(--color-neutral-700)' }}>
            Información de contacto
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input 
              label="Celular" 
              value={form.phone || ''} 
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              icon={<PhoneIcon />}
              placeholder="987654321"
            />
            <Input 
              label="Fecha de nacimiento" 
              type="date" 
              value={form.birthDate || ''} 
              onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              icon={<CalendarIcon />}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <Select 
              label="Género" 
              value={form.gender || ''} 
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              options={[
                { value: '', label: 'Seleccionar' }, 
                { value: 'M', label: 'Masculino' }, 
                { value: 'F', label: 'Femenino' }, 
                { value: 'O', label: 'Otro' }
              ]} 
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <Input 
              label="Dirección" 
              value={form.address || ''} 
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              icon={<MapPinIcon />}
              placeholder="Av. Principal 123"
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