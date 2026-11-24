#!/usr/bin/env node
/* scripts/check-dostup-generatorov.mjs — генераторы без тарифа
   (lib/tarify/dostup.ts) в браузере, на собранном сайте (out/).

     • Закрытое задание (№3, №13): вместо генератора — карточка «в
       пробном доступе и на платных тарифах», ссылка на тарифы и на
       открытые генераторы.
     • Открытое (№1, №10): первая генерация проходит, вторая — окно
       «Лист готов…» (раньше — «Пробная генерация использована»), лист остаётся. У каждого
       задания свой счётчик.
     • «Собрать вариант»: то же — одна пробная генерация.
     • Генераторы базы (№5, №12) открыты без тарифа и без счётчика:
       вторая генерация проходит без окна тарифов.
     • Ключ проверок budetege:dostup:proverka открывает всё.

   Браузер здесь — посетитель без ключа проверок: общий помощник
   scripts/lib/cookie-notice.mjs кладёт ключ, поэтому баннер cookie и
   окно «Впервые здесь?» закрываются здесь своим скриптом. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP } from './lib/load-ts.mjs';
import { nomerRazdela } from '../src/content/struktura.js';
import { kod } from './lib/adres.mjs';

/* Заголовок окна после пробной генерации (content/generatorUi.ts). */
const OKNO_TEKST = 'Лист готов — его можно скачать и распечатать';
/* Номер для показа: в адресе — номер хранения, на экране — номер ЕГЭ. */
const ege = (no) => String(nomerRazdela(Number(no)));

