#!/usr/bin/env node
/* scripts/check-dev-pages.mjs — служебных галерей нет в продакшене.

   Галереи банков (файлы page.dev.tsx) — только для разработки: в
   обычной сборке (`pnpm build`, без GALEREYA=1) маршрута нет, и
   хостинг отдаёт на адрес 404. Проверка смотрит на готовый экспорт
   out/: папки маршрута нет и ни один файл не содержит его адреса или
   служебного класса галереи. То же для прототипа заставки первого
   визита /dev/intro (флаг INTRO_DEV_PAGES=1); его 404 проверяется ещё и
   настоящим Apache с нашим .htaccess, если apache2 установлен (в CI —
   да; локально без него этот пункт пропускается с предупреждением).

   Запуск после pnpm build: node scripts/check-dev-pages.mjs */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { APP } from './lib/load-ts.mjs';
import { startApache } from './lib/apache.mjs';

const OUT = path.join(APP, 'out');
const DEV_ROUTES = [
  'styleguide/zadanie-7',
  'styleguide/zadanie-9',
  'styleguide/zadanie-10',
  'styleguide/soglasiya',
  'dev/intro',
];
/* Признаки служебных страниц в собранных файлах: адрес и класс разметки. */
const MARKERS = [
  '/styleguide/zadanie-7',
  'g7__stat',
  '/styleguide/zadanie-9',
  'g9__stat',
  '/styleguide/zadanie-10',
  'g10__stat',
  '/styleguide/soglasiya',
  'sgl__grid',
  '/dev/intro',
  'Прототип заставки',
  'dev-intro__panel',
];

if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет out/index.html — сначала pnpm build.');
  process.exit(1);
}

const problems = [];
for (const r of DEV_ROUTES) {
  if (fs.existsSync(path.join(OUT, r))) {
    problems.push(`в экспорте есть папка ${r}/ — галерея попала в продакшен`);
  }
}

function* files(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* files(p);
    } else if (/\.(html|txt|js|json|css)$/.test(e.name)) {
      yield p;
    }
  }
}
for (const f of files(OUT)) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of MARKERS) {
    if (s.includes(m)) {
      problems.push(`${path.relative(OUT, f)} содержит «${m}»`);
    }
  }
}

/* Живой запрос: тот же статический сервер, что у превью, — 404. */
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = path.join(OUT, url);
  if (url.endsWith('/')) {
    file = path.join(file, 'index.html');
  }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    res.writeHead(200);
    res.end(fs.readFileSync(file));
  } else {
    res.writeHead(404);
    res.end('not found');
  }
});
await new Promise((ok) => server.listen(0, ok));
const port = server.address().port;
for (const r of DEV_ROUTES) {
  const code = await new Promise((ok) => {
    http.get(`http://127.0.0.1:${port}/${r}/`, (res) => {
      res.resume();
      ok(res.statusCode);
    });
  });
  if (code !== 404) {
    problems.push(`/${r}/ отдаёт ${code}, ожидался 404`);
  }
}
server.close();

let apacheChecked = false;
try {
  const apache = await startApache(OUT, 18000 + Math.floor(Math.random() * 1000));
  try {
    const res = await fetch(apache.url + '/dev/intro/', { redirect: 'manual' });
    if (res.status !== 404) problems.push(`Apache: /dev/intro/ отдаёт ${res.status}, а не 404`);
    apacheChecked = true;
  } finally {
    apache.stop();
  }
} catch (err) {
  if (process.env.CI) problems.push('Apache не запустился: ' + err.message);
  else console.warn('Пропущено: ответ Apache (' + err.message + ')');
}

if (problems.length > 0) {
  console.error('Служебные страницы в продакшене:');
  problems.forEach((p) => console.error('  ' + p));
  process.exit(1);
}
console.log(
  `Служебные страницы (${DEV_ROUTES.join(', ')}) в продакшен не попали: маршрут отдаёт 404` +
    (apacheChecked ? ' (и в Apache).' : '.'),
);
