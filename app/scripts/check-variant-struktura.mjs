#!/usr/bin/env node
/* scripts/check-variant-struktura.mjs — варианты и структура экзамена.

   Запуск: pnpm test:variant-struktura
           STRUKTURA_EGE=2027-19 pnpm test:variant-struktura

   Задача варианта помнит номер хранения своего раздела: на нём держатся
   сборщики задач, зерно, код варианта, сохранённые работы и база. А из
   каких заданий вариант собирается, под каким номером задача показана
   и сколько баллов в частях — зависит от действующей структуры
   экзамена (src/content/struktura.js) и выводится в
   src/lib/variant/struktura.ts. Проверка смотрит это по структуре,
   под которой запущена, — в CI дважды, по обеим.

   1. Из чего собирается вариант: разделы первой части, у которых есть
      сборщик задач; порядок — по номерам ЕГЭ.
   2. Номер на экране: у задач первой и второй части — номер ЕГЭ, без
      повторов и пропусков; у задачи, раздела которой в этой части
      экзамена нет, — «—».
   3. Баллы: таблица MAX_BALL (по номерам хранения) совпадает с весом
      заданий в структуре; максимумы частей и всей работы — из структуры.
   4. Шкала: таблица из структуры; шкала всей работы — на её максимум.
   5. Настройки и код варианта: «Все» — задания действующей структуры;
      код, собранный по прежней структуре (все тринадцать заданий),
      читается как раньше.
   6. По каждой структуре — её числа: 13 + 7 заданий и 33 балла; 12 + 7
      заданий и 32 балла, «Уравнения» — №6, экономика с кратким ответом
      и «Случайные величины» без номера. */

import { requireSrc } from './lib/load-ts.mjs';

const S = requireSrc('content/struktura.js');
const V = requireSrc('lib/variant/struktura');
const { EGE_NUMBERS } = requireSrc('lib/variant/types');
const { SUBTYPE_IDS, SECTIONS } = requireSrc('lib/variant/sections');
const { MAX_BALL, BALLY, PART2_NUMBERS, MAX_PART1, MAX_PART2, MAX_TOTAL } = requireSrc(
  'content/variantOnline/bally',
);
const { TESTOVYJ, TESTOVYJ_RABOTY, SHKALA_ISTOCHNIK, rastyanut } = requireSrc(
  'content/variantOnline/shkala',
);
const { defaultConfig, sanitizeConfig, readCode } = requireSrc('lib/variant/session');
const { encodeCode } = requireSrc('lib/variant/code');
const { sheetNo } = requireSrc('lib/variant/sheets');
const { fullPartOne, scoreWork, testScore } = requireSrc('lib/variant/online/proverka');
const { CHAST2_TEXT } = requireSrc('content/variantOnline/chast2Text');

const oshibki = [];
let proverok = 0;
function ok(uslovie, chto) {
  proverok += 1;
  if (!uslovie) oshibki.push(chto);
}
function ravno(est, nado, chto) {
  ok(
    JSON.stringify(est) === JSON.stringify(nado),
    `${chto}: ${JSON.stringify(est)} ≠ ${JSON.stringify(nado)}`,
  );
}

const zadaniya = S.zadaniyaEge();
const chast1 = zadaniya.filter((z) => z.chast === 1);
const chast2 = zadaniya.filter((z) => z.chast === 2);

/* ── 1. Из чего собирается вариант ───────────────────────────────── */

ravno(
  V.CHAST1,
  chast1.map((z) => z.hranenie),
  'первая часть — разделы структуры по порядку номеров',
);
ravno(
  V.VARIANT_NUMBERS,
  V.CHAST1.filter((n) => EGE_NUMBERS.includes(n)),
  'вариант собирается из разделов первой части, у которых есть сборщик задач',
);
ravno(
  V.VARIANT_SKORO,
  V.CHAST1.filter((n) => !EGE_NUMBERS.includes(n)),
  'плитка «скоро» — у разделов первой части без сборщика',
);
ok(
  V.VARIANT_NUMBERS.every((n, i, all) => i === 0 || all[i - 1] < n),
  'порядок заданий варианта: по номерам хранения он должен совпадать с порядком номеров ЕГЭ ' +
    '(на нём стоит порядок задач в листе и разбор кода варианта)',
);
ravno(
  SECTIONS.map((s) => s.egeNumber),
  EGE_NUMBERS,
  'у каждого сборщика задач есть описание раздела',
);

/* ── 2. Номер на экране ──────────────────────────────────────────── */

