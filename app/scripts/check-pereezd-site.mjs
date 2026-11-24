#!/usr/bin/env node
/* scripts/check-pereezd-site.mjs — переезд адресов банка на коды
   разделов на настоящем Apache (docs/ege-2027-struktura-shag-0.md,
   раздел 5).

   Запуск после pnpm build: pnpm test:pereezd-site
   Нужен apache2 (scripts/lib/apache.mjs).

   Запросы идут с Host: budetege.ru, как на хостинге:
     — каждый прежний адрес из src/content/pereezd/starye-adresa.json
       (с «/», без неё и с index.html) — ровно один 301 сразу на
       https://budetege.ru/<новый адрес>; новый адрес отвечает 200 и это
       не заглушка «Страница переехала»;
     — строка запроса переносится (?a=1);
     — адреса скрытого раздела по номеру (/zadaniya/6/…) — 404;
     — в браузере старый адрес с якорем открывает новый с тем же якорем;
     — заглушка прежнего адреса (index.txt, переход внутри сайта) есть в
       сборке и ведёт туда же. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP } from './lib/load-ts.mjs';
import { startApache } from './lib/apache.mjs';

const OUT = path.join(APP, 'out');
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет сборки out/: сначала pnpm build');
  process.exit(1);
}
const STARYE = JSON.parse(
  fs.readFileSync(path.join(APP, 'src/content/pereezd/starye-adresa.json'), 'utf8'),
);
const PORT = 8000 + Math.floor(Math.random() * 1000);
const HOST = 'https://budetege.ru';

const oshibki = [];
let proverok = 0;
const check = (ok, what) => {
  proverok += 1;
  if (!ok) oshibki.push(what);
};

function request(url) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: PORT,
        path: encodeURI(url),
        method: 'GET',
        headers: { Host: 'budetege.ru' },
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (c) => {
          if (body.length < 4000) body += c;
        });
        res.on('end', () =>
          resolve({ status: res.statusCode, location: res.headers.location, body }),
        );
      },
    );
    req.on('error', reject);
    req.end();
  });
}

const apache = await startApache(OUT, PORT);
try {
  /* 1. Каждый прежний адрес — один 301 на итоговый. */
  const novye = new Set();
  for (const [staryy, novyy] of Object.entries(STARYE)) {
    const nado = HOST + novyy;
    for (const v of [staryy, staryy.replace(/\/$/, ''), `${staryy}index.html`]) {
      const r = await request(v);
      check(
        r.status === 301 && r.location === nado,
        `${v} → ${r.status} ${r.location ?? ''}, нужно 301 ${nado}`,
      );
    }
    novye.add(novyy.split('#')[0]);
  }
  /* 2. Новые адреса живые и не заглушки. */
  for (const a of novye) {
    const r = await request(a);
    check(r.status === 200, `${a} → ${r.status}, нужно 200`);
    check(!/http-equiv="refresh"/i.test(r.body), `${a} — заглушка, а не страница`);
  }
  /* 3. Строка запроса. */
  {
    const r = await request('/zadaniya/7/trenazher/?a=1&b=2');
    check(
      r.status === 301 && r.location === `${HOST}/zadaniya/uravneniya/trenazher/?a=1&b=2`,
      `строка запроса: ${r.status} ${r.location}`,
    );
  }
  /* 4. Скрытый раздел по номеру — 404, без 301. */
  for (const a of [
    '/zadaniya/6/',
    '/zadaniya/6',
    '/zadaniya/6/teoriya/',
    '/zadaniya/sluchainye-velichiny/',
  ]) {
    const r = await request(a);
    check(r.status === 404, `${a} → ${r.status} ${r.location ?? ''}, нужно 404`);
  }
  /* 5. Заглушки прежних адресов в сборке (переход внутри сайта). */
  for (const [staryy, novyy] of Object.entries(STARYE)) {
    const file = path.join(OUT, staryy, 'index.html');
    if (!fs.existsSync(file)) {
      check(false, `нет заглушки ${staryy}`);
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    const canon = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1]?.replace(/&amp;/g, '&');
    check(canon === novyy, `заглушка ${staryy} ведёт на ${canon}, нужно ${novyy}`);
  }
  /* 6. Браузер: старый адрес с запросом и якорем. */
  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  );
  const page = await browser.newPage();
  /* Без Host: budetege.ru Apache уводит на свой адрес; если по https —
     в проверке тот же адрес отдаёт он же по http. */
  const httpsSam = apache.url.replace('http://', 'https://');
  await page.route(`${httpsSam}/**`, (route) =>
    route.continue({ url: route.request().url().replace(httpsSam, apache.url) }),
  );
  await page.goto(`${apache.url}/zadaniya/7/?a=1#tip-P05`, { waitUntil: 'load' });
  const u = new URL(page.url());
  check(
    u.pathname === '/zadaniya/uravneniya/' && u.search === '?a=1' && u.hash === '#tip-P05',
    `браузер: /zadaniya/7/?a=1#tip-P05 → ${u.pathname}${u.search}${u.hash}`,
  );
  await browser.close();
} finally {
  apache.stop();
}

if (oshibki.length > 0) {
  console.error(`Переезд адресов на Apache: ${oshibki.length} из ${proverok} не прошли`);
  for (const o of oshibki.slice(0, 40)) console.error(`  — ${o}`);
  process.exit(1);
}
console.log(
  `Переезд адресов на Apache: ${Object.keys(STARYE).length} прежних адресов, ${proverok} проверок — всё в порядке.`,
);
