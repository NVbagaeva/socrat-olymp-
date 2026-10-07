/* scripts/build-sitemap.mjs — карта сайта из собранного экспорта.

   Поисковику нужен список публичных страниц: https://budetege.ru/sitemap.xml.
   Список не записан руками — он считается по out/ после pnpm build:
   каждая папка с index.html — страница, её адрес — путь папки с «/»
   на конце. Появился новый раздел или подтема — попадёт в карту сама.

   Не попадают:
   - страницы с <meta name="robots" content="noindex…"> — печатные
     листы, витрины, заглушки разделов, личный кабинет (robots задают
     сами страницы, lib/seo.ts);
   - служебные папки: 404, витрина дизайн-системы, файлы сборки.

   Адрес страницы берётся из её же canonical (<link rel="canonical">):
   карта и страница не могут разойтись. Страница без canonical —
   ошибка сборки.

   Запуск после next build (входит в pnpm build):
     node scripts/build-sitemap.mjs */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(app, 'out');
const SITE_URL = 'https://budetege.ru';

/* Папки верхнего уровня, которых в карте быть не может. */
const SKIP_TOP = new Set(['_next', '404', 'styleguide']);

export function pages(dir = OUT, out = []) {
  for (const name of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (dir === OUT && SKIP_TOP.has(name)) {
        continue;
      }
      pages(full, out);
      continue;
    }
    if (name === 'index.html') {
      out.push(full);
    }
  }
  return out;
}

/** «/zadaniya/4/» из out/zadaniya/4/index.html. */
export function routeOf(file) {
  const rel = path.relative(OUT, path.dirname(file)).split(path.sep).filter(Boolean);
  return rel.length === 0 ? '/' : `/${rel.join('/')}/`;
}

export function isNoindex(html) {
  const m = html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i);
  return m !== null && /\bnoindex\b/i.test(m[1]);
}

export function canonicalOf(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
  return m === null ? null : m[1];
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Список адресов карты: только индексируемые страницы, по canonical. */
export function sitemapUrls() {
  const urls = [];
  const problems = [];
  for (const file of pages()) {
    const html = fs.readFileSync(file, 'utf8');
    if (isNoindex(html)) {
      continue;
    }
    const route = routeOf(file);
    const canonical = canonicalOf(html);
    if (canonical === null) {
      problems.push(`${route}: нет <link rel="canonical">`);
      continue;
    }
    if (canonical !== `${SITE_URL}${route}`) {
      problems.push(`${route}: canonical ${canonical} не совпадает с адресом страницы`);
      continue;
    }
    urls.push(canonical);
  }
  /* Главная первой, остальные по адресу: карту читают и люди. */
  urls.sort((a, b) => (a === `${SITE_URL}/` ? -1 : b === `${SITE_URL}/` ? 1 : a.localeCompare(b)));
  return { urls, problems };
}

export function sitemapXml(urls) {
  const lines = urls.map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join('\n')}\n</urlset>\n`;
}

function main() {
  if (!fs.existsSync(path.join(OUT, 'index.html'))) {
    console.error('Нет out/index.html — сначала next build.');
    process.exit(1);
  }
  const { urls, problems } = sitemapUrls();
  if (problems.length > 0) {
    console.error(`Карта сайта не собрана: ${problems.length} страниц(ы) с неверным canonical.`);
    for (const line of problems) {
      console.error(`  ${line}`);
    }
    process.exit(1);
  }
  if (!urls.includes(`${SITE_URL}/`)) {
    console.error('В карте сайта нет главной страницы.');
    process.exit(1);
  }
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemapXml(urls));
  console.log(`Карта сайта out/sitemap.xml: страниц — ${urls.length}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
