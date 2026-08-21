import api from './axios';

const download = (res: any, name: string) => {
  const url = window.URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  window.URL.revokeObjectURL(url);
};

export const toolsService = {
  preview: (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post('/api/tools/preview', fd).then((r) => r.data);
  },

  downloadTemplate: async (type: string) => {
    const res = await api.get(`/api/tools/template/${type}`, { responseType: 'blob' });
    download(res, `plantilla-${type}.xlsx`);
  },

  compare: (a: File, b: File) => {
    const fd = new FormData(); fd.append('fileA', a); fd.append('fileB', b);
    return api.post('/api/tools/compare', fd).then((r) => r.data);
  },
  compareExport: async (a: File, b: File) => {
    const fd = new FormData(); fd.append('fileA', a); fd.append('fileB', b);
    download(await api.post('/api/tools/compare/export', fd, { responseType: 'blob' }), 'comparativa.xlsx');
  },

  transform: (f: File) => {
    const fd = new FormData(); fd.append('file', f);
    return api.post('/api/tools/schedule/transform', fd).then((r) => r.data);
  },
  transformExport: async (f: File) => {
    const fd = new FormData(); fd.append('file', f);
    download(await api.post('/api/tools/schedule/transform/export', fd, { responseType: 'blob' }), 'horario_ordenado.xlsx');
  },

  cross: (info: File, sched: File) => {
    const fd = new FormData(); fd.append('fileInfo', info); fd.append('fileSchedule', sched);
    return api.post('/api/tools/cross', fd).then((r) => r.data);
  },
  crossExport: async (info: File, sched: File) => {
    const fd = new FormData(); fd.append('fileInfo', info); fd.append('fileSchedule', sched);
    download(await api.post('/api/tools/cross/export', fd, { responseType: 'blob' }), 'horario_con_dni.xlsx');
  },
};