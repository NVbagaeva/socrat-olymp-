#!/usr/bin/env node
/* scripts/glavnaya/snimki-vecher.mjs — настоящие снимки страниц сайта для
   витрины возможностей на главной (components/landing/sumerki/
   Vitrina.tsx): генератор рабочих листов и тренажёр.

   Снимает собранный сайт (app/out) с фиксированными зёрнами: листы — по
   адресам печати с seed в адресе, экраны тренажёра — с подменённым
   Math.random (генератор с постоянным зерном), так что при пересборке
   кадры те же. Имён учеников и личных данных нет: строка «Фамилия, имя»
   пустая, в шапке листа — автор сайта.

   Генераторы большинства заданий без тарифа закрыты (lib/tarify/
   dostup.ts), поэтому браузер съёмки ставит ключ проверок
   budetege:dostup:proverka — он действует только на 127.0.0.1. Печать
   варианта сама зовёт окно печати браузера — на съёмке оно отключено.

   Выход — public/images/glavnaya/vitrina-<имя>-…webp:
     -{520,1040}      кадр для витрины (у листа — верх страницы A4);
     -polnyy-{1200,1588} целиком, для просмотра (грузится только когда
                      просмотр открыли).

   Запуск (после сборки): node scripts/glavnaya/snimki-vecher.mjs */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(APP, 'out');
const DIR = path.join(APP, 'public/images/glavnaya');
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет сборки app/out: сначала pnpm build');
  process.exit(1);
}
fs.mkdirSync(DIR, { recursive: true });

/* ── Наборы и адреса. Зёрна фиксированы. ──────────────────────────── */

const PLANIMETRIYA = 's=p01%3A1%2Cp05%3A1%2Cp13%3A1&seed=GLAVNAYA1';
const SAMOSTOYATELNAYA = `/zadaniya/1/pechat/?m=v&i=m&ps=2&${PLANIMETRIYA}&v=3&vr=sr`;
/* sp=B — место для решения в клетку, по длине задачи (lib/sheet/space.js). */
const SAMOSTOYATELNAYA_KLETKA = `${SAMOSTOYATELNAYA}&sp=B`;
const UCHITEL = `/zadaniya/1/pechat/otvety/?m=v&i=m&ps=2&${PLANIMETRIYA}&v=3&vr=sr`;
const SYUZHET = '/zadaniya/11/pechat/?m=v&i=m&ps=2&s=DP-07%3A1%2CSM-04%3A1&v=1&seed=GLAVNAYA3';
const GRAFIK =
  '/zadaniya/12/generator/pechat/?ps=2&s=12Q.A%3A1%2C12.A%3A1&seed=GLAVNAYA12&t=color&c=1';

/** Генератор задания: нажать «Сгенерировать», взять адрес листа, своё зерно. */
async function adresGeneratora(page, no, seed) {
  await page.goto(`${BASE}/zadaniya/${no}/generator/`, { waitUntil: 'networkidle' });
  const go = page.locator('.gen-strip .gen-go');
  await go.waitFor({ timeout: 30000 });
  await go.click();
  await page.waitForTimeout(2500);
  const href = await page.evaluate(
    () => document.querySelector('a[href*="pechat"]')?.getAttribute('href') ?? '',
  );
  if (href === '') throw new Error(`№${no}: генератор не дал адрес листа`);
  return href.replace(/seed=[^&]+/, `seed=${seed}`).replace(/&kit=[^&]+/, '');
}

/** «Собрать вариант»: код варианта (зерно — от подменённого Math.random). */
async function kodVarianta(page) {
  await page.goto(`${BASE}/variant/`, { waitUntil: 'networkidle' });
  await page
    .locator('button.var-btn--tyoplyy', { hasText: /Сформировать/ })
    .first()
    .click();
  await page.waitForTimeout(3500);
  const href = await page.evaluate(
    () => document.querySelector('a[href*="/variant/reshat/"]')?.getAttribute('href') ?? '',
  );
  const kod = /kod=([^&]+)/.exec(href)?.[1];
  if (kod === undefined) throw new Error('«Собрать вариант»: нет кода');
  return kod;
}

