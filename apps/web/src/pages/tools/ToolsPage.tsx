import React, { useState } from 'react';
import { Card, Button } from '@suite/ui';
import { useToast } from '../../context/ToastContext';
import { toolsService } from '../../api/tools.service';

const FileInput: React.FC<{ label: string; onFile: (f: File | null) => void }> = ({ label, onFile }) => (
  <div>
    <label className="input-label">{label}</label>
    <input type="file" accept=".xlsx,.xls" onChange={(e) => onFile(e.target.files?.[0] || null)} className="input" />
  </div>
);

const ResultTable: React.FC<{ headers: string[]; rows: any[]; max?: number }> = ({ headers, rows, max = 50 }) => (
  <Card className="p-0" style={{ marginTop: 12 }}>
    <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
      <table className="table">
        <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.slice(0, max).map((r, i) => (
            <tr key={i}>{headers.map((h) => <td key={h}>{String(r[h] ?? '')}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
    {rows.length > max && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', padding: 8 }}>Mostrando {max} de {rows.length}. Descarga el Excel para ver todo.</p>}
  </Card>
);

export const ToolsPage: React.FC = () => {
  const { success, error } = useToast();
  const [tab, setTab] = useState<'compare' | 'schedule' | 'cross'>('compare');
  const [busy, setBusy] = useState(false);

  // compare
  const [cA, setCA] = useState<File | null>(null); const [cB, setCB] = useState<File | null>(null); const [cRes, setCRes] = useState<any>(null);
  // schedule
  const [sF, setSF] = useState<File | null>(null); const [sRes, setSRes] = useState<any>(null);
  // cross
  const [xI, setXI] = useState<File | null>(null); const [xS, setXS] = useState<File | null>(null); const [xRes, setXRes] = useState<any>(null);

  const run = async (fn: () => Promise<any>, setter: (r: any) => void) => {
    setBusy(true);
    try { const r = await fn(); setter(r); success('✅ Procesado'); }
    catch (err: any) { error(err.response?.data?.message || 'Error'); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Herramientas</h1>
          <p className="page-subtitle">Utilidades Excel migradas de los scripts de Python</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setTab('compare')} className={`btn ${tab === 'compare' ? 'btn-primary' : 'btn-secondary'}`}>🔀 Comparar por DNI</button>
        <button onClick={() => setTab('schedule')} className={`btn ${tab === 'schedule' ? 'btn-primary' : 'btn-secondary'}`}>🗓️ Transformar horario</button>
        <button onClick={() => setTab('cross')} className={`btn ${tab === 'cross' ? 'btn-primary' : 'btn-secondary'}`}>🔗 Cruzar con docentes</button>
      </div>

      {tab === 'compare' && (
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <FileInput label="Registro Total (A)" onFile={setCA} />
            <FileInput label="Registro Parcial (B)" onFile={setCB} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => run(() => toolsService.compare(cA!, cB!), setCRes)} isLoading={busy} disabled={!cA || !cB}>Comparar</Button>
              {cRes && <Button variant="success" onClick={() => toolsService.compareExport(cA!, cB!)}>📥</Button>}
            </div>
          </div>
          {cRes && (
            <>
              <p style={{ margin: '12px 0', fontSize: 'var(--text-sm)' }}>
                ✅ Ambos: <strong>{cRes.summary.both}</strong> · Solo A: <strong style={{ color: 'var(--color-danger-500)' }}>{cRes.summary.onlyA}</strong> · Solo B: <strong style={{ color: 'var(--color-danger-500)' }}>{cRes.summary.onlyB}</strong>
              </p>
              <ResultTable headers={cRes.onlyA.headers} rows={cRes.onlyA.rows} />
            </>
          )}
        </Card>
      )}

      {tab === 'schedule' && (
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
            <FileInput label="Horario (formato ancho)" onFile={setSF} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => run(() => toolsService.transform(sF!), setSRes)} isLoading={busy} disabled={!sF}>Transformar</Button>
              {sRes && <Button variant="success" onClick={() => toolsService.transformExport(sF!)}>📥</Button>}
            </div>
          </div>
          {sRes && <ResultTable headers={['AULA', 'DOCENTE', 'CURSO', 'DIA_SEMANA']} rows={sRes.rows} />}
        </Card>
      )}

      {tab === 'cross' && (
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <FileInput label="Docentes (NOMBRES/APELLIDOS/DNI)" onFile={setXI} />
            <FileInput label="Horario (DOCENTE)" onFile={setXS} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => run(() => toolsService.cross(xI!, xS!), setXRes)} isLoading={busy} disabled={!xI || !xS}>Cruzar</Button>
              {xRes && <Button variant="success" onClick={() => toolsService.crossExport(xI!, xS!)}>📥</Button>}
            </div>
          </div>
          {xRes && (
            <>
              <p style={{ margin: '12px 0', fontSize: 'var(--text-sm)' }}>
                ✅ Exactos: <strong>{xRes.summary.exact}</strong> · 🔎 Fuzzy: <strong style={{ color: 'var(--color-warning-700)' }}>{xRes.summary.fuzzy}</strong> · ❌ No encontrados: <strong style={{ color: 'var(--color-danger-500)' }}>{xRes.summary.notFound}</strong>
              </p>
              <ResultTable headers={xRes.rows.length ? Object.keys(xRes.rows[0]) : []} rows={xRes.rows} />
            </>
          )}
        </Card>
      )}
    </div>
  );
};