/* scripts/lib/illyustracii.mjs — замер картинок-иллюстраций на собранном сайте.

   Общая часть аудита (scripts/audit-illyustracii.mjs) и проверки
   (scripts/check-illyustracii.mjs): список страниц, статический сервер
   над out/, замер каждой видимой растровой картинки в браузере и нормы
   вариантов компонента Illustration (components/ui/Illustration.tsx).

   Вариант картинки — атрибут data-ill у самой картинки, у <picture> или
   у ближайшего предка. Картинка без варианта не крупнее NORMA_BEZ.
   Нормы — в CSS-пикселях отображаемого размера, «телефон» — экран уже
   640 px (тот же порог, что в illustration.css). */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
/** Папка собранного сайта; ILL_OUT — другая сборка (снимок «было»). */
export const OUT = process.env.ILL_OUT ? path.resolve(process.env.ILL_OUT) : path.join(APP, 'out');

/** Ширины экрана проверки: компьютер и телефон. */
export const EKRANY = [1440, 375];
export const TELEFON_DO = 640;

/** Допуск округления, px. */
const DOPUSK = 1.5;

/**
 * Нормы вариантов: наибольшая ширина и высота отображаемой картинки.
 * У header, section, inline и task норма — на большую сторону.
 */
export const NORMY = {
  header: { komp: { w: 260, h: 260 }, tel: { w: 112, h: 112 } },
  hero: { komp: { w: 360, h: 300 }, tel: { w: 220, h: 300 } },
  section: { komp: { w: 280, h: 280 }, tel: { w: 280, h: 280 } },
  inline: { komp: { w: 140, h: 140 }, tel: { w: 140, h: 140 } },
  task: { komp: { w: 180, h: 180 }, tel: { w: 120, h: 120 } },
};
export const NORMA_BEZ = 360;

export function normaDlya(variant, shirina) {
  const tel = shirina < TELEFON_DO;
  if (variant !== null && NORMY[variant] !== undefined) return NORMY[variant][tel ? 'tel' : 'komp'];
  return { w: NORMA_BEZ, h: NORMA_BEZ };
}

/** Нарушение нормы: строка с причиной или null. */
export function narushenie(kartinka, shirina) {
  const n = normaDlya(kartinka.variant, shirina);
  const bad = [];
  if (kartinka.w > n.w + DOPUSK) bad.push(`ширина ${kartinka.w} > ${n.w}`);
  if (kartinka.h > n.h + DOPUSK) bad.push(`высота ${kartinka.h} > ${n.h}`);
  return bad.length === 0 ? null : bad.join(', ');
}

/* ── Страницы ──────────────────────────────────────────────────── */

const OBSHCHIE = [
  '/',
  '/about/',
  '/kak-polzovatsya/',
  '/tarify/',
  '/dlya-uchitelya/',
  '/kabinet/',
  '/kabinet/vstupit/',
  '/kabinet/statistika/',
  '/kabinet/klassy/',
  '/kabinet/domashka/',
  '/kabinet/dz2/',
  '/kabinet/progress/klass/',
  '/kabinet/progress/uchenik/',
  '/kabinet/progress/zadacha/',
  '/kabinet/progress/variant/',
  '/statistika/',
  '/moi-materialy/',
  '/moi-zadaniya/',
  '/izbrannoe/',
];

/** Вкладки разделов, которые не страницы для ученика. */
const NE_VKLADKI = new Set(['pechat', 'dannye', 'razbor-pechat']);

function estStranica(url) {
  const file = path.join(OUT, url, 'index.html');
  if (!fs.existsSync(file)) return false;
  /* Заглушки «Страница переехала» — не страницы. */
  const head = fs.readFileSync(file, 'utf8').slice(0, 4000);
  return !/http-equiv="refresh"/i.test(head);
}

/**
 * Все страницы проверки: главная, «Об авторе», «Как пользоваться»,
 * тарифы, кабинеты и вкладки каждого раздела /zadaniya/N/… (сама
 * вкладка «О задании» и вкладки первого уровня: теория, карточки,
 * опорные задачи, тренажёр, генератор, для репетиторов и свои вкладки
 * раздела), плюс страницы теории второго уровня.
 */
export function spisokStranic() {
  const urls = OBSHCHIE.filter(estStranica);
  const root = path.join(OUT, 'zadaniya');
  const nomera = fs
    .readdirSync(root)
    .filter((n) => /^\d+$/.test(n))
    .sort((a, b) => Number(a) - Number(b));
  for (const n of nomera) {
    const base = `/zadaniya/${n}/`;
    if (estStranica(base)) urls.push(base);
    for (const tab of fs.readdirSync(path.join(root, n)).sort()) {
      if (NE_VKLADKI.has(tab)) continue;
      const url = `${base}${tab}/`;
      if (!fs.statSync(path.join(root, n, tab)).isDirectory()) continue;
      if (estStranica(url)) urls.push(url);
      if (tab !== 'teoriya') continue;
      for (const sub of fs.readdirSync(path.join(root, n, tab)).sort()) {
        const u = `${url}${sub}/`;
        if (fs.statSync(path.join(root, n, tab, sub)).isDirectory() && estStranica(u)) urls.push(u);
      }
    }
  }
  return urls;
}