const OUT = path.join(APP, 'out');
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет папки сборки out: сначала pnpm build');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};
const server = http.createServer((req, res) => {
  let file = path.join(OUT, decodeURIComponent(req.url.split('?')[0]));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = 'http://127.0.0.1:' + server.address().port;

let checks = 0;
const errors = [];
function check(ok, text) {
  checks += 1;
  if (!ok) errors.push(text);
}

const browser = await chromium.launch();
async function posetitel({ proverka = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript((klyuch) => {
    try {
      localStorage.setItem('budetege:cookie-notice:v1', JSON.stringify({ seen: true }));
      localStorage.setItem('budetege:onboarding:v1', JSON.stringify({ welcomeSeen: true }));
      if (klyuch) localStorage.setItem('budetege:dostup:proverka', 'true');
    } catch {
      /* без хранилища */
    }
  }, proverka);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`ошибка на странице: ${e}`));
  return { ctx, page };
}

const OKNO = '.gen-sheet__title';
const okno = async (page) =>
  (await page.locator(OKNO).count()) > 0 ? await page.locator(OKNO).first().innerText() : null;

/* ── Закрытые задания ─────────────────────────────────────────── */
{
  const { ctx, page } = await posetitel();
  for (const no of ['3', '13']) {
    await page.goto(`${BASE}/zadaniya/${kod(no)}/generator/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    check(
      (await page.locator('.gen-zamok').count()) === 1,
      `№${no}: нет карточки закрытого генератора`,
    );
    check((await page.locator('section.gen').count()) === 0, `№${no}: генератор открыт без тарифа`);
    check(
      (await page.locator('.gen-zamok a[href="/tarify/"]').count()) === 1,
      `№${no}: нет ссылки на тарифы`,
    );
    const zagolovok = await page.locator('.gen-zamok__zagolovok').innerText();
    check(
      zagolovok.includes(`№${ege(no)} `),
      `№${no}: в заголовке карточки не номер ЕГЭ №${ege(no)}: «${zagolovok}»`,
    );
    for (const otkr of ['1', '2', '10', '11']) {
      const ssylka = page.locator(`.gen-zamok a[href="/zadaniya/${kod(otkr)}/generator/"]`);
      check((await ssylka.count()) === 1, `№${no}: нет ссылки на открытый генератор №${otkr}`);
      if ((await ssylka.count()) === 1) {
        const tekst = (await ssylka.innerText()).trim();
        check(
          tekst === `№${ege(otkr)}`,
          `№${no}: ссылка на генератор ${otkr} подписана «${tekst}»`,
        );
      }
    }
  }
  await ctx.close();
}

/* ── Открытые задания: одна пробная генерация ─────────────────── */
{
  const { ctx, page } = await posetitel();
  for (const no of ['1', '10']) {
    await page.goto(`${BASE}/zadaniya/${kod(no)}/generator/`, { waitUntil: 'networkidle' });
    const go = page.locator('.gen-strip .gen-go');
    await go.waitFor();
    await go.click();
    await page.waitForSelector('.gen-paper.is-live .gen-task', { timeout: 60000 });
    check((await okno(page)) === null, `№${no}: первая генерация не прошла`);
    await go.click();
    await page.waitForTimeout(400);
    check((await okno(page)) === OKNO_TEKST, `№${no}: вторая генерация без окна тарифов`);
    const tekstOkna = await page.locator('.gen-zamok__okno p').innerText();
    check(
      tekstOkna.includes(`№${ege(no)} `),
      `№${no}: в окне не номер ЕГЭ №${ege(no)}: «${tekstOkna}»`,
    );
    await page.keyboard.press('Escape');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.gen-paper.is-live .gen-task', { timeout: 60000 });
    check(true, `№${no}: лист после перезагрузки на месте`);
  }
  await ctx.close();
}

/* ── Генераторы базы: открыты целиком, без счётчика ─────────── */
{
  const { ctx, page } = await posetitel();
  for (const no of ['5', '12']) {
    await page.goto(`${BASE}/baza/zadaniya/${no}/generator/`, { waitUntil: 'networkidle' });
    await page.locator('section.gen').waitFor();
    check((await page.locator('.gen-zamok').count()) === 0, `база №${no}: генератор закрыт`);
    const go = page.locator('.gen-strip .gen-go');
    await go.click();
    await page.waitForSelector('.gen-paper.is-live .gen-task', { timeout: 60000 });
    await go.click();
    await page.waitForTimeout(400);
    check((await okno(page)) === null, `база №${no}: вторая генерация с окном тарифов`);
  }
  await ctx.close();
}

/* ── «Собрать вариант» ────────────────────────────────────────── */
{
  const { ctx, page } = await posetitel();
  await page.goto(`${BASE}/variant/`, { waitUntil: 'networkidle' });
  const go = page.locator('button.var-btn--tyoplyy', { hasText: /Сформировать|Перегенерировать/ });
  await go.first().waitFor();
  await go.first().click();
  await page.locator('button.var-btn--tyoplyy', { hasText: 'Перегенерировать' }).waitFor({
    timeout: 60000,
  });
  check((await okno(page)) === null, '«Собрать вариант»: первая генерация не прошла');
  await go.first().click();
  await page.waitForTimeout(400);
  check((await okno(page)) === OKNO_TEKST, '«Собрать вариант»: вторая генерация без окна тарифов');
  await ctx.close();
}

/* ── Ключ проверок открывает всё ─────────────────────────────── */
{
  const { ctx, page } = await posetitel({ proverka: true });
  await page.goto(`${BASE}/zadaniya/stereometriya/generator/`, { waitUntil: 'networkidle' });
  await page.locator('section.gen').waitFor();
  check((await page.locator('.gen-zamok').count()) === 0, 'ключ проверок: №3 закрыт');
  const go = page.locator('.gen-strip .gen-go');
  await go.click();
  await page.waitForSelector('.gen-paper.is-live .gen-task', { timeout: 60000 });
  await go.click();
  await page.waitForTimeout(400);
  check((await okno(page)) === null, 'ключ проверок: вторая генерация с окном тарифов');
  await page.goto(`${BASE}/baza/zadaniya/12/generator/`, { waitUntil: 'networkidle' });
  await page.locator('section.gen').waitFor();
  check((await page.locator('.gen-zamok').count()) === 0, 'ключ проверок: база №12 закрыта');
  await page.locator('.gen-strip .gen-go').click();
  await page.waitForSelector('.gen-paper.is-live .gen-task', { timeout: 60000 });
  check(true, 'ключ проверок: база №12 собирает лист');
  await ctx.close();
}

await browser.close();
server.close();

if (errors.length > 0) {
  console.error(`Генераторы без тарифа: ${errors.length} из ${checks} проверок не прошли:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`Генераторы без тарифа: проверок ${checks}, расхождений нет.`);
