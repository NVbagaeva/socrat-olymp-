/* scripts/check-links.mjs — внутренние ссылки не ведут на заглушки и в 404.

   Переехавшая страница оставляет по старому адресу заглушку
   (components/layout/Redirect.tsx): для закладок и внешних ссылок.
   Внутри сайта на заглушку ссылаться нельзя — ученик видит мелькание
   промежуточной страницы (так было с опорными задачами №4, №5, №8:
   карточки блоков вели на …/podgotovka/{блок}/).

   Смотрит на собранный сайт (out/):

   1. Заглушки — страницы с <meta http-equiv="refresh">. Их новый адрес
      (<link rel="canonical">) должен существовать и сам не быть заглушкой.
   2. Во всех остальных HTML и служебных файлах роутера (…/index.txt):
      href="…" и "href":"…" — не на заглушку и не в 404.
   3. Там же и в JS сборки (_next/static) — любая строка в кавычках,
      похожая на путь: не на заглушку. Так ловятся адреса, которые
      передаются пропсом (listHref и т.п.) или собираются в коде.
   4. В public/.htaccess у каждой заглушки есть 301 на тот же адрес,
      что у неё самой: до заглушки браузер не должен доходить вовсе.

   Запуск после pnpm build:  node scripts/check-links.mjs
   Пустой список проблем — код 0, иначе 1. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { internalPath } from './check-trailing-slash.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(app, 'out');

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** Адрес страницы по файлу: out/a/b/index.html → /a/b/. */
function urlOf(file) {
  const rel = '/' + path.relative(OUT, file).split(path.sep).join('/');
  return rel.replace(/index\.(html|txt)$/, '');
}

const CHUNK_SEAM = /"\]\)<\/script><script>self\.__next_f\.push\(\[1,"/g;
const HREF = [/\bhref=(["'])(.*?)\1/g, /\\?"href\\?":\\?"(.*?)\\?"/g];
/* Строка в кавычках, начинается с «/» и похожа на адрес страницы. */
const QUOTED_PATH = /\\?["'`](\/[a-z0-9][a-z0-9\-/_.]*\/)(?:[?#][^"'`\\]*)?\\?["'`]/gi;

function decode(p) {
  try {
    return decodeURI(p);
  } catch {
    return p;
  }
}

/** Ссылка → путь от корня (относительные — от адреса страницы). */
function resolve(href, pageUrl) {
  const p = internalPath(href.replace(/\\u0026/g, '&'));
  if (p === null) return null;
  if (p.startsWith('/')) return decode(p);
  return decode(new URL(p, `http://x${pageUrl}`).pathname);
}

function exists(p) {
  const local = path.join(OUT, ...p.split('/').filter(Boolean));
  if (p.endsWith('/')) return fs.existsSync(path.join(local, 'index.html'));
  if (fs.existsSync(local) && fs.statSync(local).isFile()) return true;
  /* /a/b без «/» — это check-trailing-slash; здесь важно, что страница есть. */
  return fs.existsSync(path.join(local, 'index.html'));
}

/* 301 из public/.htaccess: правила вида RewriteRule ^zadaniya… … [R=301…]. */
function htaccessRules() {
  const text = fs.readFileSync(path.join(app, 'public', '.htaccess'), 'utf8');
  const rules = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*RewriteRule\s+(\S+)\s+(\S+)\s+\[([^\]]*R=301[^\]]*)\]/);
    // ^(.*)$ — косая черта на конце, не перенос страницы.
    if (m === null || m[1] === '^(.*)$') continue;
    rules.push({ re: new RegExp(m[1]), to: m[2].replace('%{ENV:SITE_SCHEME}://%{HTTP_HOST}', '') });
  }
  return rules;
}

