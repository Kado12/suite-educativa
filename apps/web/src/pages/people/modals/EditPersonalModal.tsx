import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select } from '@suite/ui';
import { PhotoIcon } from '@heroicons/react/24/outline';
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
        firstName: student.firstName, lastName: student.lastName,
        docType: student.docType || 'DNI', dni: student.dni || '',
        phone: student.phone || '', email: student.email || '',
        birthDate: student.birthDate ? student.birthDate.split('T')[0] : '',
        gender: student.gender || '', address: student.address || '',
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
    if (!form.firstName || !form.lastName) { error('Nombres y apellidos obligatorios'); return; }
    if (form.docType === 'DNI' && !/^\d{8}$/.test(form.dni)) { error('DNI debe tener 8 dígitos'); return; }
    if (form.docType === 'CARNET' && !/^0\d{0,8}$/.test(form.dni)) { error('Carnet debe comenzar con 0'); return; }

    setSaving(true);
    try {
      // 1. Si hay foto nueva, subirla PRIMERO y obtener su URL
      let photoUrlToSend: string | undefined;
      if (pendingPhoto) {
        const { oldPublicId, newPublicId } = await peopleService.getPhotoInfo(student.id, form.dni);
        const { url } = await uploadService.replaceImage(pendingPhoto, oldPublicId, newPublicId);
        photoUrlToSend = url;
      }

      // 2. Guardar todo: datos + correo autogenerado + foto
      await peopleService.updateStudentFull(student.id, {
        ...form,
        email: autoEmail,
        ...(photoUrlToSend ? { photoUrl: photoUrlToSend } : {}),
        birthDate: form.birthDate || undefined,
      });

      success('Datos personales actualizados');
      onSaved();
      onClose();
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Datos Personales" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Foto 16:9 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 240, height: 135, borderRadius: 12, background: 'var(--color-neutral-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            border: '2px dashed var(--color-neutral-300)', flexShrink: 0,
          }}>
            {previewUrl ? (
              <img src={previewUrl} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <PhotoIcon style={{ width: 32, height: 32, color: 'var(--color-neutral-400)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>Sin foto · 16:9</span>
              </div>
            )}
          </div>
          <div>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              {previewUrl ? 'Cambiar foto' : 'Subir foto'}
              <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
            </label>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 4 }}>
              Se guarda con el N° de documento.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Nombres" value={form.firstName || ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <Input label="Apellidos" value={form.lastName || ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12 }}>
          <Select label="Tipo doc." value={form.docType || 'DNI'} onChange={(e) => setForm({ ...form, docType: e.target.value })}
            options={[{ value: 'DNI', label: 'DNI' }, { value: 'CARNET', label: 'Carnet Ext.' }]} />
          <Input label="N° de documento" value={form.dni || ''} onChange={(e) => setForm({ ...form, dni: e.target.value })} required />
        </div>

        <div>
          <label className="input-label">Correo (autogenerado)</label>
          <input className="input" value={autoEmail} readOnly style={{ background: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Celular" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Fecha de nacimiento" type="date" value={form.birthDate || ''} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
        </div>

        <Select label="Género" value={form.gender || ''} onChange={(e) => setForm({ ...form, gender: e.target.value })}
          options={[{ value: '', label: 'Seleccionar' }, { value: 'M', label: 'Masculino' }, { value: 'F', label: 'Femenino' }, { value: 'O', label: 'Otro' }]} />

        <Input label="Dirección" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} isLoading={saving}>Guardar cambios</Button>
        </div>
      </div>
    </Modal>
  );
};