#!/usr/bin/env node
/* scripts/check-dev-pages.mjs — прототипов нет в настоящей сборке.

   Служебные страницы-прототипы (app/**\/page.dev.tsx, сейчас — /dev/intro,
   заставка первого визита) живут только в `next dev` и в сборке с
   INTRO_DEV_PAGES=1 (next.config.ts). Проверка по собранному out/:

     1. папки out/dev/ нет, и ни одна страница и ни один файл данных
        роутера не ссылается на /dev/…;
     2. кода прототипа нет в скриптах (_next/static);
     3. настоящий Apache с нашим .htaccess отдаёт на /dev/intro/ 404 —
        если apache2 установлен (в CI — да; локально без него этот
        пункт пропускается с предупреждением).

   Запуск: pnpm build && pnpm test:dev-pages */

import fs from 'node:fs';
import path from 'node:path';
import { APP } from './lib/load-ts.mjs';
import { startApache } from './lib/apache.mjs';

const OUT = path.join(APP, 'out');
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет сборки app/out: сначала pnpm build');
  process.exit(1);
}

const failures = [];

if (fs.existsSync(path.join(OUT, 'dev'))) failures.push('в сборке есть папка out/dev/');

/* Признаки кода прототипа: строки, которые есть только в DevIntro. */
const MARKERS = ['Прототип заставки', 'dev-intro__panel'];
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
for (const file of walk(OUT)) {
  if (!/\.(html|txt|js|css)$/.test(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(OUT, file);
  /* Сам префикс '/dev/' встречается в коде онбординга (там он молчит),
     ссылка на страницу — это '/dev/<имя>'. */
  if (/["'(]\/dev\/[a-z]/.test(text)) failures.push(`${rel}: ссылка на /dev/…`);
  for (const m of MARKERS) {
    if (text.includes(m)) failures.push(`${rel}: код прототипа («${m}»)`);
  }
}

let apacheChecked = false;
try {
  const apache = await startApache(OUT, 18000 + Math.floor(Math.random() * 1000));
  try {
    const res = await fetch(apache.url + '/dev/intro/', { redirect: 'manual' });
    if (res.status !== 404) failures.push(`Apache: /dev/intro/ отдаёт ${res.status}, а не 404`);
    apacheChecked = true;
  } finally {
    apache.stop();
  }
} catch (err) {
  if (process.env.CI) failures.push('Apache не запустился: ' + err.message);
  else console.warn('Пропущено: ответ Apache (' + err.message + ')');
}

if (failures.length > 0) {
  console.error('Прототипы попали в сборку:\n  ' + failures.join('\n  '));
  process.exit(1);
}
console.log(`Прототипов в сборке нет${apacheChecked ? '; /dev/intro/ → 404' : ''}.`);
