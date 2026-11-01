#!/usr/bin/env node
/* scripts/seo-postbuild.mjs — карта сайта и состояние страниц после сборки.

   Запуск: сам, последним шагом pnpm build (после next build).

   Обходит готовые страницы app/out и пишет рядом с ними:

     sitemap.xml      — страницы для поиска с <lastmod>;
     seo-state.json   — отпечаток текста каждой страницы карты и дата
                        его последнего изменения (по нему следующая
                        выкладка понимает, что поменялось);
     seo-changed.txt  — адреса, у которых текст изменился с прошлой
                        выкладки (их деплой отправляет в IndexNow);
     <ключ>.txt       — файл ключа IndexNow, если задан INDEXNOW_KEY.

   В карту попадает страница, если она:
     - без noindex и не страница-перенаправление (meta refresh);
     - canonical указывает на неё саму (режимы тренажёров ссылаются
       canonical на тренажёр раздела — их в карте нет);
     - не служебная: /styleguide/, /kabinet/, /voyti/, /dev/, 404.

   lastmod — честная дата изменения текста страницы. Прошлое состояние
   берётся из файла SEO_PREV_STATE (деплой скачивает его с сайта:
   https://budetege.ru/seo-state.json). У страницы, чей отпечаток не
   изменился, дата прежняя; у новой или изменённой — дата этой
   выкладки. Нет прошлого состояния (первая выкладка, локальная
   сборка) — у всех страниц дата последнего коммита.

   Отпечаток считается по тому, что видит читатель и робот: title,
   description, canonical и текст страницы без скриптов. Номер сборки
   и имена файлов _next в него не входят — пересборка без правок
   текста lastmod не трогает. */

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '..');
const OUT = path.join(APP, 'out');
const SITE = 'https://budetege.ru';

/** Служебные разделы: в карту не идут, даже если открыты для робота. */
const SLUZHEBNYE = ['/styleguide/', '/kabinet/', '/voyti/', '/dev/', '/404/'];

if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('seo-postbuild: нет app/out/index.html — сначала next build');
  process.exit(1);
}

/** Все страницы сборки: адрес → файл. */
function stranitsy() {
  const list = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== '_next') walk(full);
      } else if (entry.name === 'index.html') {
        const rel = path.relative(OUT, path.dirname(full)).split(path.sep).join('/');
        list.push({ url: rel === '' ? '/' : `/${rel}/`, file: full });
      }
    }
  };
  walk(OUT);
  return list.sort((a, b) => a.url.localeCompare(b.url));
}

function meta(html, name) {
  const re = new RegExp(`<meta[^>]+name="${name}"[^>]*content="([^"]*)"`, 'i');
  return re.exec(html)?.[1] ?? null;
}

function canonical(html) {
  return /<link[^>]+rel="canonical"[^>]*href="([^"]*)"/i.exec(html)?.[1] ?? null;
}

/** Текст страницы без скриптов, стилей и разметки — как его читает робот. */
function tekst(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function title(html) {
  return /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() ?? '';
}

function otpechatok(html, url) {
  const h = crypto.createHash('sha256');
  h.update(`${title(html)}\n${meta(html, 'description') ?? ''}\n${canonical(html) ?? ''}\n`);
  /* Текст — только тело: <head> уже учтён полями выше. */
  const body = html.slice(html.search(/<body[\s>]/i));
  h.update(tekst(body));
  h.update(url);
  return h.digest('hex').slice(0, 16);
}

function dataKommita() {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cI'], {
      cwd: APP,
      encoding: 'utf8',
    }).trim();
  } catch {
    return new Date().toISOString();
  }
}

function prezhnee() {
  const file = process.env.SEO_PREV_STATE;
  if (file === undefined || file === '' || !fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return data && typeof data === 'object' && data.pages ? data.pages : null;
  } catch {
    return null;
  }
}

const seychas = new Date().toISOString();
const kommit = dataKommita();
const bylo = prezhnee();

const karta = [];
const isklyucheny = { noindex: 0, refresh: 0, canonical: 0, sluzhebnye: 0 };
for (const { url, file } of stranitsy()) {
  if (SLUZHEBNYE.some((p) => url.startsWith(p))) {
    isklyucheny.sluzhebnye += 1;
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  if (/noindex/i.test(meta(html, 'robots') ?? '')) {
    isklyucheny.noindex += 1;
    continue;
  }
  if (/<meta[^>]+http-equiv="refresh"/i.test(html)) {
    isklyucheny.refresh += 1;
    continue;
  }
  const can = canonical(html);
  if (can !== null && can !== `${SITE}${url}`) {
    isklyucheny.canonical += 1;
    continue;
  }
  karta.push({ url, h: otpechatok(html, url) });
}

const pages = {};
const izmeneny = [];
for (const { url, h } of karta) {
  const prev = bylo?.[url];
  let lastmod;
  if (bylo === null) {
    lastmod = kommit;
  } else if (prev !== undefined && prev.h === h) {
    lastmod = prev.lastmod;
  } else {
    lastmod = seychas;
    izmeneny.push(`${SITE}${url}`);
  }
  pages[url] = { h, lastmod };
}

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...Object.entries(pages).map(
    ([url, { lastmod }]) => `  <url><loc>${SITE}${url}</loc><lastmod>${lastmod}</lastmod></url>`,
  ),
  '</urlset>',
  '',
].join('\n');

fs.writeFileSync(path.join(OUT, 'sitemap.xml'), xml);
fs.writeFileSync(path.join(OUT, 'seo-state.json'), `${JSON.stringify({ site: SITE, pages })}\n`);
fs.writeFileSync(
  path.join(OUT, 'seo-changed.txt'),
  izmeneny.length === 0 ? '' : `${izmeneny.join('\n')}\n`,
);

/* Файл ключа IndexNow: https://budetege.ru/<ключ>.txt с самим ключом. */
const key = (process.env.INDEXNOW_KEY ?? '').trim();
if (key !== '') {
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    console.error('seo-postbuild: INDEXNOW_KEY — от 8 до 128 латинских букв, цифр и дефисов');
    process.exit(1);
  }
  fs.writeFileSync(path.join(OUT, `${key}.txt`), key);
}

console.log(
  `seo-postbuild: в карте ${karta.length} страниц; не вошли — noindex ${isklyucheny.noindex}, ` +
    `перенаправления ${isklyucheny.refresh}, canonical на другую ${isklyucheny.canonical}, ` +
    `служебные ${isklyucheny.sluzhebnye}; ` +
    (bylo === null
      ? 'прошлого состояния нет, lastmod — дата коммита'
      : `изменилось ${izmeneny.length}`),
);
