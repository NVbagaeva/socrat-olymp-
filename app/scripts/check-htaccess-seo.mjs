#!/usr/bin/env node
/* scripts/check-htaccess-seo.mjs — зеркало, чистые адреса и 404 на Apache.

   Запуск: pnpm build && pnpm test:htaccess-seo   (нужен apache2)

   Поднимает настоящий Apache над app/out с public/.htaccess (как
   check-navigation.mjs) и проверяет правила поиска:

     - www.budetege.ru/… → 301 на https://budetege.ru/… одним шагом,
       путь и строка запроса сохраняются;
     - запрос с X-Forwarded-Proto: http → 301 на https;
     - /index.html и /zadaniya/index.html → 301 на / и /zadaniya/;
     - адрес без «/» → 301 на адрес с «/» (прежнее правило не сломано);
     - /ege/, /ege/3/, /about.html → 301 на новые адреса;
     - несуществующий адрес → код 404 и своя страница «Такой страницы
       нет» со ссылками на разделы, а не страница Apache;
     - robots.txt и sitemap.xml отдаются с кодом 200. */

import http from 'node:http';
import path from 'node:path';
import { APP } from './lib/load-ts.mjs';
import { startApache } from './lib/apache.mjs';

const OUT = path.join(APP, 'out');
const PORT = 18000 + Math.floor(Math.random() * 1000);

let checks = 0;
let failed = 0;
function check(ok, name) {
  checks += 1;
  if (!ok) failed += 1;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${name}`);
}

function request(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: PORT, path: url, method: 'GET', headers }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => {
        body += c;
      });
      res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

const apache = await startApache(OUT, PORT);
try {
  const site = { Host: 'budetege.ru' };
  const www = { Host: 'www.budetege.ru' };

  console.log('Зеркало');
  for (const [from, to] of [
    ['/', 'https://budetege.ru/'],
    ['/zadaniya/13/', 'https://budetege.ru/zadaniya/13/'],
    ['/zadaniya/?part=2', 'https://budetege.ru/zadaniya/?part=2'],
    ['/zadaniya', 'https://budetege.ru/zadaniya'],
  ]) {
    const r = await request(from, www);
    check(r.status === 301 && r.location === to, `www${from} → 301 ${to} (${r.status} ${r.location})`);
  }
  const http1 = await request('/zadaniya/13/', { ...site, 'X-Forwarded-Proto': 'http' });
  check(
    http1.status === 301 && http1.location === 'https://budetege.ru/zadaniya/13/',
    `http (X-Forwarded-Proto) → 301 https (${http1.status} ${http1.location})`,
  );
  const https1 = await request('/zadaniya/13/', { ...site, 'X-Forwarded-Proto': 'https' });
  check(https1.status === 200, `https → 200, без петли (${https1.status})`);

  console.log('Чистые адреса');
  for (const [from, to] of [
    ['/index.html', 'https://budetege.ru/'],
    ['/zadaniya/index.html', 'https://budetege.ru/zadaniya/'],
    ['/zadaniya/13/index.html?x=1', 'https://budetege.ru/zadaniya/13/?x=1'],
    ['/zadaniya', 'https://budetege.ru/zadaniya/'],
    ['/ege/', 'https://budetege.ru/zadaniya/'],
    ['/ege', 'https://budetege.ru/zadaniya/'],
    ['/ege/3/', 'https://budetege.ru/zadaniya/3/'],
    ['/ege/3/index.html', 'https://budetege.ru/zadaniya/3/'],
    ['/about.html', 'https://budetege.ru/about/'],
  ]) {
    const r = await request(from, site);
    check(r.status === 301 && r.location === to, `${from} → 301 ${to} (${r.status} ${r.location})`);
  }
  for (const url of ['/', '/zadaniya/', '/zadaniya/13/teoriya/']) {
    const r = await request(url, site);
    check(r.status === 200, `${url} → 200 (${r.status})`);
  }

  console.log('404, robots.txt, sitemap.xml');
  const net = await request('/net-takoy-stranicy/', site);
  check(net.status === 404, `несуществующая страница → 404 (${net.status})`);
  check(net.body.includes('Такой страницы нет'), 'на 404 — своя страница «Такой страницы нет»');
  check(net.body.includes('href="/zadaniya/13/"'), 'на 404 — ссылки на разделы банка');
  check(!net.body.includes('The requested URL was not found'), 'на 404 — не страница Apache');
  const robots = await request('/robots.txt', site);
  check(robots.status === 200 && robots.body.includes('Sitemap: https://budetege.ru/sitemap.xml'), 'robots.txt → 200 и строка Sitemap');
  const sitemap = await request('/sitemap.xml', site);
  check(sitemap.status === 200 && sitemap.body.includes('<loc>https://budetege.ru/</loc>'), 'sitemap.xml → 200 и главная в карте');
} finally {
  await apache.stop();
}

console.log(`\nПроверок: ${checks}, не прошло: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
