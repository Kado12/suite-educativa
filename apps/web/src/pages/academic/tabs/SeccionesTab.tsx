import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusIcon, TrashIcon, PencilIcon, ClockIcon, BuildingOfficeIcon, 
  PowerIcon, ArrowDownTrayIcon, MagnifyingGlassIcon, XCircleIcon,
  UserGroupIcon, MapPinIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, ConfirmModal, Badge, SearchableSelect, Pagination } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { academicService } from '../../../api/academic.service';

export const SeccionesTab: React.FC = () => {
  const { success, error } = useToast();
  const [turnos, setTurnos] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Búsqueda
  const [search, setSearch] = useState('');

  // Turno
  const [showTurno, setShowTurno] = useState(false);
  const [editingTurno, setEditingTurno] = useState<any | null>(null);
  const [turno, setTurno] = useState({ name: '', slot1Start: '08:00', slot1End: '11:00', slot2Start: '11:00', slot2End: '14:00' });

  // Sección
  const [showSec, setShowSec] = useState(false);
  const [editingSec, setEditingSec] = useState<any | null>(null);
  const [sec, setSec] = useState({ classroomId: '', turnoId: '', capacity: '25', enrollmentPriority: '0', name: '' });

  const [del, setDel] = useState<{ type: 'turno' | 'sec'; id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => Promise.all([
    academicService.listTurnos().then(setTurnos),
    academicService.listSections().then(setSections),
    academicService.listSedes().then(setSedes),
  ]).catch(() => error('Error al cargar'));
  useEffect(() => { load(); }, []);

  const classroomOptions = useMemo(() =>
    sedes.flatMap((s) => s.classrooms.map((c: any) => ({
      value: c.id,
      label: c.name,
      hint: s.name,
    }))),
    [sedes],
  );

  // Filtrado por búsqueda
  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;
    const s = search.toLowerCase();
    return sections.filter((sec) =>
      sec.name.toLowerCase().includes(s) ||
      sec.classroom.name.toLowerCase().includes(s) ||
      sec.classroom.sede.name.toLowerCase().includes(s) ||
      sec.turno.name.toLowerCase().includes(s)
    );
  }, [sections, search]);

  // Paginación
  const paginatedSections = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSections.slice(start, start + pageSize);
  }, [filteredSections, currentPage, pageSize]);

  useEffect(() => { setCurrentPage(1); }, [search, pageSize]);

  // Exportar
  const handleExport = async () => {
    try {
      await academicService.exportSections();
      success('📥 Archivo descargado');
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al exportar');
    }
  };

  const openCreateTurno = () => { 
    setEditingTurno(null); 
    setTurno({ name: '', slot1Start: '08:00', slot1End: '11:00', slot2Start: '11:00', slot2End: '14:00' }); 
    setShowTurno(true); 
  };
  const openEditTurno = (t: any) => { 
    setEditingTurno(t); 
    setTurno({ 
      name: t.name, 
      slot1Start: t.slot1Start, 
      slot1End: t.slot1End, 
      slot2Start: t.slot2Start, 
      slot2End: t.slot2End 
    }); 
    setShowTurno(true); 
  };

  const saveTurno = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingTurno) { 
        await academicService.updateTurno(editingTurno.id, turno); 
        success('✅ Turno actualizado'); 
      } else { 
        await academicService.createTurno(turno); 
        success('✅ Turno creado'); 
      }
      setShowTurno(false); load();
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    } finally { 
      setSaving(false); 
    }
  };

  const openCreateSec = () => { 
    setEditingSec(null); 
    setSec({ classroomId: '', turnoId: '', capacity: '25', enrollmentPriority: '0', name: '' }); 
    setShowSec(true); 
  };
  const openEditSec = (s: any) => { 
    setEditingSec(s); 
    setSec({ 
      classroomId: s.classroomId, 
      turnoId: s.turnoId, 
      capacity: String(s.capacity), 
      enrollmentPriority: String(s.enrollmentPriority), 
      name: s.name 
    }); 
    setShowSec(true); 
  };

  const saveSec = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingSec) {
        await academicService.updateSectionFull(editingSec.id, { 
          name: sec.name, 
          capacity: parseInt(sec.capacity), 
          enrollmentPriority: parseInt(sec.enrollmentPriority) 
        });
        success('✅ Sección actualizada');
      } else {
        await academicService.createSection({ 
          classroomId: sec.classroomId, 
          turnoId: sec.turnoId, 
          capacity: parseInt(sec.capacity), 
          enrollmentPriority: parseInt(sec.enrollmentPriority), 
          name: sec.name || undefined 
        });
        success('✅ Sección creada');
      }
      setShowSec(false); load();
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    } finally { 
      setSaving(false); 
    }
  };

  const toggleActive = async (s: any) => {
    try {
      await academicService.toggleSection(s.id);
      success(s.isActive ? '✅ Sección desactivada' : '✅ Sección activada');
      load();
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    }
  };

  const handleDelete = async () => {
    if (!del) return; setSaving(true);
    try {
      if (del.type === 'turno') await academicService.deleteTurno(del.id);
      else await academicService.deleteSection(del.id);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* TURNOS */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 44, 
              height: 44, 
              borderRadius: 12, 
              background: 'linear-gradient(135deg, var(--color-info-50) 0%, var(--color-info-100) 100%)', 
              color: 'var(--color-info-600)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <ClockIcon style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
                Turnos
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
                {turnos.length} configurados
              </p>
            </div>
          </div>
          <Button onClick={openCreateTurno} icon={<PlusIcon />}>
            Nuevo turno
          </Button>
        </div>

        {turnos.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-neutral-400)', padding: 32 }}>
            <ClockIcon style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Sin turnos configurados</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {turnos.map((t) => (
              <div 
                key={t.id} 
                style={{ 
                  padding: 16, 
                  background: 'var(--color-neutral-50)', 
                  borderRadius: 10, 
                  border: '1px solid var(--color-neutral-200)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
                    {t.name}
                  </h4>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button 
                      onClick={() => openEditTurno(t)} 
                      className="btn btn-ghost btn-icon"
                      style={{ color: 'var(--color-success-500)' }}
                    >
                      <PencilIcon style={{ width: 14, height: 14 }} />
                    </button>
                    <button 
                      onClick={() => setDel({ type: 'turno', id: t.id, name: t.name })} 
                      className="btn btn-ghost btn-icon"
                      style={{ color: 'var(--color-danger-600)' }}
                    >
                      <TrashIcon style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
                  <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ClockIcon style={{ width: 14, height: 14, color: 'var(--color-neutral-400)' }} />
                    <span>Slot 1: <strong>{t.slot1Start} - {t.slot1End}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ClockIcon style={{ width: 14, height: 14, color: 'var(--color-neutral-400)' }} />
                    <span>Slot 2: <strong>{t.slot2Start} - {t.slot2End}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* SECCIONES */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 44, 
              height: 44, 
              borderRadius: 12, 
              background: 'linear-gradient(135deg, var(--color-success-50) 0%, var(--color-success-100) 100%)', 
              color: 'var(--color-success-500)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <UserGroupIcon style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
                Secciones
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
                {sections.filter((s) => s.isActive).length} activas de {sections.length}
              </p>
            </div>
          </div>
          <Button onClick={openCreateSec} icon={<PlusIcon />}>
            Nueva sección
          </Button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Input
              placeholder="Buscar por sección, salón, sede..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<MagnifyingGlassIcon />}
            />
          </div>
          <Button 
            variant="success" 
            onClick={handleExport}
            icon={<ArrowDownTrayIcon />}
          >
            Exportar Excel
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

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Sección</th>
                <th>Salón</th>
                <th>Sede</th>
                <th>Turno</th>
                <th style={{ textAlign: 'center' }}>Cupo</th>
                <th style={{ textAlign: 'center' }}>Ocupación</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSections.map((s) => {
                const enrolled = s._count?.enrollments || 0;
                const pct = s.capacity > 0 ? Math.round((enrolled / s.capacity) * 100) : 0;
                const occupancyColor = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : 'success';
                return (
                  <tr key={s.id} style={{ opacity: s.isActive ? 1 : 0.55 }}>
                    <td>
                      <strong style={{ color: 'var(--color-neutral-900)' }}>{s.name}</strong>
                    </td>
                    <td style={{ color: 'var(--color-neutral-600)' }}>{s.classroom.name}</td>
                    <td style={{ color: 'var(--color-neutral-600)' }}>{s.classroom.sede.name}</td>
                    <td>
                      <Badge color="primary">{s.turno.name}</Badge>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{s.capacity}</td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge color={occupancyColor}>
                        {enrolled}/{s.capacity} ({pct}%)
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge color={s.isActive ? 'success' : 'neutral'}>
                        {s.isActive ? '● Activa' : '○ Inactiva'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => toggleActive(s)} 
                          className="btn btn-ghost btn-icon" 
                          title={s.isActive ? 'Desactivar' : 'Activar'}
                          style={{ color: s.isActive ? 'var(--color-warning-600)' : 'var(--color-success-500)' }}
                        >
                          <PowerIcon style={{ width: 16, height: 16 }} />
                        </button>
                        <button 
                          onClick={() => openEditSec(s)} 
                          className="btn btn-ghost btn-icon" 
                          title="Editar"
                          style={{ color: 'var(--color-success-500)' }}
                        >
                          <PencilIcon style={{ width: 16, height: 16 }} />
                        </button>
                        <button 
                          onClick={() => setDel({ type: 'sec', id: s.id, name: s.name })} 
                          className="btn btn-ghost btn-icon" 
                          title="Eliminar"
                          style={{ color: 'var(--color-danger-600)' }}
                        >
                          <TrashIcon style={{ width: 16, height: 16 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSections.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 48, color: 'var(--color-neutral-400)' }}>
                    <UserGroupIcon style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.3 }} />
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      {search ? 'No se encontraron secciones' : 'Sin secciones registradas'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredSections.length > 0 && (
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredSections.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </Card>

      {/* Modal Turno */}
      <Modal isOpen={showTurno} onClose={() => setShowTurno(false)} title={editingTurno ? 'Editar turno' : 'Nuevo turno'}>
        <form onSubmit={saveTurno} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input 
            label="Nombre del turno" 
            value={turno.name} 
            onChange={(e) => setTurno({ ...turno, name: e.target.value })} 
            placeholder="Ej: Mañana" 
            required
            icon={<ClockIcon />}
          />
          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, color: 'var(--color-neutral-700)' }}>
              Slot 1
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input 
                label="Inicio" 
                type="time" 
                value={turno.slot1Start} 
                onChange={(e) => setTurno({ ...turno, slot1Start: e.target.value })} 
                required 
              />
              <Input 
                label="Fin" 
                type="time" 
                value={turno.slot1End} 
                onChange={(e) => setTurno({ ...turno, slot1End: e.target.value })} 
                required 
              />
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, color: 'var(--color-neutral-700)' }}>
              Slot 2
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input 
                label="Inicio" 
                type="time" 
                value={turno.slot2Start} 
                onChange={(e) => setTurno({ ...turno, slot2Start: e.target.value })} 
                required 
              />
              <Input 
                label="Fin" 
                type="time" 
                value={turno.slot2End} 
                onChange={(e) => setTurno({ ...turno, slot2End: e.target.value })} 
                required 
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setShowTurno(false)}>Cancelar</Button>
            <Button type="submit" isLoading={saving} loadingText="Guardando...">
              {editingTurno ? 'Guardar cambios' : 'Crear turno'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Sección */}
      <Modal isOpen={showSec} onClose={() => setShowSec(false)} title={editingSec ? 'Editar sección' : 'Nueva sección'}>
        <form onSubmit={saveSec} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input 
            label="Nombre (opcional, se autogenera)" 
            value={sec.name} 
            onChange={(e) => setSec({ ...sec, name: e.target.value })} 
            placeholder="Ej: A11 - M"
            icon={<UserGroupIcon />}
          />
          <SearchableSelect 
            label="Salón" 
            value={sec.classroomId} 
            onChange={(v) => setSec({ ...sec, classroomId: v })} 
            options={classroomOptions} 
            placeholder="Escribe para buscar salón..." 
            required 
          />
          <Select 
            label="Turno" 
            value={sec.turnoId} 
            onChange={(e) => setSec({ ...sec, turnoId: e.target.value })} 
            options={[{ value: '', label: 'Selecciona turno' }, ...turnos.map((t) => ({ value: t.id, label: t.name }))]} 
            required 
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input 
              label="Cupo máximo" 
              type="number" 
              min={1} 
              value={sec.capacity} 
              onChange={(e) => setSec({ ...sec, capacity: e.target.value })} 
              required
              icon={<UserGroupIcon />}
            />
            <Input 
              label="Prioridad de inscripción" 
              type="number" 
              min={0} 
              value={sec.enrollmentPriority} 
              onChange={(e) => setSec({ ...sec, enrollmentPriority: e.target.value })} 
              required
              hint="Mayor número = más prioridad"
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setShowSec(false)}>Cancelar</Button>
            <Button type="submit" isLoading={saving} loadingText="Guardando...">
              {editingSec ? 'Guardar cambios' : 'Crear sección'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={!!del} 
        onClose={() => setDel(null)} 
        onConfirm={handleDelete} 
        title={`Eliminar ${del?.type === 'turno' ? 'turno' : 'sección'}`} 
        message={`¿Eliminar "${del?.name}"?\n\nEsta acción no se puede deshacer.${del?.type === 'sec' ? '\n\nSolo es posible si no tiene matrículas activas.' : ''}`} 
        isLoading={saving} 
      />
    </div>
  );
};