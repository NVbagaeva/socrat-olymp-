#!/usr/bin/env node
/* scripts/check-galereya-1.mjs — галереи банка №1 в сборке сайта нет.

   Запуск после pnpm build: pnpm test:galereya-1

   Галерея банка задания №1 (/styleguide/planimetriya-1/galereya/)
   показывает ответы и существует только в разработке: её файл
   называется page.dev.tsx, и Next видит его лишь в `next dev` или со
   флагом GALEREYA_1=1 (next.config.ts). Проверка: в out/ нет папки
   маршрута (на хостинге адрес отдаёт 404) и ни одного следа её
   разметки или адреса в собранных файлах. Приём — как у галереи №9. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(APP, 'out');
const ROUTE = 'styleguide/planimetriya-1/galereya';
const MARKERS = ['/styleguide/planimetriya-1/galereya', 'g1__stat', 'Галерея банка задания №1'];

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
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(html|txt|js|json|css)$/.test(entry.name)) {
      files += 1;
      const text = fs.readFileSync(full, 'utf8');
      for (const m of MARKERS) {
        if (text.includes(m))
          errors.push(`${path.relative(APP, full)}: «${m}» — след галереи в сборке`);
      }
    }
  }
}
walk(OUT);

if (errors.length > 0) {
  console.error(`Галерея банка №1 в сборке (${errors.length}):`);
  for (const e of errors.slice(0, 30)) console.error('  ' + e);
  process.exit(1);
}
console.log(`Галереи банка №1 в сборке нет: просмотрено файлов ${files}, /${ROUTE}/ — 404.`);
