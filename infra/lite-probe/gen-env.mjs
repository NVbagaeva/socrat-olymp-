#!/usr/bin/env node
/**
 * Секреты облегчённого набора: пароль базы, ключ подписи JWT, ключи
 * anon и service_role. Пишет .env рядом с compose.yml.
 *
 * Значения создаются там, где запускается набор (в пробе — на машине
 * CI, на сервере — на самом сервере), и никуда не печатаются.
 * Файл .env в репозиторий не попадает (.gitignore).
 *
 *   node gen-env.mjs                 — пробный набор (адреса localhost)
 *   node gen-env.mjs --force         — перезаписать существующий .env
 */
import { createHmac, randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, '.env');

if (existsSync(target) && !process.argv.includes('--force')) {
  console.error('.env уже есть; перезаписать: --force');
  process.exit(1);
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');
/* Без символов, которые ломают строку подключения postgres://. */
const secret = (bytes) => randomBytes(bytes).toString('hex');

/* Ключи в том же виде, что у Supabase: HS256, iss=supabase, роль в
   поле role. supabase-js и PostgREST принимают их без изменений. */
function apiKey(role, jwtSecret) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({ role, iss: 'supabase', iat: now, exp: now + 10 * 365 * 24 * 3600 }),
  );
  const signature = createHmac('sha256', jwtSecret).update(`${header}.${payload}`).digest();
  return `${header}.${payload}.${b64url(signature)}`;
}

const jwtSecret = secret(32);
const env = {
  POSTGRES_PASSWORD: secret(24),
  AUTHENTICATOR_PASSWORD: secret(24),
  AUTH_ADMIN_PASSWORD: secret(24),
  JWT_SECRET: jwtSecret,
  ANON_KEY: apiKey('anon', jwtSecret),
  SERVICE_ROLE_KEY: apiKey('service_role', jwtSecret),
};

writeFileSync(
  target,
  Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n') + '\n',
  { mode: 0o600 },
);
console.log(`Записан ${target}: ${Object.keys(env).join(', ')} (значения не печатаются)`);
