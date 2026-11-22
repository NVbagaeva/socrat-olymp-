#!/usr/bin/env node
/* scripts/build-sitemap.mjs — карта сайта out/sitemap.xml для поисковиков.

   Запускается сам после сборки (postbuild, вслед за build-skrytye):
   pnpm build. Отдельно: node scripts/build-sitemap.mjs [--out <папка>]

   Список адресов берётся из собранного сайта, руками его не ведут:
   каждая out/…/index.html — страница, кроме
     — заглушек «Страница переехала» (<meta http-equiv="refresh">):
       им отвечает 301, в карте нужен новый адрес, и он там уже есть;
     — страниц с <meta name="robots" content="noindex">: печатные листы,
       витрины движков, кабинет, вход;
     — скрытых разделов (build-skrytye.mjs): посетителю они отвечают 404;
     — личных и служебных страниц без noindex (BEZ_KARTY ниже): у
       робота там пусто — данные ученика живут в его браузере.
   robots.txt (public/robots.txt) указывает на эту карту.

   Адрес сайта — SITE_URL из src/lib/og.ts: один на весь проект. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { skrytyeVSborke } from './build-skrytye.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Начала адресов, которым в карте не место, хотя noindex у них нет. */
export const BEZ_KARTY = [
  '/styleguide/',
  '/dev/',
  '/ne-naydeno/',
  '/eshche/',
  '/nastroyki/',
  '/uvedomleniya/',
  '/statistika/',
  '/izbrannoe/',
  '/istoriya-resheniy/',
  '/moi-zadaniya/',
  '/moi-materialy/',
  '/moi-konspekty/',
];

const REFRESH = /<meta\s+http-equiv="refresh"/i;
const NOINDEX = /<meta\s+name="robots"\s+content="[^"]*noindex/i;

/** Адрес сайта без «/» на конце — из src/lib/og.ts. */
export function siteUrl() {
  const og = fs.readFileSync(path.join(APP, 'src/lib/og.ts'), 'utf8');
  const m = og.match(/export const SITE_URL = '([^']+)'/);
  if (!m) throw new Error('В src/lib/og.ts не найден SITE_URL');
  return m[1].replace(/\/$/, '');
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === '_next') continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (name === 'index.html') out.push(full);
  }
  return out;
}

/**
 * Адреса для карты, по алфавиту; главная — первой.
 * @param {string} out Папка сборки.
 * @returns {string[]} Пути от корня с «/» на конце.
 */
export function adresaKarty(out) {
  const skrytye = skrytyeVSborke(out).flatMap((r) => r.adresa.map((a) => `/zadaniya/${a}/`));
  return walk(out)
    .map((file) => {
      const rel = path.relative(out, path.dirname(file)).split(path.sep).join('/');
      return { url: rel === '' ? '/' : `/${rel}/`, file };
    })
    .filter(({ url }) => !BEZ_KARTY.some((p) => url.startsWith(p)))
    .filter(({ url }) => !skrytye.some((p) => url.startsWith(p)))
    .filter(({ file }) => {
      const html = fs.readFileSync(file, 'utf8');
      /* Мета-теги — в <head>; дальше читать незачем. */
      const head = html.slice(0, html.indexOf('</head>') + 1 || undefined);
      return !REFRESH.test(head) && !NOINDEX.test(head);
    })
    .map(({ url }) => url)
    .sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));
}

const xml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Текст sitemap.xml. */
export function kartaXml(adresa, site) {
  const stroki = adresa.map((a) => `  <url><loc>${xml(site + encodeURI(a))}</loc></url>`);
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${stroki.join('\n')}\n` +
    '</urlset>\n'
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const out = path.resolve(
    args.includes('--out') ? args[args.indexOf('--out') + 1] : path.join(APP, 'out'),
  );
  if (!fs.existsSync(path.join(out, 'index.html'))) {
    console.error(`Нет ${out}/index.html: сначала next build.`);
    process.exit(1);
  }
  const adresa = adresaKarty(out);
  /* Карта из горстки адресов — признак поломки фильтра, а не сайта. */
  if (adresa.length < 50 || adresa[0] !== '/') {
    console.error(`Карта сайта подозрительно мала (${adresa.length} адресов) — не записана.`);
    process.exit(1);
  }
  fs.writeFileSync(path.join(out, 'sitemap.xml'), kartaXml(adresa, siteUrl()));
  console.log(`Карта сайта: ${adresa.length} адресов → sitemap.xml`);
}
