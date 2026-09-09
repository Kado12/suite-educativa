import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  PencilIcon, TrashIcon, AcademicCapIcon, PhotoIcon, 
  DocumentArrowDownIcon, ArrowDownTrayIcon, IdentificationIcon,
  UserIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, MagnifyingGlassIcon,
  CloudArrowUpIcon, EyeIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, ConfirmModal, Badge, Pagination, SearchableSelect, FileInput } from '@suite/ui';
import { useToast } from '../../../context/ToastContext';
import { peopleService } from '../../../api/people.service';
import { academicService } from '../../../api/academic.service';
import { EditPersonalModal } from '../modals/EditPersonalModal';
import { EditAcademicModal } from '../modals/EditAcademicModal';
import { pdfService } from '../../../api/pdf.service';
import { uploadService } from '../../../api/upload.service';

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
  const [sedes, setSedes] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [fSede, setFSede] = useState(''); 
  const [fTurno, setFTurno] = useState('');

  const [uploadingPhotos, setUploadingPhotos] = useState(false);

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

  useEffect(() => {
    academicService.listSedes().then(setSedes);
    academicService.listTurnos().then(setTurnos);
  }, []);

  const filtered = students.filter((s) => {
    const enr = s.enrollments?.[0];
    return (!fSede || enr?.section?.classroom?.sede?.id === fSede) && (!fTurno || enr?.section?.turno?.id === fTurno);
  });

  // Paginación
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  useEffect(() => { setCurrentPage(1); }, [search, pageSize, fSede, fTurno]);

  const handleSaved = useCallback(() => setReloadKey((k) => k + 1), []);

  const openEditPersonal = (s: any) => { setSelectedStudent(s); setShowEditPersonal(true); };
  const openEditAcademic = (s: any) => { setSelectedStudent(s); setShowEditAcademic(true); };

  const handleDelete = async () => {
    if (!del) return; 
    setSaving(true);
    try { 
      await peopleService.deleteStudent(del.id); 
      success('✅ Alumno eliminado'); 
      setDel(null); 
      load(); 
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleExport = async () => {
    try { 
      await peopleService.exportStudents(search || undefined); 
      success('📥 Lista de alumnos descargada'); 
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error al exportar'); 
    }
  };

  const handleBulkPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingPhotos(true);
    try {
      const r = await uploadService.bulkStudentPhotos(files);
      success(`✅ ${r.matched} fotos asignadas`);
      if (r.unmatched.length > 0) error(`⚠️ ${r.unmatched.length} sin coincidencia de DNI`);
      load();
    } catch (err: any) { 
      error(err.response?.data?.message || 'Error al subir fotos'); 
    } finally { 
      setUploadingPhotos(false); 
      e.target.value = ''; 
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filtros y acciones */}
      <Card>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Input
              placeholder="Buscar por nombre o documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<MagnifyingGlassIcon />}
            />
          </div>
          <Select
            label="Sede"
            value={fSede}
            onChange={(e) => setFSede(e.target.value)}
            options={[{ value: '', label: 'Todas las sedes' }, ...sedes.map((s) => ({ value: s.id, label: s.name }))]}
          />
          <Select
            label="Turno"
            value={fTurno}
            onChange={(e) => setFTurno(e.target.value)}
            options={[{ value: '', label: 'Todos los turnos' }, ...turnos.map((t) => ({ value: t.id, label: t.name }))]}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button 
            variant="success" 
            onClick={handleExport}
            icon={<ArrowDownTrayIcon />}
          >
            Exportar lista
          </Button>
          <label 
            className="btn btn-secondary" 
            style={{ 
              cursor: uploadingPhotos ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: uploadingPhotos ? 0.6 : 1,
            }}
          >
            <CloudArrowUpIcon style={{ width: 18, height: 18 }} />
            {uploadingPhotos ? 'Subiendo fotos...' : 'Subir fotos en bloque'}
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handleBulkPhotos} 
              style={{ display: 'none' }} 
              disabled={uploadingPhotos} 
            />
          </label>
          {(fSede || fTurno || search) && (
            <Button 
              variant="ghost" 
              onClick={() => { setFSede(''); setFTurno(''); setSearch(''); }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Stats rápidos */}
        <div style={{ 
          marginTop: 16, 
          padding: '12px 16px', 
          background: 'var(--color-neutral-50)', 
          borderRadius: 8,
          display: 'flex',
          gap: 24,
          fontSize: 'var(--text-sm)',
          color: 'var(--color-neutral-600)'
        }}>
          <div>
            <strong style={{ color: 'var(--color-neutral-900)' }}>{filtered.length}</strong> alumnos
            {search && ` encontrados`}
          </div>
          {fSede && <div>Sede: <strong>{sedes.find(s => s.id === fSede)?.name}</strong></div>}
          {fTurno && <div>Turno: <strong>{turnos.find(t => t.id === fTurno)?.name}</strong></div>}
        </div>
      </Card>

      {/* Tabla de alumnos */}
      <Card className="p-0">
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>Foto</th>
                <th>Alumno</th>
                <th>Documento</th>
                <th>Contacto</th>
                <th>Sección actual</th>
                <th style={{ textAlign: 'right', width: 200 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((s) => {
                const enr = s.enrollments[0];
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ 
                        width: 60, 
                        height: 60, 
                        borderRadius: 8, 
                        overflow: 'hidden', 
                        background: 'var(--color-neutral-100)',
                        border: '2px solid var(--color-neutral-200)'
                      }}>
                        {s.photoUrl ? (
                          <img
                            src={s.photoUrl}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                          />
                        ) : (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            width: '100%', 
                            height: '100%',
                            background: 'linear-gradient(135deg, var(--color-primary-100) 0%, var(--color-primary-200) 100%)',
                          }}>
                            <UserIcon style={{ width: 24, height: 24, color: 'var(--color-primary-600)' }} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-neutral-900)' }}>
                        {s.lastName}, {s.firstName}
                      </div>
                      {s.gender && (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 2 }}>
                          {s.gender === 'M' ? 'Masculino' : s.gender === 'F' ? 'Femenino' : 'Otro'}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                        {s.docType === 'CARNET' ? 'CE: ' : ''}{s.dni || '—'}
                      </div>
                    </td>
                    <td>
                      {s.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-sm)', marginBottom: 2 }}>
                          <PhoneIcon style={{ width: 14, height: 14, color: 'var(--color-neutral-400)' }} />
                          {s.phone}
                        </div>
                      )}
                      {s.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                          <EnvelopeIcon style={{ width: 14, height: 14 }} />
                          {s.email}
                        </div>
                      )}
                      {!s.phone && !s.email && <span style={{ color: 'var(--color-neutral-400)' }}>—</span>}
                    </td>
                    <td>
                      {enr ? (
                        <div>
                          <Badge color="primary">{enr.section.name}</Badge>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 4 }}>
                            {enr.section.classroom.sede.name} · {enr.section.turno.name}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-neutral-400)', fontSize: 'var(--text-xs)' }}>
                          Sin matricular
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => openEditPersonal(s)} 
                          className="btn btn-ghost btn-icon" 
                          title="Editar datos personales"
                          style={{ color: 'var(--color-success-500)' }}
                        >
                          <PencilIcon style={{ width: 16, height: 16 }} />
                        </button>
                        <button 
                          onClick={() => openEditAcademic(s)} 
                          className="btn btn-ghost btn-icon" 
                          title="Editar datos académicos"
                          style={{ color: 'var(--color-primary-600)' }}
                        >
                          <AcademicCapIcon style={{ width: 16, height: 16 }} />
                        </button>
                        <button
                          onClick={async () => {
                            try { 
                              await pdfService.downloadStudentRecord(s.id, s.dni); 
                              success('✅ Ficha PDF descargada'); 
                            } catch { 
                              error('Error al generar PDF'); 
                            }
                          }}
                          className="btn btn-ghost btn-icon"
                          title="Descargar ficha PDF"
                          style={{ color: 'var(--color-extra-600)' }}
                        >
                          <DocumentArrowDownIcon style={{ width: 16, height: 16 }} />
                        </button>
                        <button 
                          onClick={async () => { 
                            try { 
                              await pdfService.downloadStudentCard(s.id, s.dni); 
                              success('✅ Carné descargado'); 
                            } catch { 
                              error('Error al generar carné'); 
                            } 
                          }}
                          className="btn btn-ghost btn-icon" 
                          title="Carné estudiantil"
                          style={{ color: 'var(--color-primary-600)' }}
                        >
                          <IdentificationIcon style={{ width: 16, height: 16 }} />
                        </button>
                        <button 
                          onClick={() => setDel(s)} 
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--color-neutral-400)' }}>
                    <UserIcon style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
                    <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>
                      {search || fSede || fTurno ? 'No se encontraron alumnos' : 'Sin alumnos registrados'}
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)' }}>
                      {search || fSede || fTurno ? 'Intenta ajustar los filtros de búsqueda' : 'Importa alumnos desde la sección de importaciones'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <Pagination 
            currentPage={currentPage} 
            pageSize={pageSize} 
            totalItems={filtered.length} 
            onPageChange={setCurrentPage} 
            onPageSizeChange={setPageSize} 
          />
        )}
      </Card>

      <ConfirmModal 
        isOpen={!!del} 
        onClose={() => setDel(null)} 
        onConfirm={handleDelete} 
        title="Eliminar alumno"
        message={`¿Eliminar a ${del?.firstName} ${del?.lastName}?\n\nSolo es posible si no tiene matrículas activas.`} 
        isLoading={saving} 
      />

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