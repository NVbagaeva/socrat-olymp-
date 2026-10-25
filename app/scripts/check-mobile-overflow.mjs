#!/usr/bin/env node
/* scripts/check-mobile-overflow.mjs — горизонтальная прокрутка на телефоне.

   Обходит все страницы собранного экспорта на ширинах 320, 360, 375,
   390, 430 и 768 и ищет то, что выходит за экран: страница целиком не должна
   ехать вбок. Широкое содержимое (формулы, таблицы) прокручивается
   внутри своего блока — такой блок обрезает потомков и сюда не попадает.
   В CI — ширина 375 (SHIRINY=375).

   Запуск: node scripts/check-mobile-overflow.mjs [--json файл] [префикс…]
   Ширины можно сузить: SHIRINY=375 node scripts/check-mobile-overflow.mjs.
   Префиксы сужают обход: `node scripts/check-mobile-overflow.mjs /zadaniya/4/`. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium);

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'out');
const PORT = 4183;
const SHIRINY = process.env.SHIRINY
  ? process.env.SHIRINY.split(',').map(Number)
  : [320, 360, 375, 390, 430, 768];
const POTOKI = 6;

const TIPY = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
};

function server() {
  return http.createServer((req, res) => {
    const put = decodeURIComponent((req.url ?? '/').split('?')[0]);
    let file = path.join(OUT, put);
    if (!file.startsWith(OUT)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, 'index.html');
    }
    if (!fs.existsSync(file)) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('404');
      return;
    }
    res.writeHead(200, { 'content-type': TIPY[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

/* Все страницы экспорта: папка с index.html — адрес. */
function vseStranitsy() {
  const puti = [];
  const obhod = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === '_next') continue;
        obhod(p);
      } else if (e.name === 'index.html') {
        const rel = path.relative(OUT, dir).split(path.sep).join('/');
        puti.push(rel === '' ? '/' : `/${rel}/`);
      }
    }
  };
  obhod(OUT);
  return puti.sort();
}

/* Что вылезает за экран: элементы, правый край которых правее окна,
   и ни один предок их не обрезает. Из цепочки вложенных берём
   верхний — он и есть причина. */
function zamer() {
  const w = document.documentElement.clientWidth;
  /* Прокрутки нет — искать виновника незачем: обход всех элементов
     с их предками на больших страницах теории занимает минуты. */
  const scroll = document.documentElement.scrollWidth - w;
  if (scroll <= 0) return { scroll, elementy: [] };
  const opis = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += `#${el.id}`;
    const cls = typeof el.className === 'string' ? el.className : (el.getAttribute('class') ?? '');
    if (cls.trim()) s += `.${cls.trim().split(/\s+/).slice(0, 3).join('.')}`;
    return s;
  };
  const put = (el) => {
    const chain = [];
    for (let e = el; e && e !== document.body && chain.length < 4; e = e.parentElement) {
      chain.unshift(opis(e));
    }
    return chain.join(' > ');
  };
  const obrezaet = (el) => {
    const cs = getComputedStyle(el);
    return cs.overflowX !== 'visible' || cs.contain.includes('paint');
  };
  const vyhodyat = new Set();
  for (const el of document.body.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right <= w + 1 && r.left >= -1) continue;
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed' || cs.visibility === 'hidden') continue;
    let skryt = false;
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      if (getComputedStyle(a).position === 'fixed') {
        skryt = true;
        break;
      }
      if (a !== document.body && obrezaet(a)) {
        const ar = a.getBoundingClientRect();
        if (ar.right <= w + 1 && ar.left >= -1) {
          skryt = true;
          break;
        }
      }
    }
    if (!skryt) vyhodyat.add(el);
  }
  const verhnie = [...vyhodyat].filter((el) => !vyhodyat.has(el.parentElement));
  return {
    scroll,
    elementy: verhnie.slice(0, 6).map((el) => {
      const r = el.getBoundingClientRect();
      return {
        put: put(el),
        right: Math.round(r.right),
        left: Math.round(r.left),
        width: Math.round(r.width),
      };
    }),
  };
}

