#!/usr/bin/env node
/* scripts/check-fab-stable.mjs — кнопка «?» (HelpFab) стоит на месте.

   Запуск: pnpm build && pnpm test:fab-stable [префикс адреса…]

   Кнопка «?» плавает в правом нижнем углу экрана. Её место задаёт
   только CSS (onboarding.css: position: fixed, отступы — токены
   --fab-*), JS координат не считает. Проверка открывает собранный
   сайт в Chromium и WebKit (движок Safari на iPad) на планшетах
   768×1024, 820×1180, 834×1194, 1024×1366 в обеих ориентациях, на
   телефоне 390×844 и на компьютере 1440×900 и следит за кнопкой
   каждый кадр (requestAnimationFrame):
     — медленная прокрутка шагом 80 px, рывок до самого низа и обратно,
       прокрутка туда-сюда: кнопка относительно экрана не сдвигается
       больше чем на 1 px (кадры, где она намеренно скрыта, не в счёт);
     — поворот экрана: после поворота кнопка стоит ровно там же, где
       при загрузке страницы сразу в этой ориентации, и обратно;
     — переход между вкладками раздела: на новой вкладке кнопка там
       же, где при прямой загрузке этой вкладки;
     — поле ввода тренажёра на сенсорном экране: пока поле в фокусе
       (открыта клавиатура), кнопка спрятана, после — на прежнем месте;
     — кнопка не закрывает управление: в конце страницы — ни одну
       ссылку, кнопку или поле; на любом шаге прокрутки — ни один
       элемент закреплённых панелей («Сгенерировать», «Начать
       тренировку», нижняя навигация). */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, webkit } from 'playwright';
import { APP } from './lib/load-ts.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium, webkit);

