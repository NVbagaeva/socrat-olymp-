#!/usr/bin/env node
/* scripts/check-illyustracii.mjs — ни одна картинка не крупнее нормы.

   Запуск (после pnpm build):  pnpm test:illyustracii [--only /zadaniya/1/]

   Проходит все страницы сайта из lib/illyustracii.mjs (главная, «Об
   авторе», «Как пользоваться», тарифы, кабинеты, все вкладки разделов)
   на 1440 и 375 px и падает, если отображаемая картинка (<img>: растр и
   SVG-файл) больше нормы своего варианта Illustration (атрибут data-ill
   у картинки или предка; нормы — components/ui/Illustration.tsx) или
   картинка без варианта крупнее 360 px по любой стороне.

   Ещё раз на 2560 px — главная и «О задании» №1: на очень широком
   экране размеры не растут. */

import { chromium } from 'playwright';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';
import { EKRANY, narushenie, obojti, spisokStranic, zapustitServer } from './lib/illyustracii.mjs';

bezBanneraCookieVsyudu(chromium);

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const urls = spisokStranic().filter((u) => only === null || u.startsWith(only));
if (urls.length === 0) {
  console.error('Нет страниц: сначала pnpm build.');
  process.exit(2);
}

const { server, base } = await zapustitServer();
const browser = await chromium.launch();
const problemy = [];
const oshibki = [];
let kartinok = 0;

const prohody = [
  ...EKRANY.map((shirina) => ({ shirina, urls })),
  { shirina: 2560, urls: urls.filter((u) => u === '/' || u === '/zadaniya/1/') },
];
for (const { shirina, urls: spisok } of prohody) {
  await obojti(
    browser,
    base,
    spisok,
    shirina,
    (url, kartinki) => {
      for (const k of kartinki) {
        kartinok += 1;
        const p = narushenie(k, shirina);
        if (p !== null)
          problemy.push(`${url} @${shirina}: ${k.file} [${k.variant ?? 'без варианта'}] — ${p}`);
      }
    },
    { onError: (url, e) => oshibki.push(`${url} @${shirina}: ${e.message.split('\n')[0]}`) },
  );
  console.log(`  ${shirina} px: ${spisok.length} страниц`);
}
await browser.close();
server.close();

for (const o of oshibki) console.log(`  ОШИБКА ${o}`);
for (const p of problemy) console.log(`  НЕТ ${p}`);
console.log(
  `\nкартинок ${kartinok}, крупнее нормы ${problemy.length}, страниц не открылось ${oshibki.length}`,
);
process.exit(problemy.length === 0 && oshibki.length === 0 ? 0 : 1);
