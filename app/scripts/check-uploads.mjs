#!/usr/bin/env node
/* scripts/check-uploads.mjs — сервис загрузки фото части 2
   (infra/lite/uploads) на временном PostgreSQL и папке вместо бакета.

   Запуск: pnpm test:uploads

     1. Без входа — 401; с ключом anon вместо токена пользователя — 401.
     2. Фото с EXIF (геометка, поворот) перекодируется: поворот применён,
        длинная сторона ≤ 2000, около 1 МБ, метаданных нет.
     3. Не изображение (текст с расширением .jpg) и HEIC — 415, больше
        4 МБ — 413; лимит загрузок в час — 429.
     4. Подписанная ссылка: своему ученику и его учителю — да; другому
        ученику и учителю другого класса — 404, как несуществующее фото.
     5. Порядок и удаление; после сдачи загрузка закрыта (403).
     6. Автопроверка части 2 — тем же кодом, что сайт.
     7. Срок хранения: фото удаляются, баллы остаются.

   Ненулевой код возврата — проверка не прошла. */

import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startTempPg } from './lib/temp-pg.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const UP = path.join(ROOT, 'infra', 'lite', 'uploads');
const { createRequire } = await import('node:module');
const requireUp = createRequire(path.join(UP, 'package.json'));
const pg = requireUp('pg');
const sharp = requireUp('sharp');
const { createApp } = await import(path.join(UP, 'lib', 'app.mjs'));
const { fsStorage } = await import(path.join(UP, 'lib', 'storage.mjs'));
const { signJwt } = await import(path.join(UP, 'lib', 'jwt.mjs'));
const { udalitIstekshie } = await import(path.join(UP, 'retention.mjs'));

let failures = 0;
function ok(cond, what, extra = '') {
  if (cond) console.log(`  ✓ ${what}`);
  else {
    failures += 1;
    console.error(`  ✗ ${what} ${extra}`);
  }
}

const SECRET = 'test-secret-'.repeat(4);
const tok = (sub, role = 'authenticated') =>
  signJwt({ sub, role, exp: Math.floor(Date.now() / 1000) + 600 }, SECRET);
const S1 = 'c1000000-0000-0000-0000-000000000000';
const S2 = 'c2000000-0000-0000-0000-000000000000';
const T1 = 'b1000000-0000-0000-0000-000000000000';
const T2 = 'b2000000-0000-0000-0000-000000000000';

