import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, TrashIcon, PencilIcon, BookOpenIcon, AcademicCapIcon,
  MagnifyingGlassIcon, XCircleIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, ConfirmModal, Badge } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { academicService } from '../../../api/academic.service';

export const AreasTab: React.FC = () => {
  const { success, error } = useToast();
  const [areas, setAreas] = useState<any[]>([]);
  const [search, setSearch] = useState('');

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

  const filteredAreas = areas.filter((a) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(s) ||
      a.courses.some((c: any) => c.name.toLowerCase().includes(s))
    );
  });

  // ===== ÁREAS =====
  const openCreateArea = () => { setEditingArea(null); setAreaName(''); setShowArea(true); };
  const openEditArea = (a: any) => { setEditingArea(a); setAreaName(a.name); setShowArea(true); };

  const saveArea = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingArea) { 
        await academicService.updateArea(editingArea.id, areaName); 
        success('✅ Área actualizada'); 
      } else { 
        await academicService.createArea(areaName); 
        success('✅ Área creada'); 
      }
      setShowArea(false); load();
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    } finally { 
      setSaving(false); 
    }
  };

  // ===== CURSOS =====
  const openCreateCourse = () => { 
    setEditingCourse(null); 
    setCourse({ name: '', areaId: areas[0]?.id || '' }); 
    setShowCourse(true); 
  };
  const openEditCourse = (c: any) => { 
    setEditingCourse(c); 
    setCourse({ name: c.name, areaId: c.areaId }); 
    setShowCourse(true); 
  };

  const saveCourse = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingCourse) { 
        await academicService.updateCourse(editingCourse.id, course); 
        success('✅ Curso actualizado'); 
      } else { 
        await academicService.createCourse(course); 
        success('✅ Curso creado'); 
      }
      setShowCourse(false); load();
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async () => {
    if (!del) return; setSaving(true);
    try {
      if (del.type === 'area') await academicService.deleteArea(del.id);
      else await academicService.deleteCourse(del.id);
      success('✅ Eliminado correctamente'); 
      setDel(null); 
      load();
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Búsqueda y acciones */}
      <Card>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Input
              placeholder="Buscar por área o curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<MagnifyingGlassIcon />}
            />
          </div>
          <Button 
            variant="secondary" 
            onClick={openCreateCourse}
            icon={<PlusIcon />}
          >
            Nuevo curso
          </Button>
          <Button 
            onClick={openCreateArea}
            icon={<PlusIcon />}
          >
            Nueva área
          </Button>
          {search && (
            <Button 
              variant="ghost" 
              onClick={() => setSearch('')}
              icon={<XCircleIcon />}
            >
              Limpiar
            </Button>
          )}
        </div>
        <div style={{ 
          marginTop: 12, 
          fontSize: 'var(--text-sm)', 
          color: 'var(--color-neutral-600)' 
        }}>
          <strong>{filteredAreas.length}</strong> áreas · <strong>{areas.reduce((sum, a) => sum + a.courses.length, 0)}</strong> cursos en total
        </div>
      </Card>

      {filteredAreas.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-neutral-400)' }}>
            <AcademicCapIcon style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>
              {search ? 'No se encontraron áreas' : 'Sin áreas registradas'}
            </div>
            <div style={{ fontSize: 'var(--text-sm)' }}>
              {search ? 'Intenta con otros términos de búsqueda' : 'Crea la primera área académica'}
            </div>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filteredAreas.map((a) => (
            <Card key={a.id} className="card-elevated" style={{ transition: 'all 0.2s' }}>
              {/* Header del área */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                    <AcademicCapIcon style={{ width: 22, height: 22 }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
                      {a.name}
                    </h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
                      {a.courses.length} {a.courses.length === 1 ? 'curso' : 'cursos'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button 
                    onClick={() => openEditArea(a)} 
                    className="btn btn-ghost btn-icon" 
                    title="Editar área"
                    style={{ color: 'var(--color-success-600)' }}
                  >
                    <PencilIcon style={{ width: 16, height: 16 }} />
                  </button>
                  <button 
                    onClick={() => setDel({ type: 'area', id: a.id, name: a.name })} 
                    className="btn btn-ghost btn-icon" 
                    title="Eliminar área"
                    style={{ color: 'var(--color-danger-600)' }}
                  >
                    <TrashIcon style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>

              {/* Lista de cursos */}
              {a.courses.length === 0 ? (
                <div style={{ 
                  fontSize: 'var(--text-sm)', 
                  color: 'var(--color-neutral-400)', 
                  textAlign: 'center', 
                  padding: '16px 8px',
                  background: 'var(--color-neutral-50)',
                  borderRadius: 8
                }}>
                  Sin cursos asignados
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {a.courses.map((c: any) => (
                    <div 
                      key={c.id} 
                      style={{
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 10,
                        padding: '10px 12px', 
                        background: 'var(--color-neutral-50)', 
                        borderRadius: 8,
                        border: '1px solid var(--color-neutral-100)',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-neutral-100)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-neutral-50)'; }}
                    >
                      <BookOpenIcon style={{ width: 16, height: 16, color: 'var(--color-warning-500)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-neutral-800)' }}>
                        {c.name}
                      </span>
                      <button 
                        onClick={() => openEditCourse(c)} 
                        className="btn btn-ghost btn-icon" 
                        title="Editar curso"
                        style={{ color: 'var(--color-success-600)' }}
                      >
                        <PencilIcon style={{ width: 14, height: 14 }} />
                      </button>
                      <button 
                        onClick={() => setDel({ type: 'course', id: c.id, name: c.name })} 
                        className="btn btn-ghost btn-icon" 
                        title="Eliminar curso"
                        style={{ color: 'var(--color-danger-600)' }}
                      >
                        <TrashIcon style={{ width: 14, height: 14 }} />
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
        <form onSubmit={saveArea} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input 
            label="Nombre del área" 
            value={areaName} 
            onChange={(e) => setAreaName(e.target.value)} 
            placeholder="Ej: Matemáticas" 
            required
            icon={<AcademicCapIcon />}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setShowArea(false)}>Cancelar</Button>
            <Button type="submit" isLoading={saving} loadingText="Guardando...">
              {editingArea ? 'Guardar cambios' : 'Crear área'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Curso */}
      <Modal isOpen={showCourse} onClose={() => setShowCourse(false)} title={editingCourse ? 'Editar curso' : 'Nuevo curso'}>
        <form onSubmit={saveCourse} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input 
            label="Nombre del curso" 
            value={course.name} 
            onChange={(e) => setCourse({ ...course, name: e.target.value })} 
            placeholder="Ej: Álgebra" 
            required
            icon={<BookOpenIcon />}
          />
          <Select 
            label="Área" 
            value={course.areaId} 
            onChange={(e) => setCourse({ ...course, areaId: e.target.value })}
            options={areas.map((a) => ({ value: a.id, label: a.name }))} 
            required 
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setShowCourse(false)}>Cancelar</Button>
            <Button type="submit" isLoading={saving} loadingText="Guardando...">
              {editingCourse ? 'Guardar cambios' : 'Crear curso'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={!!del} 
        onClose={() => setDel(null)} 
        onConfirm={handleDelete}
        title={`Eliminar ${del?.type === 'area' ? 'área' : 'curso'}`}
        message={`¿Eliminar "${del?.name}"?\n\nEsta acción no se puede deshacer.${del?.type === 'area' ? '\n\nSe eliminarán también todos los cursos asociados.' : ''}`}
        isLoading={saving} 
      />
    </div>
  );
};