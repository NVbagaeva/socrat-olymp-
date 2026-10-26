#!/usr/bin/env node
/* scripts/check-chast2.mjs — часть 2 онлайн: баллы, шкала, автопроверка.

   Запуск: pnpm test:chast2

     1. Баллы: максимумы 1–20 из одного конфига, сумма 13 + 20 = 33.
     2. Шкала: значения для 0…33, не убывает, 0 → 0, 33 → 100.
     3. Автопроверка: для каждого типа поля — таблица эквивалентных
        записей (должны совпасть), неэквивалентных (не совпасть) и
        неразборчивых («проверит учитель», не «неверно»).
     Ответы самих вариантов — pnpm test:povyshennye-chast2.

   Ненулевой код возврата — проверка не прошла. */

import { requireSrc } from './lib/load-ts.mjs';

const { MAX_BALL, MAX_PART1, MAX_PART2, MAX_TOTAL } = requireSrc('content/variantOnline/bally');
const { TESTOVYJ_33: TESTOVYJ } = requireSrc('content/variantOnline/shkala');
const { proverit } = requireSrc('lib/chast2/sravnenie');

let failures = 0;
let checks = 0;
function ok(cond, where) {
  checks += 1;
  if (!cond) {
    failures += 1;
    console.error(`  ✗ ${where}`);
  }
}

/* ── 1. Баллы ───────────────────────────────────────────────────── */
const ozhid = { 14: 2, 15: 3, 16: 2, 17: 2, 18: 3, 19: 4, 20: 4 };
for (let n = 1; n <= 13; n += 1) ok(MAX_BALL[n] === 1, `№${n}: 1 балл`);
for (const [n, b] of Object.entries(ozhid)) ok(MAX_BALL[n] === b, `№${n}: ${b} балла`);
ok(
  MAX_PART1 === 13 && MAX_PART2 === 20 && MAX_TOTAL === 33,
  `части 13 + 20 = 33 (${MAX_PART1} + ${MAX_PART2} = ${MAX_TOTAL})`,
);
ok(Object.values(MAX_BALL).reduce((s, x) => s + x, 0) === 33, 'сумма максимумов 33');

/* Критерии: верхняя строка — максимум задания, нижняя — 0, баллы по убыванию без пропусков. */
const { KRITERII, kriteriiZadaniya } = requireSrc('content/variantOnline/kriterii');
for (let n = 14; n <= 20; n += 1) {
  const k = KRITERII[n];
  ok(k[0].ball === MAX_BALL[n], `№${n}: верхний критерий = максимум ${MAX_BALL[n]}`);
  ok(k[k.length - 1].ball === 0, `№${n}: нижний критерий 0`);
  ok(
    k.every((r, i) => i === 0 || r.ball === k[i - 1].ball - 1),
    `№${n}: баллы ${k.map((r) => r.ball).join(',')} подряд`,
  );
  ok(
    kriteriiZadaniya(n).every((r) => r.ili.every((t) => !/[{}]/.test(t))),
    `№${n}: в критериях нет незаполненных мест`,
  );
}
ok(
  kriteriiZadaniya(16, { u: 'точки 1' })[1].ili[0].endsWith('исключением точки 1'),
  '№16: уточнение варианта подставляется',
);

/* ── 2. Шкала ───────────────────────────────────────────────────── */
ok(TESTOVYJ.length === 34, `шкала: 34 значения (0…33), а не ${TESTOVYJ.length}`);
ok(TESTOVYJ[0] === 0 && TESTOVYJ[33] === 100, 'шкала: 0 → 0, 33 → 100');
ok(
  TESTOVYJ.every((v, i) => i === 0 || v >= TESTOVYJ[i - 1]),
  'шкала не убывает',
);
ok(
  TESTOVYJ.every((v) => Number.isInteger(v) && v >= 0 && v <= 100),
  'шкала: целые 0…100',
);

/* ── 3. Автопроверка ────────────────────────────────────────────── */
const S = 'sovpadaet';
const N = 'ne-sovpadaet';
const U = 'uchitel';
const I = (lo, loZakr, hi, hiZakr) => ({ t: 'interval', lo, loZakr, hi, hiZakr });
const T = (x) => ({ t: 'tochka', x });
const M = (...kuski) => ({ kuski });

