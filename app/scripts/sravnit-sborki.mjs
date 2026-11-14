#!/usr/bin/env node
/* scripts/sravnit-sborki.mjs — две сборки сайта показывают одно и то же.

   Запуск: node scripts/sravnit-sborki.mjs <out «до»> <out «после»>
           [--pokazat N]   сколько различий напечатать (по умолчанию 20)

   Для правок, которые не должны менять ничего на экране: перенос номера
   задания в struktura.js, переименование, разбор кода на части. Сайт
   собирают дважды — с main и с ветки — и сравнивают страницы.

   Сравнивается то, что видит человек и поисковик:
     — список страниц (index.html, 404.html) — должен совпасть;
     — на каждой странице: разметка и весь текст, title и meta, атрибуты
       (ссылки, alt, aria-label, классы), микроразметка JSON-LD.

   Не сравнивается то, что меняется от любой правки кода и на экран не
   влияет: имена файлов сборки (/_next/static/…, в них хеш содержимого),
   встроенные сценарии с данными роутера, служебные комментарии React
   между соседними кусками текста («Задание №<!-- -->6»).

   Чего проверка не видит: текст, который появляется только после
   нажатия (окно подтверждения, итоги тренировки) и собирается в
   браузере. Его сверяют снимком значений модулей — см. описание PR. */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const dirs = args.filter((a) => !a.startsWith('--'));
if (dirs.length !== 2) {
  console.error('Нужны две папки: node scripts/sravnit-sborki.mjs <out «до»> <out «после»>');
  process.exit(2);
}
const [DO, POSLE] = dirs.map((d) => path.resolve(d));
const POKAZAT = Number(args[args.indexOf('--pokazat') + 1]) || 20;

function stranitsy(root) {
  const out = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) {
        if (name !== '_next') walk(full);
      } else if (name === 'index.html' || (dir === root && name.endsWith('.html'))) {
        out.push(path.relative(root, full).split(path.sep).join('/'));
      }
    }
  };
  walk(root);
  return out.sort();
}

/** То, что на странице видно: разметка без служебных частей сборки. */
function vidimoe(html) {
  return (
    html
      /* Сценарии: данные роутера и код. Микроразметку оставляем. */
      .replace(/<script\b(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/g, '')
      /* Подключение файлов сборки: имена с хешем содержимого. */
      .replace(/<link\b[^>]*\/_next\/[^>]*>/g, '')
      .replace(/\/_next\/static\/[^"'\s)]+/g, '/_next/…')
      /* Комментарии React: границы текста и отложенных блоков. */
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ')
      .replace(/> </g, '><')
      .trim()
  );
}

/** Первое место, где строки расходятся: по 60 знаков до и 100 после. */
function mesto(a, b) {
  let i = 0;
  const n = Math.min(a.length, b.length);
  while (i < n && a[i] === b[i]) i += 1;
  const s = Math.max(0, i - 60);
  return { do: a.slice(s, i + 100), posle: b.slice(s, i + 100) };
}

const a = stranitsy(DO);
const b = stranitsy(POSLE);
const setA = new Set(a);
const setB = new Set(b);
const propali = a.filter((p) => !setB.has(p));
const poyavilis = b.filter((p) => !setA.has(p));

const raznye = [];
let odinakovyh = 0;
for (const p of a) {
  if (!setB.has(p)) continue;
  const x = vidimoe(fs.readFileSync(path.join(DO, p), 'utf8'));
  const y = vidimoe(fs.readFileSync(path.join(POSLE, p), 'utf8'));
  if (x === y) odinakovyh += 1;
  else raznye.push({ p, ...mesto(x, y) });
}

const adres = (p) => '/' + p.replace(/index\.html$/, '');
console.log(`Страниц «до»: ${a.length}, «после»: ${b.length}.`);
console.log(`Совпадают: ${odinakovyh}. Отличаются: ${raznye.length}.`);
if (propali.length > 0) {
  console.log(`\nПропали (${propali.length}):`);
  for (const p of propali.slice(0, POKAZAT)) console.log(`  ${adres(p)}`);
}
if (poyavilis.length > 0) {
  console.log(`\nПоявились (${poyavilis.length}):`);
  for (const p of poyavilis.slice(0, POKAZAT)) console.log(`  ${adres(p)}`);
}
if (raznye.length > 0) {
  console.log('\nГде расходятся:');
  for (const r of raznye.slice(0, POKAZAT)) {
    console.log(`\n  ${adres(r.p)}\n    до:    …${r.do}…\n    после: …${r.posle}…`);
  }
  if (raznye.length > POKAZAT) console.log(`\n  … и ещё ${raznye.length - POKAZAT}`);
}

if (propali.length + poyavilis.length + raznye.length > 0) process.exit(1);
console.log('\nСборки показывают одно и то же.');
