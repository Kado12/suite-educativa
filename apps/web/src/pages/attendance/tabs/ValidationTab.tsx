import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Modal, Badge } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { validationsService } from '../../../api/validations.service';
import { academicService } from '../../../api/academic.service';
import { 
  CheckCircleIcon, ExclamationTriangleIcon, ClockIcon,
  UserIcon, CalendarIcon, ShieldCheckIcon, ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'neutral'> = {
  VALIDATED: 'success',
  OBSERVED: 'warning',
  PENDING: 'neutral',
};

const STATUS_LABELS: Record<string, string> = {
  VALIDATED: '✓ Validada',
  OBSERVED: '⚠ Observada',
  PENDING: '○ Pendiente',
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
      success('✅ Observación registrada');
      setObserve(null); setComment('');
      validationsService.getWeekStatus(periodId, parseInt(week)).then(setRows);
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const validated = rows.filter((r) => r.validation?.status === 'VALIDATED').length;
  const observed = rows.filter((r) => r.validation?.status === 'OBSERVED').length;
  const pending = rows.length - validated - observed;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Card de filtros */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--color-warning-50) 0%, var(--color-warning-100) 100%)',
            color: 'var(--color-warning-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ShieldCheckIcon style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
              Validación de asistencias
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
              Revisa y valida las asistencias semanales de los docentes
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
          <Select 
            label="Período" 
            value={periodId} 
            onChange={(e) => setPeriodId(e.target.value)}
            options={periods.map((p) => ({ value: p.id, label: p.name }))} 
          />
          <Select 
            label="Semana" 
            value={week} 
            onChange={(e) => setWeek(e.target.value)}
            options={Array.from({ length: periods.find((p) => p.id === periodId)?.weeks || 12 }, (_, i) => ({ value: String(i + 1), label: `Semana ${i + 1}` }))} 
          />
        </div>

        {/* Stats rápidos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <div style={{ 
            padding: '12px 16px', 
            background: 'var(--color-success-50)',
            border: '1px solid var(--color-success-200)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <CheckCircleIcon style={{ width: 20, height: 20, color: 'var(--color-success-600)' }} />
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success-600)', fontWeight: 500 }}>Validadas</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-success-700)' }}>{validated}</div>
            </div>
          </div>
          <div style={{ 
            padding: '12px 16px', 
            background: 'var(--color-warning-50)',
            border: '1px solid var(--color-warning-200)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <ExclamationTriangleIcon style={{ width: 20, height: 20, color: 'var(--color-warning-600)' }} />
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning-600)', fontWeight: 500 }}>Observadas</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-warning-700)' }}>{observed}</div>
            </div>
          </div>
          <div style={{ 
            padding: '12px 16px', 
            background: 'var(--color-neutral-50)',
            border: '1px solid var(--color-neutral-200)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <ClockIcon style={{ width: 20, height: 20, color: 'var(--color-neutral-600)' }} />
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)', fontWeight: 500 }}>Pendientes</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-neutral-700)' }}>{pending}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabla de docentes */}
      <Card className="p-0">
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid var(--color-neutral-200)',
          background: 'var(--color-neutral-50)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserIcon style={{ width: 20, height: 20, color: 'var(--color-warning-600)' }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-neutral-700)' }}>
              Docentes de la semana {week}
            </span>
          </div>
        </div>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Docente</th>
                <th style={{ textAlign: 'center' }}>Horas</th>
                <th style={{ textAlign: 'center' }}>Asist.</th>
                <th style={{ textAlign: 'center' }}>Faltas</th>
                <th style={{ textAlign: 'center' }}>Tard.</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                {canValidate && <th style={{ textAlign: 'right' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={canValidate ? 7 : 6} style={{ textAlign: 'center', padding: 48, color: 'var(--color-neutral-400)' }}>
                    <CalendarIcon style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.3 }} />
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      Sin docentes con sesiones esta semana
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const status = row.validation?.status || 'PENDING';
                  return (
                    <tr key={row.teacher.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--color-warning-100) 0%, var(--color-warning-200) 100%)',
                            color: 'var(--color-warning-700)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {row.teacher.firstName[0]}{row.teacher.lastName[0]}
                          </div>
                          <div>
                            <strong style={{ color: 'var(--color-neutral-900)' }}>
                              {row.teacher.lastName}, {row.teacher.firstName}
                            </strong>
                            {status === 'OBSERVED' && row.validation?.comment && (
                              <div style={{ 
                                fontSize: 'var(--text-xs)', 
                                color: 'var(--color-warning-700)',
                                marginTop: 4,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 4
                              }}>
                                <ChatBubbleLeftIcon style={{ width: 12, height: 12, flexShrink: 0, marginTop: 2 }} />
                                <span>{row.validation.comment}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <strong style={{ color: 'var(--color-primary-600)', fontSize: 'var(--text-base)' }}>
                          {row.stats.hours}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ color: 'var(--color-success-700)', fontWeight: 600 }}>
                          {row.stats.presents}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          color: row.stats.absents > 0 ? 'var(--color-danger-700)' : 'var(--color-neutral-400)', 
                          fontWeight: row.stats.absents > 0 ? 600 : 400 
                        }}>
                          {row.stats.absents}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          color: row.stats.lateMinutes > 0 ? 'var(--color-warning-700)' : 'var(--color-neutral-400)', 
                          fontWeight: row.stats.lateMinutes > 0 ? 600 : 400 
                        }}>
                          {row.stats.lateMinutes}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge color={STATUS_COLORS[status] || 'neutral'}>
                          {STATUS_LABELS[status] || status}
                        </Badge>
                      </td>
                      {canValidate && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <Button 
                              size="sm" 
                              variant="success" 
                              onClick={() => handleValidate(row)} 
                              isLoading={saving}
                              disabled={status === 'VALIDATED'}
                              icon={<CheckCircleIcon />}
                            >
                              Validar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              onClick={() => { setObserve(row); setComment(row.validation?.comment || ''); }}
                              icon={<ExclamationTriangleIcon />}
                            >
                              Observar
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de observación */}
      <Modal isOpen={!!observe} onClose={() => setObserve(null)} title={`Observación: ${observe?.teacher.lastName}, ${observe?.teacher.firstName}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ 
            padding: 12, 
            background: 'var(--color-warning-50)',
            border: '1px solid var(--color-warning-200)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            fontSize: 'var(--text-sm)',
            color: 'var(--color-warning-700)'
          }}>
            <ExclamationTriangleIcon style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2 }} />
            <span>
              Al marcar como observada, deberás justificar el motivo. El docente será notificado.
            </span>
          </div>
          <div>
            <label className="input-label">Motivo de la observación</label>
            <textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              rows={4} 
              className="textarea"
              placeholder="Describe el motivo de la observación..."
              style={{ minHeight: 100 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setObserve(null)}>Cancelar</Button>
            <Button onClick={handleObserve} isLoading={saving} loadingText="Guardando...">
              Guardar observación
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};