const TABLICA = [
  /* число */
  [
    { vid: 'chislo', verno: '\\frac{2\\sqrt{21}}{\\sqrt{103}}' },
    [
      ['\\frac{\\sqrt{84}}{\\sqrt{103}}', S],
      ['2√21/√103', S],
      ['\\sqrt{\\frac{84}{103}}', S],
      ['0,9031', N],
      ['\\frac{2\\sqrt{21}}{103}', N],
      ['2*sqrt(21)/sqrt(103)', S],
      ['\\sqrt{84/103', U],
      ['ответ два', U],
    ],
  ],
  [
    { vid: 'chislo', verno: '1,5' },
    [
      ['1.5', S],
      ['\\frac32', S],
      ['3/2', S],
      ['1{,}5', S],
      ['1\\frac{1}{2}', S],
      ['15', N],
      ['-1,5', N],
    ],
  ],
  [
    { vid: 'chislo', verno: '420' },
    [
      ['420', S],
      ['4,2\\cdot10^2', S],
      ['420,0', S],
      ['421', N],
    ],
  ],
  [
    { vid: 'chislo', verno: '-\\frac{11\\pi}{2}' },
    [
      ['-5,5\\pi', S],
      ['-\\frac{11}{2}\\pi', S],
      ['-11π/2', S],
      ['11π/2', N],
    ],
  ],
  /* выражение с параметром */
  [
    { vid: 'vyrazhenie', verno: '14{,}4\\sqrt{\\frac{2}{2-n}}', oblast: { n: [0, 0.5] } },
    [
      ['14,4\\sqrt{\\frac{2}{2-n}}', S],
      ['\\frac{14{,}4\\sqrt2}{\\sqrt{2-n}}', S],
      ['\\sqrt{\\frac{414{,}72}{2-n}}', S],
      ['72√2/(5√(2-n))', S],
      ['14,4\\sqrt{\\frac{2}{2+n}}', N],
      ['14,4', N],
      ['14,4\\sqrt{\\frac{2}{2-m}}', U],
    ],
  ],
  /* набор корней */
  [
    { vid: 'korni', verno: ['-\\frac{11\\pi}{2}', '-5\\pi'] },
    [
      [['-5\\pi', '-\\frac{11\\pi}{2}'], S],
      [['-5π', '-5,5π'], S],
      [['-5\\pi', '-5\\pi', '-\\frac{11\\pi}{2}'], S],
      [['-5\\pi'], N],
      [['-5\\pi', '-\\frac{9\\pi}{2}'], N],
      [['-5\\pi', '-\\frac{11\\pi}{2}', '-6\\pi'], N],
      [['-5\\pi', 'минус пять пи'], U],
      [[], N],
    ],
  ],
  /* промежутки */
  [
    { vid: 'promezhutki', verno: M(I('1', true, '1,5', false), I('16', true, 'inf', false)) },
    [
      [M(I('1', true, '\\frac32', false), I('16', true, '+\\infty', false)), S],
      [M(I('16', true, '\\infty', true), I('1', true, '1.5', false)), S],
      [
        M(I('1', true, '1,25', true), I('1,25', false, '1,5', false), I('16', true, 'inf', false)),
        S,
      ],
      [M(I('1', false, '1,5', false), I('16', true, 'inf', false)), N],
      [M(I('1', true, '1,5', true), I('16', true, 'inf', false)), N],
      [M(I('1', true, '1,5', false), I('16', false, 'inf', false), T('16')), S],
      [M(I('1', true, '1,5', false)), N],
      [M(I('1', true, 'полтора', false), I('16', true, 'inf', false)), U],
    ],
  ],
  [
    { vid: 'promezhutki', verno: M(I('-4,5', true, '-2\\sqrt2', false), T('-4\\frac{17}{18}')) },
    [
      [M(T('-\\frac{89}{18}'), I('-\\frac92', true, '-\\sqrt8', false)), S],
      [M(I('-4,5', true, '-2√2', false), T('-89/18')), S],
      [M(I('-4,5', true, '-2\\sqrt2', true), T('-\\frac{89}{18}')), N],
      [M(I('-4,5', true, '-2\\sqrt2', false)), N],
      [M(I('-4,5', true, '-2,83', false), T('-\\frac{89}{18}')), N],
    ],
  ],
  /* серии */
  [
    { vid: 'serii', verno: ['\\pi+2\\pi n', '\\frac{\\pi}{2}+2\\pi l'] },
    [
      [['x=\\pi+2\\pi n, n\\in\\mathbb{Z}', 'x=\\frac{\\pi}{2}+2\\pi k, k\\in\\mathbb{Z}'], S],
      [['-\\pi+2\\pi k', '\\frac{5\\pi}{2}+2\\pi m'], S],
      [['\\pi(2n+1)', '\\frac{\\pi}{2}(4k+1)'], S],
      [['\\frac{\\pi}{2}+\\frac{\\pi}{2}\\cdot n'], N],
      [['\\pi+2\\pi n'], N],
      [['\\pi+\\pi n', '\\frac{\\pi}{2}+2\\pi n'], N],
      [['x = π + 2πn', 'x = π/2 + 2πn'], S],
      [['\\pi + 2\\pi n + y'], U],
    ],
  ],
  [
    { vid: 'serii', verno: ['(-1)^n\\frac{\\pi}{6}+\\pi n'] },
    [
      [['\\frac{\\pi}{6}+2\\pi n', '\\frac{5\\pi}{6}+2\\pi n'], S],
      [['\\frac{\\pi}{6}+\\pi n'], N],
    ],
  ],
  /* да / нет */
  [
    { vid: 'danet', verno: true },
    [
      ['da', S],
      ['net', N],
      [null, N],
    ],
  ],
  [
    { vid: 'danet', verno: false },
    [
      ['net', S],
      ['da', N],
    ],
  ],
];

for (const [pole, sluchai] of TABLICA) {
  for (const [vvod, nado] of sluchai) {
    const est = proverit(pole, vvod);
    ok(
      est === nado,
      `${pole.vid} ${JSON.stringify(pole.verno)} ← ${JSON.stringify(vvod)}: ждали ${nado}, получили ${est}`,
    );
  }
}

if (failures > 0) {
  console.error(`\nЧасть 2: ошибок ${failures} из ${checks}`);
  process.exit(1);
}
console.log(`Часть 2: ${checks} проверок — всё сходится`);
