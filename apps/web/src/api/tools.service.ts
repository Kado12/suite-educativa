import api from './axios';

const download = (res: any, name: string) => {
  const url = window.URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  window.URL.revokeObjectURL(url);
};

export const toolsService = {
  compare: (a: File, b: File) => {
    const fd = new FormData(); fd.append('fileA', a); fd.append('fileB', b);
    return api.post('/api/tools/compare', fd).then((r) => r.data);
  },
  compareExport: async (a: File, b: File) => download(await api.post('/api/tools/compare/export', (() => { const fd = new FormData(); fd.append('fileA', a); fd.append('fileB', b); return fd; })(), { responseType: 'blob' }), 'comparativa.xlsx'),
  transform: (f: File) => { const fd = new FormData(); fd.append('file', f); return api.post('/api/tools/schedule/transform', fd).then((r) => r.data); },
  transformExport: async (f: File) => download(await api.post('/api/tools/schedule/transform/export', (() => { const fd = new FormData(); fd.append('file', f); return fd; })(), { responseType: 'blob' }), 'horario_ordenado.xlsx'),
  cross: (info: File, sched: File) => { const fd = new FormData(); fd.append('fileInfo', info); fd.append('fileSchedule', sched); return api.post('/api/tools/cross', fd).then((r) => r.data); },
  crossExport: async (info: File, sched: File) => download(await api.post('/api/tools/cross/export', (() => { const fd = new FormData(); fd.append('fileInfo', info); fd.append('fileSchedule', sched); return fd; })(), { responseType: 'blob' }), 'horario_con_dni.xlsx'),
};