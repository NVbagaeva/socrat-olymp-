#!/usr/bin/env node
/* scripts/check-tsveta.mjs — вписанные цвета вне палитры.

   Запуск: pnpm test:tsveta
           pnpm test:tsveta --spisok     — показать все найденные цвета
           pnpm test:tsveta --obnovit    — переписать счётчики исключений
                                           (причины остаются, новые файлы
                                           получают причину «ПРОВЕРИТЬ»)

   Цвета живут в палитре (src/styles/tokens.css): компоненты берут только
   переменные, иначе тёмная тема («ночное стекло», lib/tema.ts) их не
   достанет. Проверка ищет hex, rgb(), rgba(), hsl() в CSS и в строках
   TS/TSX. Не смотрит:
   - src/styles/tokens.css — там сама палитра;
   - печать: src/lib/sheet/**, файлы и папки pechat, блоки @media print —
     листы и печать всегда светлые;
   - комментарии.
   Неизбежные исключения (запасной hex в var(--x, #hex) для чертежей,
   уходящих в листы и PDF; WebGL; цвета аватаров; маски) — в явном списке
   scripts/tsveta-isklyucheniya.json с причиной. Новый цвет или файл вне
   списка — ошибка: заведите переменную в tokens.css. */

import fs from 'node:fs';
import path from 'node:path';
import { APP } from './lib/load-ts.mjs';

const SRC = path.join(APP, 'src');
const SPISOK = path.join(APP, 'scripts', 'tsveta-isklyucheniya.json');
const args = new Set(process.argv.slice(2));

const PROPUSK = [
  /^styles\/tokens\.css$/,
  /^lib\/sheet\//,
  /(^|\/)pechat(\/|[^/]*\.(css|tsx?)$)/,
  /\.d\.ts$/,
];

function obkhod(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) obkhod(p, out);
    else if (/\.(css|tsx?|js|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

/* Убрать комментарии и печатные блоки, не сдвигая смысл. */
function ochistit(text, css) {
  let s = text.replace(/\/\*[\s\S]*?\*\//g, ' ');
  if (css) {
    let i;
    while ((i = s.search(/@media\s+print\b/)) !== -1) {
      const start = s.indexOf('{', i);
      let d = 0;
      let j = start;
      for (; j < s.length; j += 1) {
        if (s[j] === '{') d += 1;
        else if (s[j] === '}' && --d === 0) break;
      }
      s = s.slice(0, i) + s.slice(j + 1);
    }
  } else {
    s = s.replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  }
  return s;
}

const CVET = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\([^)]*\)/g;

function naiti(file) {
  const rel = path.relative(SRC, file).split(path.sep).join('/');
  if (PROPUSK.some((re) => re.test(rel))) return null;
  const css = file.endsWith('.css');
  const text = ochistit(fs.readFileSync(file, 'utf8'), css);
  const found = {};
  if (css) {
    for (const m of text.matchAll(CVET)) {
      /* #000 / #fff в масках (mask-image) — не цвет интерфейса. */
      const k = m[0].toLowerCase().replace(/\s+/g, ' ');
      found[k] = (found[k] ?? 0) + 1;
    }
  } else {
    /* В TS/TSX — только цвета внутри строковых литералов. */
    for (const lit of text.matchAll(/(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g)) {
      for (const m of lit[2].matchAll(CVET)) {
        if (
          m[0].startsWith('#') &&
          !/^#[0-9a-fA-F]{3}([0-9a-fA-F]{1}|[0-9a-fA-F]{3}|[0-9a-fA-F]{5})?$/.test(m[0])
        )
          continue;
        const k = m[0].toLowerCase().replace(/\s+/g, ' ');
        found[k] = (found[k] ?? 0) + 1;
      }
    }
  }
  return Object.keys(found).length > 0 ? { rel, found } : null;
}

const vse = obkhod(SRC).map(naiti).filter(Boolean);
const spisok = fs.existsSync(SPISOK) ? JSON.parse(fs.readFileSync(SPISOK, 'utf8')) : {};

if (args.has('--spisok')) {
  for (const { rel, found } of vse) {
    console.log(
      `${rel}: ${Object.entries(found)
        .map(([c, n]) => `${c}×${n}`)
        .join(' ')}`,
    );
  }
}

if (args.has('--obnovit')) {
  const novyy = {};
  for (const { rel, found } of vse) {
    novyy[rel] = { prichina: spisok[rel]?.prichina ?? 'ПРОВЕРИТЬ', tsveta: found };
  }
  fs.writeFileSync(SPISOK, JSON.stringify(novyy, null, 2) + '\n');
  console.log(`Список исключений переписан: файлов ${Object.keys(novyy).length}.`);
  process.exit(0);
}

const oshibki = [];
let vsego = 0;
for (const { rel, found } of vse) {
  const razresheno = spisok[rel];
  for (const [c, n] of Object.entries(found)) {
    vsego += n;
    const mozhno = razresheno?.tsveta?.[c] ?? 0;
    if (n > mozhno) oshibki.push(`${rel}: ${c} — ${n} раз(а), в списке исключений ${mozhno}`);
  }
}
for (const [rel, v] of Object.entries(spisok)) {
  if (!v.prichina || v.prichina === 'ПРОВЕРИТЬ') oshibki.push(`${rel}: у исключения нет причины`);
}

if (oshibki.length > 0) {
  console.error('Вписанные цвета вне палитры (заведите переменную в src/styles/tokens.css):');
  for (const o of oshibki) console.error('  ✗ ' + o);
  process.exit(1);
}
console.log(
  `Цвета: вне палитры только исключения из списка — файлов ${vse.length}, вхождений ${vsego}.`,
);
