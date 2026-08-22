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
};