/**
 * Снимки настоящих страниц для «Как пользоваться сайтом»:
 * public/images/kak-polzovatsya/shagi/*.webp.
 *
 *   pnpm build && node scripts/snimki-kak-polzovatsya.mjs [адрес сервера]
 *
 * Снимает собранный сайт (app/out) на своём сервере 127.0.0.1 при
 * deviceScaleFactor 2 — текст на снимках резкий и в окне на весь экран.
 * Генератор открыт ключом проверок (budetege:dostup:proverka), баннер
 * cookie скрыт. Кадр — область страницы правее бокового меню, 16:10;
 * листы А4 — сам лист генератора от верха.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { bezBanneraCookieVsyudu, DOSTUP_PROVERKA_KEY } from './lib/cookie-notice.mjs';

const APP = path.join(import.meta.dirname, '..');
const OUT = path.join(APP, 'out');
const DIR = path.join(APP, 'public', 'images', 'kak-polzovatsya', 'shagi');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/x-component',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
};

function server() {
  return http.createServer((req, res) => {
    let p = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(OUT, p);
    if (!file.startsWith(OUT) || !fs.existsSync(file)) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

const W = 1280;
const H = 800;
/** Высота верхней полосы сайта: кадр начинается ниже неё. */
const VERH = 52;

async function main() {
  let base = process.argv[2];
  let srv = null;
  if (base === undefined) {
    srv = server();
    await new Promise((r) => srv.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${srv.address().port}`;
  }
  bezBanneraCookieVsyudu(chromium);
  fs.mkdirSync(DIR, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  await ctx.addInitScript((k) => {
    try {
      localStorage.setItem(k, 'true');
    } catch {
      /* без хранилища — генератор с пробной генерацией */
    }
  }, DOSTUP_PROVERKA_KEY);
  const p = await ctx.newPage();

  const otkryt = async (url) => {
    await p.goto(base + url, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(600);
  };

  /** Кадр 16:10 правее бокового меню; верх кадра — y на странице. */
  const kadr = async (imya, y) => {
    const left = await p.evaluate(() => Math.round(document.querySelector('.app-main')?.getBoundingClientRect().left ?? 0));
    await p.evaluate((t) => window.scrollTo(0, t), Math.max(0, y - VERH));
    await p.waitForTimeout(400);
    const width = W - left;
    const height = Math.round((width * 10) / 16);
    const buf = await p.screenshot({ clip: { x: left, y: VERH, width, height: Math.min(height, H - VERH) } });
    await sharp(buf).resize(2048, 1280, { fit: 'cover', position: 'top' }).webp({ quality: 84 }).toFile(path.join(DIR, `${imya}.webp`));
    console.log(`${imya}.webp`);
  };
  const nizShapki = async () =>
    p.evaluate(() => {
      const el = document.querySelector('header.shapka');
      return el === null ? 0 : el.getBoundingClientRect().bottom + window.scrollY - 8;
    });
  const verh = async (loc, zapas = 16) => {
    const b = await loc.boundingBox();
    const sy = await p.evaluate(() => window.scrollY);
    return (b?.y ?? 0) + sy - zapas;
  };

  /* Банк заданий. */
  await otkryt('/zadaniya/');
  await kadr('bank', 0);

  /* Теория и опорные задачи №1 (адреса — как на странице, по коду). */
  await otkryt('/zadaniya/planimetriya/teoriya/');
  await kadr('teoriya', await nizShapki());
  await otkryt('/zadaniya/planimetriya/opornye-zadachi/');
  await kadr('opornye', await nizShapki());

  /* Генератор №10: настройки и лист. */
  await otkryt('/zadaniya/tekstovye-zadachi/generator/');
  await kadr('generator', await nizShapki());

  /* Собранный лист ученика и учителя. */
  await p.getByRole('button', { name: /Сгенерировать/ }).first().click();
  await p.waitForTimeout(1500);
  const list = p.locator('.gen-paper').first();
  const a4 = async (imya) => {
    await list.scrollIntoViewIfNeeded();
    await p.waitForTimeout(400);
    /* Снимок самого листа; кадр А4 — от верха листа. */
    const buf = await list.screenshot();
    const { width } = await sharp(buf).metadata();
    const h = Math.round((width * 297) / 210);
    await sharp(buf)
      .extract({ left: 0, top: 0, width, height: Math.min(h, (await sharp(buf).metadata()).height) })
      .resize(840, 1188, { fit: 'cover', position: 'top' })
      .webp({ quality: 84 })
      .toFile(path.join(DIR, `${imya}.webp`));
    console.log(`${imya}.webp`);
  };
  /* Высокое окно: задачи листа ниже экрана браузер не дорисовывает. */
  await p.setViewportSize({ width: W, height: 2400 });
  await a4('a4-uchenika');
  await p.getByRole('button', { name: 'Учитель', exact: true }).first().click();
  await p.waitForTimeout(800);
  await a4('a4-uchitelya');
  await p.setViewportSize({ width: W, height: H });
  await kadr('list-uchitelya', await verh(list, 64));

  /* Тренажёр №4 с открытой подсказкой. */
  await otkryt('/zadaniya/veroyatnost/trenazher/');
  await p.getByRole('button', { name: /Все методы вперемешку/ }).first().click();
  await p.waitForTimeout(1000);
  await p.locator('.trn-podskazka-knopka').first().click();
  await p.waitForTimeout(600);
  await kadr('trenazher', await verh(p.locator('.trn-zadacha').first(), 24));

  /* Готовые уроки №10. */
  await otkryt('/zadaniya/tekstovye-zadachi/dlya-repetitorov/');
  await kadr('uroki', await verh(p.getByText('Маршруты уроков').first(), 24));

  await browser.close();
  srv?.close();
}

await main();
