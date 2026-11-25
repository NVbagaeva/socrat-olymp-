/**
 * Проверка страницы «Как пользоваться сайтом» по собранному сайту.
 *
 *   pnpm build && pnpm test:kak-polzovatsya
 *
 * Обе вкладки (?dlya=repetitor и ?dlya=uchenik), ширина 1440 и 375:
 *   — картинки загрузились, у всех есть alt;
 *   — нажатие на шаг, «Дальше →» и стрелки меняют выбранный шаг,
 *     заливку дорожки и снимок; «Открыть →» ведёт на страницу из сборки;
 *   — под содержимым блока шагов нет пустоты больше 24 px;
 *   — мини-задача: подсказка открывает 3 вопроса по очереди, «0,4» и
 *     «0.4» принимаются, «0,6» — нет;
 *   — глава видео перематывает ролик и подсвечивается;
 *   — закрытые вопросы FAQ не показывают текст ответа;
 *   — горизонтальной прокрутки нет.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

const APP = path.join(import.meta.dirname, '..');
const OUT = path.join(APP, 'out');
if (!fs.existsSync(path.join(OUT, 'kak-polzovatsya', 'index.html'))) {
  console.error('Нет сборки app/out: сначала pnpm build');
  process.exit(1);
}

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

function fileOf(url) {
  let p = decodeURIComponent(url.split(/[?#]/)[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(OUT, p);
  return f.startsWith(OUT) && fs.existsSync(f) && fs.statSync(f).isFile() ? f : null;
}

/* Свой сервер с Range: без него браузер не перематывает видео. */
const server = http.createServer((req, res) => {
  const file = fileOf(req.url ?? '/');
  if (file === null) {
    res.writeHead(404);
    res.end();
    return;
  }
  const size = fs.statSync(file).size;
  const type = MIME[path.extname(file)] ?? 'application/octet-stream';
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
  if (range !== null) {
    const start = range[1] === '' ? 0 : Number(range[1]);
    const end = range[2] === '' ? size - 1 : Number(range[2]);
    res.writeHead(206, {
      'content-type': type,
      'content-range': `bytes ${start}-${end}/${size}`,
      'accept-ranges': 'bytes',
      'content-length': end - start + 1,
    });
    fs.createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { 'content-type': type, 'content-length': size, 'accept-ranges': 'bytes' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

bezBanneraCookieVsyudu(chromium);
const browser = await chromium.launch();

for (const width of [1440, 375]) {
  for (const tab of ['repetitor', 'uchenik']) {
    const kto = `${tab} ${width}`;
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const p = await ctx.newPage();
    const oshibki = [];
    p.on('pageerror', (e) => oshibki.push(e.message));
    await p.goto(`${BASE}/kak-polzovatsya/?dlya=${tab}`, { waitUntil: 'networkidle' });

    /* Прокрутка до низа: ленивые картинки и блоки подгружаются. */
    const vysota = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < vysota + 900; y += 500) {
      await p.evaluate((t) => window.scrollTo(0, t), y);
      await p.waitForTimeout(120);
    }
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(400);

    /* Картинки. */
    const kartinki = await p.$$eval('.howto img', (imgs) =>
      imgs.map((i) => ({
        src: i.currentSrc || i.src,
        alt: i.hasAttribute('alt'),
        ok: i.complete && i.naturalWidth > 0,
      })),
    );
    check(kartinki.length > 0, `${kto}: на странице нет картинок`);
    for (const k of kartinki) {
      check(k.alt, `${kto}: нет alt у ${k.src}`);
      check(k.ok, `${kto}: не загрузилась ${k.src}`);
    }

    /* Горизонтальная прокрутка. */
    const shire = await p.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    check(shire <= 0, `${kto}: горизонтальная прокрутка ${shire}px`);

    /* Шаги. */
    const shagi = p.locator('.put [role="tab"]');
    const n = await shagi.count();
    check(n === (tab === 'repetitor' ? 5 : 4), `${kto}: шагов ${n}`);
    check(
      (await shagi.nth(0).getAttribute('aria-selected')) === 'true',
      `${kto}: по умолчанию выбран не шаг 1`,
    );
    const sostoyanie = () =>
      p.evaluate(() => ({
        sel: [...document.querySelectorAll('.put [role="tab"]')].findIndex(
          (t) => t.getAttribute('aria-selected') === 'true',
        ),
        zal: document.querySelector('.put__zalivka')?.getBoundingClientRect().height ?? -1,
        snimok: document.querySelector('.put__ramka img')?.getAttribute('src') ?? '',
        href: document.querySelector('.put__otkryt')?.getAttribute('href') ?? '',
      }));
    const ssylki = new Set();
    let pred = await sostoyanie();
    ssylki.add(pred.href);
    for (let i = n - 1; i >= 1; i--) {
      await shagi.nth(i).click();
      await p.waitForTimeout(450);
      const s = await sostoyanie();
      check(s.sel === i, `${kto}: нажатие на шаг ${i + 1} не выбрало его`);
      check(s.zal !== pred.zal, `${kto}: дорожка не изменилась на шаге ${i + 1}`);
      ssylki.add(s.href);
      pred = s;
    }
    await shagi.nth(0).click();
    await p.waitForTimeout(450);
    const s0 = await sostoyanie();
    await p.getByRole('button', { name: 'Дальше →' }).click();
    await p.waitForTimeout(450);
    const s1 = await sostoyanie();
    check(s1.sel === 1, `${kto}: «Дальше →» не перешла на шаг 2`);
    check(s1.zal > s0.zal, `${kto}: «Дальше →» не заполнила дорожку`);
    check(s1.snimok !== s0.snimok, `${kto}: «Дальше →» не сменила снимок`);
    await shagi.nth(1).focus();
    await p.keyboard.press('ArrowDown');
    await p.waitForTimeout(450);
    const s2 = await sostoyanie();
    check(s2.sel === 2, `${kto}: стрелка вниз не выбрала шаг 3`);
    check(s2.snimok !== s1.snimok || s2.href !== s1.href, `${kto}: стрелка не сменила снимок`);
    await p.keyboard.press('ArrowUp');
    await p.waitForTimeout(450);
    check((await sostoyanie()).sel === 1, `${kto}: стрелка вверх не вернула шаг 2`);
    for (const h of ssylki) {
      check(fileOf(h) !== null, `${kto}: «Открыть →» ведёт в 404: ${h}`);
    }

    /* Пустота под содержимым блока шагов. */
    const pustota = await p.evaluate(() => {
      const put = document.querySelector('.put');
      if (put === null) return 999;
      const pad = parseFloat(getComputedStyle(put).paddingBottom);
      const niz = Math.max(
        ...[...put.querySelectorAll('.put__nav, .put__panel, .put [role="tab"]')].map(
          (e) => e.getBoundingClientRect().bottom,
        ),
      );
      return put.getBoundingClientRect().bottom - pad - niz;
    });
    check(pustota <= 24, `${kto}: под блоком шагов пусто ${Math.round(pustota)}px`);

    /* Мини-задача. */
    const proba = p.locator('.proba');
    await proba.scrollIntoViewIfNeeded();
    await proba.getByRole('button', { name: /Подсказка/ }).click();
    const voprosy = proba.locator('.trn-vopros');
    check((await voprosy.count()) === 1, `${kto}: подсказка открыла не один вопрос`);
    /* Верные кнопки: «10», «4», «4 на 10» — по порядку в вопросе. */
    const verno = [1, 0, 0];
    for (let i = 0; i < 3; i++) {
      const knopki = voprosy.nth(i).locator('.trn-vopros__knopka');
      check((await knopki.count()) === 3, `${kto}: в вопросе ${i + 1} не три варианта`);
      await knopki.nth(verno[i]).click();
      await p.waitForTimeout(150);
      const otkryto = await voprosy.count();
      check(otkryto === Math.min(i + 2, 3), `${kto}: после вопроса ${i + 1} открыто ${otkryto}`);
    }
    const pole = proba.locator('input');
    const proverit = async (v) => {
      await pole.fill(v);
      await proba.getByRole('button', { name: 'Проверить' }).click();
      await p.waitForTimeout(150);
      return proba.locator('.trn-verdikt--da').count();
    };
    check((await proverit('0,6')) === 0, `${kto}: ответ 0,6 принят`);
    check((await proverit('0,4')) === 1, `${kto}: ответ 0,4 не принят`);
    await proba.getByRole('button', { name: 'Решить заново' }).click();
    check((await proverit('0.4')) === 1, `${kto}: ответ 0.4 не принят`);

    /* Главы видео. */
    const glava = p.locator('.vid__glava', { hasText: 'Подсказки' });
    await glava.scrollIntoViewIfNeeded();
    await glava.click();
    await p.waitForTimeout(800);
    const t = await p.evaluate(() => document.querySelector('.vid__player')?.currentTime ?? -1);
    check(t >= 20.5 && t < 26, `${kto}: глава «Подсказки» перемотала на ${t}`);
    check(
      (await glava.getAttribute('class'))?.includes('is-active') === true,
      `${kto}: глава «Подсказки» не подсвечена`,
    );
    await p.evaluate(() => document.querySelector('.vid__player')?.pause());

    /* Закрытые вопросы FAQ. */
    const faq = await p.$$eval('.howto__q:not(.open) .solution-details-body', (els) =>
      els.map((e) => {
        const inner = e.firstElementChild;
        return {
          h: e.getBoundingClientRect().height,
          vis: inner === null ? 'hidden' : getComputedStyle(inner).visibility,
        };
      }),
    );
    check(faq.length > 0, `${kto}: нет вопросов FAQ`);
    for (const [i, f] of faq.entries()) {
      check(f.h < 1 && f.vis === 'hidden', `${kto}: закрытый вопрос ${i + 1} виден (${f.h}px, ${f.vis})`);
    }

    check(oshibki.length === 0, `${kto}: ошибки страницы: ${oshibki.join('; ')}`);
    await ctx.close();
  }
}

await browser.close();
server.close();

if (failures.length > 0) {
  console.error(`Как пользоваться: ${failures.length} из ${checks} проверок не прошли:`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`Как пользоваться: все ${checks} проверок прошли`);
