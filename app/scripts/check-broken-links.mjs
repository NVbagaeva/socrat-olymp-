#!/usr/bin/env node
/* scripts/check-broken-links.mjs — битые ссылки внутри сайта.

   Запуск: pnpm build && pnpm test:broken-links

   Обходит все страницы app/out и проверяет каждую внутреннюю ссылку и
   каждый файл, на который ссылается разметка:

     - <a href>, <link href> (кроме preload/preconnect чужих хостов),
       <img src>, <img srcset>, <source srcset>, <script src>;
     - адрес страницы /путь/ — должен быть app/out/путь/index.html,
       файл /путь/файл.ext — app/out/путь/файл.ext;
     - якорь #id в ссылке на страницу сайта — на той странице должен
       быть элемент с таким id (ссылка на якорь своей же страницы — тоже).

   Внешние адреса (https://… на другие хосты, mailto:, tel:) сеть здесь
   не проверяет: в CI их проверять нечем и незачем. Ссылки «#» пустые
   (заглушки) считаются отдельно и печатаются списком, но проверку не
   роняют — это открытый вопрос, а не поломка сборки.

   Хоть одна битая ссылка — проверка падает со списком «страница →
   ссылка». */

import fs from 'node:fs';
import path from 'node:path';
import { APP } from './lib/load-ts.mjs';

const OUT = process.env.OUT_DIR ?? path.join(APP, 'out');
const SITE_HOSTS = new Set(['budetege.ru', 'www.budetege.ru']);

if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет сборки app/out: сначала pnpm build');
  process.exit(1);
}

function stranitsy() {
  const list = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== '_next') walk(full);
      } else if (entry.name.endsWith('.html')) {
        list.push(full);
      }
    }
  };
  walk(OUT);
  return list;
}

/** Адрес страницы по файлу: out/a/b/index.html → /a/b/. */
function adresFayla(file) {
  const rel = path.relative(OUT, file).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
}

/** Разметка без скриптов: ссылки из данных роутера — не ссылки страницы. */
function bezSkriptov(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (tag) => {
    const src = /\ssrc="([^"]+)"/i.exec(tag);
    return src === null ? '' : `<script src="${src[1]}"></script>`;
  });
}

function decode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'");
}

function ssylki(html) {
  const out = [];
  const re = /<(a|link|img|source|script|iframe)\b([^>]*)>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    const attrs = m[2];
    const get = (name) => new RegExp(`\\s${name}="([^"]*)"`, 'i').exec(attrs)?.[1];
    if (tag === 'link') {
      const rel = (get('rel') ?? '').toLowerCase();
      if (rel.includes('preconnect') || rel.includes('dns-prefetch')) continue;
    }
    for (const name of ['href', 'src']) {
      const v = get(name);
      if (v !== undefined) out.push({ tag, value: decode(v) });
    }
    for (const name of ['srcset', 'imagesrcset']) {
      const v = get(name);
      if (v !== undefined) {
        for (const part of decode(v).split(',')) {
          const url = part.trim().split(/\s+/)[0];
          if (url) out.push({ tag, value: url });
        }
      }
    }
  }
  return out;
}

const idKesh = new Map();
function idStranitsy(file) {
  let ids = idKesh.get(file);
  if (ids === undefined) {
    const html = fs.readFileSync(file, 'utf8');
    ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => decode(m[1])));
    idKesh.set(file, ids);
  }
  return ids;
}

/** Файл сборки по пути адреса; null — такого нет. */
function faylPoAdresu(pathname) {
  const p = decodeURIComponent(pathname);
  if (p.endsWith('/')) {
    const f = path.join(OUT, p, 'index.html');
    return fs.existsSync(f) ? f : null;
  }
  const f = path.join(OUT, p);
  if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  return null;
}

const bitye = [];
const pustye = new Map();
let vsego = 0;
const files = stranitsy();
for (const file of files) {
  const from = adresFayla(file);
  const html = bezSkriptov(fs.readFileSync(file, 'utf8'));
  for (const { tag, value } of ssylki(html)) {
    if (value === '' || /^(mailto:|tel:|javascript:|data:|blob:)/i.test(value)) continue;
    if (value === '#') {
      pustye.set(from, (pustye.get(from) ?? 0) + 1);
      continue;
    }
    let url;
    try {
      url = new URL(value, `https://budetege.ru${from}`);
    } catch {
      bitye.push({ from, value, why: 'адрес не разбирается' });
      continue;
    }
    if (!SITE_HOSTS.has(url.hostname)) continue;
    vsego += 1;
    const target = faylPoAdresu(url.pathname);
    if (target === null) {
      bitye.push({ from, value, why: 'нет такой страницы или файла' });
      continue;
    }
    if (tag === 'a' && url.hash.length > 1 && target.endsWith('.html')) {
      const id = decodeURIComponent(url.hash.slice(1));
      if (!idStranitsy(target).has(id)) {
        bitye.push({ from, value, why: `на странице нет якоря #${id}` });
      }
    }
  }
}

console.log(`Страниц: ${files.length}, внутренних ссылок и файлов проверено: ${vsego}`);
if (pustye.size > 0) {
  const n = [...pustye.values()].reduce((a, b) => a + b, 0);
  console.log(
    `Ссылок-заглушек «#»: ${n} на ${pustye.size} страницах (например, ${[...pustye.keys()].slice(0, 3).join(', ')})`,
  );
}
if (bitye.length > 0) {
  const vid = new Map();
  for (const b of bitye) {
    const k = `${b.value} — ${b.why}`;
    vid.set(k, [...(vid.get(k) ?? []), b.from]);
  }
  console.log(`\nБитых ссылок: ${bitye.length} (разных — ${vid.size})`);
  for (const [k, list] of [...vid.entries()].slice(0, 60)) {
    console.log(
      `  ${k}\n     на ${list.length} стр.: ${list.slice(0, 3).join(', ')}${list.length > 3 ? ', …' : ''}`,
    );
  }
  process.exit(1);
}
console.log('Битых ссылок нет.');