async function main() {
  const args = process.argv.slice(2);
  let jsonOut = null;
  const prefiksy = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--json') jsonOut = args[++i];
    else prefiksy.push(args[i]);
  }
  if (!fs.existsSync(path.join(OUT, 'index.html'))) {
    throw new Error('Нет собранного экспорта: сначала pnpm build');
  }
  /* Справочник №1 для печати — только лист A4, экранного вида у него нет. */
  let puti = vseStranitsy().filter((p) => !p.startsWith('/zadaniya/1/pechat/spravochnik/'));
  if (prefiksy.length > 0) puti = puti.filter((p) => prefiksy.some((x) => p.startsWith(x)));

  const srv = server();
  await new Promise((done) => srv.listen(PORT, done));
  const svoy = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(svoy === undefined ? {} : { executablePath: svoy });
  /* Служебная проверка аналогов №11 весит 70 МБ: раскладка такой
     страницы занимает больше минуты — ей и сроки дольше. */
  const ves = (put) => fs.statSync(path.join(OUT, put, 'index.html')).size;
  const zadachi = [];
  for (const put of puti) {
    const dolgo = ves(put) > 30 * 1024 * 1024 ? 8 : 1;
    for (const shirina of SHIRINY) zadachi.push({ put, shirina, dolgo });
  }
  const itog = [];
  let i = 0;
  /* Ожидание с потолком: что бы ни повисло (переход, шрифты, закрытие
     вкладки), поток не стоит вечно. */
  const sroch = (p, ms, chto) =>
    Promise.race([
      p,
      new Promise((_, no) => setTimeout(() => no(new Error(`${chto}: нет ответа ${ms} мс`)), ms)),
    ]);
  const proverit = async (z) => {
    const page = await sroch(
      browser.newPage({ viewport: { width: z.shirina, height: 800 } }),
      15000,
      'вкладка',
    );
    /* Листы печати сами открывают окно печати и спрашивают confirm:
       в тесте ни то ни другое не нужно, иначе страница ждёт вечно. */
    await page.addInitScript(() => {
      window.print = () => {};
      window.confirm = () => true;
    });
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    try {
      await page.goto(`http://127.0.0.1:${PORT}${z.put}`, {
        waitUntil: 'load',
        timeout: 30000 * z.dolgo,
      });
      /* Старый адрес уводит на новый сам, пока ждём шрифты. */
      await sroch(
        page.evaluate(() => document.fonts.ready),
        15000,
        'шрифты',
      );
      await page.waitForTimeout(400);
      const r = await sroch(page.evaluate(zamer), 15000 * z.dolgo, 'замер');
      if (r.scroll > 0 || r.elementy.length > 0)
        itog.push({ put: z.put, shirina: z.shirina, ...r });
    } catch (e) {
      /* Старые адреса (…/podgotovka/) уводят на новые сами: страница
         ушла из-под замера — проверять на ней нечего. */
      if (!/context was destroyed|navigation/i.test(String(e))) {
        itog.push({ put: z.put, shirina: z.shirina, oshibka: String(e).slice(0, 200) });
      }
    } finally {
      await sroch(page.close(), 10000, 'закрытие').catch(() => {});
    }
  };
  let gotovo = 0;
  const rabotnik = async () => {
    while (i < zadachi.length) {
      const z = zadachi[i++];
      try {
        await sroch(proverit(z), 60000 * z.dolgo, 'страница');
      } catch (e) {
        itog.push({ put: z.put, shirina: z.shirina, oshibka: String(e).slice(0, 200) });
      }
      gotovo += 1;
      if (gotovo % 100 === 0) process.stderr.write(`… ${gotovo} из ${zadachi.length}\n`);
    }
  };
  try {
    await Promise.all(Array.from({ length: POTOKI }, rabotnik));
  } finally {
    await sroch(browser.close(), 15000, 'браузер').catch(() => {});
    srv.close();
  }
  itog.sort((a, b) => (a.put === b.put ? a.shirina - b.shirina : a.put < b.put ? -1 : 1));
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(itog, null, 2));
  const prokrutka = itog.filter((x) => x.scroll > 0 || x.oshibka);
  for (const x of prokrutka) {
    console.log(`${x.put} @${x.shirina}: ${x.oshibka ?? `+${x.scroll}px`}`);
    for (const e of x.elementy ?? []) console.log(`    ${e.put}  [${e.left}…${e.right}]`);
  }
  console.log(
    `Страниц: ${puti.length}, проверок: ${zadachi.length}, с прокруткой страницы: ${prokrutka.length}`,
  );
  process.exitCode = prokrutka.length > 0 ? 1 : 0;
}

await main();
/* Сервер и браузер иногда держат открытые соединения после закрытия
   (страницы-переадресации …/podgotovka/): итог уже напечатан — выходим. */
process.exit(process.exitCode ?? 0);
