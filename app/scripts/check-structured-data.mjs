#!/usr/bin/env node
/* scripts/check-structured-data.mjs — микроразметка, canonical и Open Graph.

   Запуск: pnpm build && pnpm test:seo

   По готовой сборке app/out проверяет на каждой странице:

     1. JSON-LD (lib/schema.ts) разбирается как JSON, у каждого объекта
        есть @context https://schema.org и @type, а у типов — поля,
        без которых Яндекс и Google разметку не принимают:
          BreadcrumbList — пункты по порядку с name, адрес у всех, кроме
            последнего; адреса — на главном зеркале;
          Organization, WebSite — name и url; Person — name;
          LearningResource — name, description, url;
          FAQPage — вопросы с name и ответом acceptedAnswer.text;
          Quiz — name и вопросы hasPart с текстом.
     2. Organization и WebSite — на каждой индексируемой странице, по одному.
     3. canonical — один, абсолютный, на https://budetege.ru, с «/» на
        конце; og:url совпадает с canonical; есть og:title, og:description,
        og:site_name, twitter:card.
     4. На индексируемой странице description свой, а не общий по
        умолчанию, и title не длиннее 80 знаков.
     5. Ни одна индексируемая страница не повторяет чужой title.
     6. H1 на странице ровно один (кроме служебных).

   Падает со списком «страница — что не так». */

import fs from 'node:fs';
import path from 'node:path';
import { APP } from './lib/load-ts.mjs';

const OUT = process.env.OUT_DIR ?? path.join(APP, 'out');
const SITE = 'https://budetege.ru';
const DEFAULT_DESC = 'Подготовка к ЕГЭ по профильной математике.';
const SLUZHEBNYE = ['/styleguide/', '/kabinet/', '/voyti/', '/dev/', '/404/'];

if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет сборки app/out: сначала pnpm build');
  process.exit(1);
}

function stranitsy() {
  const list = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name !== '_next') walk(full);
      } else if (e.name === 'index.html') {
        const rel = path.relative(OUT, dir).split(path.sep).join('/');
        list.push({ url: rel === '' ? '/' : `/${rel}/`, file: full });
      }
    }
  };
  walk(OUT);
  return list;
}

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
const attr = (html, re) => {
  const m = re.exec(html);
  return m === null ? null : decode(m[1]);
};

const oshibki = [];
const bad = (url, msg) => oshibki.push(`${url} — ${msg}`);
const titles = new Map();
const vidy = new Map();
let indeks = 0;

