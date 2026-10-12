#!/usr/bin/env node
/* scripts/check-razdely-12-images.mjs — картинки задания №12 доходят до
   сайта: стеклянные иконки разделов и главная иллюстрация.

   Три режима:

     node scripts/check-razdely-12-images.mjs
       Исходники. У каждого раздела из data/functionTypes.ts есть поле
       icon, и для него лежат все файлы
       public/images/razdely/12/<icon>-{96,192,384}.{webp,png}: нужной
       ширины, с прозрачным фоном (углы прозрачные — значит, нет белой
       каймы на фоне сайта). Здесь же — файлы главной иллюстрации
       public/images/zadaniya/12/hero-*.

     node scripts/check-razdely-12-images.mjs --site
       Собранный сайт (out/, после pnpm build). Страница /zadaniya/12/ и
       страницы всех открытых разделов: на каждой есть иконки всех
       разделов (плашка, меню, «Другие разделы»), каждый адрес картинки
       №12 отдаётся с кодом 200 и типом image/*, заглушек вроде
       «Иллюстрация готовится» нет.

     node scripts/check-razdely-12-images.mjs --url https://budetege.ru
       То же на живом сайте — шаг после выкладки в deploy.yml: ловит, если
       картинка не доехала до хостинга или закэширована старая страница.

   Ненулевой код возврата — проверка не прошла. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import sharp from 'sharp';
import { APP, requireSrc } from './lib/load-ts.mjs';

const args = process.argv.slice(2);
const SITE = args.includes('--site');
const URL_ARG = args.includes('--url') ? args[args.indexOf('--url') + 1] : null;

const WIDTHS = [96, 192, 384];
const HERO = [480, 768, 1152];
const ZAGLUSHKI = [/Иллюстраци[яи]\s+готовится/i, /Портрета\s+пока\s+нет/i, /Здесь\s+появится\s+фотография/i];

const { functionTypes } = requireSrc('data/functionTypes.ts');
const errors = [];
const bad = (text) => errors.push(text);

/* ── 1. Исходники ─────────────────────────────────────────────── */

/** Углы картинки прозрачные: на любом фоне сайта нет каймы. */
async function transparentCorners(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const at = (x, y) => data[(y * info.width + x) * info.channels + 3];
  const w = info.width - 1;
  const h = info.height - 1;
  return [at(0, 0), at(w, 0), at(0, h), at(w, h)].every((alpha) => alpha === 0);
}

async function checkFile(rel, width) {
  const file = path.join(APP, 'public', rel);
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
    bad(`нет файла ${rel}`);
    return;
  }
  const meta = await sharp(file).metadata();
  if (meta.width !== width) {
    bad(`${rel}: ширина ${meta.width} вместо ${width}`);
  }
  if (!meta.hasAlpha) {
    bad(`${rel}: нет прозрачности — на фоне сайта будет кайма`);
  } else if (!(await transparentCorners(file))) {
    bad(`${rel}: углы непрозрачные — на фоне сайта будет кайма`);
  }
}

let files = 0;
for (const razdel of functionTypes) {
  if (!razdel.icon) {
    bad(`у раздела ${razdel.id} нет иконки (поле icon в data/functionTypes.ts)`);
    continue;
  }
  for (const width of WIDTHS) {
    for (const ext of ['webp', 'png']) {
      await checkFile(`images/razdely/12/${razdel.icon}-${width}.${ext}`, width);
      files += 1;
    }
  }
}
for (const width of HERO) {
  for (const ext of ['webp', 'png']) {
    await checkFile(`images/zadaniya/12/hero-${width}.${ext}`, width);
    files += 1;
  }
}
console.log(`Картинки №12 в исходниках: разделов ${functionTypes.length}, файлов ${files}.`);

/* ── 2. Сайт: собранный (out/) или живой (--url) ─────────────── */

function serveOut() {
  const OUT = path.join(APP, 'out');
  if (!fs.existsSync(path.join(OUT, 'index.html'))) {
    console.error('Нет out/index.html — сначала pnpm build.');
    process.exit(1);
  }
  const TYPES = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp',
    '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
  const server = http.createServer((req, res) => {
    let file = path.join(OUT, decodeURIComponent(req.url.split('?')[0]));
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, 'index.html');
    }
    if (!file.startsWith(OUT) || !fs.existsSync(file)) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/** Адреса картинок №12 на странице: в разметке (src, srcset) и в данных
    роутера, откуда карточки дорисовываются в браузере. */
function imagesIn(html) {
  const urls = new Set();
  for (const m of html.matchAll(/\/images\/(?:razdely|zadaniya)\/12\/[a-z0-9-]+\.(?:webp|png)(?:\?v=[0-9a-f]+)?/g)) {
    urls.add(m[0]);
  }
  return [...urls];
}

async function fetchRetry(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      return await fetch(url, { redirect: 'follow' });
    } catch (error) {
      if (i >= tries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000 * i));
    }
  }
}

if (SITE || URL_ARG) {
  const server = URL_ARG ? null : await serveOut();
  const base = URL_ARG ? URL_ARG.replace(/\/$/, '') : `http://127.0.0.1:${server.address().port}`;
  const pages = ['/zadaniya/12/'].concat(
    functionTypes.filter((t) => t.status === 'active').map((t) => `/zadaniya/12/${t.id}/`),
  );
  const checked = new Map();
  for (const page of pages) {
    const res = await fetchRetry(base + page);
    if (res.status !== 200) {
      bad(`${page}: страница отдаёт ${res.status}`);
      continue;
    }
    const html = await res.text();
    for (const re of ZAGLUSHKI) {
      if (re.test(html)) {
        bad(`${page}: заглушка «${html.match(re)[0]}» вместо картинки`);
      }
    }
    const urls = imagesIn(html);
    /* На странице №12 — карточки всех разделов. На странице раздела —
       его плашка и «Другие разделы»: остальные открытые разделы. Меню
       «Все разделы» собирается по нажатию, в исходной странице его нет. */
    const own = page.split('/')[3];
    const wanted = functionTypes.filter((t) => page === '/zadaniya/12/' || t.id === own || t.status === 'active');
    for (const razdel of wanted) {
      if (razdel.icon && !urls.some((u) => u.includes(`/images/razdely/12/${razdel.icon}-`))) {
        bad(`${page}: нет иконки раздела ${razdel.id} (${razdel.icon})`);
      }
    }
    if (page === '/zadaniya/12/' && !urls.some((u) => u.includes('/images/zadaniya/12/hero-'))) {
      bad(`${page}: нет главной иллюстрации`);
    }
    for (const url of urls) {
      if (checked.has(url)) {
        continue;
      }
      const img = await fetchRetry(new URL(url, base).href);
      const type = img.headers.get('content-type') || '';
      const size = (await img.arrayBuffer()).byteLength;
      checked.set(url, img.status);
      if (img.status !== 200 || !type.startsWith('image/') || size === 0) {
        bad(`${page}: ${url} — ${img.status}, ${type || 'без типа'}, ${size} байт`);
      }
    }
  }
  server?.close();
  console.log(`Сайт ${URL_ARG ?? 'out/'}: страниц ${pages.length}, адресов картинок №12 ${checked.size}.`);
}

if (errors.length) {
  console.error(`\nКартинки №12 — расхождения (${errors.length}):`);
  errors.slice(0, 40).forEach((line) => console.error('  ✗ ' + line));
  process.exit(1);
}
console.log('Картинки №12 на месте.');
