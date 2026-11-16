#!/usr/bin/env node
/* scripts/volna-shots.mjs — снимки «до / после» для pull request волны
   аудита продаж (docs/audit-prodazhi.md). Поднимает собранный сайт из
   папки (по умолчанию app/out) и снимает страницы на 390 и 1440 px
   глазами посетителя без тарифа: баннер cookie и приветствие уже
   закрыты.

   Запуск: node scripts/volna-shots.mjs <папка-снимков> [папка-сборки]

   Кроме страниц: окно после пробной генерации (№10), бургер-меню и
   экран «Ещё» на телефоне. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.resolve(process.argv[2] ?? 'snimki');
const OUT = path.resolve(process.argv[3] ?? path.join(ROOT, 'out'));
fs.mkdirSync(DIR, { recursive: true });

const TIPY = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.glb': 'model/gltf-binary',
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

/* [имя, адрес, страница целиком?] */
const STRANITSY = [
  ['glavnaya', '/', true],
  ['tarify', '/tarify/', true],
  ['z8-generator-zakryt', '/zadaniya/9/generator/', false],
  ['z8-o-zadanii', '/zadaniya/9/', false],
  ['z9-o-zadanii', '/zadaniya/10/', false],
  ['z17-o-zadanii', '/zadaniya/18/', false],
  ['sobrat-variant', '/variant/', false],
  ['about', '/about/', false],
  ['sg-prodazhi', '/styleguide/prodazhi/', false],
  ['sg-glavnaya-1', '/styleguide/prodazhi/glavnaya-1/', true],
  ['sg-glavnaya-2', '/styleguide/prodazhi/glavnaya-2/', true],
];
const SHIRINY = [
  { id: '390', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { id: '1440', viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false },
];
const MAX_H = 9000;

const browser = await chromium.launch();
try {
  for (const sh of SHIRINY) {
    const ctx = await browser.newContext({
      viewport: sh.viewport,
      isMobile: sh.isMobile,
      hasTouch: sh.hasTouch,
      deviceScaleFactor: 1,
    });
    await ctx.addInitScript(() => {
      try {
        localStorage.setItem('budetege:cookie-notice:v1', JSON.stringify({ seen: true }));
        localStorage.setItem('budetege:onboarding:v1', JSON.stringify({ welcomeSeen: true }));
      } catch {
        /* без хранилища */
      }
    });
    const page = await ctx.newPage();
    for (const [imya, adres, polnaya] of STRANITSY) {
      const otvet = await page.goto(BASE + adres, { waitUntil: 'load' });
      if (!otvet || otvet.status() !== 200) {
        console.log(sh.id, imya, 'нет страницы');
        continue;
      }
      await page.waitForTimeout(1200);
      await page.screenshot({
        path: path.join(DIR, `${imya}-${sh.id}.jpg`),
        type: 'jpeg',
        quality: 74,
      });
      if (polnaya) {
        const h = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < Math.min(h, MAX_H); y += 700) {
          await page.evaluate((yy) => window.scrollTo(0, yy), y);
          await page.waitForTimeout(100);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(600);
        await page.screenshot({
          path: path.join(DIR, `${imya}-${sh.id}-full.jpg`),
          type: 'jpeg',
          quality: 62,
          fullPage: h <= MAX_H,
          ...(h > MAX_H ? { clip: { x: 0, y: 0, width: sh.viewport.width, height: MAX_H } } : {}),
        });
      }
      console.log(sh.id, imya);
    }

    /* Окно после пробной генерации: №10 (адрес /zadaniya/11/). */
    await page.goto(`${BASE}/zadaniya/11/generator/`, { waitUntil: 'load' });
    /* На телефоне кнопка в другой полосе — ищем по названию. */
    const go = page.getByRole('button', { name: /Сгенерировать|Перегенерировать/ }).first();
    try {
      await go.waitFor({ timeout: 15000 });
      await go.click();
      await page.waitForSelector('.gen-paper.is-live .gen-task', { timeout: 60000 });
      await page.getByRole('button', { name: /Сгенерировать|Перегенерировать/ }).first().click();
      await page.waitForTimeout(900);
      await page.screenshot({
        path: path.join(DIR, `z10-okno-generacii-${sh.id}.jpg`),
        type: 'jpeg',
        quality: 74,
      });
    } catch (e) {
      console.log('окно генерации:', e.message);
    }

    if (sh.id === '390') {
      for (const [imya, adres] of [
        ['menu', '/'],
        ['menu-tarify', '/tarify/'],
      ]) {
        await page.goto(BASE + adres, { waitUntil: 'load' });
        await page.waitForTimeout(800);
        try {
          await page.locator('.burger').first().click({ timeout: 5000 });
          await page.waitForTimeout(1000);
          await page.screenshot({
            path: path.join(DIR, `${imya}-390.jpg`),
            type: 'jpeg',
            quality: 74,
          });
        } catch (e) {
          console.log(imya, e.message);
        }
      }
      const eshche = await page.goto(`${BASE}/eshche/`, { waitUntil: 'load' });
      if (eshche?.status() === 200) {
        await page.waitForTimeout(800);
        await page.screenshot({
          path: path.join(DIR, `eshche-390.jpg`),
          type: 'jpeg',
          quality: 74,
        });
      }
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}
