#!/usr/bin/env node
/* scripts/check-spravochnik-1.mjs — справочник по планиметрии (№1).

   1. Самотест данных (lib/planimetriya/spravochnik-selftest.ts):
      карточки, «Где на ЕГЭ» покрывает прототипы 1–75, старые якоря
      ведут на новые карточки, ответы разборов совпадают с ответами
      задач банка и аналогов, обязательные пункты на месте, KaTeX
      набирает все тексты и формулы.
   2. Пересказ: ни одна фраза не совпадает с текстами сторонних
      источников больше чем на восемь слов подряд (тексты источников
      есть только локально, в _sources/; в CI шаг пропускается).
      Исключение — школьные формулировки теорем и признаков, которые
      автор задала дословно (shkolnaya в данных): их совпадения
      печатаются отдельным списком и ошибкой не считаются.
   3. Чертежи (этап 2): у каждой карточки и своего примера есть
      чертёж, движок рисует его без нарушений и наложений подписей,
      в теории нет чисел, ключевой элемент выделен.
   4. Контраст цветов блоков (styles/tokens.css): белый текст на
      ярлыках и основной текст на заливках — не меньше 4,5 : 1 (WCAG
      AA), золотая линия ключевого элемента на белом — не меньше 3 : 1.
   5. Файл вычитки docs/spravochnik-1/soderzhanie.md совпадает с данными
      (иначе: pnpm build:spravochnik-1).

   Запуск: pnpm test:spravochnik-1 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { proveritPereskaz } from './lib/istochniki-1.mjs';
import { soderzhanieMd } from './lib/spravochnik-1-md.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const typeset = (tex) => katex.renderToString(tex, { throwOnError: true, strict: 'error' });

const { checkSpravochnik, checkChertezhi, tekstySpravochnika, shkolnyeFormulirovki } = requireSrc(
  'lib/planimetriya/spravochnik-selftest.ts',
);

const itog = checkSpravochnik(typeset);
console.log(
  `справочник: ${itog.razdelov} разделов, ${itog.kartochek} карточек, ${itog.primerov} разборов, проблем ${itog.problems.length}`,
);

const pereskaz = proveritPereskaz(tekstySpravochnika(), 8);
if (pereskaz === null)
  console.log('пересказ: текстов источников нет на этой машине — сверка пропущена');
else console.log(`пересказ: совпадений с источниками длиннее 8 слов — ${pereskaz.length}`);

/* Школьные формулировки: только для сведения. */
const shkolnye = shkolnyeFormulirovki();
const shkolnyeSovpadeniya = proveritPereskaz(shkolnye, 8);
if (shkolnyeSovpadeniya !== null) {
  console.log(
    `школьные формулировки: ${shkolnye.length}, совпадают с учебными текстами — ${shkolnyeSovpadeniya.length} (не ошибка)`,
  );
  for (const x of shkolnyeSovpadeniya) console.log(`  · ${x}`);
}

const chertezhi = checkChertezhi();
console.log(`чертежи: ${chertezhi.risunkov} рисунков, проблем ${chertezhi.problems.length}`);

/* Контраст: значения токенов из styles/tokens.css. */
const TOKENS = fs.readFileSync(path.join(APP, 'src', 'styles', 'tokens.css'), 'utf8');
function cvet(imya) {
  const m = TOKENS.match(new RegExp(`${imya}:\\s*([^;]+);`));
  if (m === null) throw new Error(`нет токена ${imya}`);
  const v = m[1].trim();
  const ssylka = v.match(/^var\((--[a-z0-9-]+)\)$/);
  return ssylka === null ? v : cvet(ssylka[1]);
}
function yarkost(hex) {
  const n = hex.replace('#', '');
  const c = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const l = c.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
}
function kontrast(a, b) {
  const [x, y] = [yarkost(cvet(a)), yarkost(cvet(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
const PARY = [
  ...['def', 'svo', 'pri', 'teo', 'vaz', 'primer', 'primenenie'].flatMap((b) => [
    [`ярлык «${b}»: белый на цвете`, '--white', `--color-spr-${b}`, 4.5],
    [`текст на заливке «${b}»`, '--grey-900', `--color-spr-${b}-soft`, 4.5],
  ]),
  ['ответ: подпись на заливке', '--color-spr-vaz', '--color-spr-vaz-soft', 4.5],
  ['этап разбора на белом', '--color-spr-def', '--white', 4.5],
  ['ключевой элемент чертежа на белом', '--color-spr-klyuch', '--white', 3],
  ['«Скачать справочник»: белый на синем', '--white', '--color-primary', 4.5],
  ['«Скачать справочник» при наведении', '--white', '--color-primary-hover', 4.5],
];
const kontrastProblemy = [];
for (const [chto, a, b, nado] of PARY) {
  const k = kontrast(a, b);
  if (k < nado) kontrastProblemy.push(`контраст: ${chto} — ${k.toFixed(2)} при норме ${nado}`);
}
const minK = Math.min(...PARY.filter((x) => x[3] === 4.5).map(([, a, b]) => kontrast(a, b)));
console.log(`контраст: ${PARY.length} пар, наименьший для текста ${minK.toFixed(2)} : 1, проблем ${kontrastProblemy.length}`);

const FILE = path.join(APP, '..', 'docs', 'spravochnik-1', 'soderzhanie.md');
const fajl = fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : '';
const svezhiy = fajl === soderzhanieMd();
console.log(`файл вычитки: ${svezhiy ? 'совпадает с данными' : 'устарел'}`);

const vse = [
  ...itog.problems,
  ...chertezhi.problems,
  ...kontrastProblemy,
  ...(pereskaz ?? []).map((x) => `совпадение с источником: ${x}`),
  ...(svezhiy ? [] : ['docs/spravochnik-1/soderzhanie.md устарел: pnpm build:spravochnik-1']),
];
if (vse.length > 0) {
  for (const p of vse) console.log(`  ✗ ${p}`);
  process.exit(1);
}
console.log('ок');
