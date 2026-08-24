import api from './axios';

export const pdfService = {
  downloadStudentRecord: async (studentId: string, dni?: string) => {
    const res = await api.get(`/api/pdf/student-record/${studentId}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ficha-${dni || studentId}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  },

  downloadStudentCard: async (id: string, dni?: string) => {
    const res = await api.get(`/api/pdf/student-card/${id}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement('a'); a.href = url; a.download = `carne-${dni || id}.pdf`; a.click();
    window.URL.revokeObjectURL(url);
  },
};