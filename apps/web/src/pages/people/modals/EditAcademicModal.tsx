import React, { useState, useEffect } from 'react';
import { Modal, Button, Select } from '@suite/ui';
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
    try {
      const s = await enrollmentService.suggestSection(sedeId, turnoId);
      if (s) { setSectionId(s.id); success(`Sección sugerida: ${s.name}`); }
      else error('No hay secciones con cupo');
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
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
      success('Datos académicos actualizados');
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
      success(`Plan cambiado. ${confirmRestore.paidCount} cuota(s) restaurada(s) a pendiente.`);
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
      <Modal isOpen={isOpen} onClose={onClose} title="Datos Académicos">
        <p style={{ color: 'var(--color-neutral-400)', textAlign: 'center', padding: 24 }}>
          Este alumno no tiene matrícula activa.
        </p>
      </Modal>
    );
  }

  return (
    <>
      <Modal isOpen={isOpen && !confirmRestore} onClose={onClose} title="Editar Datos Académicos" size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 12, background: 'var(--color-neutral-50)', borderRadius: 8, fontSize: 'var(--text-sm)' }}>
            <strong>Matrícula activa:</strong> {activeEnrollment.section.name} · {activeEnrollment.period.name} · inscrito {new Date(activeEnrollment.enrolledAt).toLocaleDateString()}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select label="Sede" value={sedeId} onChange={(e) => { setSedeId(e.target.value); setSectionId(''); }}
              options={sedes.map((s) => ({ value: s.id, label: s.name }))} />
            <Select label="Turno" value={turnoId} onChange={(e) => { setTurnoId(e.target.value); setSectionId(''); }}
              options={turnos.map((t) => ({ value: t.id, label: t.name }))} />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Select label="Sección" value={sectionId} onChange={(e) => setSectionId(e.target.value)}
                options={[{ value: '', label: 'Seleccionar' }, ...sections.map((s) => ({ value: s.id, label: `${s.name} (cupo ${s.capacity})` }))]} />
            </div>
            <Button variant="secondary" onClick={autoAssign}>Auto-asignar</Button>
          </div>

          <Select label="Plan de pago" value={planId} onChange={(e) => setPlanId(e.target.value)}
            options={plans.map((p) => ({ value: p.id, label: `${p.name} — S/ ${Number(p.amount).toFixed(2)} en ${p.installments} cuota(s)` }))} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} isLoading={saving}>Guardar cambios</Button>
            <Button
              variant="secondary"
              onClick={async () => {
                try { await pdfService.downloadStudentRecord(student.id, student.dni); }
                catch { error('Error al generar PDF'); }
              }}
            >
              Descargar ficha PDF
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación para restaurar pagos */}
      <Modal isOpen={!!confirmRestore} onClose={() => setConfirmRestore(null)} title="Confirmar cambio de plan">
        <div style={{ padding: 16, background: 'var(--color-warning-50)', borderRadius: 8, marginBottom: 16 }}>
          <p style={{ fontSize: 'var(--text-sm)', margin: 0 }}>
            ⚠️ Este alumno tiene <strong>{confirmRestore?.paidCount} cuota(s) pagada(s)</strong>.
          </p>
          <p style={{ fontSize: 'var(--text-sm)', marginTop: 8, marginBottom: 0 }}>
            Al cambiar de plan, todas las cuotas se restaurarán a <strong>pendiente</strong> y se generarán nuevas con el plan seleccionado.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="secondary" onClick={() => setConfirmRestore(null)}>Cancelar</Button>
          <Button variant="danger" onClick={confirmChangePlan} isLoading={saving}>Confirmar cambio</Button>
        </div>
      </Modal>
    </>
  );
};