function redirectOf(rules, urlPath) {
  const p = urlPath.replace(/^\//, '');
  for (const rule of rules) {
    const m = p.match(rule.re);
    if (m !== null) return rule.to.replace(/\$(\d)/g, (_, n) => m[Number(n)] ?? '');
  }
  return null;
}

function main() {
  if (!fs.existsSync(path.join(OUT, 'index.html'))) {
    console.error('Нет out/index.html — сначала pnpm build.');
    process.exit(1);
  }
  const all = walk(OUT);
  const pages = all.filter(
    (f) => /\.(html|txt)$/.test(f) && !f.includes(`${path.sep}_next${path.sep}`),
  );
  const scripts = all.filter((f) => f.endsWith('.js') && f.includes(`${path.sep}_next${path.sep}`));

  /* 1. Заглушки. */
  const stubs = new Map(); // адрес → новый адрес
  for (const f of pages) {
    if (!f.endsWith('.html')) continue;
    const html = fs.readFileSync(f, 'utf8');
    if (!/http-equiv="refresh"/i.test(html)) continue;
    const canon = html.match(/<link rel="canonical" href="([^"]*)"/);
    stubs.set(urlOf(f), canon === null ? null : canon[1].replace(/&amp;/g, '&'));
  }
  const stubDirs = new Set([...stubs.keys()]);

  const problems = [];
  const add = (kind, where, link) => problems.push({ kind, where, link });

  for (const [from, to] of stubs) {
    if (to === null) {
      add('заглушка без <link rel="canonical">', from, '');
      continue;
    }
    const target = to.split(/[?#]/, 1)[0];
    if (stubDirs.has(target)) add('заглушка ведёт на заглушку', from, to);
    else if (!exists(target)) add('заглушка ведёт в 404', from, to);
  }

  /* 2–3. Ссылки на страницах и в JS. */
  let links = 0;
  for (const f of pages) {
    const pageUrl = urlOf(f);
    if (stubDirs.has(pageUrl)) continue; // сама заглушка и её index.txt
    const where = path.relative(app, f);
    const text = fs.readFileSync(f, 'utf8').replace(CHUNK_SEAM, '');
    const seen = new Set();
    for (const re of HREF) {
      for (const m of text.matchAll(re)) {
        const href = m[2] ?? m[1];
        const p = resolve(href, pageUrl);
        if (p === null || seen.has(p)) continue;
        seen.add(p);
        links += 1;
        if (stubDirs.has(p)) add('ссылка на заглушку', where, href);
        else if (!exists(p)) add('ссылка в 404', where, href);
      }
    }
    for (const m of text.matchAll(QUOTED_PATH)) {
      const p = decode(m[1]);
      if (!seen.has(p) && stubDirs.has(p)) add('адрес заглушки в данных страницы', where, m[1]);
      seen.add(p);
    }
  }
  for (const f of scripts) {
    const text = fs.readFileSync(f, 'utf8');
    for (const m of text.matchAll(QUOTED_PATH)) {
      if (stubDirs.has(decode(m[1]))) add('адрес заглушки в JS', path.relative(app, f), m[1]);
    }
  }

  /* 4. Серверный 301 на каждую заглушку. */
  const rules = htaccessRules();
  for (const [from, to] of stubs) {
    if (to === null) continue;
    for (const variant of [from, from.replace(/\/$/, ''), `${from}index.html`]) {
      const got = redirectOf(rules, variant);
      if (got !== to) add(`нет 301 в .htaccess (получилось ${got ?? '—'})`, variant, to);
    }
  }

  if (problems.length > 0) {
    console.error(`Проблемы со ссылками: ${problems.length}.`);
    const byKind = new Map();
    for (const pr of problems) {
      const key = `${pr.kind}: ${pr.link}`;
      const list = byKind.get(key) ?? [];
      list.push(pr.where);
      byKind.set(key, list);
    }
    for (const [key, where] of [...byKind].sort()) {
      console.error(`  ${key}  — ${where.length}, например ${where.slice(0, 3).join(', ')}`);
    }
    process.exit(1);
  }
  console.log(
    `Ссылки в порядке: страниц ${pages.length}, JS ${scripts.length}, ссылок ${links}, ` +
      `заглушек ${stubs.size} (у всех есть 301 и живой новый адрес).`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
