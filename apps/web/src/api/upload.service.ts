import api from './axios';

export const uploadService = {
  uploadImage: (file: File, publicId?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    if (publicId) fd.append('publicId', publicId);
    return api.post('/api/upload/image', fd).then((r) => r.data);
  },

  replaceImage: (file: File, oldPublicId: string | null, newPublicId: string) => {
    const fd = new FormData();
    fd.append('file', file);
    if (oldPublicId) fd.append('oldPublicId', oldPublicId);
    fd.append('newPublicId', newPublicId);
    return api.post('/api/upload/replace-image', fd).then((r) => r.data);
  },

  bulkStudentPhotos: (files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    return api.post('/api/upload/bulk-student-photos', fd).then((r) => r.data);
  },
};