#!/usr/bin/env node
/* scripts/check-otvet.mjs — общий модуль ответов (src/lib/otvet).

   Запуск: pnpm test:otvet (сборка не нужна).

   Три таблицы:
     1. запись бланка: нормальная запись или причина неверной записи
        и то число, которое имел в виду ученик;
     2. чтение ответа в режиме тренажёра и бланка против верного ответа:
        засчитан, неверен, «значение верное — запишите десятичной»,
        подсказка о формате (попытка не тратится);
     3. разбор «как число» для разделов с допуском (lib/answer.ts).
   Плюс таблица онлайн-варианта (normalizeCases.json): тот же модуль,
   та же таблица сверяет функцию базы normalize_ege_answer.

   Ненулевой код возврата — расхождение, оно печатается. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const { normalizeAnswer, readAnswer, formatHint, fractionRightHint, displayAnswer, parseNumber } =
  requireSrc('lib/otvet/index.ts');
const { parseAnswer, sameNumber } = requireSrc('lib/answer.ts');

let checks = 0;
const failures = [];
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

/* ── 1. Запись бланка ──────────────────────────────────────────────
   [ввод, нормальная запись] или [ввод, причина, имелось в виду]. */
const NORMAL = [
  ['0,5', '0.5'],
  ['0.5', '0.5'],
  ['-3', '-3'],
  ['−3', '-3'], // U+2212
  ['‐3', '-3'], // U+2010
  ['‑3', '-3'], // U+2011
  ['–3', '-3'],
  ['—3', '-3'],
  ['﹣3', '-3'],
  ['－3', '-3'],
  ['  12  ', '12'],
  [' 12 ', '12'],
  [' -0,25 ', '-0.25'],
  ['007', '7'],
  ['1,50', '1.5'],
  ['2,000', '2'],
  ['0,0', '0'],
  ['-0', '0'],
  ['−0,00', '0'],
  ['-0,10', '-0.1'],
  ['16,8', '16.8'],
  ['00,25', '0.25'],
  ['1000000', '1000000'],
  ['0,000001', '0.000001'],
  ['1/4', 'fraction', '0.25'],
  ['1∕4', 'fraction', '0.25'], // U+2215
  ['1÷4', 'fraction', '0.25'],
  ['-3/4', 'fraction', '-0.75'],
  ['−3 / 4', 'fraction', '-0.75'],
  ['1/3', 'fraction', null],
  ['2/0', 'fraction', null],
  ['1,5/3', 'fraction', '0.5'],
  ['3 1/2', 'mixed', '3.5'],
  ['-2 3/4', 'mixed', '-2.75'],
  ['1 1/3', 'mixed', null],
  ['50%', 'percent', '50'],
  ['12,5 %', 'percent', '12.5'],
  ['5 см', 'units', '5'],
  ['5см', 'units', '5'],
  ['30°', 'units', '30'],
  ['250 руб.', 'units', '250'],
  ['1e3', 'exponent', '1000'],
  ['2,5E-2', 'exponent', '0.025'],
  ['0x10', 'letters', null],
  ['х=5', 'letters', null],
  ['abc', 'letters', null],
  ['+5', 'plus', '5'],
  ['+0,5', 'plus', '0.5'],
  ['.5', 'dot', '0.5'],
  [',5', 'dot', '0.5'],
  ['-,5', 'dot', '-0.5'],
  ['5.', 'dot', '5'],
  ['5,', 'dot', '5'],
  ['1 000', 'space', '1000'],
  ['1 000', 'space', '1000'],
  ['- 3', 'space', '-3'],
  ['/2', 'other', null],
  ['1,2,3', 'other', null],
  ['--3', 'other', null],
  ['-', 'other', null],
  [',', 'other', null],
  ['', 'empty', null],
  ['   ', 'empty', null],
];

for (const [input, want, meant] of NORMAL) {
  const n = normalizeAnswer(input);
  const shown = JSON.stringify(input);
  if (meant === undefined) {
    check(
      n.ok && n.value === want,
      `запись ${shown}: ждали ${want}, получили ${JSON.stringify(n)}`,
    );
  } else {
    check(
      !n.ok && n.problem === want && n.meant === meant,
      `запись ${shown}: ждали ${want} (${meant}), получили ${JSON.stringify(n)}`,
    );
    if (!n.ok) {
      const hint = formatHint(n.problem, n.meant);
      check(
        typeof hint === 'string' &&
          hint.length > 10 &&
          !hint.includes('undefined') &&
          !hint.includes('null'),
        `подсказка для ${shown}: ${hint}`,
      );
    }
  }
}

/* ── 2. Чтение против верного ответа ───────────────────────────────
   [ввод, режим, верная запись, итог]: 'right' | 'wrong' | 'wrong-fraction'
   | 'fraction-right' | причина формата. */
