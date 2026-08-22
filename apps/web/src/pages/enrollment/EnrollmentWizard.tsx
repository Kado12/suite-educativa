import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Input, Select, Modal, Badge } from '@suite/ui';
import { UserCircleIcon, AcademicCapIcon, CurrencyDollarIcon, CheckCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../context/ToastContext';
import { enrollmentService } from '../../api/enrollment.service';
import { academicService } from '../../api/academic.service';
import { uploadService } from '../../api/upload.service';
import { pdfService } from '../../api/pdf.service';

const initialForm = {
  firstName: '', lastName: '', docType: 'DNI', dni: '', phone: '', email: '',
  birthDate: '', gender: '', photoUrl: '',
  periodId: '', sedeId: '', turnoId: '', sectionId: '',
  paymentPlanId: '', firstPaymentPaid: false,
};

export const EnrollmentWizard: React.FC<{ isOpen: boolean; onClose: () => void; onDone: () => void }> = ({ isOpen, onClose, onDone }) => {
  const { success, error } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ ...initialForm });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [periods, setPeriods] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  const [existingStudent, setExistingStudent] = useState<any>(null);
  const [suggestedSection, setSuggestedSection] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        academicService.listPeriods(),
        academicService.listSedes(),
        academicService.listTurnos(),
        academicService.listPaymentPlans(),
      ]).then(([p, s, t, pl]) => {
        setPeriods(p.filter((x: any) => x.isActive));
        setSedes(s); setTurnos(t); setPlans(pl);
        const current = p.find((x: any) => x.isActive);
        if (current) setForm((f) => ({ ...f, periodId: current.id }));
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (form.sedeId && form.turnoId) {
      academicService.listSections(true).then((all: any[]) => {
        setSections(all.filter((s) => s.classroom.sede.id === form.sedeId && s.turnoId === form.turnoId));
      });
    }
  }, [form.sedeId, form.turnoId]);

  // Correo autogenerado: primera letra del nombre + documento
  const autoEmail = useMemo(() => {
    if (!form.firstName || !form.dni) return '';
    return `${form.firstName.charAt(0).toLowerCase()}${form.dni}@suite.edu`;
  }, [form.firstName, form.dni]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  // Verificar existencia al completar el documento
  const checkExistence = async () => {
    if (!form.dni || !form.periodId) return;
    try {
      const res = await enrollmentService.checkStudent(form.dni, form.periodId);
      setExistingStudent(res.hasActiveEnrollment ? res.student : null);
      if (res.exists && !res.hasActiveEnrollment && res.student) {
        setForm((f) => ({
          ...f,
          firstName: f.firstName || res.student.firstName,
          lastName: f.lastName || res.student.lastName,
        }));
      }
    } catch {}
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar DNI antes de subir
    if (!form.dni) {
      error('Ingresa primero el número de documento');
      return;
    }
    if (form.docType === 'DNI' && !/^\d{8}$/.test(form.dni)) {
      error('El DNI debe tener 8 dígitos antes de subir la foto');
      return;
    }
    if (form.docType === 'CARNET' && !/^0\d{0,8}$/.test(form.dni)) {
      error('Valida el número de carnet antes de subir la foto');
      return;
    }

    setUploadingPhoto(true);
    try {
      const { url } = await uploadService.uploadImage(file, form.dni);  // ← usa DNI como public_id
      set('photoUrl', url);
      success('Foto subida correctamente');
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al subir foto');
    } finally { setUploadingPhoto(false); }
  };

  const autoAssign = async () => {
    if (!form.sedeId || !form.turnoId) { error('Selecciona sede y turno'); return; }
    try {
      const s = await enrollmentService.suggestSection(form.sedeId, form.turnoId);
      setSuggestedSection(s);
      if (s) { set('sectionId', s.id); success(`Sección sugerida: ${s.name}`); }
      else error('No hay secciones con cupo disponible');
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
  };

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.firstName || !form.lastName) { error('Nombres y apellidos son obligatorios'); return false; }
      if (form.docType === 'DNI' && !/^\d{8}$/.test(form.dni)) { error('El DNI debe tener 8 dígitos'); return false; }
      if (form.docType === 'CARNET' && !/^0\d{0,8}$/.test(form.dni)) { error('El Carnet debe comenzar con 0'); return false; }
      if (existingStudent) { error('Ya existe alumno con matrícula activa en este período'); return false; }
    }
    if (step === 2) {
      if (!form.sedeId || !form.turnoId || !form.sectionId) { error('Completa sede, turno y sección'); return false; }
    }
    if (step === 3) {
      if (!form.paymentPlanId) { error('Selecciona un plan de pago'); return false; }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(3, s + 1)); };
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSaving(true);
    try {
      const result = await enrollmentService.createWizard({
        firstName: form.firstName, lastName: form.lastName, docType: form.docType, dni: form.dni,
        phone: form.phone || undefined, email: autoEmail || undefined,
        birthDate: form.birthDate || undefined, gender: form.gender || undefined, photoUrl: form.photoUrl || undefined,
        sectionId: form.sectionId, periodId: form.periodId, paymentPlanId: form.paymentPlanId,
        firstPaymentPaid: form.firstPaymentPaid,
      });
      success('✅ Matrícula creada correctamente');
      try {
        await pdfService.downloadStudentRecord(result.student.id, result.student.dni);
      } catch {}
      setForm({ ...initialForm }); setStep(1); setExistingStudent(null);
      onDone(); onClose();
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al matricular');
    } finally { setSaving(false); }
  };

  const selectedPlan = plans.find((p) => p.id === form.paymentPlanId);
  const selectedSection = sections.find((s) => s.id === form.sectionId);

  const steps = [
    { n: 1, label: 'Datos personales', icon: UserCircleIcon },
    { n: 2, label: 'Datos académicos', icon: AcademicCapIcon },
    { n: 3, label: 'Pago', icon: CurrencyDollarIcon },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Matrícula" size="lg">
      {/* Stepper */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        {steps.map((s) => (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step >= s.n ? 'var(--color-primary-600)' : 'var(--color-neutral-200)',
              color: step >= s.n ? 'white' : 'var(--color-neutral-500)', fontWeight: 700,
            }}>
              {step > s.n ? <CheckCircleIcon style={{ width: 20, height: 20 }} /> : s.n}
            </div>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: step >= s.n ? 'var(--color-neutral-900)' : 'var(--color-neutral-400)' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* PASO 1 */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Nombres" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required />
            <Input label="Apellidos" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12 }}>
            <Select label="Tipo doc." value={form.docType} onChange={(e) => set('docType', e.target.value)}
              options={[{ value: 'DNI', label: 'DNI' }, { value: 'CARNET', label: 'Carnet Ext.' }]} />
            <Input label="N° de documento" value={form.dni} onChange={(e) => set('dni', e.target.value)} onBlur={checkExistence}
              placeholder={form.docType === 'DNI' ? '8 dígitos' : 'Comienza con 0'} required />
          </div>

          {/* Preview de alumno existente con matrícula activa */}
          {existingStudent && (
            <div style={{ padding: 16, background: 'var(--color-danger-50)', border: '1px solid var(--color-danger-500)', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
              {existingStudent.photoUrl && <img src={existingStudent.photoUrl} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />}
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-danger-700)' }}>Ya existe alumno</div>
                <div style={{ fontSize: 'var(--text-sm)' }}>{existingStudent.lastName}, {existingStudent.firstName} · {existingStudent.dni}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)' }}>
                  Ya matriculado en {existingStudent.activeEnrollment?.section?.name} · {existingStudent.activeEnrollment?.period?.name}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Celular" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            <Input label="Fecha de nacimiento" type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
          </div>

          <Select label="Género" value={form.gender} onChange={(e) => set('gender', e.target.value)}
            options={[{ value: '', label: 'Seleccionar' }, { value: 'M', label: 'Masculino' }, { value: 'F', label: 'Femenino' }, { value: 'O', label: 'Otro' }]} />

          <div>
            <label className="input-label">Correo (autogenerado)</label>
            <input className="input" value={autoEmail} readOnly style={{ background: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)' }} />
          </div>
          
          {/* Foto - formato 16:9 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 240, height: 135,  // 16:9 (240/135 = 16/9)
              borderRadius: 12, background: 'var(--color-neutral-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              border: '2px dashed var(--color-neutral-300)', flexShrink: 0,
            }}>
              {form.photoUrl ? (
                <img src={form.photoUrl} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <PhotoIcon style={{ width: 32, height: 32, color: 'var(--color-neutral-400)' }} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>16:9</span>
                </div>
              )}
            </div>
            <div>
              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                {uploadingPhoto ? 'Subiendo...' : 'Subir foto (opcional)'}
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} disabled={uploadingPhoto} />
              </label>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 4 }}>
                Formato 16:9. Se guarda con el N° de documento.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PASO 2 */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Select label="Período académico" value={form.periodId} onChange={(e) => set('periodId', e.target.value)}
            options={periods.map((p) => ({ value: p.id, label: p.name }))} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select label="Sede" value={form.sedeId} onChange={(e) => { set('sedeId', e.target.value); set('sectionId', ''); }}
              options={[{ value: '', label: 'Seleccionar' }, ...sedes.map((s) => ({ value: s.id, label: s.name }))]} required />
            <Select label="Turno" value={form.turnoId} onChange={(e) => { set('turnoId', e.target.value); set('sectionId', ''); }}
              options={[{ value: '', label: 'Seleccionar' }, ...turnos.map((t) => ({ value: t.id, label: t.name }))]} required />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Select label="Sección" value={form.sectionId} onChange={(e) => set('sectionId', e.target.value)}
                options={[{ value: '', label: 'Seleccionar sección' }, ...sections.map((s) => ({ value: s.id, label: `${s.name} (cupo ${s.capacity})` }))]} required />
            </div>
            <Button variant="secondary" onClick={autoAssign}>Auto-asignar</Button>
          </div>

          {suggestedSection && (
            <div style={{ padding: 12, background: 'var(--color-info-50)', borderRadius: 8, fontSize: 'var(--text-sm)' }}>
              💡 Sección sugerida: <strong>{suggestedSection.name}</strong> · {suggestedSection.enrolled}/{suggestedSection.capacity} ocupados · prioridad {suggestedSection.priority}
            </div>
          )}

          {selectedSection && (
            <div style={{ padding: 12, background: 'var(--color-neutral-50)', borderRadius: 8, fontSize: 'var(--text-sm)' }}>
              📍 {selectedSection.name} · {selectedSection.classroom.sede.name} · {selectedSection.turno.name}
            </div>
          )}
        </div>
      )}

      {/* PASO 3 */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Select label="Plan de pago" value={form.paymentPlanId} onChange={(e) => set('paymentPlanId', e.target.value)}
            options={[{ value: '', label: 'Seleccionar plan' }, ...plans.map((p) => ({ value: p.id, label: `${p.name} — S/ ${Number(p.amount).toFixed(2)} en ${p.installments} cuota(s)` }))]} required />

          {selectedPlan && (
            <div style={{ padding: 12, background: 'var(--color-neutral-50)', borderRadius: 8, fontSize: 'var(--text-sm)' }}>
              {selectedPlan.installments} cuotas de <strong>S/ {(Number(selectedPlan.amount) / selectedPlan.installments).toFixed(2)}</strong>
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'var(--color-success-50)', borderRadius: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.firstPaymentPaid} onChange={(e) => set('firstPaymentPaid', e.target.checked)} style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>La primera cuota ya fue pagada</span>
          </label>

          {/* Resumen */}
          <Card style={{ background: 'var(--color-neutral-50)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 12 }}>Resumen</h4>
            <div style={{ fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div><strong>Alumno:</strong> {form.lastName}, {form.firstName}</div>
              <div><strong>Documento:</strong> {form.docType} {form.dni}</div>
              <div><strong>Correo:</strong> {autoEmail}</div>
              <div><strong>Sección:</strong> {selectedSection?.name || '—'}</div>
              <div><strong>Plan:</strong> {selectedPlan?.name || '—'}</div>
              <div><strong>Primera cuota:</strong> {form.firstPaymentPaid ? 'Pagada ✅' : 'Pendiente'}</div>
            </div>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-neutral-200)' }}>
        <Button variant="secondary" onClick={prev} disabled={step === 1}>Anterior</Button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          {step < 3 ? (
            <Button onClick={next}>Siguiente</Button>
          ) : (
            <Button variant="success" onClick={handleSubmit} isLoading={saving} disabled={!!existingStudent}>Confirmar matrícula</Button>
          )}
        </div>
      </div>
    </Modal>
  );
};