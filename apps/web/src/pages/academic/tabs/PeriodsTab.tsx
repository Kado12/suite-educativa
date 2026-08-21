import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, ConfirmModal, Badge } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { academicService } from '../../../api/academic.service';

export const PeriodsTab: React.FC = () => {
  const { success, error } = useToast();
  const [periods, setPeriods] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [showPeriod, setShowPeriod] = useState(false);
  const [period, setPeriod] = useState({ name: '', startDate: '', weeks: '12' });
  const [showBlock, setShowBlock] = useState(false);
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

  const savePeriod = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await academicService.createPeriod({ ...period, weeks: parseInt(period.weeks) }); success('Período creado'); setShowPeriod(false); load(); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
  };
  const saveBlock = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await academicService.createBlock({ periodId: blockPeriod, name: block.name, startWeek: parseInt(block.startWeek), endWeek: parseInt(block.endWeek) }); success('Bloque creado'); setShowBlock(false); load(); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!del) return; setSaving(true);
    try {
      if (del.type === 'period') await academicService.deletePeriod(del.id); else await academicService.deleteBlock(del.id);
      success('Eliminado'); setDel(null); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
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
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={() => setShowBlock(true)}><PlusIcon style={{ width: 16, height: 16 }} /> Bloque</Button>
        <Button onClick={() => setShowPeriod(true)}><PlusIcon style={{ width: 16, height: 16 }} /> Período</Button>
      </div>

      {periods.map((p) => (
        <Card key={p.id}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="card-title">📅 {p.name}</h3>
              <p className="card-subtitle">Inicio {p.startDate.split('T')[0]} · {p.weeks} semanas</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Badge color={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'Activo' : 'Inactivo'}</Badge>
              <Button size="sm" variant="secondary" onClick={async () => { await academicService.togglePeriod(p.id, !p.isActive); load(); }}>
                {p.isActive ? 'Desactivar' : 'Activar'}
              </Button>
              <button onClick={() => setDel({ type: 'period', id: p.id, name: p.name })} style={{ color: 'var(--color-danger-500)' }}><TrashIcon style={{ width: 16, height: 16 }} /></button>
            </div>
          </div>

          {p.blocks.length === 0 ? (
            <p style={{ color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)' }}>Sin bloques</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {p.blocks.map((b: any) => {
                const ids = new Set(b.blockCourses.map((bc: any) => bc.courseId));
                return (
                  <div key={b.id} style={{ border: '1px solid var(--color-neutral-200)', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <strong style={{ fontSize: 'var(--text-sm)' }}>🧱 {b.name} <span style={{ color: 'var(--color-neutral-500)', fontWeight: 400 }}>(S{b.startWeek}-S{b.endWeek})</span></strong>
                      <button onClick={() => setDel({ type: 'block', id: b.id, name: b.name })} style={{ color: 'var(--color-danger-500)' }}><TrashIcon style={{ width: 16, height: 16 }} /></button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {allCourses.map((c: any) => (
                        <button key={c.id} onClick={() => toggleCourse(b.id, c.id, ids.has(c.id))}
                          className={`badge ${ids.has(c.id) ? 'badge-success' : 'badge-neutral'}`}>
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
      ))}

      <Modal isOpen={showPeriod} onClose={() => setShowPeriod(false)} title="Nuevo Período">
        <form onSubmit={savePeriod} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Nombre" value={period.name} onChange={(e) => setPeriod({ ...period, name: e.target.value })} placeholder="2026" required />
          <Input label="Inicio (lunes)" type="date" value={period.startDate} onChange={(e) => setPeriod({ ...period, startDate: e.target.value })} required />
          <Input label="Semanas" type="number" min={1} value={period.weeks} onChange={(e) => setPeriod({ ...period, weeks: e.target.value })} required />
          <Button type="submit" isLoading={saving}>Crear</Button>
        </form>
      </Modal>

      <Modal isOpen={showBlock} onClose={() => setShowBlock(false)} title="Nuevo Bloque">
        <form onSubmit={saveBlock} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Select label="Período" value={blockPeriod} onChange={(e) => setBlockPeriod(e.target.value)}
            options={[{ value: '', label: 'Selecciona período' }, ...periods.map((p) => ({ value: p.id, label: p.name }))]} required />
          <Input label="Nombre" value={block.name} onChange={(e) => setBlock({ ...block, name: e.target.value })} placeholder="Bloque 1" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Semana inicio" type="number" min={1} value={block.startWeek} onChange={(e) => setBlock({ ...block, startWeek: e.target.value })} required />
            <Input label="Semana fin" type="number" min={1} value={block.endWeek} onChange={(e) => setBlock({ ...block, endWeek: e.target.value })} required />
          </div>
          <Button type="submit" isLoading={saving}>Crear</Button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!del} onClose={() => setDel(null)} onConfirm={handleDelete} title="Eliminar" message={`¿Eliminar "${del?.name}"?`} isLoading={saving} />
    </div>
  );
};