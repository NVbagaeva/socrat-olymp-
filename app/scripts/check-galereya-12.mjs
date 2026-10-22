#!/usr/bin/env node
/* scripts/check-galereya-12.mjs — галереи банка №12 в сборке сайта нет.

   Запуск после pnpm build: pnpm test:galereya-12

   Галерея (/styleguide/graph-12/galereya/) показывает ответы и
   существует только в разработке: её файл называется page.dev.tsx, и
   Next видит его лишь в `next dev` или с флагом GALEREYA=1
   (next.config.ts). Проверка: в out/ нет папки маршрута (на хостинге
   адрес отдаёт 404) и ни одного следа её разметки в собранных файлах. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(APP, 'out');
const ROUTE = 'styleguide/graph-12/galereya';
const MARKERS = ['/styleguide/graph-12/galereya', 'Галерея банка задания №12'];

if (!fs.existsSync(OUT)) {
  console.error('Нет out/: сначала pnpm build.');
  process.exit(1);
}

const errors = [];
if (fs.existsSync(path.join(OUT, ROUTE))) {
  errors.push(`в сборке есть служебный маршрут /${ROUTE}/ — должен отдавать 404`);
}
let files = 0;
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(html|txt|js|json)$/.test(name)) {
      continue;
    }
    files += 1;
    const text = fs.readFileSync(full, 'utf8');
    for (const marker of MARKERS) {
      if (text.includes(marker)) {
        errors.push(`${path.relative(OUT, full)}: след галереи «${marker}»`);
      }
    }
  }
}
walk(OUT);
console.log(`Галерея №12: просмотрено файлов сборки ${files}.`);
if (errors.length) {
  errors.slice(0, 20).forEach((line) => console.error('  ✗ ' + line));
  process.exit(1);
}
console.log('В сборке галереи нет — адрес отдаёт 404.');
