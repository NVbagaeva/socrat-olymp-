/* scripts/check-asset-versions.mjs — ссылки на файлы из public/ с версией.

   PDF-листы и картинки лежат под постоянными именами, а хостинг отдаёт
   их с кешем на год. Чтобы перезалитый под тем же именем файл не
   залипал у учеников, ссылка на него несёт версию — ?v=<хеш
   содержимого> (lib/assetUrl.ts, таблица — scripts/lib/asset-versions.mjs).

   Проверка идёт по собранному сайту (out/): страницы, стили и код
   (_next/static). Находит ссылку на файл из
   public/ без ?v= или с устаревшей версией — падает и называет файл,
   строку и ссылку. Так новая картинка, вставленная без assetUrl(), не
   пройдёт незамеченной.

   Запуск после pnpm build:  node scripts/check-asset-versions.mjs */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetVersions } from './lib/asset-versions.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(app, 'out');
const versions = assetVersions(path.join(app, 'public'));

/* Файлы, которые браузер или поисковик берут по постоянному имени сами,
   без ссылки со страницы: значки вкладки и экрана «Домой». */
const FIXED = new Set(['/favicon.ico', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png']);

/* Путь к файлу из public/ в тексте: в кавычках, в url(…), в srcset. */
const paths = Object.keys(versions).filter((p) => !FIXED.has(p));
const escaped = paths
  .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .sort((a, b) => b.length - a.length);
const RE = new RegExp(`(${escaped.join('|')})(\\?v=([0-9a-f]{8}))?`, 'g');

function files(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      files(full, out);
      continue;
    }
    if (/\.(html|js|css)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

const problems = [];
let checked = 0;
for (const file of files(OUT)) {
  const rel = path.relative(app, file);
  if (rel.startsWith(path.join('out', 'styleguide'))) {
    continue;
  }
  const text = fs.readFileSync(file, 'utf8');
  checked += 1;
  for (const m of text.matchAll(RE)) {
    const [, url, , version] = m;
    if (version === versions[url]) {
      continue;
    }
    const before = text.slice(Math.max(0, m.index - 12), m.index);
    if (file.endsWith('.html') || file.endsWith('.css')) {
      /* Страница и стили: только то, что браузер скачает, — атрибуты
         src, href, srcset (и следующие адреса в srcset) и url(…).
         Тот же путь в данных компонентов внутри страницы
         ("path":"/images/…") — не ссылка: компонент сам добавит версию
         при отрисовке, и готовая ссылка проверяется здесь же. */
      if (
        !/(?:\b(?:src|href|srcset|srcSet|poster|content)=["']|url\(["']?|\d+[wx], )$/.test(before)
      ) {
        continue;
      }
    } else {
      /* Код (_next/static/*.js): путь остаётся аргументом вызова
         assetUrl("/images/…"), версию он добавит при отрисовке. Такой
         аргумент — кавычка сразу после открывающей скобки. Таблица
         версий (process.env.ASSET_VERSIONS): путь в ней — ключ, за ним
         «":». */
      if (/\(["'`]$/.test(before)) {
        continue;
      }
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + 3);
      if (/^\\?":/.test(after)) {
        continue;
      }
      if (!/["'`]$/.test(before)) {
        continue;
      }
    }
    const line = text.slice(0, m.index).split('\n').length;
    problems.push(
      `${rel}:${line} — ${url}${version ? `?v=${version} (устарела, нужна ${versions[url]})` : ' без ?v='}`,
    );
  }
}

const unique = [...new Set(problems)];
if (unique.length > 0) {
  console.error(`Ссылки на файлы из public/ без версии (${unique.length}):`);
  unique.slice(0, 80).forEach((p) => console.error('  ' + p));
  if (unique.length > 80) {
    console.error(`  … и ещё ${unique.length - 80}`);
  }
  console.error('Оберните адрес в assetUrl() из lib/assetUrl.ts.');
  process.exit(1);
}
console.log(
  `Версии файлов: ${checked} файлов сборки, все ссылки на PDF и картинки с актуальной ?v=.`,
);
