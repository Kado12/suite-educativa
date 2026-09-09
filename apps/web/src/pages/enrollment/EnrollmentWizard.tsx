import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Input, Select, Modal, Badge, FileInput } from '@suite/ui';
import { 
  UserCircleIcon, AcademicCapIcon, CurrencyDollarIcon, CheckCircleIcon, 
  PhotoIcon, PhoneIcon, EnvelopeIcon, CalendarIcon, MapPinIcon,
  CreditCardIcon, UserIcon, DocumentTextIcon, SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
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

  const autoEmail = useMemo(() => {
    if (!form.firstName || !form.dni) return '';
    return `${form.firstName.charAt(0).toLowerCase()}${form.dni}@suite.edu`;
  }, [form.firstName, form.dni]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

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
      const { url } = await uploadService.uploadImage(file, form.dni);
      set('photoUrl', url);
      success('✅ Foto subida correctamente');
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al subir foto');
    } finally { setUploadingPhoto(false); }
  };

  const autoAssign = async () => {
    if (!form.sedeId || !form.turnoId) { error('Selecciona sede y turno'); return; }
    try {
      const s = await enrollmentService.suggestSection(form.sedeId, form.turnoId);
      setSuggestedSection(s);
      if (s) { set('sectionId', s.id); success(`✅ Sección sugerida: ${s.name}`); }
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
  const selectedPeriod = periods.find((p) => p.id === form.periodId);

  const steps = [
    { n: 1, label: 'Datos personales', icon: UserCircleIcon, color: 'var(--color-primary-600)' },
    { n: 2, label: 'Datos académicos', icon: AcademicCapIcon, color: 'var(--color-extra-500)' },
    { n: 3, label: 'Plan de pago', icon: CurrencyDollarIcon, color: 'var(--color-warning-600)' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva matrícula" size="lg">
      {/* Stepper mejorado */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: 28,
        position: 'relative',
        padding: '0 8px'
      }}>
        {/* Línea conectora */}
        <div style={{
          position: 'absolute',
          top: 18,
          left: '10%',
          right: '10%',
          height: 2,
          background: 'var(--color-neutral-200)',
          zIndex: 0
        }}>
          <div style={{
            height: '100%',
            width: `${((step - 1) / 2) * 100}%`,
            background: 'var(--color-primary-500)',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {steps.map((s) => {
          const isActive = step === s.n;
          const isCompleted = step > s.n;
          return (
            <div key={s.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1, position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 40, 
                height: 40, 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: isCompleted 
                  ? 'var(--color-success-500)' 
                  : isActive 
                    ? s.color 
                    : 'var(--color-neutral-200)',
                color: 'white',
                fontWeight: 700,
                transition: 'all 0.3s ease',
                boxShadow: isActive ? `0 0 0 4px ${s.color}20` : 'none',
              }}>
                {isCompleted ? (
                  <CheckCircleIcon style={{ width: 22, height: 22 }} />
                ) : (
                  <s.icon style={{ width: 20, height: 20 }} />
                )}
              </div>
              <span style={{ 
                fontSize: 'var(--text-xs)', 
                fontWeight: isActive || isCompleted ? 600 : 500, 
                color: isActive || isCompleted ? 'var(--color-neutral-900)' : 'var(--color-neutral-400)',
                textAlign: 'center'
              }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* PASO 1: Datos personales */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, color: 'var(--color-neutral-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCircleIcon style={{ width: 18, height: 18, color: 'var(--color-primary-600)' }} />
              Información del alumno
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input 
                label="Nombres" 
                value={form.firstName} 
                onChange={(e) => set('firstName', e.target.value)} 
                required
                icon={<UserIcon />}
                placeholder="Ej: Juan Carlos"
              />
              <Input 
                label="Apellidos" 
                value={form.lastName} 
                onChange={(e) => set('lastName', e.target.value)} 
                required
                icon={<UserIcon />}
                placeholder="Ej: Pérez García"
              />
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, color: 'var(--color-neutral-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCircleIcon style={{ width: 18, height: 18, color: 'var(--color-primary-600)' }} />
              Documento de identidad
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12 }}>
              <Select 
                label="Tipo" 
                value={form.docType} 
                onChange={(e) => set('docType', e.target.value)}
                options={[{ value: 'DNI', label: 'DNI' }, { value: 'CARNET', label: 'Carnet Ext.' }]} 
              />
              <Input 
                label="N° de documento" 
                value={form.dni} 
                onChange={(e) => set('dni', e.target.value)} 
                onBlur={checkExistence}
                placeholder={form.docType === 'DNI' ? '8 dígitos' : 'Comienza con 0'} 
                required
                icon={<DocumentTextIcon />}
                hint="Se verificará si el alumno ya existe"
              />
            </div>

            {/* Preview de alumno existente */}
            {existingStudent && (
              <div style={{ 
                marginTop: 12,
                padding: 16, 
                background: 'var(--color-danger-50)', 
                border: '1px solid var(--color-danger-300)', 
                borderRadius: 8, 
                display: 'flex', 
                gap: 12, 
                alignItems: 'center' 
              }}>
                <ExclamationTriangleIcon style={{ width: 24, height: 24, color: 'var(--color-danger-600)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-danger-700)', marginBottom: 4 }}>
                    Ya existe matrícula activa
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)' }}>
                    {existingStudent.lastName}, {existingStudent.firstName} · {existingStudent.dni}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)', marginTop: 4 }}>
                    Ya matriculado en <strong>{existingStudent.activeEnrollment?.section?.name}</strong> · {existingStudent.activeEnrollment?.period?.name}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, color: 'var(--color-neutral-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <PhoneIcon style={{ width: 18, height: 18, color: 'var(--color-primary-600)' }} />
              Contacto
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input 
                label="Celular" 
                value={form.phone} 
                onChange={(e) => set('phone', e.target.value)}
                icon={<PhoneIcon />}
                placeholder="987654321"
              />
              <Input 
                label="Fecha de nacimiento" 
                type="date" 
                value={form.birthDate} 
                onChange={(e) => set('birthDate', e.target.value)}
                icon={<CalendarIcon />}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <Select 
                label="Género" 
                value={form.gender} 
                onChange={(e) => set('gender', e.target.value)}
                options={[{ value: '', label: 'Seleccionar' }, { value: 'M', label: 'Masculino' }, { value: 'F', label: 'Femenino' }, { value: 'O', label: 'Otro' }]} 
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <label className="input-label">Correo (autogenerado)</label>
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

          {/* Foto */}
          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, color: 'var(--color-neutral-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <PhotoIcon style={{ width: 18, height: 18, color: 'var(--color-primary-600)' }} />
              Foto del alumno (opcional)
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 180, 
                height: 180,
                borderRadius: 12, 
                background: 'var(--color-neutral-100)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                overflow: 'hidden',
                border: form.photoUrl ? '2px solid var(--color-primary-300)' : '2px dashed var(--color-neutral-300)', 
                flexShrink: 0,
              }}>
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 16, textAlign: 'center' }}>
                    <PhotoIcon style={{ width: 40, height: 40, color: 'var(--color-neutral-400)' }} />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>Sin foto</span>
                  </div>
                )}
              </div>
              <div>
                <label className="btn btn-secondary" style={{ cursor: uploadingPhoto ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <PhotoIcon style={{ width: 16, height: 16 }} />
                  {uploadingPhoto ? 'Subiendo...' : form.photoUrl ? 'Cambiar foto' : 'Subir foto'}
                  <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} disabled={uploadingPhoto} />
                </label>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 8, maxWidth: 200 }}>
                  Se guarda asociada al N° de documento.
                </p>
                {form.photoUrl && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => set('photoUrl', '')}
                    style={{ marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--color-danger-600)' }}
                  >
                    Quitar foto
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PASO 2: Datos académicos */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, color: 'var(--color-neutral-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarIcon style={{ width: 18, height: 18, color: 'var(--color-success-600)' }} />
              Período académico
            </h4>
            <Select 
              label="Período" 
              value={form.periodId} 
              onChange={(e) => set('periodId', e.target.value)}
              options={periods.map((p) => ({ value: p.id, label: p.name }))} 
              required 
            />
          </div>

          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, color: 'var(--color-neutral-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPinIcon style={{ width: 18, height: 18, color: 'var(--color-success-600)' }} />
              Ubicación académica
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select 
                label="Sede" 
                value={form.sedeId} 
                onChange={(e) => { set('sedeId', e.target.value); set('sectionId', ''); }}
                options={[{ value: '', label: 'Seleccionar sede' }, ...sedes.map((s) => ({ value: s.id, label: s.name }))]} 
                required 
              />
              <Select 
                label="Turno" 
                value={form.turnoId} 
                onChange={(e) => { set('turnoId', e.target.value); set('sectionId', ''); }}
                options={[{ value: '', label: 'Seleccionar turno' }, ...turnos.map((t) => ({ value: t.id, label: t.name }))]} 
                required 
              />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <Select 
                  label="Sección" 
                  value={form.sectionId} 
                  onChange={(e) => set('sectionId', e.target.value)}
                  options={[{ value: '', label: 'Seleccionar sección' }, ...sections.map((s) => ({ value: s.id, label: `${s.name} (cupo ${s.capacity})` }))]} 
                  required 
                />
              </div>
              <Button 
                variant="secondary" 
                onClick={autoAssign}
                icon={<SparklesIcon />}
              >
                Auto-asignar
              </Button>
            </div>

            {suggestedSection && (
              <div style={{ 
                marginTop: 12,
                padding: '10px 12px', 
                background: 'var(--color-info-50)', 
                border: '1px solid var(--color-info-200)',
                borderRadius: 8, 
                fontSize: 'var(--text-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--color-info-700)'
              }}>
                <SparklesIcon style={{ width: 16, height: 16 }} />
                <span>Sección sugerida: <strong>{suggestedSection.name}</strong></span>
              </div>
            )}

            {selectedSection && (
              <div style={{ 
                marginTop: 12,
                padding: 12, 
                background: 'var(--color-success-50)', 
                border: '1px solid var(--color-success-200)',
                borderRadius: 8, 
                fontSize: 'var(--text-sm)',
                color: 'var(--color-success-700)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <CheckCircleIcon style={{ width: 16, height: 16 }} />
                  <strong>Sección seleccionada</strong>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success-600)' }}>
                  {selectedSection.name} · {selectedSection.classroom.sede.name} · {selectedSection.turno.name}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PASO 3: Plan de pago */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, color: 'var(--color-neutral-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCardIcon style={{ width: 18, height: 18, color: 'var(--color-warning-600)' }} />
              Plan de pago
            </h4>
            <Select 
              label="Plan" 
              value={form.paymentPlanId} 
              onChange={(e) => set('paymentPlanId', e.target.value)}
              options={[{ value: '', label: 'Seleccionar plan' }, ...plans.map((p) => ({ value: p.id, label: `${p.name} — S/ ${Number(p.amount).toFixed(2)} en ${p.installments} cuota(s)` }))]} 
              required 
            />

            {selectedPlan && (
              <div style={{ 
                marginTop: 12,
                padding: 12, 
                background: 'var(--color-warning-50)', 
                border: '1px solid var(--color-warning-200)',
                borderRadius: 8, 
                fontSize: 'var(--text-sm)',
                color: 'var(--color-warning-700)'
              }}>
                <strong>Detalle del plan:</strong> {selectedPlan.installments} {selectedPlan.installments === 1 ? 'cuota' : 'cuotas'} de{' '}
                <strong>S/ {(Number(selectedPlan.amount) / selectedPlan.installments).toFixed(2)}</strong> c/u
              </div>
            )}
          </div>

          <label 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              padding: 16, 
              background: form.firstPaymentPaid ? 'var(--color-success-50)' : 'var(--color-neutral-50)', 
              border: `1px solid ${form.firstPaymentPaid ? 'var(--color-success-300)' : 'var(--color-neutral-200)'}`,
              borderRadius: 8, 
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <input 
              type="checkbox" 
              checked={form.firstPaymentPaid} 
              onChange={(e) => set('firstPaymentPaid', e.target.checked)} 
              style={{ width: 20, height: 20 }} 
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-neutral-900)' }}>
                La primera cuota ya fue pagada
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 2 }}>
                Marca si el alumno ya canceló la primera cuota al momento de matricularse
              </div>
            </div>
          </label>

          {/* Resumen */}
          <Card style={{ 
            background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-info-50) 100%)', 
            border: '1px solid var(--color-primary-200)' 
          }}>
            <h4 style={{ 
              fontSize: 'var(--text-sm)', 
              fontWeight: 700, 
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--color-primary-700)'
            }}>
              <DocumentTextIcon style={{ width: 18, height: 18 }} />
              Resumen de matrícula
            </h4>
            <div style={{ fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--color-primary-100)' }}>
                <strong style={{ color: 'var(--color-neutral-600)' }}>Alumno:</strong>
                <span style={{ color: 'var(--color-neutral-900)' }}>{form.lastName}, {form.firstName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--color-primary-100)' }}>
                <strong style={{ color: 'var(--color-neutral-600)' }}>Documento:</strong>
                <span style={{ color: 'var(--color-neutral-900)' }}>{form.docType} {form.dni}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--color-primary-100)' }}>
                <strong style={{ color: 'var(--color-neutral-600)' }}>Correo:</strong>
                <span style={{ color: 'var(--color-neutral-900)' }}>{autoEmail || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--color-primary-100)' }}>
                <strong style={{ color: 'var(--color-neutral-600)' }}>Período:</strong>
                <span style={{ color: 'var(--color-neutral-900)' }}>{selectedPeriod?.name || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--color-primary-100)' }}>
                <strong style={{ color: 'var(--color-neutral-600)' }}>Sección:</strong>
                <span style={{ color: 'var(--color-neutral-900)' }}>{selectedSection?.name || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--color-primary-100)' }}>
                <strong style={{ color: 'var(--color-neutral-600)' }}>Plan:</strong>
                <span style={{ color: 'var(--color-neutral-900)' }}>{selectedPlan?.name || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: 'var(--color-neutral-600)' }}>Primera cuota:</strong>
                <Badge color={form.firstPaymentPaid ? 'success' : 'warning'}>
                  {form.firstPaymentPaid ? '✓ Pagada' : '○ Pendiente'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-neutral-200)' }}>
        <Button variant="secondary" onClick={prev} disabled={step === 1}>
          ← Anterior
        </Button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          {step < 3 ? (
            <Button onClick={next} icon={<span style={{ fontSize: '1.2em' }}>→</span>}>
              Siguiente
            </Button>
          ) : (
            <Button 
              variant="success" 
              onClick={handleSubmit} 
              isLoading={saving} 
              loadingText="Creando matrícula..."
              disabled={!!existingStudent}
              icon={<CheckCircleIcon />}
            >
              Confirmar matrícula
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};