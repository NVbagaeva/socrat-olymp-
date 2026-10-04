/* scripts/check-math-markup.mjs — математика только в KaTeX.

   Ищет формулы, написанные обычным текстом: «k > 0», «f(x)», «3/4»,
   «x · y», «A(2; −3)», одиночные буквы-переменные и т. п. (признаки —
   scripts/lib/math-markup.mjs). Формула в тексте интерфейса и в
   данных задач пишется $…$ и набирается KaTeX.

   Две части:
     1. Исходники src/: строки, шаблоны, текст JSX и строки JSON —
        с файлом и номером строки. Работает без сборки.
     2. Собранный сайт out/ (если он есть или передан --site): видимый
        текст страниц вне формул, чертежей и служебных тегов. Ловит то,
        что собралось из кусков и в исходниках по одной строке не видно.

   Падает с кодом 1 и списком «файл:строка — признак — текст».

   Исключения — явные списки ниже, у каждого причина. Точечное
   исключение в разметке — класс .no-math-check на элементе.

   Запуск:
     node scripts/check-math-markup.mjs            исходники (+ out/, если собран)
     node scripts/check-math-markup.mjs --src      только исходники
     node scripts/check-math-markup.mjs --site     только собранный сайт (обязателен out/)
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeTexts, jsonTexts, sourceFiles } from './lib/math-source.mjs';
import { findPlainMath, stripDollarMath, visibleTexts } from './lib/math-markup.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(app, 'src');
const OUT = path.join(app, 'out');

/* ── Исключения: исходники ─────────────────────────────────────── */

/* Файлы, которые не проверяются целиком (путь от src/). */
const SKIP_FILES = [
  { re: /^app\/styleguide\//, why: 'служебная витрина компонентов, ученик её не видит' },
  { re: /^content\/perenos-iz-04-v-05\.ts$/, why: 'заметки о переносе материала, на сайт не выводятся' },
  { re: /(?:^|\/)selftest\.ts$/, why: 'самопроверки генераторов, тексты сообщений об ошибках' },
  { re: /^lib\/graph\/(?:renderer|math|katex|katex-upgrade|animate|preview-ui|triangle)\.js$/,
    why: 'внутренности движка: разбор и вёрстка формул, подписи SVG' },
  { re: /answers\.json$/, why: 'ключи ответов, не текст' },
  { re: /^lib\/solid\/catalog\.ts$/, why: 'подписи каталога тел — только для /styleguide/' },
  { re: /^lib\/scenes\.ts$/, why: 'подписи внутри SVG-чертежей: KaTeX в <text> не встраивается' },
  { re: /^lib\/veroyatnost\/illyustratsii\.ts$/, why: 'alt картинок: атрибут, только обычный текст' },
];

/* ── Исключения: собранный сайт ───────────────────────────────── */

const SKIP_PAGES = [
  { re: /^styleguide\//, why: 'служебная витрина компонентов' },
];

/* Тексты страницы, которые математикой не являются. */
const SITE_TEXT_OK = [
  { re: /^[−-]?\d+(?:[,.]\d+)?$/, why: 'число в ячейке таблицы статистики (−2 к счёту)' },
  { re: /(?:https?:\/\/|t\.me\/|youtube\.com|youtu\.be)/, why: 'адрес ссылки' },
];

/* Найденные куски, которые математикой не являются. */
const SITE_HIT_OK = [
  { rule: 'fraction', re: /^\d+ \/ \d+$/,
    why: 'счётчик «решено / всего», «вопрос 1 / 3», номер страницы листа: целые через « / »' },
];

/* ── Проверка ──────────────────────────────────────────────────── */

function describe(hits) {
  return [...new Set(hits.map((h) => `${h.rule}: ${h.match}`))].slice(0, 3).join(' | ');
}

function short(text) {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > 110 ? flat.slice(0, 107) + '…' : flat;
}

function checkSources() {
  const files = sourceFiles(SRC, SKIP_FILES.map((item) => item.re));
  const problems = [];
  for (const file of files) {
    const items = file.endsWith('.json') ? jsonTexts(file) : codeTexts(file);
    for (const item of items) {
      const hits = findPlainMath(stripDollarMath(item.text));
      if (hits.length > 0) {
        problems.push(`${path.relative(app, file)}:${item.line} — ${describe(hits)} — «${short(item.text)}»`);
      }
    }
  }
  return { problems, checked: files.length };
}

function htmlFiles(dir) {
  const files = [];
  (function walk(current) {
    for (const name of fs.readdirSync(current)) {
      const full = path.join(current, name);
      if (fs.statSync(full).isDirectory()) { walk(full); continue; }
      if (name.endsWith('.html')) { files.push(full); }
    }
  })(dir);
  return files.sort();
}

/* Строка в HTML, где стоит найденный кусок: чтобы отчёт показывал
   место, а не только страницу. */
function lineOf(html, piece) {
  const at = html.indexOf(piece);
  return at < 0 ? 1 : html.slice(0, at).split('\n').length;
}

function checkSite() {
  const problems = [];
  const files = htmlFiles(OUT).filter((file) => {
    const rel = path.relative(OUT, file).replace(/\\/g, '/');
    return !SKIP_PAGES.some((item) => item.re.test(rel));
  });
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    for (const text of visibleTexts(html)) {
      if (SITE_TEXT_OK.some((item) => item.re.test(text))) { continue; }
      const hits = findPlainMath(text)
        .filter((hit) => !SITE_HIT_OK.some((ok) => ok.rule === hit.rule && ok.re.test(hit.match)));
      if (hits.length > 0) {
        problems.push(`${path.relative(app, file)}:${lineOf(html, hits[0].match)} — ${describe(hits)} — «${short(text)}»`);
      }
    }
  }
  return { problems, checked: files.length };
}

const args = new Set(process.argv.slice(2));
const wantSrc = !args.has('--site');
const wantSite = args.has('--site') || (!args.has('--src') && fs.existsSync(OUT));

let failed = false;

if (wantSrc) {
  const { problems, checked } = checkSources();
  if (problems.length > 0) {
    failed = true;
    console.error(`Математика вне KaTeX в исходниках (${problems.length}):`);
    problems.forEach((line) => console.error('  ' + line));
    console.error('Формулу пишите $…$ (см. lib/tex.ts). Если обычный текст нужен специально — ' +
      'добавьте файл в SKIP_FILES или ключ в NOT_TEXT_KEYS (scripts/lib/math-source.mjs) с причиной.');
  } else {
    console.log(`Исходники: ${checked} файлов, математики вне KaTeX нет.`);
  }
}

if (wantSite) {
  if (!fs.existsSync(OUT)) {
    console.error('Нет app/out: сначала pnpm build.');
    process.exit(1);
  }
  const { problems, checked } = checkSite();
  if (problems.length > 0) {
    failed = true;
    console.error(`Математика вне KaTeX на страницах сайта (${problems.length}):`);
    problems.forEach((line) => console.error('  ' + line));
    console.error('Исключение для отдельного элемента — класс .no-math-check, ' +
      'для типа текста — SITE_TEXT_OK в этом файле.');
  } else {
    console.log(`Сайт: ${checked} страниц, математики вне KaTeX нет.`);
  }
}

process.exit(failed ? 1 : 0);
