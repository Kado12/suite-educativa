import React, { useState, useEffect, useMemo } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, ClockIcon, BuildingOfficeIcon, PowerIcon, ArrowDownTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
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

  // ... resto de handlers (turno, sección, toggle, delete) igual que antes
  const openCreateTurno = () => { setEditingTurno(null); setTurno({ name: '', slot1Start: '08:00', slot1End: '11:00', slot2Start: '11:00', slot2End: '14:00' }); setShowTurno(true); };
  const openEditTurno = (t: any) => { setEditingTurno(t); setTurno({ name: t.name, slot1Start: t.slot1Start, slot1End: t.slot1End, slot2Start: t.slot2Start, slot2End: t.slot2End }); setShowTurno(true); };

  const saveTurno = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingTurno) { await academicService.updateTurno(editingTurno.id, turno); success('Turno actualizado'); }
      else { await academicService.createTurno(turno); success('Turno creado'); }
      setShowTurno(false); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const openCreateSec = () => { setEditingSec(null); setSec({ classroomId: '', turnoId: '', capacity: '25', enrollmentPriority: '0', name: '' }); setShowSec(true); };
  const openEditSec = (s: any) => { setEditingSec(s); setSec({ classroomId: s.classroomId, turnoId: s.turnoId, capacity: String(s.capacity), enrollmentPriority: String(s.enrollmentPriority), name: s.name }); setShowSec(true); };

  const saveSec = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingSec) {
        await academicService.updateSectionFull(editingSec.id, { name: sec.name, capacity: parseInt(sec.capacity), enrollmentPriority: parseInt(sec.enrollmentPriority) });
        success('Sección actualizada');
      } else {
        await academicService.createSection({ classroomId: sec.classroomId, turnoId: sec.turnoId, capacity: parseInt(sec.capacity), enrollmentPriority: parseInt(sec.enrollmentPriority), name: sec.name || undefined });
        success('Sección creada');
      }
      setShowSec(false); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (s: any) => {
    try {
      await academicService.toggleSection(s.id);
      success(s.isActive ? 'Sección desactivada' : 'Sección activada');
      load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async () => {
    if (!del) return; setSaving(true);
    try {
      if (del.type === 'turno') await academicService.deleteTurno(del.id);
      else await academicService.deleteSection(del.id);
      success('Eliminado'); setDel(null); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="secondary" onClick={openCreateSec}><PlusIcon style={{ width: 16, height: 16 }} /> Sección</Button>
        <Button onClick={openCreateTurno}><PlusIcon style={{ width: 16, height: 16 }} /> Turno</Button>
      </div>

      {/* TURNOS */}
      <Card>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-info-50)', color: 'var(--color-info-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClockIcon style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h3 className="card-title">Turnos</h3>
              <p className="card-subtitle" style={{ margin: 0 }}>{turnos.length} configurados</p>
            </div>
          </div>
        </div>
        {turnos.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-neutral-400)', padding: 24 }}>Sin turnos configurados</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {turnos.map((t) => (
              <div key={t.id} style={{ padding: 16, background: 'var(--color-neutral-50)', borderRadius: 10, border: '1px solid var(--color-neutral-200)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0 }}>{t.name}</h4>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button onClick={() => openEditTurno(t)} className="btn btn-ghost btn-icon"><PencilIcon style={{ width: 14, height: 14, color: 'var(--color-success-700)'  }} /></button>
                    <button onClick={() => setDel({ type: 'turno', id: t.id, name: t.name })} className="btn btn-ghost btn-icon"><TrashIcon style={{ width: 14, height: 14, color: 'var(--color-danger-500)' }} /></button>
                  </div>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)' }}>
                  <div style={{ marginBottom: 4 }}>Slot 1: <strong>{t.slot1Start} - {t.slot1End}</strong></div>
                  <div>Slot 2: <strong>{t.slot2Start} - {t.slot2End}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* SECCIONES con búsqueda, paginación y alertas */}
      <Card>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-success-50)', color: 'var(--color-success-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BuildingOfficeIcon style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h3 className="card-title">Secciones</h3>
              <p className="card-subtitle" style={{ margin: 0 }}>{sections.filter((s) => s.isActive).length} activas de {sections.length}</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 280 }}>
              <Input
                placeholder="Buscar por sección, salón, sede..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="success" onClick={handleExport}>
              <ArrowDownTrayIcon style={{ width: 16, height: 16 }} /> Exportar Excel
            </Button>
          </div>
        </div>

        <div className="table-container" style={{ border: 'none', borderTop: '1px solid var(--color-neutral-100)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Sección</th><th>Salón</th><th>Sede</th><th>Turno</th>
                <th style={{ textAlign: 'center' }}>Cupo</th>
                <th style={{ textAlign: 'center' }}>Ocupación</th>
                <th style={{ textAlign: 'center' }}>Estado</th><th></th>
              </tr>
            </thead>
            <tbody>
              {paginatedSections.map((s) => {
                const enrolled = s._count?.enrollments || 0;
                const pct = s.capacity > 0 ? Math.round((enrolled / s.capacity) * 100) : 0;
                const occupancyColor = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : 'success';
                return (
                  <tr key={s.id} style={{ opacity: s.isActive ? 1 : 0.55 }}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.classroom.name}</td>
                    <td>{s.classroom.sede.name}</td>
                    <td><Badge color="primary">{s.turno.name}</Badge></td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{s.capacity}</td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge color={occupancyColor}>{enrolled}/{s.capacity} ({pct}%)</Badge>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge color={s.isActive ? 'success' : 'danger'}>{s.isActive ? 'Activa' : 'Inactiva'}</Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => toggleActive(s)} className="btn btn-ghost btn-icon" title={s.isActive ? 'Desactivar' : 'Activar'}>
                        <PowerIcon style={{ width: 16, height: 16, color: s.isActive ? 'var(--color-extra-600)' : 'var(--color-neutral-400)' }} />
                      </button>
                      <button onClick={() => openEditSec(s)} className="btn btn-ghost btn-icon" title="Editar">
                        <PencilIcon style={{ width: 16, height: 16, color: 'var(--color-success-700)'  }} />
                      </button>
                      <button onClick={() => setDel({ type: 'sec', id: s.id, name: s.name })} className="btn btn-ghost btn-icon" title="Eliminar">
                        <TrashIcon style={{ width: 16, height: 16, color: 'var(--color-danger-500)' }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredSections.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--color-neutral-400)' }}>
                  {search ? 'No se encontraron secciones' : 'Sin secciones'}
                </td></tr>
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

      {/* Modals (igual que antes) */}
      <Modal isOpen={showTurno} onClose={() => setShowTurno(false)} title={editingTurno ? 'Editar turno' : 'Nuevo turno'}>
        <form onSubmit={saveTurno} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Nombre" value={turno.name} onChange={(e) => setTurno({ ...turno, name: e.target.value })} placeholder="Ej: Mañana" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Slot 1 inicio" type="time" value={turno.slot1Start} onChange={(e) => setTurno({ ...turno, slot1Start: e.target.value })} required />
            <Input label="Slot 1 fin" type="time" value={turno.slot1End} onChange={(e) => setTurno({ ...turno, slot1End: e.target.value })} required />
            <Input label="Slot 2 inicio" type="time" value={turno.slot2Start} onChange={(e) => setTurno({ ...turno, slot2Start: e.target.value })} required />
            <Input label="Slot 2 fin" type="time" value={turno.slot2End} onChange={(e) => setTurno({ ...turno, slot2End: e.target.value })} required />
          </div>
          <Button type="submit" isLoading={saving}>{editingTurno ? 'Guardar cambios' : 'Crear turno'}</Button>
        </form>
      </Modal>

      <Modal isOpen={showSec} onClose={() => setShowSec(false)} title={editingSec ? 'Editar sección' : 'Nueva sección'}>
        <form onSubmit={saveSec} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Nombre (opcional, se autogenera)" value={sec.name} onChange={(e) => setSec({ ...sec, name: e.target.value })} placeholder="Ej: A11 - M" />
          <SearchableSelect label="Salón" value={sec.classroomId} onChange={(v) => setSec({ ...sec, classroomId: v })} options={classroomOptions} placeholder="Escribe para buscar salón..." required />
          <Select label="Turno" value={sec.turnoId} onChange={(e) => setSec({ ...sec, turnoId: e.target.value })} options={[{ value: '', label: 'Selecciona turno' }, ...turnos.map((t) => ({ value: t.id, label: t.name }))]} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Cupo máximo" type="number" min={1} value={sec.capacity} onChange={(e) => setSec({ ...sec, capacity: e.target.value })} required />
            <Input label="Prioridad" type="number" min={0} value={sec.enrollmentPriority} onChange={(e) => setSec({ ...sec, enrollmentPriority: e.target.value })} required />
          </div>
          <Button type="submit" isLoading={saving}>{editingSec ? 'Guardar cambios' : 'Crear sección'}</Button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!del} onClose={() => setDel(null)} onConfirm={handleDelete} title={`Eliminar ${del?.type === 'turno' ? 'turno' : 'sección'}`} message={`¿Eliminar "${del?.name}"? Esta acción no se puede deshacer.`} isLoading={saving} />
    </div>
  );
};