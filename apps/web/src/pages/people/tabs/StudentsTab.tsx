import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PencilIcon, TrashIcon, AcademicCapIcon, PhotoIcon, MagnifyingGlassIcon, DocumentArrowDownIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, ConfirmModal, Badge, Pagination, SearchableSelect } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { peopleService } from '../../../api/people.service';
import { EditPersonalModal } from '../modals/EditPersonalModal';
import { EditAcademicModal } from '../modals/EditAcademicModal';
import { pdfService } from '../../../api/pdf.service';

export const StudentsTab: React.FC = () => {
  const { success, error } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [showEditPersonal, setShowEditPersonal] = useState(false);
  const [showEditAcademic, setShowEditAcademic] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const [reloadKey, setReloadKey] = useState(0);

  // Modal eliminar
  const [del, setDel] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    peopleService.listStudents(search || undefined)
      .then(setStudents)
      .catch(() => error('Error al cargar'));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => load(), 200);
    return () => clearTimeout(t);
  }, [search, reloadKey, load]);

  // Paginación
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return students.slice(start, start + pageSize);
  }, [students, currentPage, pageSize]);
  useEffect(() => { setCurrentPage(1); }, [search, pageSize]);

  const handleSaved = useCallback(() => setReloadKey((k) => k + 1), []);

  const openEditPersonal = (s: any) => { setSelectedStudent(s); setShowEditPersonal(true); };
  const openEditAcademic = (s: any) => { setSelectedStudent(s); setShowEditAcademic(true); };


  const handleDelete = async () => {
    if (!del) return; setSaving(true);
    try { await peopleService.deleteStudent(del.id); success('Alumno eliminado'); setDel(null); load(); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleExport = async () => {
    try { await peopleService.exportStudents(search || undefined); success('📥 Lista de alumnos descargada'); }
    catch (err: any) { error(err.response?.data?.message || 'Error al exportar'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <Card>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AcademicCapIcon style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h3 className="card-title">Alumnos</h3>
              <p className="card-subtitle" style={{ margin: 0 }}>{students.length} registrados</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <Input placeholder="Buscar por nombre o documento..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
            <Button variant="success" onClick={handleExport}><ArrowDownTrayIcon style={{ width: 16, height: 16 }} /> Exportar</Button>
          </div>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr><th>Foto</th><th>Alumno</th><th>Documento</th><th>Contacto</th><th>Sección actual</th><th></th></tr>
            </thead>
            <tbody>
              {paginated.map((s) => {
                const enr = s.enrollments[0];
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ width: 80, height: 60, borderRadius: 6, overflow: 'hidden', background: 'var(--color-neutral-100)' }}>
                        {s.photoUrl ? (
                          <img
                            src={s.photoUrl}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                            <PhotoIcon style={{ width: 20, height: 20, color: 'var(--color-neutral-400)' }} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td><strong>{s.lastName}, {s.firstName}</strong></td>
                    <td>{s.dni || '—'}</td>
                    <td>
                      {s.phone && <div style={{ fontSize: 'var(--text-sm)' }}>{s.phone}</div>}
                      {s.email && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{s.email}</div>}
                      {!s.phone && !s.email && '—'}
                    </td>
                    <td>
                      {enr ? <Badge color="primary">{enr.section.name}</Badge> : <span style={{ color: 'var(--color-neutral-400)', fontSize: 'var(--text-xs)' }}>Sin matricular</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => openEditPersonal(s)} className="btn btn-ghost btn-icon" title="Editar datos personales">
                        <PencilIcon style={{ width: 16, height: 16, color: 'var(--color-success-700)' }} />
                      </button>
                      <button onClick={() => openEditAcademic(s)} className="btn btn-ghost btn-icon" title="Editar datos académicos">
                        <AcademicCapIcon style={{ width: 16, height: 16, color: 'var(--color-primary-700)' }} />
                      </button>
                      <button onClick={() => setDel(s)} className="btn btn-ghost btn-icon" title="Eliminar">
                        <TrashIcon style={{ width: 16, height: 16, color: 'var(--color-danger-700)' }} />
                      </button>
                      <button
                        onClick={async () => {
                          try { await pdfService.downloadStudentRecord(s.id, s.dni); success('PDF descargado'); }
                          catch { error('Error al generar PDF'); }
                        }}
                        className="btn btn-ghost btn-icon"
                        title="Descargar ficha PDF"
                      >
                        <DocumentArrowDownIcon style={{ width: 16, height: 16, color: 'var(--color-extra-600)' }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--color-neutral-400)' }}>Sin alumnos</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {students.length > 0 && (
          <Pagination currentPage={currentPage} pageSize={pageSize} totalItems={students.length} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
        )}
      </Card>

      <ConfirmModal isOpen={!!del} onClose={() => setDel(null)} onConfirm={handleDelete} title="Eliminar alumno"
        message={`¿Eliminar a ${del?.firstName} ${del?.lastName}? Solo es posible si no tiene matrículas.`} isLoading={saving} />

      
      <EditPersonalModal
        isOpen={showEditPersonal}
        student={selectedStudent}
        onClose={() => setShowEditPersonal(false)}
        onSaved={handleSaved}
      />
      <EditAcademicModal
        isOpen={showEditAcademic}
        student={selectedStudent}
        onClose={() => setShowEditAcademic(false)}
        onSaved={handleSaved}
      />
    </div>
  );
};