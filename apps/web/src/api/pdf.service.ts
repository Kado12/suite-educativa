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
};