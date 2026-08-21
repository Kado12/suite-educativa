import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, ConfirmModal } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { academicService } from '../../../api/academic.service';

export const AreasTab: React.FC = () => {
  const { success, error } = useToast();
  const [areas, setAreas] = useState<any[]>([]);
  const [showArea, setShowArea] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [showCourse, setShowCourse] = useState(false);
  const [course, setCourse] = useState({ name: '', areaId: '' });
  const [del, setDel] = useState<{ type: 'area' | 'course'; id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => academicService.listAreas().then(setAreas).catch(() => error('Error al cargar'));
  useEffect(() => { load(); }, []);

  const saveArea = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await academicService.createArea(areaName); success('Área creada'); setShowArea(false); setAreaName(''); load(); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
  };
  const saveCourse = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await academicService.createCourse(course); success('Curso creado'); setShowCourse(false); setCourse({ name: '', areaId: '' }); load(); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!del) return; setSaving(true);
    try {
      if (del.type === 'area') await academicService.deleteArea(del.id); else await academicService.deleteCourse(del.id);
      success('Eliminado'); setDel(null); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={() => setShowCourse(true)}><PlusIcon style={{ width: 16, height: 16 }} /> Curso</Button>
        <Button onClick={() => setShowArea(true)}><PlusIcon style={{ width: 16, height: 16 }} /> Área</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {areas.map((a) => (
          <Card key={a.id}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">📚 {a.name}</h3>
              <button onClick={() => setDel({ type: 'area', id: a.id, name: a.name })} style={{ color: 'var(--color-danger-500)' }}><TrashIcon style={{ width: 16, height: 16 }} /></button>
            </div>
            {a.courses.length === 0 ? (
              <p style={{ color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)' }}>Sin cursos</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {a.courses.map((c: any) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-neutral-50)', borderRadius: 8, padding: '8px 12px' }}>
                    <span style={{ fontSize: 'var(--text-sm)' }}>📘 {c.name}</span>
                    <button onClick={() => setDel({ type: 'course', id: c.id, name: c.name })} style={{ color: 'var(--color-danger-500)' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal isOpen={showArea} onClose={() => setShowArea(false)} title="Nueva Área">
        <form onSubmit={saveArea} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Nombre" value={areaName} onChange={(e) => setAreaName(e.target.value)} required />
          <Button type="submit" isLoading={saving}>Crear</Button>
        </form>
      </Modal>

      <Modal isOpen={showCourse} onClose={() => setShowCourse(false)} title="Nuevo Curso">
        <form onSubmit={saveCourse} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Nombre" value={course.name} onChange={(e) => setCourse({ ...course, name: e.target.value })} required />
          <Select label="Área" value={course.areaId} onChange={(e) => setCourse({ ...course, areaId: e.target.value })}
            options={[{ value: '', label: 'Selecciona área' }, ...areas.map((a) => ({ value: a.id, label: a.name }))]} required />
          <Button type="submit" isLoading={saving}>Crear</Button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!del} onClose={() => setDel(null)} onConfirm={handleDelete} title="Eliminar" message={`¿Eliminar "${del?.name}"?`} isLoading={saving} />
    </div>
  );
};