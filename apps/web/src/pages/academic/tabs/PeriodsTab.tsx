import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, CalendarDaysIcon, RectangleGroupIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, ConfirmModal, Badge } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { academicService } from '../../../api/academic.service';

export const PeriodsTab: React.FC = () => {
  const { success, error } = useToast();
  const [periods, setPeriods] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);

  // Período
  const [showPeriod, setShowPeriod] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<any | null>(null);
  const [period, setPeriod] = useState({ name: '', startDate: '', weeks: '12' });

  // Bloque
  const [showBlock, setShowBlock] = useState(false);
  const [editingBlock, setEditingBlock] = useState<any | null>(null);
  const [blockPeriod, setBlockPeriod] = useState('');
  const [block, setBlock] = useState({ name: '', startWeek: '1', endWeek: '6' });

  const [del, setDel] = useState<{ type: 'period' | 'block'; id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => Promise.all([
    academicService.listPeriods().then(setPeriods),
    academicService.listAreas().then(setAreas),
  ]).catch(() => error('Error al cargar'));
  useEffect(() => { load(); }, []);

  const allCourses = areas.flatMap((a) => a.courses);

  // ===== PERÍODOS =====
  const openCreatePeriod = () => { setEditingPeriod(null); setPeriod({ name: '', startDate: '', weeks: '12' }); setShowPeriod(true); };
  const openEditPeriod = (p: any) => {
    setEditingPeriod(p);
    setPeriod({ name: p.name, startDate: p.startDate.split('T')[0], weeks: String(p.weeks) });
    setShowPeriod(true);
  };

  const savePeriod = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingPeriod) {
        await academicService.updatePeriodFull(editingPeriod.id, {
          name: period.name, startDate: period.startDate, weeks: parseInt(period.weeks),
        });
        success('Período actualizado');
      } else {
        await academicService.createPeriod({ name: period.name, startDate: period.startDate, weeks: parseInt(period.weeks) });
        success('Período creado');
      }
      setShowPeriod(false); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const togglePeriod = async (p: any) => {
    try { await academicService.togglePeriod(p.id, !p.isActive); load(); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
  };

  // ===== BLOQUES =====
  const openCreateBlock = () => {
    setEditingBlock(null);
    setBlockPeriod(periods[0]?.id || '');
    setBlock({ name: '', startWeek: '1', endWeek: '6' });
    setShowBlock(true);
  };
  const openEditBlock = (b: any) => {
    setEditingBlock(b);
    setBlockPeriod(b.periodId);
    setBlock({ name: b.name, startWeek: String(b.startWeek), endWeek: String(b.endWeek) });
    setShowBlock(true);
  };

  const saveBlock = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingBlock) {
        await academicService.updateBlock(editingBlock.id, {
          name: block.name, startWeek: parseInt(block.startWeek), endWeek: parseInt(block.endWeek),
        });
        success('Bloque actualizado');
      } else {
        await academicService.createBlock({
          periodId: blockPeriod, name: block.name,
          startWeek: parseInt(block.startWeek), endWeek: parseInt(block.endWeek),
        });
        success('Bloque creado');
      }
      setShowBlock(false); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!del) return; setSaving(true);
    try {
      if (del.type === 'period') await academicService.deletePeriod(del.id);
      else await academicService.deleteBlock(del.id);
      success('Eliminado'); setDel(null); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const toggleCourse = async (blockId: string, courseId: string, present: boolean) => {
    try {
      if (present) await academicService.removeCourseFromBlock(blockId, courseId);
      else await academicService.addCourseToBlock(blockId, courseId);
      load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="secondary" onClick={openCreateBlock}>
          <PlusIcon style={{ width: 16, height: 16 }} /> Bloque
        </Button>
        <Button onClick={openCreatePeriod}>
          <PlusIcon style={{ width: 16, height: 16 }} /> Período
        </Button>
      </div>

      {periods.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <CalendarDaysIcon style={{ width: 48, height: 48, color: 'var(--color-neutral-300)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-neutral-400)' }}>No hay períodos registrados</p>
        </Card>
      ) : (
        periods.map((p) => (
          <Card key={p.id} className="card-elevated">
            {/* Header período */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: p.isActive ? 'var(--color-success-50)' : 'var(--color-neutral-100)',
                  color: p.isActive ? 'var(--color-success-500)' : 'var(--color-neutral-500)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CalendarDaysIcon style={{ width: 22, height: 22 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>{p.name}</h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
                    Inicio: {p.startDate.split('T')[0]} · {p.weeks} semanas
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge color={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'Activo' : 'Inactivo'}</Badge>
                <button onClick={() => togglePeriod(p)} className="btn btn-secondary btn-sm">
                  {p.isActive ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => openEditPeriod(p)} className="btn btn-ghost btn-icon" title="Editar período">
                  <PencilIcon style={{ width: 16, height: 16, color: 'var(--color-success-700)'  }} />
                </button>
                <button onClick={() => setDel({ type: 'period', id: p.id, name: p.name })} className="btn btn-ghost btn-icon" title="Eliminar período">
                  <TrashIcon style={{ width: 16, height: 16, color: 'var(--color-danger-500)' }} />
                </button>
              </div>
            </div>

            {/* Bloques */}
            {p.blocks.length === 0 ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)', textAlign: 'center', padding: 12 }}>Sin bloques</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {p.blocks.map((b: any) => {
                  const ids = new Set(b.blockCourses.map((bc: any) => bc.courseId));
                  return (
                    <div key={b.id} style={{
                      border: '1px solid var(--color-neutral-200)', borderRadius: 10, padding: 14,
                      background: 'var(--color-neutral-50)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <RectangleGroupIcon style={{ width: 18, height: 18, color: 'var(--color-primary-600)' }} />
                          <strong style={{ fontSize: 'var(--text-sm)' }}>{b.name}</strong>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                            (S{b.startWeek} a S{b.endWeek}) · {b.blockCourses.length} cursos
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 2 }}>
                          <button onClick={() => openEditBlock(b)} className="btn btn-ghost btn-icon" title="Editar bloque">
                            <PencilIcon style={{ width: 14, height: 14, color: 'var(--color-success-700)'  }} />
                          </button>
                          <button onClick={() => setDel({ type: 'block', id: b.id, name: b.name })} className="btn btn-ghost btn-icon" title="Eliminar bloque">
                            <TrashIcon style={{ width: 14, height: 14, color: 'var(--color-danger-500)' }} />
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {allCourses.map((c: any) => (
                          <button key={c.id} onClick={() => toggleCourse(b.id, c.id, ids.has(c.id))}
                            className={`badge ${ids.has(c.id) ? 'badge-success' : 'badge-neutral'}`}
                            style={{ cursor: 'pointer' }}>
                            {ids.has(c.id) ? '✓' : '+'} {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        ))
      )}

      {/* Modal Período */}
      <Modal isOpen={showPeriod} onClose={() => setShowPeriod(false)} title={editingPeriod ? 'Editar período' : 'Nuevo período'}>
        <form onSubmit={savePeriod} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Nombre" value={period.name} onChange={(e) => setPeriod({ ...period, name: e.target.value })} placeholder="Ej: Semestre 2026-II" required />
          <Input label="Fecha de inicio (debe ser lunes)" type="date" value={period.startDate} onChange={(e) => setPeriod({ ...period, startDate: e.target.value })} required />
          <Input label="Semanas" type="number" min={1} max={52} value={period.weeks} onChange={(e) => setPeriod({ ...period, weeks: e.target.value })} required />
          <Button type="submit" isLoading={saving}>{editingPeriod ? 'Guardar cambios' : 'Crear período'}</Button>
        </form>
      </Modal>

      {/* Modal Bloque */}
      <Modal isOpen={showBlock} onClose={() => setShowBlock(false)} title={editingBlock ? 'Editar bloque' : 'Nuevo bloque'}>
        <form onSubmit={saveBlock} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!editingBlock && (
            <Select label="Período" value={blockPeriod} onChange={(e) => setBlockPeriod(e.target.value)}
              options={periods.map((p) => ({ value: p.id, label: p.name }))} required />
          )}
          <Input label="Nombre" value={block.name} onChange={(e) => setBlock({ ...block, name: e.target.value })} placeholder="Ej: Bloque 1" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Semana inicio" type="number" min={1} value={block.startWeek} onChange={(e) => setBlock({ ...block, startWeek: e.target.value })} required />
            <Input label="Semana fin" type="number" min={1} value={block.endWeek} onChange={(e) => setBlock({ ...block, endWeek: e.target.value })} required />
          </div>
          <Button type="submit" isLoading={saving}>{editingBlock ? 'Guardar cambios' : 'Crear bloque'}</Button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!del} onClose={() => setDel(null)} onConfirm={handleDelete}
        title={`Eliminar ${del?.type === 'period' ? 'período' : 'bloque'}`}
        message={`¿Eliminar "${del?.name}"? Esta acción no se puede deshacer.`}
        isLoading={saving} />
    </div>
  );
};