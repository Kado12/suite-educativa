import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, BuildingOfficeIcon, BuildingOffice2Icon, MapPinIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, ConfirmModal, Badge } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { academicService } from '../../../api/academic.service';

export const SedesTab: React.FC = () => {
  const { success, error } = useToast();
  const [sedes, setSedes] = useState<any[]>([]);

  // Sede: crear/editar
  const [showSede, setShowSede] = useState(false);
  const [editingSede, setEditingSede] = useState<any | null>(null);
  const [sedeName, setSedeName] = useState('');

  // Salón: crear/editar
  const [showSalon, setShowSalon] = useState(false);
  const [editingSalon, setEditingSalon] = useState<any | null>(null);
  const [salon, setSalon] = useState({ name: '', sedeId: '' });

  const [del, setDel] = useState<{ type: 'sede' | 'salon'; id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => academicService.listSedes().then(setSedes).catch(() => error('Error al cargar'));
  useEffect(() => { load(); }, []);

  // ===== SEDES =====
  const openCreateSede = () => { setEditingSede(null); setSedeName(''); setShowSede(true); };
  const openEditSede = (s: any) => { setEditingSede(s); setSedeName(s.name); setShowSede(true); };

  const saveSede = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingSede) { await academicService.updateSede(editingSede.id, sedeName); success('Sede actualizada'); }
      else { await academicService.createSede(sedeName); success('Sede creada'); }
      setShowSede(false); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  // ===== SALONES =====
  const openCreateSalon = () => { setEditingSalon(null); setSalon({ name: '', sedeId: sedes[0]?.id || '' }); setShowSalon(true); };
  const openEditSalon = (s: any, sedeId: string) => { setEditingSalon(s); setSalon({ name: s.name, sedeId }); setShowSalon(true); };

  const saveSalon = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingSalon) { await academicService.updateClassroom(editingSalon.id, salon); success('Salón actualizado'); }
      else { await academicService.createClassroom(salon); success('Salón creado'); }
      setShowSalon(false); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!del) return; setSaving(true);
    try {
      if (del.type === 'sede') await academicService.deleteSede(del.id);
      else await academicService.deleteClassroom(del.id);
      success('Eliminado'); setDel(null); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header acciones */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="secondary" onClick={openCreateSalon}>
          <PlusIcon style={{ width: 16, height: 16 }} /> Salón
        </Button>
        <Button onClick={openCreateSede}>
          <PlusIcon style={{ width: 16, height: 16 }} /> Sede
        </Button>
      </div>

      {sedes.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <BuildingOfficeIcon style={{ width: 48, height: 48, color: 'var(--color-neutral-300)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-neutral-400)' }}>No hay sedes registradas</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {sedes.map((s) => (
            <Card key={s.id} className="card-elevated" style={{ transition: 'transform 0.15s, box-shadow 0.15s' }}>
              {/* Header sede */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'var(--color-primary-50)', color: 'var(--color-primary-600)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <BuildingOfficeIcon style={{ width: 22, height: 22 }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>{s.name}</h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
                      {s.classrooms.length} salones · {s.classrooms.reduce((a: number, c: any) => a + c.sections.length, 0)} secciones
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openEditSede(s)} className="btn btn-ghost btn-icon" title="Editar sede">
                    <PencilIcon style={{ width: 16, height: 16, color: 'var(--color-success-700)'  }} />
                  </button>
                  <button onClick={() => setDel({ type: 'sede', id: s.id, name: s.name })} className="btn btn-ghost btn-icon" title="Eliminar sede">
                    <TrashIcon style={{ width: 16, height: 16, color: 'var(--color-danger-500)' }} />
                  </button>
                </div>
              </div>

              {/* Lista de salones */}
              {s.classrooms.length === 0 ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)', textAlign: 'center', padding: '12px 0' }}>
                  Sin salones
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {s.classrooms.map((c: any) => (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', background: 'var(--color-neutral-50)', borderRadius: 8,
                      border: '1px solid var(--color-neutral-100)',
                    }}>
                      <BuildingOffice2Icon style={{ width: 16, height: 16, color: 'var(--color-neutral-500)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-neutral-800)' }}>{c.name}</span>
                      <Badge color="primary">{c.sections.length} secciones</Badge>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button onClick={() => openEditSalon(c, s.id)} className="btn btn-ghost btn-icon" title="Editar salón">
                          <PencilIcon style={{ width: 14, height: 14, color: 'var(--color-success-700)'  }} />
                        </button>
                        <button onClick={() => setDel({ type: 'salon', id: c.id, name: c.name })} className="btn btn-ghost btn-icon" title="Eliminar salón">
                          <TrashIcon style={{ width: 14, height: 14, color: 'var(--color-danger-500)' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal Sede */}
      <Modal isOpen={showSede} onClose={() => setShowSede(false)} title={editingSede ? 'Editar sede' : 'Nueva sede'}>
        <form onSubmit={saveSede} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Nombre de la sede" value={sedeName} onChange={(e) => setSedeName(e.target.value)} placeholder="Ej: Sede Central" required />
          <Button type="submit" isLoading={saving}>{editingSede ? 'Guardar cambios' : 'Crear sede'}</Button>
        </form>
      </Modal>

      {/* Modal Salón */}
      <Modal isOpen={showSalon} onClose={() => setShowSalon(false)} title={editingSalon ? 'Editar salón' : 'Nuevo salón'}>
        <form onSubmit={saveSalon} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Nombre del salón" value={salon.name} onChange={(e) => setSalon({ ...salon, name: e.target.value })} placeholder="Ej: A11" required />
          <Select label="Sede" value={salon.sedeId} onChange={(e) => setSalon({ ...salon, sedeId: e.target.value })}
            options={sedes.map((s) => ({ value: s.id, label: s.name }))} required />
          <Button type="submit" isLoading={saving}>{editingSalon ? 'Guardar cambios' : 'Crear salón'}</Button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!del} onClose={() => setDel(null)} onConfirm={handleDelete}
        title={`Eliminar ${del?.type === 'sede' ? 'sede' : 'salón'}`}
        message={`¿Eliminar "${del?.name}"? Esta acción no se puede deshacer.`}
        isLoading={saving} />
    </div>
  );
};