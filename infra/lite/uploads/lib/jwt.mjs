/* Проверка JWT GoTrue (HS256, общий ключ JWT_SECRET) без библиотек.
   Принимаются только токены вошедших: role = authenticated, срок не
   истёк, есть sub. Ключ anon и service_role здесь не годятся. */

import { createHmac, timingSafeEqual } from 'node:crypto';

const b64url = (buf) => Buffer.from(buf).toString('base64url');

export function verifyJwt(token, secret, now = Date.now()) {
  const parts = String(token ?? '').split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  let header;
  let payload;
  try {
    header = JSON.parse(Buffer.from(h, 'base64url').toString('utf8'));
    payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (header.alg !== 'HS256') return null;
  const want = createHmac('sha256', secret).update(`${h}.${p}`).digest();
  const got = Buffer.from(s, 'base64url');
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  if (typeof payload.exp !== 'number' || payload.exp * 1000 <= now) return null;
  if (payload.role !== 'authenticated') return null;
  if (typeof payload.sub !== 'string' || !/^[0-9a-f-]{36}$/.test(payload.sub)) return null;
  return payload;
}

/** Для проверок: подписать токен тем же ключом. */
export function signJwt(payload, secret) {
  const h = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const p = b64url(JSON.stringify(payload));
  const s = createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url');
  return `${h}.${p}.${s}`;
}
