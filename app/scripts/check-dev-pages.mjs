#!/usr/bin/env node
/* scripts/check-dev-pages.mjs — служебных страниц в сборке сайта нет.

   Запуск после pnpm build: pnpm test:dev-pages

   Галерея банка задания №9 (/styleguide/zadanie-9/) показывает ответы
   и существует только в разработке: её файлы называются page.dev.tsx,
   и Next видит их лишь в `next dev` или со флагом GALEREYA_9=1
   (next.config.ts). Проверка: в out/ нет ни папки маршрута (на хостинге
   адрес отдаёт 404), ни ссылок на неё и ни одного её файла в бандле. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(APP, 'out');
const DEV_ROUTES = ['styleguide/zadanie-9'];
/* Признаки страниц галереи в собранных файлах: адрес и класс разметки. */
const MARKERS = ['/styleguide/zadanie-9', 'g9__stat'];

if (!fs.existsSync(OUT)) {
  console.error('Нет out/: сначала pnpm build.');
  process.exit(1);
}

const errors = [];
for (const route of DEV_ROUTES) {
  if (fs.existsSync(path.join(OUT, route))) {
    errors.push(`в сборке есть служебный маршрут /${route}/ — должен отдавать 404`);
  }
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
      for (const marker of MARKERS) {
        if (text.includes(marker)) {
          errors.push(
            `${path.relative(APP, full)}: «${marker}» — след служебной страницы в сборке`,
          );
        }
      }
    }
  }
}
walk(OUT);

if (errors.length > 0) {
  console.error(`Служебные страницы в сборке (${errors.length}):`);
  for (const e of errors.slice(0, 30)) console.error('  ' + e);
  process.exit(1);
}
console.log(
  `Служебных страниц в сборке нет: просмотрено файлов ${files}, маршрут ${DEV_ROUTES.map((r) => '/' + r + '/').join(', ')} — 404.`,
);
