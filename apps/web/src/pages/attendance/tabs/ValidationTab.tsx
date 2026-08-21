import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Modal, Badge } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { validationsService } from '../../../api/validations.service';
import { academicService } from '../../../api/academic.service';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'neutral'> = {
  VALIDATED: 'success',
  OBSERVED: 'warning',
  PENDING: 'neutral',
};

export const ValidationTab: React.FC = () => {
  const { success, error } = useToast();
  const { can } = useAuth();
  const canValidate = can('attendance.validate');

  const [periods, setPeriods] = useState<any[]>([]);
  const [periodId, setPeriodId] = useState('');
  const [week, setWeek] = useState('1');
  const [rows, setRows] = useState<any[]>([]);
  const [observe, setObserve] = useState<any | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    academicService.listPeriods().then((p) => {
      setPeriods(p);
      const current = p.find((x: any) => x.isActive);
      if (current) setPeriodId(current.id);
    });
  }, []);

  useEffect(() => {
    if (periodId) validationsService.getWeekStatus(periodId, parseInt(week)).then(setRows);
  }, [periodId, week]);

  const handleValidate = async (row: any) => {
    setSaving(true);
    try {
      await validationsService.setStatus({ teacherProfileId: row.teacher.id, periodId, weekNumber: parseInt(week), status: 'VALIDATED' });
      success(`✅ Semana de ${row.teacher.lastName} validada`);
      validationsService.getWeekStatus(periodId, parseInt(week)).then(setRows);
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleObserve = async () => {
    if (!comment.trim()) { error('Escribe el motivo'); return; }
    setSaving(true);
    try {
      await validationsService.setStatus({ teacherProfileId: observe.teacher.id, periodId, weekNumber: parseInt(week), status: 'OBSERVED', comment });
      success('Observación registrada');
      setObserve(null); setComment('');
      validationsService.getWeekStatus(periodId, parseInt(week)).then(setRows);
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const validated = rows.filter((r) => r.validation?.status === 'VALIDATED').length;
  const observed = rows.filter((r) => r.validation?.status === 'OBSERVED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Select label="Período" value={periodId} onChange={(e) => setPeriodId(e.target.value)} style={{ minWidth: 160 }}
            options={periods.map((p) => ({ value: p.id, label: p.name }))} />
          <Select label="Semana" value={week} onChange={(e) => setWeek(e.target.value)} style={{ minWidth: 140 }}
            options={Array.from({ length: periods.find((p) => p.id === periodId)?.weeks || 12 }, (_, i) => ({ value: String(i + 1), label: `Semana ${i + 1}` }))} />
          <div style={{ display: 'flex', gap: 12, fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--color-success-700)' }}>✅ {validated}</span>
            <span style={{ color: 'var(--color-warning-700)' }}>⚠️ {observed}</span>
            <span style={{ color: 'var(--color-neutral-500)' }}>⏳ {rows.length - validated - observed}</span>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead><tr><th>Docente</th><th>Horas</th><th>Asist.</th><th>Faltas</th><th>Tard.</th><th>Estado</th>{canValidate && <th></th>}</tr></thead>
            <tbody>
              {rows.map((row) => {
                const status = row.validation?.status || 'PENDING';
                return (
                  <tr key={row.teacher.id}>
                    <td>
                      <strong>{row.teacher.lastName}, {row.teacher.firstName}</strong>
                      {status === 'OBSERVED' && row.validation?.comment && (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning-700)' }}>💬 {row.validation.comment}</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--color-primary-600)' }}>{row.stats.hours}</td>
                    <td style={{ textAlign: 'center', color: 'var(--color-success-700)' }}>{row.stats.presents}</td>
                    <td style={{ textAlign: 'center', color: 'var(--color-danger-700)' }}>{row.stats.absents}</td>
                    <td style={{ textAlign: 'center', color: 'var(--color-warning-700)' }}>{row.stats.lateMinutes}</td>
                    <td><Badge color={STATUS_COLORS[status] || 'neutral'}>{status === 'VALIDATED' ? 'Validada' : status === 'OBSERVED' ? 'Observada' : 'Pendiente'}</Badge></td>
                    {canValidate && (
                      <td style={{ textAlign: 'right' }}>
                        <Button size="sm" variant="success" onClick={() => handleValidate(row)} isLoading={saving}>✓ Validar</Button>
                        <Button size="sm" variant="secondary" style={{ marginLeft: 4 }} onClick={() => { setObserve(row); setComment(row.validation?.comment || ''); }}>⚠ Observar</Button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--color-neutral-400)' }}>Sin docentes con sesiones esta semana</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={!!observe} onClose={() => setObserve(null)} title={`Observación: ${observe?.teacher.lastName}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="textarea"
            placeholder="Motivo de la observación..." />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setObserve(null)}>Cancelar</Button>
            <Button onClick={handleObserve} isLoading={saving}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};