ravno(
  V.CHAST1.map((n) => V.nomerChasti1(n)),
  chast1.map((z) => z.nomer),
  'номера задач первой части — номера ЕГЭ подряд',
);
for (const n of EGE_NUMBERS) {
  const vChasti1 = V.CHAST1.includes(n);
  ravno(
    V.podpis1(n),
    vChasti1 ? String(S.nomerEge(n)) : V.BEZ_NOMERA,
    `подпись номера задачи с кратким ответом, раздел ${n}`,
  );
  ravno(
    sheetNo({ egeNumber: n }, 4, 'ege'),
    vChasti1 ? S.nomerEge(n) : V.BEZ_NOMERA,
    `номер на листе «как в ЕГЭ», раздел ${n}`,
  );
  ravno(sheetNo({ egeNumber: n }, 4, 'seq'), 5, `сквозной номер на листе, раздел ${n}`);
}
{
  const nomera = PART2_NUMBERS.map((n) => V.nomerChasti2(n)).filter((x) => x !== null);
  ok(new Set(nomera).size === nomera.length, `номера задач второй части повторяются: ${nomera}`);
  ravno(
    [...nomera].sort((a, b) => a - b),
    chast2.map((z) => z.nomer).filter((x) => nomera.includes(x)),
    'номера задач второй части — номера ЕГЭ второй части',
  );
  ok(
    PART2_NUMBERS.every((n, i, all) => {
      const a = V.nomerChasti2(all[i - 1] ?? n);
      const b = V.nomerChasti2(n);
      return i === 0 || a === null || b === null || a < b;
    }),
    'порядок задач второй части по номерам хранения не совпадает с порядком номеров ЕГЭ',
  );
  /* Задача с развёрнутым ответом в первой части экзамена не стоит, и наоборот. */
  for (const n of PART2_NUMBERS) ravno(V.nomerChasti1(n), null, `раздел ${n} — не первая часть`);
}

/* ── 3. Баллы ────────────────────────────────────────────────────── */

for (const n of V.VARIANT_NUMBERS) {
  ravno(BALLY[n], S.maxBall(n), `балл задачи первой части, раздел ${n}`);
}
for (const n of PART2_NUMBERS) {
  if (V.nomerChasti2(n) === null) continue;
  ravno(MAX_BALL[n], S.maxBall(n), `балл задачи второй части, раздел ${n}`);
}
ravno(
  [MAX_PART1, MAX_PART2, MAX_TOTAL],
  [S.maxPervichnyy(1), S.maxPervichnyy(2), S.maxPervichnyy()],
  'максимумы частей и всей работы — из структуры',
);
ravno(MAX_PART1, chast1.length, 'первая часть: по баллу за задание');
ravno(
  PART2_NUMBERS.filter((n) => V.nomerChasti2(n) !== null).reduce((s, n) => s + MAX_BALL[n], 0),
  MAX_PART2,
  'сумма баллов задач второй части',
);
{
  const text = CHAST2_TEXT.result.counter(1, 2, 3, null);
  ok(
    text.includes(`/ ${MAX_PART1} `) &&
      text.includes(`/ ${MAX_PART2} `) &&
      text.endsWith(`/ ${MAX_TOTAL}`),
    `строка итога считает от максимумов структуры: «${text}»`,
  );
}

/* ── 4. Шкала ────────────────────────────────────────────────────── */

ravno(TESTOVYJ, S.STRUKTURA.shkala.tablitsa, 'шкала — из структуры экзамена');
ravno(SHKALA_ISTOCHNIK, S.STRUKTURA.shkala.istochnik, 'подпись шкалы — из структуры');
ok(S.STRUKTURA.shkala.predvaritelnaya === true, 'шкала помечена предварительной');
ok(
  /ориентировочно|предварительн/.test(SHKALA_ISTOCHNIK),
  'в подписи шкалы сказано, что она предварительная',
);
ok(TESTOVYJ[0] === 0 && TESTOVYJ[TESTOVYJ.length - 1] === 100, 'шкала: от 0 до 100');
ok(
  TESTOVYJ.every((x, i, all) => i === 0 || all[i - 1] <= x),
  'шкала не убывает',
);
ravno(TESTOVYJ_RABOTY.length, MAX_TOTAL + 1, 'шкала всей работы — на её максимум');
ok(
  TESTOVYJ_RABOTY[0] === 0 && TESTOVYJ_RABOTY[MAX_TOTAL] === 100,
  'шкала всей работы: от 0 до 100',
);
ok(
  TESTOVYJ_RABOTY.every((x, i, all) => i === 0 || all[i - 1] <= x),
  'шкала всей работы не убывает',
);
ravno(testScore(MAX_PART1), TESTOVYJ[MAX_PART1], 'тестовый балл за всю первую часть');

/* ── 5. Настройки и код варианта ─────────────────────────────────── */

