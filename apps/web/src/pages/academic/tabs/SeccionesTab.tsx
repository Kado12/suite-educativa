import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, ConfirmModal, Badge } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { academicService } from '../../../api/academic.service';

export const SeccionesTab: React.FC = () => {
  const { success, error } = useToast();
  const [turnos, setTurnos] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [showTurno, setShowTurno] = useState(false);
  const [turno, setTurno] = useState({ name: '', slot1Start: '08:00', slot1End: '11:00', slot2Start: '11:00', slot2End: '14:00' });
  const [showSec, setShowSec] = useState(false);
  const [sec, setSec] = useState({ classroomId: '', turnoId: '', capacity: '30', enrollmentPriority: '0' });
  const [del, setDel] = useState<{ type: 'turno' | 'sec'; id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => Promise.all([
    academicService.listTurnos().then(setTurnos),
    academicService.listSections().then(setSections),
    academicService.listSedes().then(setSedes),
  ]).catch(() => error('Error al cargar'));
  useEffect(() => { load(); }, []);

  const allClassrooms = sedes.flatMap((s) => s.classrooms.map((c: any) => ({ ...c, sedeName: s.name })));

  const saveTurno = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await academicService.createTurno(turno); success('Turno creado'); setShowTurno(false); load(); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
  };
  const saveSec = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await academicService.createSection({
        classroomId: sec.classroomId, turnoId: sec.turnoId,
        capacity: parseInt(sec.capacity), enrollmentPriority: parseInt(sec.enrollmentPriority),
      });
      success('Sección creada'); setShowSec(false);
      setSec({ classroomId: '', turnoId: '', capacity: '30', enrollmentPriority: '0' });
      load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!del) return; setSaving(true);
    try {
      if (del.type === 'turno') await academicService.deleteTurno(del.id); else await academicService.deleteSection(del.id);
      success('Eliminado'); setDel(null); load();
    } catch (err: any) { error(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={() => setShowSec(true)}><PlusIcon style={{ width: 16, height: 16 }} /> Sección</Button>
        <Button onClick={() => setShowTurno(true)}><PlusIcon style={{ width: 16, height: 16 }} /> Turno</Button>
      </div>

      <Card>
        <div className="card-header"><h3 className="card-title">Turnos</h3></div>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead><tr><th>Turno</th><th>Slot 1</th><th>Slot 2</th><th>Acciones</th></tr></thead>
            <tbody>
              {turnos.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.name}</strong></td>
                  <td>{t.slot1Start} - {t.slot1End}</td>
                  <td>{t.slot2Start} - {t.slot2End}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => setDel({ type: 'turno', id: t.id, name: t.name })} style={{ color: 'var(--color-danger-500)' }}><TrashIcon style={{ width: 16, height: 16 }} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="card-header"><h3 className="card-title">Secciones</h3></div>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Sección</th>
                <th>Salón</th>
                <th>Sede</th>
                <th>Turno</th>
                <th>Prioridad</th>
                <th>Turno</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.classroom.name}</td>
                  <td>{s.classroom.sede.name}</td>
                  <td>{s.capacity}</td>
                  <td>{s.enrollmentPriority}</td>
                  <td><Badge color="primary">{s.turno.name}</Badge></td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => setDel({ type: 'sec', id: s.id, name: s.name })} style={{ color: 'var(--color-danger-500)' }}><TrashIcon style={{ width: 16, height: 16 }} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showTurno} onClose={() => setShowTurno(false)} title="Nuevo Turno">
        <form onSubmit={saveTurno} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Nombre" value={turno.name} onChange={(e) => setTurno({ ...turno, name: e.target.value })} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Slot 1 inicio" type="time" value={turno.slot1Start} onChange={(e) => setTurno({ ...turno, slot1Start: e.target.value })} required />
            <Input label="Slot 1 fin" type="time" value={turno.slot1End} onChange={(e) => setTurno({ ...turno, slot1End: e.target.value })} required />
            <Input label="Slot 2 inicio" type="time" value={turno.slot2Start} onChange={(e) => setTurno({ ...turno, slot2Start: e.target.value })} required />
            <Input label="Slot 2 fin" type="time" value={turno.slot2End} onChange={(e) => setTurno({ ...turno, slot2End: e.target.value })} required />
          </div>
          <Button type="submit" isLoading={saving}>Crear</Button>
        </form>
      </Modal>

      <Modal isOpen={showSec} onClose={() => setShowSec(false)} title="Nueva Sección">
        <form onSubmit={saveSec} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Select label="Salón" value={sec.classroomId} onChange={(e) => setSec({ ...sec, classroomId: e.target.value })}
            options={[{ value: '', label: 'Selecciona salón' }, ...allClassrooms.map((c) => ({ value: c.id, label: `${c.name} (${c.sedeName})` }))]} required />
          <Select label="Turno" value={sec.turnoId} onChange={(e) => setSec({ ...sec, turnoId: e.target.value })}
            options={[{ value: '', label: 'Selecciona turno' }, ...turnos.map((t) => ({ value: t.id, label: t.name }))]} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Cupo máximo" type="number" min={1} value={sec.capacity} onChange={(e) => setSec({ ...sec, capacity: e.target.value })} required />
            <Input label="Prioridad inscripción" type="number" min={0} value={sec.enrollmentPriority} onChange={(e) => setSec({ ...sec, enrollmentPriority: e.target.value })} required />
          </div>
          <Button type="submit" isLoading={saving}>Crear</Button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!del} onClose={() => setDel(null)} onConfirm={handleDelete} title="Eliminar" message={`¿Eliminar "${del?.name}"?`} isLoading={saving} />
    </div>
  );
};