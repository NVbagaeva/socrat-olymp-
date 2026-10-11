#!/usr/bin/env node
/* scripts/build-intro-still.mjs — статичный кадр заставки первого визита.

   Запуск: pnpm dev (в другом окне), затем pnpm build:intro-still
   Адрес сервера — INTRO_BASE (по умолчанию http://127.0.0.1:3000).

   Открывает /dev/intro/?still: та же сцена рисует финальный кадр
   (момент IDLE_STOP_S) на прозрачном фоне в рамке STILL из
   src/components/onboarding/intro/layout.ts. Пиксели забираются прямо
   с холста и сохраняются в public/onboarding/:
     intro-still.webp    — 2× (компьютер, экраны с высокой плотностью);
     intro-still-sm.webp — 1× (телефон: цветок там меньше).
   Картинку показывают при reduced-motion, без WebGL, на слабых
   устройствах — вместо анимации, сразу с окном. */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { chromium } from 'playwright';
import { APP } from './lib/load-ts.mjs';

const BASE = process.env.INTRO_BASE ?? 'http://127.0.0.1:3000';
const OUT = path.join(APP, 'public', 'onboarding');

const browser = await chromium.launch({
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
});
const page = await browser.newPage({
  viewport: { width: 1000, height: 800 },
  deviceScaleFactor: 2,
});
await page.goto(`${BASE}/dev/intro/?still`, { waitUntil: 'load', timeout: 180000 });
const dataUrl = await page.waitForFunction(() => window.__stillPng, null, { timeout: 180000 });
const png = Buffer.from((await dataUrl.jsonValue()).split(',')[1], 'base64');
await browser.close();

fs.mkdirSync(OUT, { recursive: true });
const meta = await sharp(png).metadata();
await sharp(png)
  .webp({ quality: 72, alphaQuality: 80, effort: 6 })
  .toFile(path.join(OUT, 'intro-still.webp'));
await sharp(png)
  .resize(Math.round(meta.width / 2))
  .webp({ quality: 72, alphaQuality: 80, effort: 6 })
  .toFile(path.join(OUT, 'intro-still-sm.webp'));
for (const name of ['intro-still.webp', 'intro-still-sm.webp']) {
  const size = fs.statSync(path.join(OUT, name)).size;
  console.log(`${name}: ${Math.round(size / 1024)} КБ`);
}
