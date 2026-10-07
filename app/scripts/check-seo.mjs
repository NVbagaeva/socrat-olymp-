/* scripts/check-seo.mjs — сайт готов к индексации.

   Проверяет собранный экспорт (out/) после pnpm build:

   1. robots.txt есть, не закрывает сайт целиком (Disallow: /) и
      называет карту сайта по каноническому адресу.
   2. sitemap.xml есть; каждый адрес в нём — страница сборки с
      «/» на конце, без noindex; главная и банк заданий — в карте;
      закрытые страницы (печатные листы, витрины, кабинет) — нет.
   3. У каждой страницы canonical ведёт на https://budetege.ru/… и
      совпадает с её адресом: ни localhost, ни www, ни http.
   4. Главная: заголовок, описание, единственный H1, бренд
      «Будет на ЕГЭ», разметка Schema.org с названием и адресом сайта,
      Open Graph.
   5. Страницы разделов заданий: у каждой свои заголовок и описание,
      один H1 (у N-го задания — про N-е задание), Open Graph.
   6. Ни на одной индексируемой странице нет canonical на чужой домен.

   Запуск после pnpm build:  node scripts/check-seo.mjs */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalOf, isNoindex, pages, routeOf } from './build-sitemap.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(app, 'out');
const SITE_URL = 'https://budetege.ru';
const BRAND = 'Будет на ЕГЭ';

const problems = [];
function fail(text) {
  problems.push(text);
}

function read(rel) {
  const full = path.join(OUT, rel);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
}

function tag(html, re) {
  const m = html.match(re);
  return m === null ? null : m[1];
}

const title = (html) => tag(html, /<title>([^<]*)<\/title>/i);
const description = (html) => tag(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
const og = (html, name) =>
  tag(html, new RegExp(`<meta\\s+property="og:${name}"\\s+content="([^"]*)"`, 'i'));
const h1s = (html) =>
  [...html.matchAll(/<h1\b[^>]*>(.*?)<\/h1>/gis)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());

/* ── 1. robots.txt ─────────────────────────────────────────────── */
const robots = read('robots.txt');
if (robots === null) {
  fail('Нет out/robots.txt.');
} else {
  if (/^\s*Disallow:\s*\/\s*$/m.test(robots)) {
    fail('robots.txt закрывает весь сайт: Disallow: /');
  }
  if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) {
    fail(`robots.txt не называет карту сайта ${SITE_URL}/sitemap.xml`);
  }
  if (/^\s*Disallow:\s*\/_next/m.test(robots)) {
    fail('robots.txt закрывает /_next/: без стилей и кода поисковик не отрисует страницу.');
  }
}

/* ── 2. sitemap.xml ────────────────────────────────────────────── */
const sitemap = read('sitemap.xml');
const inSitemap = new Set();
if (sitemap === null) {
  fail('Нет out/sitemap.xml.');
} else {
  for (const m of sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)) {
    inSitemap.add(m[1]);
  }
  if (inSitemap.size === 0) {
    fail('sitemap.xml пустой.');
  }
  for (const url of inSitemap) {
    if (!url.startsWith(`${SITE_URL}/`)) {
      fail(`sitemap: чужой адрес ${url}`);
      continue;
    }
    const route = url.slice(SITE_URL.length);
    if (!route.endsWith('/')) {
      fail(`sitemap: адрес без «/» на конце ${url}`);
      continue;
    }
    const html = read(path.join(route, 'index.html'));
    if (html === null) {
      fail(`sitemap: страницы ${route} нет в сборке`);
    } else if (isNoindex(html)) {
      fail(`sitemap: страница ${route} закрыта noindex`);
    }
  }
  for (const must of ['/', '/zadaniya/', '/about/']) {
    if (!inSitemap.has(`${SITE_URL}${must}`)) {
      fail(`sitemap: нет обязательной страницы ${must}`);
    }
  }
  for (const url of inSitemap) {
    if (
      /\/(pechat|styleguide|404)\//.test(url) ||
      /\/(statistika|nastroyki|moi-[a-z]+|izbrannoe|istoriya-resheniy|uvedomleniya|eshche)\//.test(
        url,
      )
    ) {
      fail(`sitemap: служебная страница ${url}`);
    }
  }
}

/* ── 3. canonical на каждой странице ───────────────────────────── */
let indexable = 0;
let checked = 0;
for (const file of pages()) {
  const html = fs.readFileSync(file, 'utf8');
  const route = routeOf(file);
  checked += 1;
  const canonical = canonicalOf(html);
  if (canonical === null) {
    fail(`${route}: нет canonical`);
    continue;
  }
  if (/localhost|127\.0\.0\.1|^http:\/\/|\/\/www\./i.test(canonical)) {
    fail(`${route}: canonical ${canonical}`);
  }
  if (canonical !== `${SITE_URL}${route}`) {
    fail(`${route}: canonical ${canonical} не совпадает с адресом`);
  }
  if (!isNoindex(html)) {
    indexable += 1;
    if (!inSitemap.has(canonical)) {
      fail(`${route}: индексируемая страница, но в sitemap её нет`);
    }
    if (title(html) === null || title(html) === '') {
      fail(`${route}: нет <title>`);
    }
    if (og(html, 'url') !== canonical) {
      fail(`${route}: og:url ${og(html, 'url')} не совпадает с canonical`);
    }
    const heads = h1s(html);
    if (heads.length !== 1) {
      fail(`${route}: H1 должен быть один, найдено ${heads.length}`);
    }
  }
}