const OUT = path.join(APP, 'out');
if (!fs.existsSync(OUT)) {
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
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};
/* Как Apache на хостинге: адрес папки без «/» — переадресация на «/». */
const server = http.createServer((req, res) => {
  const [put, query] = (req.url ?? '/').split('?');
  let file = path.join(OUT, decodeURIComponent(put));
  if (!file.startsWith(OUT)) {
    res.writeHead(403).end();
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!put.endsWith('/')) {
      res.writeHead(301, { location: put + '/' + (query ? '?' + query : '') }).end();
      return;
    }
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = 'http://127.0.0.1:' + server.address().port;

const ONLY = process.argv.slice(2).filter((arg) => arg.startsWith('/'));
const ALL_PAGES = [
  '/',
  '/zadaniya/',
  '/zadaniya/13/',
  '/zadaniya/13/teoriya/',
  '/zadaniya/13/trenazher/',
  '/zadaniya/13/generator/',
  '/zadaniya/11/generator/',
  '/variant/',
];
const PAGES =
  ONLY.length === 0 ? ALL_PAGES : ALL_PAGES.filter((u) => ONLY.some((p) => u.startsWith(p)));

const PLANSHETY = [
  [768, 1024],
  [820, 1180],
  [834, 1194],
  [1024, 1366],
];
const SIZES = [
  ...PLANSHETY.flatMap(([w, h]) => [
    { w, h, touch: true },
    { w: h, h: w, touch: true },
  ]),
  { w: 390, h: 844, touch: true },
  { w: 1440, h: 900, touch: false },
];
/* Вкладки раздела для перехода по ленте. */
const VKLADKI = ['/zadaniya/13/trenazher/', '/zadaniya/13/generator/', '/zadaniya/13/teoriya/'];

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

async function newContext(browser, engine, size) {
  /* isMobile в WebKit Playwright недоступен; сенсорный экран — hasTouch. */
  const context = await browser.newContext({
    viewport: { width: size.w, height: size.h },
    hasTouch: size.touch,
    ...(engine === 'Chromium' ? { isMobile: size.touch } : {}),
  });
  /* Генератор №13 без тарифа закрыт: ключ проверок (lib/tarify/dostup.ts). */
  await context.addInitScript(() => {
    try {
      localStorage.setItem('budetege:dostup:proverka', 'true');
    } catch {
      /* без хранилища */
    }
  });
  return context;
}

/** Положение кнопки относительно экрана; null — кнопки нет. */
function polozhenie() {
  const fab = document.querySelector('.help-fab');
  const btn = fab?.querySelector('.help-fab__button');
  if (!fab || !btn) return null;
  const r = btn.getBoundingClientRect();
  const cs = getComputedStyle(fab);
  return {
    right: innerWidth - r.right,
    bottom: innerHeight - r.bottom,
    skryta: cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05,
  };
}

/** Ждать кнопку опросом из страницы, до 10 с. */
async function zhdatKnopku(page) {
  for (let i = 0; i < 100; i++) {
    if (
      await page
        .evaluate(() => document.querySelector('.help-fab__button') !== null)
        .catch(() => false)
    ) {
      return true;
    }
    await page.waitForTimeout(100);
  }
  return false;
}

async function otkryt(page, url) {
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  /* Онбординг — отдельный кусок (OnboardingLazy): кнопка приходит
     после загрузки страницы. */
  if (!(await zhdatKnopku(page))) throw new Error(`${url}: кнопки «?» нет`);
  await page.waitForTimeout(150);
}

/* Запись положения каждый кадр. */
const ZAPIS_START = `(() => {
  const f = ${polozhenie.toString()};
  window.__fab = []; window.__fabRun = true;
  const kadr = () => { if (!window.__fabRun) return;
    window.__fab.push({ y: Math.round(scrollY), h: innerHeight, ...f() });
    requestAnimationFrame(kadr); };
  requestAnimationFrame(kadr);
})()`;
const zapisStop = (page) =>
  page.evaluate(() => {
    window.__fabRun = false;
    return window.__fab;
  });

/** Кадры, где видимая кнопка стоит дальше 1 px от исходного места. */
function skachki(kadry, nachalo) {
  const out = [];
  for (const k of kadry) {
    if (k.right === undefined || k.skryta) continue;
    const dr = Math.abs(k.right - nachalo.right);
    const db = Math.abs(k.bottom - nachalo.bottom);
    if (dr > 1 || db > 1)
      out.push(`y=${k.y}: справа ${k.right.toFixed(1)}, снизу ${k.bottom.toFixed(1)}`);
  }
  return out;
}

/** Управление под кнопкой. vse — все элементы, иначе только в закреплённых панелях. */
function podKnopkoy(vse) {
  const btn = document.querySelector('.help-fab__button');
  if (!btn) return [];
  const f = btn.getBoundingClientRect();
  const out = [];
  /* Закреплён — внутри fixed или прилипшего sticky (стоит на своём
     top/bottom). Sticky в потоке едет со страницей, как любой текст. */
  const zakreplen = (el) => {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.position === 'fixed') return true;
      if (cs.position === 'sticky') {
        const r = e.getBoundingClientRect();
        if (cs.top !== 'auto' && Math.abs(r.top - parseFloat(cs.top)) < 2) return true;
        if (cs.bottom !== 'auto' && Math.abs(innerHeight - r.bottom - parseFloat(cs.bottom)) < 2) {
          return true;
        }
      }
    }
    return false;
  };
  /* Видимая часть элемента: предки с overflow (колонка содержания,
     прокручиваемая таблица) обрезают то, что за их краем. */
  const vidimaya = (el) => {
    let r = el.getBoundingClientRect();
    let { left, top, right, bottom } = r;
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
      if (getComputedStyle(e).overflow === 'visible') continue;
      const c = e.getBoundingClientRect();
      left = Math.max(left, c.left);
      top = Math.max(top, c.top);
      right = Math.min(right, c.right);
      bottom = Math.min(bottom, c.bottom);
    }
    return { left, top, right, bottom };
  };
  const sel = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button], summary';
  for (const el of document.querySelectorAll(sel)) {
    if (el.closest('.help-fab')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
    if (!vse && !zakreplen(el)) continue;
    const v = vidimaya(el);
    const x = Math.min(v.right, f.right) - Math.max(v.left, f.left);
    const y = Math.min(v.bottom, f.bottom) - Math.max(v.top, f.top);
    if (x > 1 && y > 1) {
      /* Перекрытие только если сверху действительно кнопка. */
      const cx = Math.max(v.left, f.left) + x / 2;
      const cy = Math.max(v.top, f.top) + y / 2;
      const top = document.elementFromPoint(cx, cy);
      if (top && top.closest('.help-fab')) {
        out.push(
          (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 40),
        );
      }
    }
  }
  return out;
}

async function prokrutka(page, imya) {
  const nachalo = await page.evaluate(polozhenie);
  check(nachalo !== null, `${imya}: кнопки «?» нет`);
  if (nachalo === null) return;
  await page.evaluate(ZAPIS_START);
  const zakreplennye = await page.evaluate(async (podSrc) => {
    const pod = new Function('return (' + podSrc + ')(false)');
    const sleep = (t) => new Promise((r) => setTimeout(r, t));
    const H = document.documentElement.scrollHeight - innerHeight;
    const out = new Set();
    for (let y = 0; y <= Math.min(H, 4000); y += 80) {
      scrollTo(0, y);
      await sleep(16);
      if (y % 400 === 0) for (const x of pod()) out.add(x);
    }
    scrollTo(0, H);
    await sleep(250);
    scrollTo(0, 0);
    await sleep(250);
    for (let i = 0; i < 8; i++) {
      scrollTo(0, (i % 2) * Math.min(H, 1500));
      await sleep(40);
    }
    scrollTo(0, H);
    await sleep(300);
    return [...out];
  }, podKnopkoy.toString());
  const kadry = await zapisStop(page);
  const s = skachki(kadry, nachalo);
  check(
    s.length === 0,
    `${imya}: кнопка сдвигается при прокрутке (${s.length} кадров): ${s.slice(0, 3).join('; ')}`,
  );
  check(
    zakreplennye.length === 0,
    `${imya}: кнопка закрывает закреплённое управление: ${zakreplennye.join(', ')}`,
  );
  const vKonce = await page.evaluate(podKnopkoy, true);
  check(vKonce.length === 0, `${imya}: в конце страницы кнопка закрывает: ${vKonce.join(', ')}`);
}

