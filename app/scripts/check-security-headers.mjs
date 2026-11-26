#!/usr/bin/env node
/* scripts/check-security-headers.mjs — заголовки защиты и служебные файлы.

   Запуск:
     pnpm test:headers                       — Apache над out/ (нужна сборка
                                              и apache2, как test:rsc-serving);
     pnpm test:headers --url https://budetege.ru — живой сайт после выкладки.

   Страницы (главная, кабинет, страница 404) обязаны отдавать заголовки
   из public/.htaccess (раздел «Заголовки защиты»), а файлы с точкой в
   начале имени (.htaccess, .ftp-deploy-sync-state.json) — не отдаваться
   вовсе. Версию сервера проверяет только --url: её выставляет хостинг. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out');

/* Заголовок → проверка значения (строки — в нижнем регистре). */
const NADO = {
  'x-frame-options': (v) => v === 'sameorigin' || v === 'deny',
  'content-security-policy': (v) =>
    /frame-ancestors\s+('self'|'none')/.test(v) &&
    /object-src\s+'none'/.test(v) &&
    /base-uri\s+'self'/.test(v) &&
    /script-src\s+'self'/.test(v) &&
    !/unsafe-eval/.test(v) &&
    /connect-src\s+'self'/.test(v),
  'x-content-type-options': (v) => v === 'nosniff',
  'referrer-policy': (v) => /strict-origin|no-referrer|same-origin/.test(v),
  'permissions-policy': (v) => /camera=\(\)/.test(v) && /microphone=\(\)/.test(v),
  'strict-transport-security': (v) => {
    const m = /max-age=(\d+)/.exec(v);
    return m !== null && Number(m[1]) >= 15552000;
  },
};

const STRANICY = ['/', '/kabinet/', '/takoy-stranicy-net-proverka-zagolovkov/'];
const SLUZHEBNYE = ['/.htaccess', '/.ftp-deploy-sync-state.json'];

async function proverit(base, { zhivoy }) {
  const oshibki = [];
  for (const p of STRANICY) {
    const r = await fetch(base + p, { redirect: 'manual' });
    for (const [imya, ok] of Object.entries(NADO)) {
      const v = (r.headers.get(imya) ?? '').toLowerCase();
      if (v === '') oshibki.push(`${p}: нет заголовка ${imya}`);
      else if (!ok(v)) oshibki.push(`${p}: ${imya} = «${v}» — не то значение`);
    }
    if (zhivoy && /\d/.test(r.headers.get('server') ?? '')) {
      oshibki.push(`${p}: заголовок Server с версией («${r.headers.get('server')}») — скрывает хостинг`);
    }
  }
  for (const p of SLUZHEBNYE) {
    const r = await fetch(base + p, { method: 'HEAD', redirect: 'manual' });
    if (r.status !== 403 && r.status !== 404) oshibki.push(`${p}: ответ ${r.status}, ждали 403 или 404`);
  }
  return oshibki;
}

const i = process.argv.indexOf('--url');
let oshibki;
if (i !== -1) {
  const base = (process.argv[i + 1] ?? '').replace(/\/$/, '');
  if (!/^https:\/\//.test(base)) {
    console.error('--url: нужен адрес https://…');
    process.exit(2);
  }
  oshibki = await proverit(base, { zhivoy: true });
  /* Версия сервера — дело хостинга: предупреждение, не ошибка. */
  const pro = oshibki.filter((o) => o.includes('заголовок Server'));
  oshibki = oshibki.filter((o) => !o.includes('заголовок Server'));
  for (const o of [...new Set(pro)].slice(0, 1)) console.warn(`Внимание: ${o}`);
} else {
  if (!fs.existsSync(path.join(OUT, '.htaccess'))) {
    console.error('Нет out/.htaccess — сначала pnpm build.');
    process.exit(2);
  }
  const { startApache } = await import('./lib/apache.mjs');
  /* Служебный файл выкладки на время проверки — как на хостинге. */
  const proba = path.join(OUT, '.ftp-deploy-sync-state.json');
  const bylo = fs.existsSync(proba);
  if (!bylo) fs.writeFileSync(proba, '{"proverka":true}\n');
  const port = 18000 + Math.floor(Math.random() * 1000);
  const srv = await startApache(OUT, port);
  try {
    oshibki = await proverit(srv.url, { zhivoy: false });
  } finally {
    srv.stop();
    if (!bylo) fs.rmSync(proba, { force: true });
  }
}

if (oshibki.length > 0) {
  console.error('Заголовки защиты: есть ошибки\n' + oshibki.map((o) => `  - ${o}`).join('\n'));
  process.exit(1);
}
console.log(`Заголовки защиты: ${STRANICY.length} страницы с нужными заголовками, служебные файлы закрыты.`);