/* ── Сервер и браузер ─────────────────────────────────────────────── */

const TIPY = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
};
const server = http.createServer((req, res) => {
  let file = path.join(OUT, decodeURIComponent((req.url ?? '/').split('?')[0]));
  if (!file.startsWith(OUT)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TIPY[path.extname(file)] ?? 'application/octet-stream' });
  res.end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 1000 },
  deviceScaleFactor: 2,
});
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('budetege:cookie-notice:v1', JSON.stringify({ seen: true }));
    localStorage.setItem('budetege:onboarding:v1', JSON.stringify({ welcomeSeen: true }));
    /* Только для съёмки: открывает генераторы на 127.0.0.1. */
    localStorage.setItem('budetege:dostup:proverka', 'true');
  } catch {
    /* без хранилища */
  }
  /* Постоянное зерно для всего случайного на странице (mulberry32). */
  let a = 20261116;
  Math.random = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  /* Печать варианта сама зовёт окно печати — на съёмке не нужно. */
  window.print = () => {};
});
const page = await ctx.newPage();

/* ── Запись файлов ────────────────────────────────────────────────── */

async function zapisat(imya, kadr, polnyy) {
  const vyhody = [
    ...[520, 1040].map((w) => ({ w, src: kadr, file: `vitrina-${imya}-${w}.webp`, q: 80 })),
    ...[1200, 1588].map((w) => ({
      w,
      src: polnyy,
      file: `vitrina-${imya}-polnyy-${w}.webp`,
      q: 82,
    })),
  ];
  for (const v of vyhody) {
    const file = path.join(DIR, v.file);
    const info = await sharp(v.src)
      .resize({ width: v.w, withoutEnlargement: true })
      .webp({ quality: v.q, effort: 6 })
      .toFile(file);
    console.log(
      path.relative(APP, file),
      `${info.width}×${info.height}`,
      `${Math.round(info.size / 1024)} КБ`,
    );
  }
}

