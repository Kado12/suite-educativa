import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, BookOpenIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, ConfirmModal } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { academicService } from '../../../api/academic.service';

export const AreasTab: React.FC = () => {
  const { success, error } = useToast();
  const [areas, setAreas] = useState<any[]>([]);

  // Área
  const [showArea, setShowArea] = useState(false);
  const [editingArea, setEditingArea] = useState<any | null>(null);
  const [areaName, setAreaName] = useState('');

  // Curso
  const [showCourse, setShowCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [course, setCourse] = useState({ name: '', areaId: '' });

  const [del, setDel] = useState<{ type: 'area' | 'course'; id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => academicService.listAreas().then(setAreas).catch(() => error('Error al cargar'));
  useEffect(() => { load(); }, []);

  // ===== ÁREAS =====
  const openCreateArea = () => { setEditingArea(null); setAreaName(''); setShowArea(true); };
  const openEditArea = (a: any) => { setEditingArea(a); setAreaName(a.name); setShowArea(true); };

  const saveArea = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingArea) { await academicService.updateArea(editingArea.id, areaName); success('Área actualizada'); }
      else { await academicService.createArea(areaName); success('Área creada'); }
      setShowArea(false); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  // ===== CURSOS =====
  const openCreateCourse = () => { setEditingCourse(null); setCourse({ name: '', areaId: areas[0]?.id || '' }); setShowCourse(true); };
  const openEditCourse = (c: any) => { setEditingCourse(c); setCourse({ name: c.name, areaId: c.areaId }); setShowCourse(true); };

  const saveCourse = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingCourse) { await academicService.updateCourse(editingCourse.id, course); success('Curso actualizado'); }
      else { await academicService.createCourse(course); success('Curso creado'); }
      setShowCourse(false); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!del) return; setSaving(true);
    try {
      if (del.type === 'area') await academicService.deleteArea(del.id);
      else await academicService.deleteCourse(del.id);
      success('Eliminado'); setDel(null); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="secondary" onClick={openCreateCourse}>
          <PlusIcon style={{ width: 16, height: 16 }} /> Curso
        </Button>
        <Button onClick={openCreateArea}>
          <PlusIcon style={{ width: 16, height: 16 }} /> Área
        </Button>
      </div>

      {areas.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <AcademicCapIcon style={{ width: 48, height: 48, color: 'var(--color-neutral-300)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-neutral-400)' }}>No hay áreas registradas</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {areas.map((a) => (
            <Card key={a.id} className="card-elevated">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'var(--color-primary-50)', color: 'var(--color-primary-600)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <AcademicCapIcon style={{ width: 20, height: 20 }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0 }}>{a.name}</h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: 0 }}>{a.courses.length} cursos</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button onClick={() => openEditArea(a)} className="btn btn-ghost btn-icon" title="Editar área">
                    <PencilIcon style={{ width: 14, height: 14, color: 'var(--color-success-700)' }} />
                  </button>
                  <button onClick={() => setDel({ type: 'area', id: a.id, name: a.name })} className="btn btn-ghost btn-icon" title="Eliminar área">
                    <TrashIcon style={{ width: 14, height: 14, color: 'var(--color-danger-500)' }} />
                  </button>
                </div>
              </div>

              {a.courses.length === 0 ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)', textAlign: 'center', padding: 8 }}>Sin cursos</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {a.courses.map((c: any) => (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 10px', background: 'var(--color-neutral-50)', borderRadius: 6,
                    }}>
                      <BookOpenIcon style={{ width: 14, height: 14, color: 'var(--color-neutral-500)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-800)' }}>{c.name}</span>
                      <button onClick={() => openEditCourse(c)} className="btn btn-ghost btn-icon" title="Editar curso">
                        <PencilIcon style={{ width: 13, height: 13, color: 'var(--color-success-700)'  }} />
                      </button>
                      <button onClick={() => setDel({ type: 'course', id: c.id, name: c.name })} className="btn btn-ghost btn-icon" title="Eliminar curso">
                        <TrashIcon style={{ width: 13, height: 13, color: 'var(--color-danger-500)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal Área */}
      <Modal isOpen={showArea} onClose={() => setShowArea(false)} title={editingArea ? 'Editar área' : 'Nueva área'}>
        <form onSubmit={saveArea} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Nombre del área" value={areaName} onChange={(e) => setAreaName(e.target.value)} placeholder="Ej: Matemáticas" required />
          <Button type="submit" isLoading={saving}>{editingArea ? 'Guardar cambios' : 'Crear área'}</Button>
        </form>
      </Modal>

      {/* Modal Curso */}
      <Modal isOpen={showCourse} onClose={() => setShowCourse(false)} title={editingCourse ? 'Editar curso' : 'Nuevo curso'}>
        <form onSubmit={saveCourse} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Nombre del curso" value={course.name} onChange={(e) => setCourse({ ...course, name: e.target.value })} placeholder="Ej: Álgebra" required />
          <Select label="Área" value={course.areaId} onChange={(e) => setCourse({ ...course, areaId: e.target.value })}
            options={areas.map((a) => ({ value: a.id, label: a.name }))} required />
          <Button type="submit" isLoading={saving}>{editingCourse ? 'Guardar cambios' : 'Crear curso'}</Button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!del} onClose={() => setDel(null)} onConfirm={handleDelete}
        title={`Eliminar ${del?.type === 'area' ? 'área' : 'curso'}`}
        message={`¿Eliminar "${del?.name}"? Esta acción no se puede deshacer.`}
        isLoading={saving} />
    </div>
  );
};