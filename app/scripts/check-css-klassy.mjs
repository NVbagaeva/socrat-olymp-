#!/usr/bin/env node
/* scripts/check-css-klassy.mjs — один класс с раскладкой в двух местах.

   Запуск: pnpm test:css-klassy

   Зачем. Сайт собирается в общий CSS, и стили страницы, на которой
   побывали, остаются загруженными после перехода внутри сайта. Если два
   несвязанных компонента объявили один и тот же класс, правила одного
   ложатся на разметку другого. Так было с .kz: картинка к задаче
   (.kz { float: right; width: 170px }) сжимала карту «О задании»
   (.kz { display: grid }) в полоску у правого края.

   Что проверяется. Все CSS-файлы в src/components/** и src/app/**.
   Класс «объявлен» в файле, если правило ложится на него целиком:
   селектор — ровно один класс (можно с тегом, псевдоклассами и
   атрибутами: figure.kz, .kz:hover, .kz[open]), а не уточнение вроде
   .z3-karta .kz-gruppa, .kz.z45-karta или .x:has(.y). И если правило
   задаёт раскладку: display, float, width, grid*, flex*,
   position, margin*. Такие правила действуют везде, где встретится
   класс, поэтому один класс в двух папках компонентов — ошибка.

   Файлы одной папки считаются связанными (это стили одного
   компонента). Остальные нужные совпадения — в ISKLYUCHENIYA с
   комментарием, почему так можно. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(APP, 'src');
const KORNI = ['components', 'app'].map((d) => path.join(SRC, d));

/**
 * Класс → почему ему можно задавать раскладку в нескольких папках.
 * Ключ — имя класса без точки.
 */
const ISKLYUCHENIYA = new Map([
  [
    'help-fab',
    'кнопка помощи объявлена в onboarding.css; progressUchitel.css лишь прячет её на печати отчёта учителя (@media print, display: none)',
  ],
  [
    'sheet-page',
    'лист печати объявлен в lib/sheet/sheet.css; каждая страница печати задаёт одно и то же правило на экране — margin: 0 auto (лист по центру)',
  ],
  [
    'vteor__main',
    'колонка теории объявлена в zadaniya/veroyatnost.css; site9.css только на печати №9 делает её обычным блоком (@media print)',
  ],
  [
    'vteor-razdel',
    'раздел теории объявлен в zadaniya/veroyatnost.css; site9.css только на печати №9 делает его обычным блоком (@media print)',
  ],
  [
    'z1-gde__chip',
    '№1: zadanie1.css и поверх него steklo1.css подключены одним layout раздела planimetriya — «Стеклянная сцена» намеренно переопределяет прежний стиль; вне №1 класса нет',
  ],
  [
    'z11-sheet-tab',
    '№11: одна таблица модели — в листе печати (pechat11.css) и в предпросмотре листа внутри раздела (zadanie11.css); вне №11 класса нет',
  ],
  [
    'z13-tablitsa',
    '№13: одна таблица по периодам — в листе печати (pechat13.css) и в разделе (zadanie13.css); вне №13 класса нет',
  ],
  ...[
    'z13-of',
    'z13-of__dano',
    'z13-of__kletka',
    'z13-of__label',
    'z13-of__shag',
    'z13-of__stroka',
    'z13-of__vvod',
  ].map((k) => [
    k,
    '№13: zadanie13.css и поверх него zadanie13-steklo.css подключены одним layout раздела ekonomika — «Стеклянная сцена» намеренно переопределяет прежние стили того же блока; вне №13 класса нет',
  ]),
  ...['z7-podskazki', 'z7-podskazki__knopki', 'z7-podskazki__otklik', 'z7-podskazki__vopros'].map(
    (k) => [
      k,
      'блок подсказок №7 переиспользован в №6: правила в zadanie6.css и zadanie7.css совпадают слово в слово',
    ],
  ),
]);

const RASKLADKA = /^(display|float|width|position|grid(-.*)?|flex(-.*)?|margin(-.*)?)$/;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return e.name.endsWith('.css') ? [full] : [];
  });
}