const db = startTempPg('uploads-pg-');
const store = fs.mkdtempSync(path.join(os.tmpdir(), 'uploads-store-'));
let server;
let pool;
try {
  db.createdb('raboty');
  db.file('raboty', path.join(ROOT, 'supabase', 'tests', 'supabase-stub.sql'));
  for (const f of fs.readdirSync(path.join(ROOT, 'supabase', 'migrations')).sort()) {
    if (f.endsWith('.sql')) db.file('raboty', path.join(ROOT, 'supabase', 'migrations', f));
  }
  db.file('raboty', path.join(ROOT, 'supabase', 'seed', 'kabinet_katalog.sql'));
  db.file('raboty', path.join(ROOT, 'supabase', 'tests', 'uploads_fixture.sql'));
  /* Роль сервиса, как на сервере: входит по паролю, переключается в
     authenticated (проверки прав) и service_role (запись фото). */
  db.sql('raboty', `create role uploads login password 'x' noinherit; grant authenticated, service_role to uploads;`);
  const WORK = db.sql('raboty', 'select id from public.test_work').stdout.trim();

  pool = new pg.Pool({ host: db.dir, port: Number(db.port), user: 'uploads', database: 'raboty', max: 3 });
  const app = createApp({ pool, storage: fsStorage(store), jwtSecret: SECRET, maxPerHour: 6 });
  server = http.createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const BASE = `http://127.0.0.1:${server.address().port}`;
  const call = (method, p, token, body, type = 'image/jpeg') =>
    fetch(BASE + p, {
      method,
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'content-type': type } : {}) },
      body,
    });

  console.log('1. Вход');
  ok((await call('GET', '/photo/x/url')).status === 401, 'без токена — 401');
  ok((await call('GET', '/photo/x/url', tok(S1, 'anon'))).status === 401, 'ключ anon вместо пользователя — 401');
  ok((await call('GET', '/photo/x/url', signJwt({ sub: S1, role: 'authenticated', exp: 1 }, SECRET))).status === 401, 'истёкший токен — 401');

  console.log('2. Перекодирование');
  /* 4000×3000 с поворотом EXIF 6 (снимок «боком») и геометкой. */
  const raw = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#e8e4dc' } })
    .composite([{ input: Buffer.from('<svg width="4000" height="3000"><rect x="100" y="100" width="1500" height="300" fill="#123"/></svg>') }])
    .jpeg({ quality: 95 })
    .withMetadata({ orientation: 6 })
    .withExif({ IFD0: { Make: 'Phone', Copyright: 'секрет' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '55/1 45/1 0/1' } })
    .toBuffer();
  ok((await sharp(raw).metadata()).exif !== undefined, 'у исходника есть EXIF');
  let r = await call('POST', `/photo?work=${WORK}&task=14&pos=1`, tok(S1), raw);
  const p1 = await r.json();
  ok(r.status === 200, 'фото загружено', JSON.stringify(p1));
  const key = db.sql('raboty', `select object_key from public.photos where id = '${p1.id}'`).stdout.trim();
  const stored = fs.readFileSync(path.join(store, key));
  const meta = await sharp(stored).metadata();
  ok(meta.format === 'jpeg', 'в бакете — JPEG');
  ok(meta.width === 1500 && meta.height === 2000, `поворот применён и сторона ≤ 2000 (${meta.width}×${meta.height})`);
  ok(meta.exif === undefined && meta.orientation === undefined, 'EXIF (и геометка) удалён');
  ok(stored.length <= 1_100_000, `размер около 1 МБ (${stored.length})`);

  console.log('3. Не изображение, HEIC, размер, лимит');
  r = await call('POST', `/photo?work=${WORK}&task=14&pos=2`, tok(S1), Buffer.from('это не фото, а текст '.repeat(20)));
  ok(r.status === 415, 'текст под видом .jpg — 415');
  const heic = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypheic'), Buffer.alloc(200)]);
  r = await call('POST', `/photo?work=${WORK}&task=14&pos=2`, tok(S1), heic);
  ok(r.status === 415 && (await r.json()).code === 'heic', 'HEIC без перевода на устройстве — 415');
  r = await call('POST', `/photo?work=${WORK}&task=14&pos=2`, tok(S1), Buffer.alloc(5 * 1024 * 1024, 0xff));
  ok(r.status === 413, 'больше 4 МБ — 413');
  r = await call('POST', `/photo?work=${WORK}&task=13&pos=1`, tok(S1), raw);
  ok(r.status === 400, 'фото к заданию части 1 — 400');
  const small = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#fff' } }).jpeg().toBuffer();
  const ids = [p1.id];
  for (let pos = 2; pos <= 3; pos += 1) {
    r = await call('POST', `/photo?work=${WORK}&task=14&pos=${pos}`, tok(S1), small);
    ids.push((await r.json()).id);
  }
  ok(ids.length === 3 && ids.every(Boolean), 'ещё два фото к №14');

  console.log('4. Подписанные ссылки');
  const url = async (id, sub) => {
    const res = await call('GET', `/photo/${id}/url`, tok(sub));
    return { status: res.status, body: await res.json() };
  };
  ok((await url(p1.id, S1)).status === 200, 'ученик получает ссылку на своё фото');
  const t1 = await url(p1.id, T1);
  ok(t1.status === 200 && t1.body.expires - Date.now() <= 600_000, 'учитель ученика — ссылка на 10 минут');
  ok((await url(p1.id, S2)).status === 404, 'другой ученик — 404');
  ok((await url(p1.id, T2)).status === 404, 'учитель другого класса — 404');
  ok((await url('00000000-0000-0000-0000-000000000000', S1)).status === 404, 'несуществующее фото — тоже 404');

  console.log('5. Порядок, удаление, лимит, после сдачи');
  r = await call('POST', '/order', tok(S1), JSON.stringify({ work: WORK, task: 14, ids: [ids[2], ids[0], ids[1]] }), 'application/json');
  ok(r.status === 200, 'порядок изменён');
  ok(db.sql('raboty', `select position from public.photos where id = '${ids[2]}'`).stdout.trim() === '1', 'третье фото стало первым');
  r = await call('POST', '/order', tok(S2), JSON.stringify({ work: WORK, task: 14, ids }), 'application/json');
  ok(r.status === 400, 'чужие фото в своём порядке не переставить');
  r = await call('DELETE', `/photo/${ids[1]}`, tok(S2));
  ok(r.status === 404, 'чужое фото не удалить');
  r = await call('DELETE', `/photo/${ids[1]}`, tok(S1));
  ok(r.status === 200 && !fs.existsSync(path.join(store, key.replace(p1.id, ids[1]))), 'своё фото удалено вместе с файлом');
  for (let pos = 2; pos <= 6; pos += 1) await call('POST', `/photo?work=${WORK}&task=15&pos=${pos}`, tok(S1), small);
  r = await call('POST', `/photo?work=${WORK}&task=15&pos=1`, tok(S1), small);
  ok(r.status === 429, 'лимит загрузок в час — 429');

  console.log('6. Автопроверка');
  db.sql('raboty', `select set_config('request.jwt.claim.sub', '${S1}', false); set role authenticated;
    select public.save_answer('${WORK}', 16::smallint, '', '{"kuski":[{"t":"interval","lo":"9","loZakr":true,"hi":"+\\\\infty","hiZakr":false},{"t":"interval","lo":"1","loZakr":true,"hi":"\\\\frac32","hiZakr":false}]}');
    select public.save_answer('${WORK}', 20::smallint, 'а', '"net"');`);
  r = await call('POST', '/proverka', tok(S1), JSON.stringify({ work: WORK }), 'application/json');
  const pr = await r.json();
  ok(r.status === 200, 'автопроверка отвечает', JSON.stringify(pr));
  ok(pr.results?.find((x) => x.task === 16)?.auto === 'sovpadaet', '№16: промежутки в другой записи — совпадает');
  ok(pr.results?.find((x) => x.task === 20)?.auto === 'ne-sovpadaet', '№20а: не совпадает');
  ok(JSON.stringify(pr).indexOf('verno') === -1, 'верный ответ в ответе сервиса не раскрыт');

  /* Сдать работу — дальше загрузка закрыта. */
  db.sql('raboty', `select set_config('request.jwt.claim.sub', '${S1}', false); set role authenticated; select public.submit_work('${WORK}');`);
  r = await call('POST', `/photo?work=${WORK}&task=17&pos=1`, tok(S1), small);
  ok(r.status === 403, 'после сдачи загрузка закрыта');
  r = await call('POST', `/photo?work=${WORK}&task=14&pos=1`, tok(S2), small);
  ok(r.status === 200, 'одноклассник ещё может загружать (не сдал)');

  console.log('7. Срок хранения');
  db.sql('raboty', `update public.photos set expires_at = now() - interval '1 day' where submission_id in
    (select id from public.submissions where user_id = '${S1}')`);
  const bylo = Number(db.sql('raboty', `select count(*) from public.photos p join public.submissions s on s.id = p.submission_id where s.user_id = '${S1}'`).stdout.trim());
  const before = Number(db.sql('raboty', `select count(*) from public.grades g join public.submissions s on s.id = g.submission_id where s.user_id = '${S1}'`).stdout.trim());
  const n = await udalitIstekshie(pool, fsStorage(store));
  const left = Number(db.sql('raboty', `select count(*) from public.photos p join public.submissions s on s.id = p.submission_id where s.user_id = '${S1}'`).stdout.trim());
  const after = Number(db.sql('raboty', `select count(*) from public.grades g join public.submissions s on s.id = g.submission_id where s.user_id = '${S1}'`).stdout.trim());
  ok(bylo > 0 && n === bylo && left === 0, `фото с истёкшим сроком удалены (${n} из ${bylo})`);
  ok(!fs.existsSync(path.join(store, key)), 'файл удалён из хранилища');
  ok(before > 0 && before === after, 'баллы остались');
} catch (e) {
  failures += 1;
  console.error(e);
} finally {
  server?.close();
  await pool?.end();
  db.stop();
  fs.rmSync(store, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\nСервис загрузки: ошибок ${failures}`);
  process.exit(1);
}
console.log('\nСервис загрузки: все проверки прошли.');
