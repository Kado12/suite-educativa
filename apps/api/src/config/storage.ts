export const APP_ENV =
  process.env.APP_ENV || (process.env.NODE_ENV === 'production' ? 'production' : 'development');

export const STORAGE_FOLDER = `suite-educativa/${APP_ENV === 'production' ? 'prod' : 'dev'}`;

export const photoPublicId = (dni: string) => `${STORAGE_FOLDER}/${dni}`;