let otkryto = '';
async function otkryt(put) {
  if (otkryto === put) return;
  const otvet = await page.goto(BASE + put, { waitUntil: 'networkidle' });
  if (!otvet || otvet.status() !== 200) throw new Error(`${put}: ${otvet?.status()}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  otkryto = put;
}

/** Страница листа: по номеру или по тексту на ней; кадр — верх доли verh. */
async function list(imya, put, stranica, verh) {
  await otkryt(put);
  await page.waitForSelector('.sheet-page', { timeout: 60000 });
  const stranicy = page.locator('.sheet-page');
  let i = stranica.nomer ?? -1;
  if (stranica.tekst !== undefined) {
    const teksty = await stranicy.evaluateAll((els) => els.map((e) => e.innerText));
    i = teksty.findIndex(
      (t) => t.includes(stranica.tekst) && (!stranica.pervaya || t.includes('Фамилия')),
    );
  }
  if (i < 0) throw new Error(`${imya}: не нашлась страница`);
  const el = stranicy.nth(i);
  await el.scrollIntoViewIfNeeded();
  const polnyy = await el.screenshot();
  const { width: W, height: H } = await sharp(polnyy).metadata();
  const kadr = await sharp(polnyy)
    .extract({ left: 0, top: 0, width: W, height: Math.round(H * verh) })
    .toBuffer();
  await zapisat(imya, kadr, polnyy);
}

/** Одна задача с листа (с чертежом или графиком): кадр и просмотр — она же. */
async function zadacha(imya, put, sRisunkom = true) {
  await otkryt(put);
  await page.waitForSelector('.sheet-task', { timeout: 60000 });
  const zadachi = page.locator('.sheet-item, .sheet-task');
  const n = await zadachi.count();
  for (let i = 0; i < n; i += 1) {
    const el = zadachi.nth(i);
    const est = await el.evaluate((e) => e.querySelector('svg:not([class*="ico"]), img') !== null);
    if (!sRisunkom || est) {
      await el.scrollIntoViewIfNeeded();
      const png = await el.screenshot();
      await zapisat(imya, png, png);
      return;
    }
  }
  throw new Error(`${imya}: нет задачи с рисунком`);
}

/** Экран сайта: элемент целиком (или его верх до maxH css-пикселей). */
async function ekran(imya, el, maxH = 1100) {
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  /* Координаты страницы, а не окна: снимок идёт с fullPage. */
  const box = await el.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
  });
  const png = await page.screenshot({
    clip: { x: box.x, y: box.y, width: box.w, height: Math.min(box.h, maxH) },
    fullPage: true,
  });
  await zapisat(imya, png, png);
}

try {
  /* ── Генератор ── */
  await list('list-bez', SAMOSTOYATELNAYA, { tekst: 'Вариант 1', pervaya: true }, 0.56);
  await list('list-kletka', SAMOSTOYATELNAYA_KLETKA, { tekst: 'Вариант 1', pervaya: true }, 0.56);
  await list('variant-2', SAMOSTOYATELNAYA, { tekst: 'Вариант 2', pervaya: true }, 0.56);
  await list('variant-3', SAMOSTOYATELNAYA, { tekst: 'Вариант 3', pervaya: true }, 0.56);
  await list('uchitel-reshenie', UCHITEL, { nomer: 0 }, 0.56);
  await list('uchitel-otvety', UCHITEL, { tekst: 'Ответы' }, 0.56);

  const kod = await kodVarianta(page);
  otkryto = '';
  await list('pechat-varianta', `/variant/pechat/?kod=${kod}&v=1&list=uchenik`, { nomer: 0 }, 0.56);
  await otkryt(`/variant/reshat/?kod=${kod}&v=1&r=t&tm=0&w=ege`);
  await page.getByRole('button', { name: 'Начать' }).first().click();
  await page.waitForTimeout(2000);
  await ekran('onlayn', page.locator('main').first(), 980);

  await zadacha('zadacha-chertezh', SAMOSTOYATELNAYA);
  await zadacha('zadacha-grafik', GRAFIK);
  await zadacha('zadacha-syuzhet', SYUZHET, false);
  otkryto = '';
  await zadacha('zadacha-stereo', await adresGeneratora(page, '3', 'GLAVNAYA4'));

  await otkryt('/zadaniya/19/teoriya/');
  await ekran('parametr', page.locator('#teoriya-m01'), 1100);

  /* ── Тренажёр: №10 «Текстовые задачи», подсказка вопросами ── */
  otkryto = '';
  await otkryt('/zadaniya/11/trenazher/');
  await page.getByText('Все типы вперемешку').first().click();
  await page.waitForTimeout(2500);
  await page
    .getByRole('button', { name: /Подсказка/ })
    .first()
    .click();
  await page.waitForTimeout(1500);
  /* Колонка тренажёра: условие, поле ответа и подсказка-вопрос. */
  const kolonka = page.locator('.trn-ekran').first();
  await ekran('podskazka', kolonka, 1100);
  /* Неверный вариант гаснет (is-mimo). Верный ведёт к следующему шагу —
     тогда пробуем на нём. */
  for (let popytka = 0; popytka < 8; popytka += 1) {
    if ((await page.locator('.trn-vopros__knopka.is-mimo').count()) > 0) break;
    const svobodnaya = page.locator('.trn-vopros__knopka:not([disabled]):not(.is-verno)').first();
    if ((await svobodnaya.count()) === 0) break;
    await svobodnaya.click();
    await page.waitForTimeout(500);
  }
  await ekran('oshibka', kolonka, 1100);

  /* ── Карточки: лицевая сторона и оборот ── */
  otkryto = '';
  await otkryt('/zadaniya/1/kartochki/');
  await page.getByRole('button', { name: 'Начать' }).first().click();
  await page.waitForTimeout(1500);
  const karta = page.locator('.kart-card--front').first();
  await ekran(
    'kartochka-lico',
    karta.locator('xpath=ancestor::*[contains(@class,"kart")][2]'),
    900,
  );
  await karta.click();
  await page.waitForTimeout(1200);
  await ekran(
    'kartochka-oborot',
    karta.locator('xpath=ancestor::*[contains(@class,"kart")][2]'),
    900,
  );
} finally {
  await browser.close();
  server.close();
}