ravno(defaultConfig().tasks, V.VARIANT_NUMBERS, '«Все» — задания действующей структуры');
ravno(
  sanitizeConfig({ tasks: [...EGE_NUMBERS] }).tasks,
  V.VARIANT_NUMBERS,
  'сохранённые настройки: остаются только задания действующей структуры',
);
ok(fullPartOne([...V.CHAST1]), 'вся первая часть — полный вариант');
ravno(
  fullPartOne([...V.VARIANT_NUMBERS]),
  V.VARIANT_SKORO.length === 0,
  'вариант из всех доступных заданий полный, только если задачи есть у каждого раздела первой части',
);
{
  /* Код, собранный по прежней структуре: все тринадцать заданий. */
  const config = { ...defaultConfig(), tasks: [...EGE_NUMBERS] };
  const kod = encodeCode({ seed: 'K7M2', config, zameny: {}, version: '4F' }, SUBTYPE_IDS);
  const prochitan = readCode(kod);
  ok(prochitan !== null, 'код прежней структуры не читается');
  ravno(prochitan?.config.tasks, EGE_NUMBERS, 'код прежней структуры: набор заданий тот же');
  /* Код по действующей структуре. */
  const novyy = readCode(
    encodeCode({ seed: 'K7M2', config: defaultConfig(), zameny: {}, version: '4F' }, SUBTYPE_IDS),
  );
  ravno(novyy?.config.tasks, V.VARIANT_NUMBERS, 'код действующей структуры читается');
}
{
  const numbers = [...V.VARIANT_NUMBERS];
  const itog = scoreWork(
    numbers,
    numbers.map(() => true),
  );
  ravno(itog.primary, numbers.length, 'итог: по баллу за задачу первой части');
  ravno(
    itog.test,
    V.VARIANT_SKORO.length === 0 ? TESTOVYJ[numbers.length] : null,
    'тестовый балл — только за полную первую часть',
  );
}

/* ── 6. Числа каждой структуры ───────────────────────────────────── */

if (S.STRUKTURA.id === '2027-20') {
  ravno(V.VARIANT_NUMBERS, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], '20 заданий: вариант');
  ravno(V.VARIANT_SKORO, [], '20 заданий: плиток «скоро» нет');
  ravno(
    EGE_NUMBERS.map((n) => V.podpis1(n)),
    EGE_NUMBERS.map(String),
    '20 заданий: номер на экране равен номеру хранения',
  );
  ravno(
    PART2_NUMBERS.map((n) => V.podpis2(n)),
    PART2_NUMBERS.map(String),
    '20 заданий: номера второй части — 14…20',
  );
  ravno([MAX_PART1, MAX_PART2, MAX_TOTAL], [13, 20, 33], '20 заданий: 13 + 20 = 33 балла');
  ravno(TESTOVYJ_RABOTY, rastyanut(TESTOVYJ, 33), '20 заданий: шкала растянута на 33 балла');
  ravno(testScore(12), 70, '20 заданий: 12 первичных — 70 тестовых');
  ravno(testScore(13), 72, '20 заданий: 13 первичных — 72 тестовых');
}
if (S.STRUKTURA.id === '2027-19') {
  ravno(V.VARIANT_NUMBERS, [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12], '19 заданий: вариант');
  ravno(V.VARIANT_SKORO, [21], '19 заданий: новое задание №12 — «скоро»');
  ravno(
    EGE_NUMBERS.map((n) => V.podpis1(n)),
    ['1', '2', '3', '4', '5', '—', '6', '7', '8', '9', '10', '11', '—'],
    '19 заданий: «Уравнения» — №6, «Случайные величины» и экономика с кратким ответом — без номера',
  );
  ravno(
    PART2_NUMBERS.map((n) => V.podpis2(n)),
    ['13', '14', '15', '16', '17', '18', '19'],
    '19 заданий: вторая часть — 13…19, задача прежнего №17 — №16',
  );
  ravno([MAX_PART1, MAX_PART2, MAX_TOTAL], [12, 20, 32], '19 заданий: 12 + 20 = 32 балла');
  ravno(TESTOVYJ_RABOTY, TESTOVYJ, '19 заданий: шкала на 32 балла — без растяжения');
  ravno(testScore(12), 70, '19 заданий: вся первая часть — 70 тестовых');
}

if (oshibki.length > 0) {
  console.error(`Варианты и структура экзамена: ошибок — ${oshibki.length}:\n`);
  for (const o of oshibki) console.error(`  ✗ ${o}`);
  process.exit(1);
}
console.log(
  `Варианты и структура экзамена (${S.STRUKTURA.id}): ${proverok} проверок прошли. ` +
    `Вариант — из ${V.VARIANT_NUMBERS.length} заданий, баллов — ${MAX_PART1} + ${MAX_PART2} = ${MAX_TOTAL}.`,
);
