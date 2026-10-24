/* Срок хранения фото: файлы и строки фото с истёкшим сроком удаляются,
   баллы, критерии и комментарии остаются. Запускается ночным таймером
   на сервере (bin/photos-retention.sh). */

import pg from 'pg';
import { s3Storage } from './lib/storage.mjs';

export async function udalitIstekshie(pool, storage, limit = 500) {
  const c = await pool.connect();
  let n = 0;
  try {
    await c.query('set role service_role');
    const rows = (await c.query(
      'select id, object_key from public.photos where expires_at < now() order by expires_at limit $1', [limit])).rows;
    for (const r of rows) {
      await storage.remove(r.object_key);
      await c.query('delete from public.photos where id = $1', [r.id]);
      n += 1;
    }
  } finally {
    c.release();
  }
  return n;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const storage = s3Storage({
    endpoint: process.env.S3_ENDPOINT,
    bucket: process.env.S3_BUCKET,
    region: process.env.S3_REGION ?? 'ru-central1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  });
  const n = await udalitIstekshie(pool, storage);
  console.log(`фото с истёкшим сроком удалено: ${n}`);
  await pool.end();
}
