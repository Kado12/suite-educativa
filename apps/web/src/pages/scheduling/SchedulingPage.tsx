import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlayIcon, TrashIcon, BuildingOffice2Icon, UserGroupIcon, 
  ArrowDownTrayIcon, ShieldCheckIcon, CalendarDaysIcon,
  BuildingOfficeIcon, ClockIcon, AcademicCapIcon, UsersIcon,
  CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon,
  PencilSquareIcon, SparklesIcon, InformationCircleIcon,
  EyeIcon, MagnifyingGlassIcon, XCircleIcon as XIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Select, Badge, SearchableSelect, Input } from '@suite/ui';
import { useToast } from '../../context/ToastContext';
import { schedulingService } from '../../api/scheduling.service';
import { academicService } from '../../api/academic.service';
import { peopleService } from '../../api/people.service';
import { ScheduleEditor } from './ScheduleEditor';

const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export const SchedulingPage: React.FC = () => {
  const { success, error } = useToast();
  const [periods, setPeriods] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [view, setView] = useState<'section' | 'teacher' | 'editor'>('section');
  const [generating, setGenerating] = useState(false);

  const [areas, setAreas] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [exp, setExp] = useState({ sedeId: '', turnoId: '', areaId: '', teacherProfileId: '', sectionId: '' });
  const [exporting, setExporting] = useState(false);

  const [validation, setValidation] = useState<any | null>(null);
  const [validating, setValidating] = useState(false);

  // Filtros para vistas
  const [sectionFilterSede, setSectionFilterSede] = useState('');
  const [sectionFilterTurno, setSectionFilterTurno] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');

  const currentBlock = blocks.find((b) => b.id === selectedBlock);

  useEffect(() => {
    Promise.all([
      academicService.listAreas(), 
      peopleService.listTeachers(), 
      academicService.listSections(), 
      academicService.listSedes(), 
      academicService.listTurnos()
    ]).then(([a, t, s, se, tu]) => { 
      setAreas(a); setTeachers(t); setSections(s); setSedes(se); setTurnos(tu); 
    });
  }, []);

  useEffect(() => {
    academicService.listPeriods().then((p) => {
      setPeriods(p);
      const current = p.find((x: any) => x.isActive);
      if (current) setSelectedPeriod(current.id);
    });
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      academicService.listBlocks(selectedPeriod).then(setBlocks);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    if (selectedBlock) {
      schedulingService.getResult(selectedBlock).then(setSessions);
    } else {
      setSessions([]);
    }
  }, [selectedBlock]);

  const handleGenerate = async () => {
    if (!selectedBlock) { error('Selecciona un bloque'); return; }
    setGenerating(true);
    setResult(null);
    try {
      const r = await schedulingService.generate(selectedBlock);
      setResult(r);
      await schedulingService.getResult(selectedBlock).then(setSessions);
      if (r.unresolved.length === 0) success(`✅ Horario generado: ${r.totalSessions} sesiones`);
      else error(`⚠️ ${r.unresolved.length} secciones sin resolver`);
    } catch (err: any) { error(err.response?.data?.message || 'Error al generar'); }
    finally { setGenerating(false); }
  };

  const handleClear = async () => {
    if (!selectedBlock) return;
    try { 
      await schedulingService.clear(selectedBlock); 
      setSessions([]); 
      setResult(null); 
      success('✅ Horario limpiado'); 
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
  };

  const handleExport = async () => {
    if (!selectedBlock) { error('Selecciona un bloque'); return; }
    setExporting(true);
    try {
      await schedulingService.exportExcel(selectedBlock, exp);
      success('📥 Horario exportado');
    } catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setExporting(false); }
  };

  const handleValidate = async () => {
    if (!selectedBlock) { error('Selecciona un bloque'); return; }
    setValidating(true);
    try { setValidation(await schedulingService.validate(selectedBlock)); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setValidating(false); }
  };

  // Filtrar sesiones por sede/turno para vista sección
  const filteredSessionsForSection = useMemo(() => {
    return sessions.filter((s) =>
      (!sectionFilterSede || s.section.classroom.sede.id === sectionFilterSede) &&
      (!sectionFilterTurno || s.section.turno.id === sectionFilterTurno)
    );
  }, [sessions, sectionFilterSede, sectionFilterTurno]);

  // Filtrar sesiones por docente para vista docente
  const filteredSessionsForTeacher = useMemo(() => {
    if (!teacherFilter) return sessions;
    return sessions.filter((s) => s.teacherProfile.id === teacherFilter);
  }, [sessions, teacherFilter]);

  // ===== Vista por sección =====
  const renderBySection = () => {
    const bySection = new Map<string, any[]>();
    for (const s of filteredSessionsForSection) {
      if (!bySection.has(s.section.id)) bySection.set(s.section.id, []);
      bySection.get(s.section.id)!.push(s);
    }
    
    const sectionsCount = bySection.size;
    const totalSections = new Set(sessions.map(s => s.section.id)).size;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Filtros de vista */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%)',
              color: 'var(--color-primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <EyeIcon style={{ width: 20, height: 20 }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
                Vista por sección
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
                Mostrando {sectionsCount} de {totalSections} secciones
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <Select
              label="Sede"
              value={sectionFilterSede}
              onChange={(e) => setSectionFilterSede(e.target.value)}
              options={[{ value: '', label: 'Todas las sedes' }, ...sedes.map((s) => ({ value: s.id, label: s.name }))]}
            />
            <Select
              label="Turno"
              value={sectionFilterTurno}
              onChange={(e) => setSectionFilterTurno(e.target.value)}
              options={[{ value: '', label: 'Todos los turnos' }, ...turnos.map((t) => ({ value: t.id, label: t.name }))]}
            />
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button
                variant="ghost"
                onClick={() => { setSectionFilterSede(''); setSectionFilterTurno(''); }}
                icon={<XIcon />}
                disabled={!sectionFilterSede && !sectionFilterTurno}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </Card>

        {bySection.size === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-neutral-400)' }}>
              <BuildingOffice2Icon style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>
                {sectionFilterSede || sectionFilterTurno ? 'No hay secciones con estos filtros' : 'Aún no hay horario generado para este bloque'}
              </div>
              <div style={{ fontSize: 'var(--text-sm)' }}>
                {sectionFilterSede || sectionFilterTurno ? 'Intenta ajustar los filtros' : 'Haz clic en "Generar" para crear el horario'}
              </div>
            </div>
          </Card>
        ) : (
          Array.from(bySection.entries()).map(([secId, secs]) => {
            const section = secs[0].section;
            const grid: (any | null)[][] = Array.from({ length: 5 }, () => [null, null]);
            for (const s of secs) grid[s.dayOfWeek - 1][s.slot - 1] = s;
            return (
              <Card key={secId}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--color-neutral-200)' }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'var(--color-primary-50)',
                    color: 'var(--color-primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <BuildingOffice2Icon style={{ width: 20, height: 20 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
                      {section.name}
                    </h3>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 2, display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BuildingOfficeIcon style={{ width: 12, height: 12 }} />
                        {section.classroom.sede.name}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ClockIcon style={{ width: 12, height: 12 }} />
                        {section.turno.name}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>Slot</th>
                        {[1, 2, 3, 4, 5].map((d) => <th key={d}>{DAY_NAMES[d]}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2].map((slot) => (
                        <tr key={slot}>
                          <td>
                            <Badge color="neutral">Slot {slot}</Badge>
                          </td>
                          {[1, 2, 3, 4, 5].map((d) => {
                            const s = grid[d - 1][slot - 1];
                            return (
                              <td 
                                key={d} 
                                style={s ? { 
                                  background: 'var(--color-primary-50)',
                                  borderLeft: '3px solid var(--color-primary-400)'
                                } : { background: 'var(--color-neutral-50)' }}
                              >
                                {s ? (
                                  <>
                                    <div style={{ fontWeight: 600, color: 'var(--color-primary-900)', fontSize: 'var(--text-sm)' }}>
                                      {s.course.name}
                                    </div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)', marginTop: 2 }}>
                                      {s.teacherProfile.person.lastName}, {s.teacherProfile.person.firstName}
                                    </div>
                                  </>
                                ) : (
                                  <span style={{ color: 'var(--color-neutral-300)', fontSize: 'var(--text-xs)' }}>—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })
        )}
      </div>
    );
  };

  // ===== Vista por docente =====
  const renderByTeacher = () => {
    const byTeacher = new Map<string, any[]>();
    for (const s of filteredSessionsForTeacher) {
      if (!byTeacher.has(s.teacherProfile.id)) byTeacher.set(s.teacherProfile.id, []);
      byTeacher.get(s.teacherProfile.id)!.push(s);
    }

    const teachersCount = byTeacher.size;
    const totalTeachers = new Set(sessions.map(s => s.teacherProfile.id)).size;
    const selectedTeacherInfo = teachers.find(t => t.teacherProfile.id === teacherFilter);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Filtro de docente */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--color-success-50) 0%, var(--color-success-100) 100%)',
              color: 'var(--color-success-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <EyeIcon style={{ width: 20, height: 20 }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
                Vista por docente
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
                {teacherFilter 
                  ? `Viendo horario de ${selectedTeacherInfo?.firstName} ${selectedTeacherInfo?.lastName}`
                  : `Mostrando ${teachersCount} de ${totalTeachers} docentes`}
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
            <SearchableSelect
              label="Filtrar por docente"
              value={teacherFilter}
              onChange={(v) => setTeacherFilter(v)}
              options={[
                { value: '', label: 'Todos los docentes' },
                ...teachers.map((t: any) => ({ 
                  value: t.teacherProfile.id, 
                  label: `${t.lastName}, ${t.firstName}`,
                  hint: t.dni
                }))
              ]}
              placeholder="Buscar docente por nombre o DNI..."
            />
            {teacherFilter && (
              <Button
                variant="ghost"
                onClick={() => setTeacherFilter('')}
                icon={<XIcon />}
              >
                Ver todos
              </Button>
            )}
          </div>
        </Card>

        {byTeacher.size === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-neutral-400)' }}>
              <UsersIcon style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>
                {teacherFilter ? 'El docente seleccionado no tiene sesiones' : 'Sin horario generado'}
              </div>
            </div>
          </Card>
        ) : (
          Array.from(byTeacher.entries()).map(([tId, secs]) => {
            const person = secs[0].teacherProfile.person;
            const grid: (any | null)[][] = Array.from({ length: 5 }, () => [null, null]);
            for (const s of secs) grid[s.dayOfWeek - 1][s.slot - 1] = s;
            return (
              <Card key={tId}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--color-neutral-200)' }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-success-100) 0%, var(--color-success-200) 100%)',
                    color: 'var(--color-success-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {person.firstName[0]}{person.lastName[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
                      {person.lastName}, {person.firstName}
                    </h3>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 2, display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Badge color="success">{secs.length} sesiones/semana</Badge>
                      {person.dni && <span>DNI: {person.dni}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>Slot</th>
                        {[1, 2, 3, 4, 5].map((d) => <th key={d}>{DAY_NAMES[d]}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2].map((slot) => (
                        <tr key={slot}>
                          <td>
                            <Badge color="neutral">Slot {slot}</Badge>
                          </td>
                          {[1, 2, 3, 4, 5].map((d) => {
                            const s = grid[d - 1][slot - 1];
                            return (
                              <td 
                                key={d} 
                                style={s ? { 
                                  background: 'var(--color-success-50)',
                                  borderLeft: '3px solid var(--color-success-400)'
                                } : { background: 'var(--color-neutral-50)' }}
                              >
                                {s ? (
                                  <>
                                    <div style={{ fontWeight: 600, color: 'var(--color-success-700)', fontSize: 'var(--text-sm)' }}>
                                      {s.course.name}
                                    </div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)', marginTop: 2 }}>
                                      {s.section.name}
                                    </div>
                                  </>
                                ) : (
                                  <span style={{ color: 'var(--color-neutral-400)', fontSize: 'var(--text-xs)', fontStyle: 'italic' }}>libre</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })
        )}
      </div>
    );
  };

  // ===== RENDER =====
  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDaysIcon style={{ width: 24, height: 24, color: 'var(--color-primary-600)' }} />
            <h1 className="page-title">Generador de Horarios</h1>
          </div>
          <p className="page-subtitle">Asignación automática respetando disponibilidad y prioridades</p>
        </div>
      </div>

      {/* Card de configuración principal */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%)',
            color: 'var(--color-primary-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <SparklesIcon style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
              Generador automático
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
              Selecciona período y bloque para generar el horario
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Select 
            label="Período" 
            value={selectedPeriod} 
            onChange={(e) => { setSelectedPeriod(e.target.value); setSelectedBlock(''); setSessions([]); setResult(null); }}
            options={periods.map((p) => ({ value: p.id, label: p.name }))} 
            style={{ minWidth: 180 }} 
          />
          <Select 
            label="Bloque" 
            value={selectedBlock} 
            onChange={(e) => setSelectedBlock(e.target.value)}
            options={[{ value: '', label: 'Selecciona bloque' }, ...blocks.map((b) => ({ value: b.id, label: `${b.name} (S${b.startWeek}-S${b.endWeek})` }))]} 
            style={{ minWidth: 220 }} 
          />
          <Button 
            onClick={handleGenerate} 
            isLoading={generating} 
            loadingText="Generando..."
            disabled={!selectedBlock}
            icon={<PlayIcon />}
          >
            Generar horario
          </Button>
          {selectedBlock && (
            <Button 
              variant="danger" 
              onClick={handleClear}
              icon={<TrashIcon />}
            >
              Limpiar
            </Button>
          )}
          <Button 
            variant="secondary" 
            onClick={handleValidate} 
            isLoading={validating} 
            loadingText="Validando..."
            disabled={!selectedBlock}
            icon={<ShieldCheckIcon />}
          >
            Validar cruces
          </Button>
        </div>
      </Card>

      {/* Card de exportación */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--color-success-50) 0%, var(--color-success-100) 100%)',
            color: 'var(--color-success-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ArrowDownTrayIcon style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
              Exportar horario a Excel
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
              Filtra y exporta el horario en formato Excel
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
          <Select 
            label="Sede" 
            value={exp.sedeId} 
            onChange={(e) => setExp({ ...exp, sedeId: e.target.value })}
            options={[{ value: '', label: 'Todas' }, ...sedes.map((s: any) => ({ value: s.id, label: s.name }))]} 
          />
          <Select 
            label="Turno" 
            value={exp.turnoId} 
            onChange={(e) => setExp({ ...exp, turnoId: e.target.value })}
            options={[{ value: '', label: 'Todos' }, ...turnos.map((t: any) => ({ value: t.id, label: t.name }))]} 
          />
          <Select 
            label="Área" 
            value={exp.areaId} 
            onChange={(e) => setExp({ ...exp, areaId: e.target.value })}
            options={[{ value: '', label: 'Todas' }, ...areas.map((a: any) => ({ value: a.id, label: a.name }))]} 
          />
          <SearchableSelect 
            label="Docente" 
            value={exp.teacherProfileId} 
            onChange={(v) => setExp({ ...exp, teacherProfileId: v })}
            options={teachers.map((t: any) => ({ value: t.teacherProfile.id, label: `${t.lastName}, ${t.firstName}` }))} 
            placeholder="Buscar docente..." 
          />
          <SearchableSelect 
            label="Sección" 
            value={exp.sectionId} 
            onChange={(v) => setExp({ ...exp, sectionId: v })}
            options={sections.map((s: any) => ({ value: s.id, label: s.name, hint: s.classroom?.sede?.name }))} 
            placeholder="Buscar sección..." 
          />
        </div>
        <Button 
          variant="success" 
          onClick={handleExport} 
          isLoading={exporting} 
          loadingText="Exportando..."
          disabled={!selectedBlock}
          icon={<ArrowDownTrayIcon />}
        >
          Exportar a Excel
        </Button>
      </Card>

      {/* Stats de resultado */}
      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
          <Card className="p-4" style={{ background: 'var(--color-primary-50)', borderColor: 'var(--color-primary-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <BuildingOffice2Icon style={{ width: 20, height: 20, color: 'var(--color-primary-600)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-700)', fontWeight: 500 }}>Secciones</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-primary-700)' }}>
              {result.totalSections}
            </div>
          </Card>
          <Card className="p-4" style={{ background: 'var(--color-success-50)', borderColor: 'var(--color-success-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <CheckCircleIcon style={{ width: 20, height: 20, color: 'var(--color-success-600)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success-700)', fontWeight: 500 }}>Resueltas</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-success-700)' }}>
              {result.resolved}
            </div>
          </Card>
          <Card className="p-4" style={{ background: result.unresolved.length > 0 ? 'var(--color-danger-50)' : 'var(--color-neutral-50)', borderColor: result.unresolved.length > 0 ? 'var(--color-danger-200)' : 'var(--color-neutral-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <XCircleIcon style={{ width: 20, height: 20, color: result.unresolved.length > 0 ? 'var(--color-danger-600)' : 'var(--color-neutral-500)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: result.unresolved.length > 0 ? 'var(--color-danger-700)' : 'var(--color-neutral-600)', fontWeight: 500 }}>Sin resolver</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: result.unresolved.length > 0 ? 'var(--color-danger-700)' : 'var(--color-neutral-700)' }}>
              {result.unresolved.length}
            </div>
          </Card>
          <Card className="p-4" style={{ background: 'var(--color-info-50)', borderColor: 'var(--color-info-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <CalendarDaysIcon style={{ width: 20, height: 20, color: 'var(--color-info-600)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-info-700)', fontWeight: 500 }}>Sesiones</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-info-700)' }}>
              {result.totalSessions}
            </div>
          </Card>
          <Card className="p-4" style={{ background: 'var(--color-warning-50)', borderColor: 'var(--color-warning-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <UsersIcon style={{ width: 20, height: 20, color: 'var(--color-warning-600)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning-700)', fontWeight: 500 }}>Docentes</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-warning-700)' }}>
              {result.teachersUsed}
            </div>
          </Card>
        </div>
      )}

      {/* Alerta de secciones sin resolver */}
      {result && result.unresolved.length > 0 && (
        <Card style={{ marginBottom: 16, background: 'var(--color-danger-50)', borderColor: 'var(--color-danger-300)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <ExclamationTriangleIcon style={{ width: 24, height: 24, color: 'var(--color-danger-600)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--color-danger-900)' }}>
                {result.unresolved.length} sección(es) sin resolver
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {result.unresolved.map((u: any) => (
                  <li key={u.sectionId} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-danger-800)', marginBottom: 4 }}>
                    <strong>{u.sectionName}</strong>: {u.reason}
                  </li>
                ))}
              </ul>
              <div style={{ 
                fontSize: 'var(--text-xs)', 
                color: 'var(--color-danger-700)', 
                marginTop: 12,
                padding: '8px 12px',
                background: 'var(--color-danger-100)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <InformationCircleIcon style={{ width: 14, height: 14 }} />
                <span>
                  <strong>Sugerencia:</strong> verifica que haya suficientes docentes con los cursos del bloque y disponibilidad compatible.
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Validación */}
      {validation && (
        <Card style={{ 
          marginBottom: 16, 
          background: validation.conflicts.length ? 'var(--color-danger-50)' : 'var(--color-success-50)',
          borderColor: validation.conflicts.length ? 'var(--color-danger-300)' : 'var(--color-success-300)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            {validation.conflicts.length ? (
              <XCircleIcon style={{ width: 24, height: 24, color: 'var(--color-danger-600)', flexShrink: 0 }} />
            ) : (
              <CheckCircleIcon style={{ width: 24, height: 24, color: 'var(--color-success-600)', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                fontSize: 'var(--text-base)', 
                fontWeight: 700, 
                margin: '0 0 8px 0',
                color: validation.conflicts.length ? 'var(--color-danger-900)' : 'var(--color-success-900)'
              }}>
                {validation.conflicts.length 
                  ? `${validation.conflicts.length} cruce(s) detectados` 
                  : 'Sin cruces detectados'}
                <span style={{ 
                  fontSize: 'var(--text-sm)', 
                  fontWeight: 400, 
                  marginLeft: 8,
                  color: validation.conflicts.length ? 'var(--color-danger-700)' : 'var(--color-success-700)'
                }}>
                  · {validation.totalSessions} sesiones
                </span>
              </h3>
              {validation.conflicts.map((c: any, i: number) => (
                <div 
                  key={i} 
                  style={{ 
                    fontSize: 'var(--text-sm)', 
                    color: 'var(--color-danger-800)', 
                    padding: '6px 10px',
                    background: 'var(--color-danger-100)',
                    borderRadius: 4,
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span style={{ fontSize: '1.1em' }}>⛔</span> {c.message}
                </div>
              ))}
              {validation.warnings.map((w: any, i: number) => (
                <div 
                  key={i} 
                  style={{ 
                    fontSize: 'var(--text-sm)', 
                    color: 'var(--color-warning-800)', 
                    padding: '6px 10px',
                    background: 'var(--color-warning-100)',
                    borderRadius: 4,
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span style={{ fontSize: '1.1em' }}>⚠️</span> {w.message}
                </div>
              ))}
              {!validation.conflicts.length && !validation.warnings.length && (
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-success-700)' }}>
                  El horario no presenta conflictos ni advertencias.
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Vista de resultados: solo si NO estamos en editor */}
      {sessions.length > 0 && view !== 'editor' && (
        <>
          {/* Tabs de vista */}
          <div style={{
            display: 'inline-flex', 
            gap: 4, 
            marginBottom: 16,
            background: 'var(--color-neutral-100)', 
            padding: 4, 
            borderRadius: 12,
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={() => setView('section')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 8,
                fontSize: 'var(--text-sm)', fontWeight: 600,
                transition: 'all 0.2s',
                background: view === 'section' ? 'var(--color-neutral-0)' : 'transparent',
                color: view === 'section' ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
                boxShadow: view === 'section' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <BuildingOffice2Icon style={{ width: 16, height: 16 }} /> 
              Por sección
            </button>
            <button
              onClick={() => setView('teacher')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 8,
                fontSize: 'var(--text-sm)', fontWeight: 600,
                transition: 'all 0.2s',
                background: view === 'teacher' ? 'var(--color-neutral-0)' : 'transparent',
                color: view === 'teacher' ? 'var(--color-primary-600)' : 'var(--color-neutral-600)',
                boxShadow: view === 'teacher' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <UserGroupIcon style={{ width: 16, height: 16 }} /> 
              Por docente
            </button>
            <button
              onClick={() => setView('editor')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 8,
                fontSize: 'var(--text-sm)', fontWeight: 600,
                transition: 'all 0.2s',
                background: 'transparent',
                color: 'var(--color-neutral-600)',
                border: '1px dashed var(--color-neutral-300)',
              }}
            >
              <PencilSquareIcon style={{ width: 16, height: 16 }} /> 
              Editar sesiones
            </button>
          </div>

          {view === 'section' ? renderBySection() : renderByTeacher()}
        </>
      )}

      {/* Vista de editor: ocupa todo, sin tabs */}
      {sessions.length > 0 && view === 'editor' && currentBlock && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
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
                <PencilSquareIcon style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-neutral-900)' }}>
                  Editor de sesiones
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
                  Modifica sesiones individuales preservando el histórico de asistencias
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => setView('section')}
              icon={<XIcon />}
            >
              Salir del editor
            </Button>
          </div>
          <ScheduleEditor block={currentBlock} onExit={() => setView('section')} />
        </div>
      )}
    </div>
  );
};