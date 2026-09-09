import React, { useState, useEffect } from 'react';
import { Modal, Button, Select, Badge } from '@suite/ui';
import { 
  MapPinIcon, ClockIcon, AcademicCapIcon, CreditCardIcon,
  CalendarIcon, SparklesIcon, DocumentArrowDownIcon,
  ExclamationTriangleIcon, InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../../context/ToastContext';
import { enrollmentService } from '../../../api/enrollment.service';
import { academicService } from '../../../api/academic.service';
import { pdfService } from '../../../api/pdf.service';

interface Props {
  isOpen: boolean;
  student: any;
  onClose: () => void;
  onSaved: () => void;
}

export const EditAcademicModal: React.FC<Props> = ({ isOpen, student, onClose, onSaved }) => {
  const { success, error } = useToast();
  const [activeEnrollment, setActiveEnrollment] = useState<any>(null);
  const [sedes, setSedes] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  const [sedeId, setSedeId] = useState('');
  const [turnoId, setTurnoId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [planId, setPlanId] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState<{ paidCount: number } | null>(null);

  useEffect(() => {
    if (isOpen && student) {
      setSedeId(''); setTurnoId(''); setSectionId(''); setPlanId('');
      setActiveEnrollment(null);

      Promise.all([
        academicService.listSedes(),
        academicService.listTurnos(),
        academicService.listPaymentPlans(),
        enrollmentService.getActiveEnrollment(student.id),
      ]).then(([s, t, pl, active]) => {
        setSedes(s); setTurnos(t); setPlans(pl);
        if (active) {
          setActiveEnrollment(active);
          setSedeId(active.section.classroom.sede.id);
          setTurnoId(active.section.turno.id);
          setSectionId(active.section.id);
          setPlanId(active.payments[0]?.paymentPlan?.id || '');
        }
      });
    }
  }, [isOpen, student]);

  useEffect(() => {
    if (sedeId && turnoId) {
      academicService.listSections(true).then((all: any[]) => {
        setSections(all.filter((s) => s.classroom.sede.id === sedeId && s.turnoId === turnoId));
      });
    }
  }, [sedeId, turnoId]);

  const autoAssign = async () => {
    if (!sedeId || !turnoId) { error('Selecciona sede y turno'); return; }
    setAutoAssigning(true);
    try {
      const s = await enrollmentService.suggestSection(sedeId, turnoId);
      if (s) { 
        setSectionId(s.id); 
        success(`✅ Sección sugerida: ${s.name}`); 
      } else {
        error('No hay secciones con cupo disponible');
      }
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    } finally {
      setAutoAssigning(false);
    }
  };

  const handleSave = async () => {
    if (!activeEnrollment) { error('No hay matrícula activa'); return; }
    setSaving(true);
    try {
      // 1. Actualizar sección si cambió
      if (sectionId !== activeEnrollment.section.id) {
        await enrollmentService.updateActiveSection(student.id, sectionId);
      }
      // 2. Cambiar plan si cambió
      if (planId && planId !== activeEnrollment.payments[0]?.paymentPlan?.id) {
        const res = await enrollmentService.changePaymentPlan(activeEnrollment.id, planId, false);
        if (res.requiresConfirmation) {
          setConfirmRestore({ paidCount: res.paidCount });
          setSaving(false);
          return;
        }
      }
      success('✅ Datos académicos actualizados');
      onSaved();
      onClose();
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const confirmChangePlan = async () => {
    if (!confirmRestore) return;
    setSaving(true);
    try {
      await enrollmentService.changePaymentPlan(activeEnrollment.id, planId, true);
      success(`✅ Plan cambiado. ${confirmRestore.paidCount} cuota(s) restaurada(s) a pendiente.`);
      setConfirmRestore(null);
      onSaved();
      onClose();
    } catch (err: any) {
      error(err.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  if (!activeEnrollment) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Datos académicos">
        <div style={{ textAlign: 'center', padding: 32 }}>
          <AcademicCapIcon style={{ width: 48, height: 48, margin: '0 auto 12px', color: 'var(--color-neutral-400)', opacity: 0.3 }} />
          <p style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--text-sm)', margin: 0 }}>
            Este alumno no tiene matrícula activa.
          </p>
          <p style={{ color: 'var(--color-neutral-400)', fontSize: 'var(--text-xs)', marginTop: 8 }}>
            Matrícula al alumno desde la sección de matrículas para editar sus datos académicos.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal isOpen={isOpen && !confirmRestore} onClose={onClose} title="Editar datos académicos" size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Info de matrícula activa */}
          <div style={{ 
            padding: 16, 
            background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-info-50) 100%)', 
            borderRadius: 8, 
            border: '1px solid var(--color-primary-200)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ 
                width: 36, 
                height: 36, 
                borderRadius: 8, 
                background: 'var(--color-primary-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <InformationCircleIcon style={{ width: 20, height: 20, color: 'var(--color-primary-600)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-600)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Matrícula activa
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                  <Badge color="primary">
                    <AcademicCapIcon style={{ width: 12, height: 12, marginRight: 4 }} />
                    {activeEnrollment.section.name}
                  </Badge>
                  <Badge color="neutral">
                    <CalendarIcon style={{ width: 12, height: 12, marginRight: 4 }} />
                    {activeEnrollment.period.name}
                  </Badge>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)' }}>
                  Inscrito el <strong>{new Date(activeEnrollment.enrolledAt).toLocaleDateString()}</strong>
                  {activeEnrollment.payments.length > 0 && (
                    <>
                      {' · '}
                      Plan: <strong>{activeEnrollment.payments[0]?.paymentPlan?.name}</strong>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sección: Ubicación académica */}
          <div>
            <h4 style={{ 
              fontSize: 'var(--text-sm)', 
              fontWeight: 600, 
              marginBottom: 12, 
              color: 'var(--color-neutral-700)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <MapPinIcon style={{ width: 18, height: 18, color: 'var(--color-primary-600)' }} />
              Ubicación académica
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select 
                label="Sede" 
                value={sedeId} 
                onChange={(e) => { setSedeId(e.target.value); setSectionId(''); }}
                options={sedes.map((s) => ({ value: s.id, label: s.name }))} 
              />
              <Select 
                label="Turno" 
                value={turnoId} 
                onChange={(e) => { setTurnoId(e.target.value); setSectionId(''); }}
                options={turnos.map((t) => ({ value: t.id, label: t.name }))} 
              />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <Select 
                  label="Sección" 
                  value={sectionId} 
                  onChange={(e) => setSectionId(e.target.value)}
                  options={[
                    { value: '', label: 'Seleccionar sección' }, 
                    ...sections.map((s) => ({ 
                      value: s.id, 
                      label: `${s.name} (cupo ${s.capacity})` 
                    }))
                  ]} 
                />
              </div>
              <Button 
                variant="secondary" 
                onClick={autoAssign}
                isLoading={autoAssigning}
                loadingText="Buscando..."
                icon={<SparklesIcon />}
              >
                Auto-asignar
              </Button>
            </div>

            {sections.length === 0 && sedeId && turnoId && (
              <div style={{ 
                marginTop: 8, 
                padding: '8px 12px', 
                background: 'var(--color-warning-50)',
                border: '1px solid var(--color-warning-200)',
                borderRadius: 6,
                fontSize: 'var(--text-xs)',
                color: 'var(--color-warning-700)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <ExclamationTriangleIcon style={{ width: 14, height: 14 }} />
                No hay secciones disponibles para esta combinación de sede y turno.
              </div>
            )}
          </div>

          {/* Sección: Plan de pago */}
          <div>
            <h4 style={{ 
              fontSize: 'var(--text-sm)', 
              fontWeight: 600, 
              marginBottom: 12, 
              color: 'var(--color-neutral-700)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <CreditCardIcon style={{ width: 18, height: 18, color: 'var(--color-primary-600)' }} />
              Plan de pago
            </h4>

            <Select 
              label="Plan" 
              value={planId} 
              onChange={(e) => setPlanId(e.target.value)}
              options={plans.map((p) => ({ 
                value: p.id, 
                label: `${p.name} — S/ ${Number(p.amount).toFixed(2)} en ${p.installments} cuota(s)` 
              }))} 
            />

            {planId && planId !== activeEnrollment.payments[0]?.paymentPlan?.id && (
              <div style={{ 
                marginTop: 8, 
                padding: '8px 12px', 
                background: 'var(--color-info-50)',
                border: '1px solid var(--color-info-200)',
                borderRadius: 6,
                fontSize: 'var(--text-xs)',
                color: 'var(--color-info-700)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6
              }}>
                <InformationCircleIcon style={{ width: 14, height: 14, flexShrink: 0, marginTop: 2 }} />
                <span>
                  Al cambiar el plan, se te pedirá confirmación si hay cuotas ya pagadas.
                </span>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            gap: 8, 
            marginTop: 8,
            paddingTop: 16,
            borderTop: '1px solid var(--color-neutral-200)'
          }}>
            <Button
              variant="ghost"
              onClick={async () => {
                try { 
                  await pdfService.downloadStudentRecord(student.id, student.dni); 
                  success('✅ Ficha PDF descargada');
                } catch { 
                  error('Error al generar PDF'); 
                }
              }}
              icon={<DocumentArrowDownIcon />}
            >
              Descargar ficha
            </Button>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={onClose}>Cancelar</Button>
              <Button 
                onClick={handleSave} 
                isLoading={saving}
                loadingText="Guardando..."
              >
                Guardar cambios
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación para restaurar pagos */}
      <Modal isOpen={!!confirmRestore} onClose={() => setConfirmRestore(null)} title="Confirmar cambio de plan">
        <div style={{ 
          padding: 16, 
          background: 'var(--color-warning-50)', 
          border: '1px solid var(--color-warning-200)',
          borderRadius: 8, 
          marginBottom: 16 
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <ExclamationTriangleIcon style={{ width: 24, height: 24, color: 'var(--color-warning-600)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 'var(--text-sm)', margin: 0, fontWeight: 600, color: 'var(--color-warning-900)' }}>
                Este alumno tiene {confirmRestore?.paidCount} cuota(s) pagada(s).
              </p>
              <p style={{ fontSize: 'var(--text-sm)', marginTop: 8, marginBottom: 0, color: 'var(--color-warning-800)' }}>
                Al cambiar de plan, todas las cuotas se restaurarán a <strong>pendiente</strong> y se generarán nuevas con el plan seleccionado.
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="secondary" onClick={() => setConfirmRestore(null)}>Cancelar</Button>
          <Button 
            variant="danger" 
            onClick={confirmChangePlan} 
            isLoading={saving}
            loadingText="Confirmando..."
          >
            Confirmar cambio
          </Button>
        </div>
      </Modal>
    </>
  );
};