function proverObekt(url, o) {
  if (o === null || typeof o !== 'object') return bad(url, 'JSON-LD не объект');
  if (o['@context'] !== 'https://schema.org')
    bad(url, `${o['@type']}: @context не https://schema.org`);
  const t = o['@type'];
  if (typeof t !== 'string') return bad(url, 'JSON-LD без @type');
  vidy.set(t, (vidy.get(t) ?? 0) + 1);
  const nado = (pole, ok) => {
    if (!ok) bad(url, `${t}: нет ${pole}`);
  };
  switch (t) {
    case 'BreadcrumbList': {
      const items = o.itemListElement;
      nado('itemListElement', Array.isArray(items) && items.length > 0);
      (items ?? []).forEach((it, i) => {
        if (it.position !== i + 1) bad(url, `BreadcrumbList: позиция ${i + 1} не по порядку`);
        if (typeof it.name !== 'string' || it.name.trim() === '')
          bad(url, `BreadcrumbList: пункт ${i + 1} без name`);
        if (/\$|\\[a-z]/.test(it.name ?? ''))
          bad(url, `BreadcrumbList: в name сырой TeX «${it.name}»`);
        const last = i === items.length - 1;
        if (!last && typeof it.item !== 'string')
          bad(url, `BreadcrumbList: пункт ${i + 1} без адреса`);
        if (typeof it.item === 'string' && !it.item.startsWith(`${SITE}/`))
          bad(url, `BreadcrumbList: адрес не на зеркале: ${it.item}`);
      });
      break;
    }
    case 'Organization':
    case 'WebSite':
      nado('name', typeof o.name === 'string');
      nado('url', typeof o.url === 'string' && o.url.startsWith(SITE));
      break;
    case 'Person':
      nado('name', typeof o.name === 'string' && o.name !== '');
      break;
    case 'LearningResource':
      nado('name', typeof o.name === 'string');
      nado('description', typeof o.description === 'string' && o.description !== '');
      nado('url', typeof o.url === 'string' && o.url.startsWith(SITE));
      break;
    case 'FAQPage':
      nado('mainEntity', Array.isArray(o.mainEntity) && o.mainEntity.length > 0);
      for (const q of o.mainEntity ?? []) {
        if (q['@type'] !== 'Question' || typeof q.name !== 'string')
          bad(url, 'FAQPage: вопрос без name');
        if (typeof q.acceptedAnswer?.text !== 'string' || q.acceptedAnswer.text === '')
          bad(url, 'FAQPage: вопрос без ответа');
      }
      break;
    case 'Quiz':
      nado('name', typeof o.name === 'string');
      nado('hasPart', Array.isArray(o.hasPart) && o.hasPart.length > 0);
      for (const q of o.hasPart ?? []) {
        if (typeof q.text !== 'string' || q.text.trim().length < 10)
          bad(url, 'Quiz: вопрос без текста');
        if (/\\[a-z]+\{|\$/.test(q.text ?? ''))
          bad(url, `Quiz: в тексте сырой TeX: ${q.text.slice(0, 60)}`);
      }
      break;
    default:
      break;
  }
}

for (const { url, file } of stranitsy()) {
  const html = fs.readFileSync(file, 'utf8');
  const robots = attr(html, /<meta name="robots" content="([^"]*)"/) ?? '';
  const noindex = /noindex/.test(robots);
  const refresh = /<meta[^>]+http-equiv="refresh"/i.test(html);
  const sluzh = SLUZHEBNYE.some((p) => url.startsWith(p));

  /* 1–2. JSON-LD */
  const lds = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const tipy = [];
  for (const m of lds) {
    let o;
    try {
      o = JSON.parse(m[1]);
    } catch {
      bad(url, 'JSON-LD не разбирается');
      continue;
    }
    tipy.push(o['@type']);
    proverObekt(url, o);
  }
  if (noindex || refresh || sluzh) continue;
  indeks += 1;
  for (const t of ['Organization', 'WebSite']) {
    const n = tipy.filter((x) => x === t).length;
    if (n !== 1) bad(url, `${t}: ${n} раз(а), нужно 1`);
  }
  if (tipy.filter((x) => x === 'BreadcrumbList').length > 1)
    bad(url, 'BreadcrumbList больше одного');

  /* 3. canonical и Open Graph */
  const cans = [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => decode(m[1]));
  if (cans.length !== 1) bad(url, `canonical: ${cans.length} шт.`);
  const can = cans[0] ?? '';
  if (!can.startsWith(`${SITE}/`) || !can.endsWith('/'))
    bad(url, `canonical не на зеркале или без «/»: ${can}`);
  const ogUrl = attr(html, /<meta property="og:url" content="([^"]*)"/);
  /* Режим тренажёра ссылается canonical на тренажёр, og:url — на себя: так и задумано. */
  if (ogUrl !== null && can === `${SITE}${url}` && ogUrl !== can)
    bad(url, `og:url ${ogUrl} ≠ canonical ${can}`);
  for (const p of ['og:title', 'og:description', 'og:site_name']) {
    if (attr(html, new RegExp(`<meta property="${p}" content="([^"]*)"`)) === null)
      bad(url, `нет ${p}`);
  }
  if (attr(html, /<meta name="twitter:card" content="([^"]*)"/) === null)
    bad(url, 'нет twitter:card');

  /* 4–6. title, description, H1 */
  const title = attr(html, /<title>([^<]*)<\/title>/) ?? '';
  const desc = attr(html, /<meta name="description" content="([^"]*)"/) ?? '';
  if (desc === '' || desc === DEFAULT_DESC) bad(url, 'description общий по умолчанию');
  if (title.length > 80) bad(url, `title ${title.length} знаков: ${title}`);
  if (/\$|\\[a-z]+/.test(title)) bad(url, `в title сырой TeX: ${title}`);
  if (can === `${SITE}${url}`) titles.set(title, [...(titles.get(title) ?? []), url]);
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) bad(url, `H1: ${h1} шт.`);
}

for (const [title, urls] of titles) {
  if (urls.length > 1) bad(urls.join(', '), `одинаковый title «${title}»`);
}

console.log(
  `Индексируемых страниц: ${indeks}. Объектов разметки: ${[...vidy].map(([t, n]) => `${t} ${n}`).join(', ')}.`,
);
if (oshibki.length > 0) {
  console.log(`\nНе прошло: ${oshibki.length}`);
  for (const o of oshibki.slice(0, 80)) console.log(`  ${o}`);
  process.exit(1);
}
console.log('Микроразметка, canonical, Open Graph, title и description — в порядке.');
