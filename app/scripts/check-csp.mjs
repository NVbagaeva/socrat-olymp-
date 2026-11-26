#!/usr/bin/env node
/* scripts/check-csp.mjs — политика CSP из .htaccess ничего не ломает.

   Запуск после pnpm build: pnpm test:csp (нужны apache2 и Chromium).

   Apache с .htaccess сборки (там Content-Security-Policy, раздел
   «Заголовки защиты»), Chromium открывает страницы разных видов:
   главная, банк, тренажёры с формулами KaTeX и чертежами, поле ответа
   MathLive (№14), печать, устный счёт, варианты, вход и кабинет, карта,
   тарифы. На каждой — прокрутка до конца (живые сцены грузятся по ходу)
   и щелчок по первому полю ответа. Нарушение политики
   (securitypolicyviolation) или «Refused to …» в консоли — ошибка. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startApache } from './lib/apache.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(APP, 'out');

const STRANICY = [
  '/',
  '/zadaniya/',
  '/zadaniya/vychisleniya/trenazher/',
  '/zadaniya/3/',
  '/zadaniya/3/trenazher/',
  '/zadaniya/uravnenie-s-otborom/trenazher/',
  '/zadaniya/8/pechat/',
  '/ustnyy-schet/',
  '/variant/',
  '/voyti/',
  '/kabinet/',
  '/karta/',
  '/tarify/',
].filter((p) => fs.existsSync(path.join(OUT, p, 'index.html')));

if (!fs.existsSync(path.join(OUT, '.htaccess'))) {
  console.error('Нет out/.htaccess — сначала pnpm build.');
  process.exit(2);
}

const port = 19000 + Math.floor(Math.random() * 1000);
const srv = await startApache(OUT, port);
const browser = await chromium.launch();
const oshibki = [];
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__csp.push(`${e.violatedDirective} ← ${e.blockedURI || 'встроенное'}`);
    });
  });
  for (const p of STRANICY) {
    const page = await context.newPage();
    const konsol = [];
    page.on('console', (m) => {
      if (/Content Security Policy|Refused to/i.test(m.text())) konsol.push(m.text().slice(0, 200));
    });
    const r = await page.goto(srv.url + p, { waitUntil: 'load' });
    if (!r || !r.headers()['content-security-policy']) oshibki.push(`${p}: нет заголовка CSP`);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((res) => setTimeout(res, 60));
      }
    });
    const pole = page.locator('math-field, .chast2-pole input, input[inputmode], textarea').first();
    if ((await pole.count()) > 0) await pole.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const csp = await page.evaluate(() => window.__csp);
    for (const v of [...new Set([...csp, ...konsol])]) oshibki.push(`${p}: ${v}`);
    await page.close();
  }
} finally {
  await browser.close();
  srv.stop();
}

if (oshibki.length > 0) {
  console.error('CSP: политика что-то заблокировала\n' + oshibki.map((o) => `  - ${o}`).join('\n'));
  process.exit(1);
}
console.log(`CSP: ${STRANICY.length} страниц без нарушений политики.`);