/** Делит строку по символу sep на верхнем уровне (не внутри () и []). */
function split(s, sep) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(' || ch === '[') depth += 1;
    else if (ch === ')' || ch === ']') depth -= 1;
    if (ch === sep && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/** Правила файла: [{ selector, decls: [свойство] }], @media и т. п. — внутрь. */
function pravila(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  function block(s) {
    let i = 0;
    while (i < s.length) {
      const open = s.indexOf('{', i);
      if (open === -1) return;
      const prelude = s
        .slice(i, open)
        .replace(/^[\s;]*/, '')
        .trim();
      let depth = 1;
      let j = open + 1;
      while (j < s.length && depth > 0) {
        if (s[j] === '{') depth += 1;
        else if (s[j] === '}') depth -= 1;
        j += 1;
      }
      const body = s.slice(open + 1, j - 1);
      i = j;
      if (prelude.startsWith('@')) {
        if (/^@(media|supports|layer|container|scope)\b/.test(prelude)) block(body);
        continue;
      }
      /* Свойства верхнего уровня тела (вложенные правила отбрасываются). */
      const plain = body.replace(/\{[^{}]*\}/g, '');
      const decls = plain
        .split(';')
        .map((d) => d.split(':')[0].trim().toLowerCase())
        .filter((d) => /^[a-z-]+$/.test(d));
      out.push({ selector: prelude, decls });
      if (body.includes('{')) block(body.replace(/^[^{}]*?(?=[^;{}]*\{)/, ''));
    }
  }
  block(text);
  return out;
}

/**
 * Класс, на который правило ложится целиком, или null. Селектор — одна
 * часть без потомков и соседей: ровно один класс, можно с тегом,
 * псевдоклассами и атрибутами (.kz, figure.kz, .kz:hover, .kz[open]).
 * Уточнённые правила — .z3-karta .kz-gruppa, .kz.z45-karta, .kz img,
 * .x:has(.y) — действуют только внутри своего компонента и не считаются.
 */
function obyavlennyKlass(sel) {
  const s = sel.trim();
  if (/\s|[>+~]/.test(s.replace(/\((?:[^()]|\([^()]*\))*\)/g, '()').replace(/\[[^\]]*\]/g, '[]')))
    return null;
  if (/\((?:[^()]|\([^()]*\))*\.[A-Za-z_]/.test(s)) return null;
  const bezSkobok = s.replace(/\((?:[^()]|\([^()]*\))*\)/g, '').replace(/\[[^\]]*\]/g, '');
  if (bezSkobok.includes('#') || bezSkobok.includes('&')) return null;
  const klassy = bezSkobok.match(/\.[A-Za-z_][\w-]*/g) ?? [];
  if (klassy.length !== 1) return null;
  return klassy[0].slice(1);
}

/* класс → Map(файл → [селектор]) */
const obyavleniya = new Map();
for (const file of KORNI.flatMap(walk)) {
  const rel = path.relative(APP, file);
  for (const { selector, decls } of pravila(fs.readFileSync(file, 'utf8'))) {
    if (!decls.some((d) => RASKLADKA.test(d))) continue;
    for (const sel of split(selector, ',')) {
      const k = obyavlennyKlass(sel);
      if (k === null) continue;
      if (!obyavleniya.has(k)) obyavleniya.set(k, new Map());
      const po = obyavleniya.get(k);
      if (!po.has(rel)) po.set(rel, []);
      po.get(rel).push(sel.trim().replace(/\s+/g, ' '));
    }
  }
}

const problemy = [];
for (const [k, po] of [...obyavleniya].sort(([a], [b]) => a.localeCompare(b))) {
  const papki = new Set([...po.keys()].map((f) => path.dirname(f)));
  if (papki.size < 2) continue;
  if (ISKLYUCHENIYA.has(k)) continue;
  const gde = [...po].map(([f, s]) => `    ${f}: ${[...new Set(s)].join(', ')}`).join('\n');
  problemy.push(`.${k} задаёт раскладку в ${papki.size} несвязанных местах:\n${gde}`);
}
for (const k of ISKLYUCHENIYA.keys()) {
  const papki = new Set([...(obyavleniya.get(k)?.keys() ?? [])].map((f) => path.dirname(f)));
  if (papki.size < 2) problemy.push(`исключение .${k} больше не нужно — убрать из списка`);
}

if (problemy.length > 0) {
  console.error(`Классы CSS с раскладкой в несвязанных файлах (${problemy.length}):\n`);
  for (const p of problemy) console.error(`  ${p}\n`);
  console.error(
    'Дайте классу компонента своё имя. Если совпадение нужно — внесите класс\n' +
      'в ISKLYUCHENIYA (scripts/check-css-klassy.mjs) с объяснением.',
  );
  process.exit(1);
}
console.log(`CSS-классы: ${obyavleniya.size} классов с раскладкой, совпадений нет.`);
