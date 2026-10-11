#!/usr/bin/env node
/* scripts/check-dev-pages.mjs — служебных галерей нет в продакшене.

   Галереи банков (файлы page.dev.tsx) — только для разработки: в
   обычной сборке (`pnpm build`, без GALEREYA=1) маршрута нет, и
   хостинг отдаёт на адрес 404. Проверка смотрит на готовый экспорт
   out/: папки маршрута нет и ни один файл не содержит его адреса или
   служебного класса галереи.

   Запуск после pnpm build: node scripts/check-dev-pages.mjs */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { APP } from './lib/load-ts.mjs';

const OUT = path.join(APP, 'out');
const DEV_ROUTES = ['styleguide/zadanie-9', 'styleguide/zadanie-10', 'styleguide/soglasiya'];
/* Признаки служебных страниц в собранных файлах: адрес и класс разметки. */
const MARKERS = [
  '/styleguide/zadanie-9',
  'g9__stat',
  '/styleguide/zadanie-10',
  'g10__stat',
  '/styleguide/soglasiya',
  'sgl__grid',
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

if (problems.length > 0) {
  console.error('Служебные страницы в продакшене:');
  problems.forEach((p) => console.error('  ' + p));
  process.exit(1);
}
console.log(`Галереи (${DEV_ROUTES.join(', ')}) в продакшен не попали: маршрут отдаёт 404.`);