/* ── 4. Главная ────────────────────────────────────────────────── */
const home = read('index.html');
if (home === null) {
  fail('Нет out/index.html.');
} else {
  const t = title(home) ?? '';
  if (!t.includes(BRAND) || !/ЕГЭ по профильной математике/.test(t)) {
    fail(`Главная: заголовок «${t}» не называет бренд и тему`);
  }
  const d = description(home) ?? '';
  if (!d.includes(BRAND) || !/профильной математике/.test(d)) {
    fail(`Главная: описание не называет бренд и тему`);
  }
  const heads = h1s(home);
  if (heads.length !== 1 || !/Подготовка к ЕГЭ\s*по профильной\s*математике/.test(heads[0])) {
    fail(`Главная: H1 ${JSON.stringify(heads)}`);
  }
  const body = home.replace(/<script[\s\S]*?<\/script>/g, '');
  if (!body.includes(BRAND) || !body.includes('budetege.ru')) {
    fail('Главная: в тексте нет бренда «Будет на ЕГЭ» или домена budetege.ru');
  }
  const ld = tag(home, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (ld === null) {
    fail('Главная: нет разметки Schema.org (application/ld+json)');
  } else {
    let graph;
    try {
      graph = JSON.parse(ld)['@graph'];
    } catch {
      fail('Главная: Schema.org не разбирается как JSON');
    }
    if (graph !== undefined) {
      for (const type of ['Organization', 'WebSite', 'WebPage']) {
        const node = graph.find((n) => n['@type'] === type);
        if (node === undefined) {
          fail(`Главная: в Schema.org нет ${type}`);
        } else if (node.url !== `${SITE_URL}/` || (type !== 'WebPage' && node.name !== BRAND)) {
          fail(`Главная: ${type} с неверным name/url`);
        }
      }
    }
  }
  if (og(home, 'title') === null || og(home, 'image') === null || og(home, 'type') !== 'website') {
    fail('Главная: нет og:title, og:image или og:type=website');
  }
  if (!/<meta\s+name="twitter:card"\s+content="summary_large_image"/.test(home)) {
    fail('Главная: нет twitter:card');
  }
  if (!/<link\s+rel="manifest"\s+href="\/manifest\.webmanifest"/.test(home)) {
    fail('Главная: нет ссылки на manifest.webmanifest');
  }
}
if (read('manifest.webmanifest') === null) {
  fail('Нет out/manifest.webmanifest.');
}

/* ── 5. Страницы разделов заданий ──────────────────────────────── */
const seenTitles = new Map();
for (const route of [
  '/zadaniya/2/',
  '/zadaniya/3/',
  '/zadaniya/4/',
  '/zadaniya/5/',
  '/zadaniya/8/',
  '/zadaniya/11/',
  '/zadaniya/12/',
]) {
  const html = read(path.join(route, 'index.html'));
  if (html === null) {
    fail(`Нет страницы ${route}`);
    continue;
  }
  const no = route.split('/')[2];
  const t = title(html) ?? '';
  const d = description(html) ?? '';
  if (!t.includes(`Задание ${no} ЕГЭ`) || !t.includes(BRAND)) {
    fail(`${route}: заголовок «${t}»`);
  }
  if (d === '' || !d.includes('ЕГЭ')) {
    fail(`${route}: нет описания про ЕГЭ`);
  }
  const heads = h1s(html);
  if (heads.length !== 1 || !/Задание №?\d+/.test(heads[0])) {
    fail(`${route}: H1 ${JSON.stringify(heads)} не называет задание`);
  }
  if (seenTitles.has(t)) {
    fail(`${route}: заголовок повторяет ${seenTitles.get(t)}`);
  }
  seenTitles.set(t, route);
  if (og(html, 'title') === null || og(html, 'image') === null) {
    fail(`${route}: нет og:title или og:image`);
  }
}

/* ── 6. Страница 404 ───────────────────────────────────────────── */
const notFound = read('404.html');
if (notFound === null) {
  fail('Нет out/404.html.');
} else if (!/Страница не найдена/.test(notFound) || !isNoindex(notFound)) {
  fail('404.html: не наша страница или без noindex');
}
if (!/ErrorDocument 404 \/404\.html/.test(read('.htaccess') ?? '')) {
  fail('.htaccess: нет ErrorDocument 404 /404.html');
}

if (problems.length > 0) {
  console.error(`Проверка индексации: ошибок — ${problems.length}.`);
  for (const line of problems) {
    console.error(`  ${line}`);
  }
  process.exit(1);
}
console.log(
  `Индексация: страниц — ${checked}, индексируемых — ${indexable}, в sitemap — ${inSitemap.size}; robots, canonical, Schema.org, Open Graph — в порядке.`,
);