/* ── Сервер ────────────────────────────────────────────────────── */

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
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

export async function zapustitServer() {
  const server = http.createServer((req, res) => {
    const put = decodeURIComponent((req.url ?? '/').split('?')[0]);
    let file = path.join(OUT, put);
    if (!file.startsWith(OUT)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) {
      res.writeHead(404).end('404');
      return;
    }
    res.writeHead(200, { 'content-type': TIPY[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

/* ── Замер ─────────────────────────────────────────────────────── */

/**
 * Открывает страницу, прокручивает её до конца (ленивые картинки), и
 * возвращает видимые картинки-файлы (<img>: растр и SVG; рисованные
 * inline-SVG чертежи — не иллюстрации и не считаются), или null, если
 * страницы нет (404, скрытый раздел). Для каждой: файл, вариант, отображаемые
 * ширину и высоту, долю ширины контента, перекрытие текста.
 */
export async function zamerit(page, url) {
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(async () => {
    const step = Math.max(400, window.innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
    window.scrollTo(0, 0);
    /* Ленивые картинки догружаются: ждём их, но не дольше 4 с. */
    const zhdat = [...document.images]
      .filter((i) => !i.complete)
      .map(
        (i) =>
          new Promise(
            (r) =>
              i.addEventListener('load', r, { once: true }) ||
              i.addEventListener('error', r, { once: true }),
          ),
      );
    await Promise.race([Promise.all(zhdat), new Promise((r) => setTimeout(r, 4000))]);
  });
  return page.evaluate(() => {
    const KARTINKA = /\.(png|webp|jpe?g|avif|gif|svg)(\?|#|$)/i;
    const RASTR = /\.(png|webp|jpe?g|avif|gif)(\?|#|$)/i;
    /* Скрытый раздел и 404 — страницы нет, мерить нечего. */
    if (/Страница не найдена/.test(document.querySelector('h1')?.textContent ?? '')) return null;
    const main = document.querySelector('main') ?? document.body;
    const ms = getComputedStyle(main);
    const kontent =
      main.clientWidth - parseFloat(ms.paddingLeft || '0') - parseFloat(ms.paddingRight || '0');
    const out = [];
    for (const img of document.querySelectorAll('img')) {
      const src = img.currentSrc || img.src || '';
      if (!KARTINKA.test(src)) continue;
      const r = img.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const cs = getComputedStyle(img);
      if (cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
      /* Скрытый предок (display:none) — rect нулевой, отсеян выше. */
      const holder = img.closest('[data-ill]');
      const variant = holder?.getAttribute('data-ill') ?? null;
      let file = src;
      try {
        file = new URL(src).pathname;
      } catch {
        /* data: и прочее — как есть. */
      }
      out.push({
        file: decodeURIComponent(file),
        variant,
        w: Math.round(r.width * 10) / 10,
        h: Math.round(r.height * 10) / 10,
        rastr: RASTR.test(src),
        dolya: kontent > 0 ? Math.round((r.width / kontent) * 100) : null,
        fit: cs.objectFit,
        razmery: img.hasAttribute('width') && img.hasAttribute('height'),
        srcset: img.hasAttribute('srcset') || img.parentElement?.tagName === 'PICTURE',
      });
    }
    return out;
  });
}

/**
 * Обход страниц на одном экране в несколько вкладок сразу. fn(url,
 * kartinki) — на каждую страницу; ошибки — в onError.
 */
export async function obojti(browser, base, urls, shirina, fn, { vkladok = 6, onError } = {}) {
  const context = await browser.newContext({ viewport: { width: shirina, height: 900 } });
  const ochered = [...urls];
  async function rabotnik() {
    let page = await context.newPage();
    for (;;) {
      const url = ochered.shift();
      if (url === undefined) break;
      /* Зависшая страница — ошибка с адресом, а не вечное ожидание. */
      let tajmer;
      try {
        const kartinki = await Promise.race([
          zamerit(page, base + url),
          new Promise((_, reject) => {
            tajmer = setTimeout(() => reject(new Error('не открылась за 90 с')), 90000);
          }),
        ]);
        if (kartinki !== null) fn(url, kartinki);
      } catch (e) {
        onError?.(url, e);
        /* Вкладку зависшей страницы — заменить свежей. */
        await page.close().catch(() => {});
        page = await context.newPage();
      } finally {
        clearTimeout(tajmer);
      }
    }
    await page.close();
  }
  await Promise.all(Array.from({ length: vkladok }, rabotnik));
  await context.close();
}