async function proverit(engine, browserType) {
  let browser;
  try {
    browser = await browserType.launch();
  } catch (e) {
    console.log(`${engine} не установлен — пропущен (в CI он есть): ${e.message.split('\n')[0]}`);
    return;
  }
  /* Эталон: положение при прямой загрузке страницы в данном размере. */
  const etalon = new Map();
  for (const size of SIZES) {
    const tag = `${engine} ${size.w}×${size.h}`;
    const context = await newContext(browser, engine, size);
    const page = await context.newPage();
    for (const url of PAGES) {
      await otkryt(page, url);
      etalon.set(`${size.w}x${size.h}${url}`, await page.evaluate(polozhenie));
      await prokrutka(page, `${tag} ${url}`);
    }

    /* Переход по ленте вкладок раздела. */
    await otkryt(page, '/zadaniya/13/');
    for (const url of VKLADKI) {
      const tab = page.locator(`.topic-tabs-row:not([inert]) a[href="${url}"]`).first();
      if ((await tab.count()) === 0) continue;
      await tab.click();
      await page.waitForURL('**' + url);
      check(await zhdatKnopku(page), `${tag}: после перехода на ${url} кнопки «?» нет`);
      await page.waitForTimeout(400);
      const seychas = await page.evaluate(polozhenie);
      check(
        seychas !== null && !seychas.skryta,
        `${tag}: после перехода на ${url} кнопка спрятана (фокус: ${await page.evaluate(
          () => document.activeElement?.outerHTML.slice(0, 80) ?? '—',
        )})`,
      );
      const e = etalon.get(`${size.w}x${size.h}${url}`);
      if (e && seychas) {
        check(
          Math.abs(seychas.right - e.right) <= 1 && Math.abs(seychas.bottom - e.bottom) <= 1,
          `${tag}: после перехода на ${url} кнопка не на своём месте (снизу ${seychas.bottom}, а не ${e.bottom})`,
        );
      }
    }

    /* Клавиатура: поле ввода тренажёра на сенсорном экране. */
    if (size.touch) {
      await otkryt(page, '/zadaniya/13/trenazher/');
      const go = page.getByRole('button', { name: /Начать/ }).first();
      if ((await go.count()) > 0) {
        await go.click().catch(() => {});
        await page.waitForTimeout(600);
      }
      const pole = page
        .locator('main input[type="text"], main input:not([type]), main textarea')
        .first();
      if ((await pole.count()) > 0) {
        const doKl = await page.evaluate(polozhenie);
        await pole.focus();
        await page.waitForTimeout(400);
        const vo = await page.evaluate(polozhenie);
        const grubyy = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
        if (grubyy) {
          check(vo?.skryta === true, `${tag}: при открытой клавиатуре кнопка «?» видна`);
        }
        await pole.blur();
        await page.waitForTimeout(500);
        const posle = await page.evaluate(polozhenie);
        check(
          posle !== null &&
            !posle.skryta &&
            Math.abs(posle.bottom - doKl.bottom) <= 1 &&
            Math.abs(posle.right - doKl.right) <= 1,
          `${tag}: после клавиатуры кнопка не вернулась на место`,
        );
      }
    }
    await context.close();
  }

  /* Поворот: та же вкладка, размер меняется на месте. */
  for (const [w, h] of PLANSHETY) {
    const size = { w, h, touch: true };
    const context = await newContext(browser, engine, size);
    const page = await context.newPage();
    for (const url of ['/', '/zadaniya/13/', '/zadaniya/13/generator/'].filter((u) =>
      PAGES.includes(u),
    )) {
      await otkryt(page, url);
      await page.evaluate(() => scrollTo(0, 600));
      for (const [vw, vh] of [
        [h, w],
        [w, h],
      ]) {
        await page.setViewportSize({ width: vw, height: vh });
        await page.waitForTimeout(400);
        const seychas = await page.evaluate(polozhenie);
        const e = etalon.get(`${vw}x${vh}${url}`);
        if (e && seychas) {
          check(
            Math.abs(seychas.right - e.right) <= 1 && Math.abs(seychas.bottom - e.bottom) <= 1,
            `${engine} поворот ${w}×${h} → ${vw}×${vh} ${url}: кнопка снизу ${seychas.bottom.toFixed(1)}, справа ${seychas.right.toFixed(1)}, а при загрузке — ${e.bottom.toFixed(1)}, ${e.right.toFixed(1)}`,
          );
        }
      }
    }
    await context.close();
  }
  await browser.close();
}

await proverit('Chromium', chromium);
await proverit('WebKit', webkit);
server.close();

console.log(`Кнопка «?»: проверок ${checks}, ошибок ${failures.length}.`);
for (const f of failures) console.log(`  ✗ ${f}`);
if (failures.length > 0) process.exitCode = 1;
