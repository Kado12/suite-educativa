import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, ConfirmModal } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { academicService } from '../../../api/academic.service';

export const SedesTab: React.FC = () => {
  const { success, error } = useToast();
  const [sedes, setSedes] = useState<any[]>([]);
  const [showSede, setShowSede] = useState(false);
  const [sedeName, setSedeName] = useState('');
  const [showSalon, setShowSalon] = useState(false);
  const [salon, setSalon] = useState({ name: '', sedeId: '' });
  const [del, setDel] = useState<{ type: 'sede' | 'salon'; id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => academicService.listSedes().then(setSedes).catch(() => error('Error al cargar'));
  useEffect(() => { load(); }, []);

  const saveSede = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await academicService.createSede(sedeName); success('Sede creada'); setShowSede(false); setSedeName(''); load(); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
  };
  const saveSalon = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await academicService.createClassroom(salon); success('Salón creado'); setShowSalon(false); setSalon({ name: '', sedeId: '' }); load(); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!del) return; setSaving(true);
    try {
      if (del.type === 'sede') await academicService.deleteSede(del.id); else await academicService.deleteClassroom(del.id);
      success('Eliminado'); setDel(null); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={() => setShowSalon(true)}><PlusIcon style={{ width: 16, height: 16 }} /> Salón</Button>
        <Button onClick={() => setShowSede(true)}><PlusIcon style={{ width: 16, height: 16 }} /> Sede</Button>
      </div>

      {sedes.map((s) => (
        <Card key={s.id}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">🏫 {s.name}</h3>
            <Button variant="ghost" size="sm" onClick={() => setDel({ type: 'sede', id: s.id, name: s.name })}>
              <TrashIcon style={{ width: 16, height: 16 }} />
            </Button>
          </div>
          {s.classrooms.length === 0 ? (
            <p style={{ color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)' }}>Sin salones</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {s.classrooms.map((c: any) => (
                <span key={c.id} className="badge badge-primary" style={{ padding: '6px 12px', fontSize: 'var(--text-sm)' }}>
                  🚪 {c.name} ({c.sections.length} secciones)
                  <button onClick={() => setDel({ type: 'salon', id: c.id, name: c.name })} style={{ marginLeft: 6, color: 'var(--color-danger-500)' }}>✕</button>
                </span>
              ))}
            </div>
          )}
        </Card>
      ))}

      <Modal isOpen={showSede} onClose={() => setShowSede(false)} title="Nueva Sede">
        <form onSubmit={saveSede} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Nombre" value={sedeName} onChange={(e) => setSedeName(e.target.value)} required />
          <Button type="submit" isLoading={saving}>Crear</Button>
        </form>
      </Modal>

      <Modal isOpen={showSalon} onClose={() => setShowSalon(false)} title="Nuevo Salón">
        <form onSubmit={saveSalon} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Nombre" value={salon.name} onChange={(e) => setSalon({ ...salon, name: e.target.value })} placeholder="A11" required />
          <Select label="Sede" value={salon.sedeId} onChange={(e) => setSalon({ ...salon, sedeId: e.target.value })}
            options={[{ value: '', label: 'Selecciona sede' }, ...sedes.map((s) => ({ value: s.id, label: s.name }))]} required />
          <Button type="submit" isLoading={saving}>Crear</Button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!del} onClose={() => setDel(null)} onConfirm={handleDelete} title="Eliminar" message={`¿Eliminar "${del?.name}"?`} isLoading={saving} />
    </div>
  );
};