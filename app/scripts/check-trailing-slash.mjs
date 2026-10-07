/* scripts/check-trailing-slash.mjs — внутренние ссылки только с «/» на конце.

   Сайт выгружается папками с index.html (trailingSlash: true), и
   настоящий адрес страницы — /zadaniya/, а не /zadaniya. На адрес без
   косой черты Apache на хостинге отвечает редиректом 301 на
   http://…/zadaniya/ — с понижением до http (он стоит за прокси и не
   знает, что запрос пришёл по https). Chrome такой редирект проглатывает,
   а Safari при переходе внутри сайта блокирует его как смешанное
   содержимое: переход падает, у ученика белый экран.

   Поэтому ссылки строятся через lib/paths.ts (href()), а эта проверка
   смотрит на собранный сайт (out/): во всех HTML-страницах и в служебных
   файлах роутера (…/index.txt — по ним Next.js дорисовывает экран при
   переходе) ищет внутренние ссылки, у которых путь не кончается на «/».
   Пропускает: файлы с расширением (.pdf, .png…), чистые якоря «#…»,
   mailto:, tel:, внешние адреса. Нашлась хоть одна — падает и называет
   файл и ссылку.

   Запуск после pnpm build:  node scripts/check-trailing-slash.mjs */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(app, 'out');

/* Свой домен: абсолютная ссылка на него — тоже внутренняя. */
const OWN_ORIGIN = /^https?:\/\/(www\.)?budetege\.ru(?=[/?#]|$)/i;

function files(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name !== '_next') {
        files(full, out);
      }
      continue;
    }
    if (/\.(html|txt)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

/** Путь внутренней ссылки без ?… и #… или null, если ссылка не наша. */
export function internalPath(href) {
  let url = href.trim().replace(/&amp;/g, '&');
  if (url === '' || url.startsWith('#') || /^(mailto|tel|javascript|data|blob):/i.test(url)) {
    return null;
  }
  if (OWN_ORIGIN.test(url)) {
    url = url.replace(OWN_ORIGIN, '') || '/';
  } else if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) {
    return null;
  }
  const pathOnly = url.split(/[?#]/, 1)[0];
  if (pathOnly === '') {
    // «?tab=…» — та же страница, путь не меняется.
    return null;
  }
  return pathOnly;
}

/** Ссылка ведёт на страницу (а не на файл) и без «/» на конце. */
export function lacksSlash(href) {
  const p = internalPath(href);
  if (p === null || p.endsWith('/')) {
    return false;
  }
  const last = p.slice(p.lastIndexOf('/') + 1);
  // Файл с расширением: .pdf, .png, .ico, index.txt… и manifest.webmanifest
  return !/\.([a-z0-9]{1,5}|webmanifest)$/i.test(last);
}

/* href="…" в разметке и "href":"…" в данных роутера (RSC, в т.ч.
   внутри self.__next_f.push в HTML, где кавычки экранированы). */
const PATTERNS = [/\bhref=(["'])(.*?)\1/g, /\\?"href\\?":\\?"(.*?)\\?"/g];

function hrefsIn(text) {
  const found = [];
  for (const m of text.matchAll(PATTERNS[0])) {
    found.push(m[2]);
  }
  for (const m of text.matchAll(PATTERNS[1])) {
    found.push(m[1]);
  }
  return found;
}

function main() {
  if (!fs.existsSync(path.join(OUT, 'index.html'))) {
    console.error('Нет out/index.html — сначала pnpm build.');
    process.exit(1);
  }
  const problems = new Map();
  let checked = 0;
  for (const file of files(OUT)) {
    const rel = path.relative(app, file);
    checked += 1;
    for (const href of hrefsIn(fs.readFileSync(file, 'utf8'))) {
      if (lacksSlash(href)) {
        const list = problems.get(href) ?? new Set();
        list.add(rel);
        problems.set(href, list);
      }
    }
  }
  if (problems.size > 0) {
    console.error(
      `Ссылки без «/» на конце: ${problems.size}. Стройте их через href() из lib/paths.ts.`,
    );
    for (const [href, where] of [...problems].sort()) {
      const sample = [...where].slice(0, 3).join(', ');
      console.error(`  ${href}  — ${where.size} файл(ов), например ${sample}`);
    }
    process.exit(1);
  }
  console.log(`Внутренние ссылки с «/» на конце: проверено файлов — ${checked}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
