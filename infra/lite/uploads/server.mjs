/* Запуск сервиса загрузки (контейнер uploads в infra/lite/compose.yml).
   Окружение: DATABASE_URL (роль uploads), JWT_SECRET, S3_ENDPOINT,
   S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY. */

import http from 'node:http';
import pg from 'pg';
import { createApp } from './lib/app.mjs';
import { s3Storage } from './lib/storage.mjs';

const need = (k) => {
  const v = process.env[k];
  if (!v) {
    console.error(`нет ${k}`);
    process.exit(2);
  }
  return v;
};

const pool = new pg.Pool({ connectionString: need('DATABASE_URL'), max: 4 });
const storage = s3Storage({
  endpoint: need('S3_ENDPOINT'),
  bucket: need('S3_BUCKET'),
  region: process.env.S3_REGION ?? 'ru-central1',
  accessKeyId: need('S3_ACCESS_KEY_ID'),
  secretAccessKey: need('S3_SECRET_ACCESS_KEY'),
});
// PHOTO_KEEP_DAYS — сколько дней хранить фото (не дольше конца учебного года).
const keep = Number(process.env.PHOTO_KEEP_DAYS ?? '');
const keepDays = Number.isInteger(keep) && keep > 0 ? keep : null;
const handle = createApp({ pool, storage, jwtSecret: need('JWT_SECRET'), keepDays });
http.createServer(handle).listen(8080, () => console.log('uploads: 8080'));
