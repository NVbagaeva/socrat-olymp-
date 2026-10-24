/* Хранилище фото: S3-совместимый бакет (Yandex Object Storage) или
   папка на диске (только проверки). Публичного доступа к бакету нет:
   чтение — по подписанной ссылке с коротким сроком. */

import fs from 'node:fs/promises';
import path from 'node:path';
import { AwsClient } from 'aws4fetch';

export function s3Storage({ endpoint, bucket, region, accessKeyId, secretAccessKey }) {
  const aws = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region });
  const url = (key) => `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`;
  return {
    async put(key, data) {
      const res = await aws.fetch(url(key), {
        method: 'PUT',
        body: data,
        headers: { 'content-type': 'image/jpeg', 'x-amz-server-side-encryption': 'AES256' },
      });
      if (!res.ok) throw new Error(`s3 put ${res.status}`);
    },
    async remove(key) {
      const res = await aws.fetch(url(key), { method: 'DELETE' });
      if (!res.ok && res.status !== 404) throw new Error(`s3 delete ${res.status}`);
    },
    async signedUrl(key, seconds) {
      const u = new URL(url(key));
      u.searchParams.set('X-Amz-Expires', String(seconds));
      const signed = await aws.sign(u.toString(), { method: 'GET', aws: { signQuery: true } });
      return signed.url;
    },
  };
}

/** Для проверок: файлы в папке, «подписанная ссылка» — путь с отметкой срока. */
export function fsStorage(dir) {
  return {
    async put(key, data) {
      const file = path.join(dir, key);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, data);
    },
    async remove(key) {
      await fs.rm(path.join(dir, key), { force: true });
    },
    async signedUrl(key, seconds) {
      return `file://${path.join(dir, key)}?expires=${Date.now() + seconds * 1000}`;
    },
    dir,
  };
}
