#!/usr/bin/env node
/* scripts/audit-illyustracii.mjs — аудит размеров картинок-иллюстраций.

   Запуск (после pnpm build):
     node scripts/audit-illyustracii.mjs [--json файл] [--md файл] [--only /zadaniya/planimetriya/]

   Проходит все страницы проверки (lib/illyustracii.mjs → spisokStranic)
   на 1440 и 375 px и пишет таблицу: страница — экран — файл — вариант —
   отображаемые ширина и высота — доля ширины контента — нарушение нормы.
   Ничего не проверяет и не падает: это снимок для отчёта. Проверка —
   scripts/check-illyustracii.mjs. */

import fs from 'node:fs';
import { chromium } from 'playwright';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';
import { EKRANY, narushenie, obojti, spisokStranic, zapustitServer } from './lib/illyustracii.mjs';

bezBanneraCookieVsyudu(chromium);

const args = process.argv.slice(2);
const arg = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const only = arg('--only');

const urls = spisokStranic().filter((u) => only === null || u.startsWith(only));
const { server, base } = await zapustitServer();
const browser = await chromium.launch();
const rows = [];

for (const shirina of EKRANY) {
  await obojti(
    browser,
    base,
    urls,
    shirina,
    (url, kartinki) => {
      for (const k of kartinki) rows.push({ url, shirina, ...k, problema: narushenie(k, shirina) });
      process.stdout.write(`\r${shirina} ${url}`.padEnd(60));
    },
    { onError: (url, e) => console.error(`\n  ${url} @${shirina}: ${e.message.split('\n')[0]}`) },
  );
}
process.stdout.write('\n');
await browser.close();
server.close();

/* Одна строка на картинку страницы и экрана (повторы — счётчик). */
const key = (r) => `${r.url}|${r.shirina}|${r.file}|${r.variant}|${r.w}|${r.h}`;
const uniq = new Map();
for (const r of rows) {
  const k = key(r);
  if (uniq.has(k)) uniq.get(k).n += 1;
  else uniq.set(k, { ...r, n: 1 });
}
const list = [...uniq.values()];

const jsonOut = arg('--json');
if (jsonOut !== null) fs.writeFileSync(jsonOut, JSON.stringify(list, null, 1));

const md = [
  '| Страница | Экран | Файл | Вариант | Ш × В, px | Доля контента | Норма |',
  '|---|---|---|---|---|---|---|',
  ...list.map(
    (r) =>
      `| ${r.url} | ${r.shirina} | ${r.file.replace(/^.*\//, '')}${r.n > 1 ? ` ×${r.n}` : ''} | ${r.variant ?? '—'} | ${Math.round(r.w)} × ${Math.round(r.h)} | ${r.dolya ?? '—'} % | ${r.problema === null ? 'ok' : `**${r.problema}**`} |`,
  ),
];
const mdOut = arg('--md');
if (mdOut !== null) fs.writeFileSync(mdOut, md.join('\n') + '\n');

const bad = list.filter((r) => r.problema !== null);
console.log(`страниц ${urls.length}, картинок ${list.length}, вне нормы ${bad.length}`);