const READ = [
  ['0,25', 'trenazher', '0.25', 'right'],
  ['0.250', 'trenazher', '0.25', 'right'],
  ['−12', 'trenazher', '-12', 'right'],
  ['-12,0', 'trenazher', '-12', 'right'],
  ['12', 'trenazher', '-12', 'wrong'],
  /* Точное сравнение: никакого допуска. */
  ['0,3333333333', 'trenazher', '0.3333333333', 'right'],
  ['0,333333333', 'trenazher', '0.3333333333', 'wrong'],
  ['1,0000000001', 'trenazher', '1', 'wrong'],
  /* Дробь в тренажёре: верное значение — подсказка, неверное — ошибка. */
  ['1/4', 'trenazher', '0.25', 'fraction-right'],
  ['2/8', 'trenazher', '0.25', 'fraction-right'],
  ['-3∕5', 'trenazher', '-0.6', 'fraction-right'],
  ['1/3', 'trenazher', '0.25', 'wrong-fraction'],
  ['3/8', 'trenazher', '0.25', 'wrong-fraction'],
  /* Неверная запись — подсказка, попытка не тратится, и при верном значении. */
  ['3 1/2', 'trenazher', '3.5', 'mixed'],
  ['5 см', 'trenazher', '5', 'units'],
  ['50%', 'trenazher', '50', 'percent'],
  ['1e3', 'trenazher', '1000', 'exponent'],
  ['0x10', 'trenazher', '16', 'letters'],
  ['/2', 'trenazher', '0.5', 'other'],
  ['+5', 'trenazher', '5', 'plus'],
  ['.5', 'trenazher', '0.5', 'dot'],
  ['5.', 'trenazher', '5', 'dot'],
  ['', 'trenazher', '5', 'empty'],
  /* Бланк: дробь — подсказка, значение не раскрывается. */
  ['1/4', 'blank', '0.25', 'fraction'],
  ['3/8', 'blank', '0.25', 'fraction'],
  ['0,25', 'blank', '0.25', 'right'],
  ['0,26', 'blank', '0.25', 'wrong'],
];

for (const [input, mode, correct, want] of READ) {
  const r = readAnswer(input, mode, (value) => value === correct);
  const got =
    r.kind === 'answer'
      ? r.right
        ? 'right'
        : r.viaFraction
          ? 'wrong-fraction'
          : 'wrong'
      : r.kind === 'fractionRight'
        ? 'fraction-right'
        : r.problem;
  check(
    got === want,
    `чтение ${JSON.stringify(input)} (${mode}, верно ${correct}): ждали ${want}, получили ${got}`,
  );
  if (r.kind === 'fractionRight') {
    const hint = fractionRightHint(r.decimal);
    check(
      hint.startsWith('Значение верное, но в бланк ЕГЭ записывают десятичную дробь: ') &&
        hint.includes(displayAnswer(correct)),
      `подсказка «значение верное» для ${input}: ${hint}`,
    );
  }
}
check(
  fractionRightHint('0.25') ===
    'Значение верное, но в бланк ЕГЭ записывают десятичную дробь: 0,25. Введите ответ так.',
  'текст подсказки «значение верное» — как в задании',
);
check(
  fractionRightHint('-3') ===
    'Значение верное, но в бланк ЕГЭ записывают целое число: −3. Введите ответ так.',
  'дробь с целым значением: «записывают целое число»',
);
check(displayAnswer('-2.25') === '−2,25', 'запись для экрана: −2,25');

/* ── 3. Число из записи (разделы с допуском) ─────────────────────── */
const NUMBER = [
  ['1,5', 1.5],
  ['3/2', 1.5],
  ['−1/3', -1 / 3],
  [' 2 ', 2],
  ['1e3', null],
  ['0x10', null],
  ['/2', null],
  ['3 1/2', null],
  ['5 см', null],
  ['', null],
];
for (const [input, want] of NUMBER) {
  const got = parseNumber(input);
  check(
    want === null ? got === null : got !== null && Math.abs(got - want) < 1e-12,
    `число из ${JSON.stringify(input)}: ждали ${want}, получили ${got}`,
  );
  check(
    parseAnswer(input) === got,
    `lib/answer.ts повторяет lib/otvet для ${JSON.stringify(input)}`,
  );
}
check(sameNumber('0,5', '1/2'), 'разделы с допуском: 0,5 = 1/2');
check(!sameNumber('1e3', '1000'), 'разделы с допуском: «1e3» больше не число');

/* ── Таблица онлайн-варианта ─────────────────────────────────────── */
const { cases } = JSON.parse(
  fs.readFileSync(path.join(APP, 'src/lib/variant/online/normalizeCases.json'), 'utf8'),
);
for (const [input, want] of cases) {
  const n = normalizeAnswer(input);
  const got = n.ok ? n.value : n.problem;
  check(got === want, `таблица варианта ${JSON.stringify(input)}: ждали ${want}, получили ${got}`);
}

/* ── Проверка ответа ДЗ: одна таблица для сайта, заглушки и базы ──── */
const { proveritOtvetDz } = requireSrc('lib/otvet/proverkaDz.ts');
const { proveritMock } = await import('./lib/dz-mock.mjs');
const dzCases = JSON.parse(
  fs.readFileSync(path.join(APP, 'src/lib/otvet/proverkaDzCases.json'), 'utf8'),
).cases;
for (const [input, answer, want] of dzCases) {
  const got = proveritOtvetDz(input, answer).kind;
  check(got === want, `ДЗ ${JSON.stringify(input)} при ответе ${answer}: ждали ${want}, получили ${got}`);
  const mock = proveritMock(input, answer).kind;
  check(mock === want, `заглушка ДЗ ${JSON.stringify(input)}: ждали ${want}, получили ${mock}`);
}

console.log(
  `Модуль ответов: ${checks} проверок (запись ${NORMAL.length}, чтение ${READ.length}, число ${NUMBER.length}, таблица варианта ${cases.length}, таблица ДЗ ${dzCases.length}), не прошло ${failures.length}.`,
);
if (failures.length > 0) {
  for (const f of failures) console.error(`  НЕТ ${f}`);
  process.exit(1);
}
