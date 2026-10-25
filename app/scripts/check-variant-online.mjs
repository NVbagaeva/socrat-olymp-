#!/usr/bin/env node
/* scripts/check-variant-online.mjs — онлайн-режим «Собрать вариант».

   Запуск: pnpm test:variant-online [--sets N]

   Проверяется без браузера, тем же кодом сайта (requireSrc):

     1. Нормализация ответа ЕГЭ — таблица случаев: запятая и точка,
        лишние нули, «−0», неверная запись (дробь, буквы, пробелы).
     2. Баллы и шкала: первичный балл по конфигу, тестовый — только при
        всех заданиях 1–13, шкала не убывает и кончается на 100.
     3. Детерминизм серии: тот же код → те же варианты, задача в задачу.
     4. Нет повторов в серии из 10 вариантов (N случайных серий).
     5. Код результата раскодируется без потерь (случайные ответы,
        время, режимы, таймеры) и не принимает испорченный код.
     6. Статистика по архиву: решаемость, среднее время, слабые номера.
     7. «Работа над ошибками»: аналог того же прототипа, не из партии.

   Восстановление прогресса после перезагрузки проверяет браузерный
   тест scripts/check-variant-online-site.mjs (после pnpm build).

   Ненулевой код возврата — проверка не прошла. */

import fs from 'node:fs';
import path from 'node:path';
import { requireSrc, SRC } from './lib/load-ts.mjs';

const args = process.argv.slice(2);
const SETS = args.includes('--sets') ? Number(args[args.indexOf('--sets') + 1]) : 9;

let failures = 0;
let checks = 0;
function ok(cond, where, message) {
  checks += 1;
  if (!cond) {
    failures += 1;
    if (failures <= 60) console.error(`  ✗ ${where}: ${message}`);
  }
}

/* Таблица KaTeX шумит предупреждениями о кириллице в формулах — не наше. */
const warn = console.warn;
console.warn = (...a) => (String(a[0]).includes('LaTeX-incompatible') ? undefined : warn(...a));

const { normalizeAnswer, sameAnswer, displayAnswer } = requireSrc('lib/variant/online/normalize');
const { scoreWork, testScore, verdictOf, localProverka } = requireSrc(
  'lib/variant/online/proverka',
);
const { TESTOVYJ } = requireSrc('content/variantOnline/shkala');
const { encodeResult, decodeResult } = requireSrc('lib/variant/online/resultCode');
const { computeStats } = requireSrc('lib/variant/online/stats');
const { parseReshat, reshatHref, parseSeriya, seriyaHref } = requireSrc('lib/variant/online/link');
const { seriesRepeats, analogOf } = requireSrc('lib/variant/online/work');
const { buildVariantSet } = requireSrc('lib/variant/build');
const { encodeCode, decodeCode } = requireSrc('lib/variant/code');
const { rngOf } = requireSrc('lib/vychisleniya/rng');

/* ── 1. Нормализация ─────────────────────────────────────────────── */

console.log('1. Нормализация ответа');
const CASES = [
  // ввод, нормальная запись или причина
  ['5', '5'],
  ['-3', '-3'],
  ['−3', '-3'],
  ['–3', '-3'],
  ['—3', '-3'],
  ['0,5', '0.5'],
  ['0.5', '0.5'],
  ['1,50', '1.5'],
  ['1.500', '1.5'],
  ['2,0', '2'],
  ['2.', 'other'],
  ['007', '7'],
  ['00,25', '0.25'],
  ['0', '0'],
  ['-0', '0'],
  ['−0,00', '0'],
  ['-0,10', '-0.1'],
  ['  12  ', '12'],
  [' 12 ', '12'],
  ['1000000', '1000000'],
  ['-2,25', '-2.25'],
  ['', 'empty'],
  ['   ', 'empty'],
  ['1/2', 'fraction'],
  ['-3/4', 'fraction'],
  ['1 / 2', 'fraction'],
  ['abc', 'letters'],
  ['5 см', 'letters'],
  ['1e3', 'letters'],
  ['х=5', 'letters'],
  ['1 000', 'space'],
  ['1 000', 'space'],
  [',5', 'other'],
  ['.5', 'other'],
  ['+5', 'other'],
  ['1,2,3', 'other'],
  ['--3', 'other'],
  ['1,5.2', 'other'],
  ['-', 'other'],
  [',', 'other'],
];
for (const [input, want] of CASES) {
  const n = normalizeAnswer(input);
  const got = n.ok ? n.value : n.problem;
  ok(got === want, `normalize(${JSON.stringify(input)})`, `ждали ${want}, получили ${got}`);
}
ok(sameAnswer('0,50', '0.5'), 'sameAnswer', '0,50 = 0.5');
ok(sameAnswer('−0', '0'), 'sameAnswer', '−0 = 0');
ok(sameAnswer('-2,250', '−2,25'), 'sameAnswer', '-2,250 = −2,25');
ok(!sameAnswer('1/2', '0,5'), 'sameAnswer', '1/2 ≠ 0,5 (неверная запись)');
ok(!sameAnswer('2', '−2'), 'sameAnswer', '2 ≠ −2');
ok(displayAnswer('-2.25') === '−2,25', 'displayAnswer', displayAnswer('-2.25'));
ok(verdictOf('1/2', '0,5').kind === 'format', 'verdictOf', 'дробь — подсказка о формате');
ok(verdictOf('0,5', '0,5').kind === 'right', 'verdictOf', 'верно');
ok(verdictOf('0,6', '0,5').kind === 'wrong', 'verdictOf', 'неверно');

/* ── 2. Баллы и шкала ───────────────────────────────────────────── */

console.log('2. Баллы и шкала');
const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
ok(
  TESTOVYJ.length === 33 && TESTOVYJ[0] === 0 && TESTOVYJ[32] === 100,
  'шкала',
  'от 0 до 32 первичных, 0…100',
);
ok(
  TESTOVYJ.every((v, i) => i === 0 || v >= TESTOVYJ[i - 1]),
  'шкала',
  'не убывает',
);
ok(
  testScore(12) === 70 && testScore(13) === 72 && testScore(6) === 34,
  'шкала',
  'строки шкалы 2026',
);
const full = scoreWork(
  ALL,
  ALL.map((n) => n % 2 === 0),
);
ok(full.primary === 6 && full.max === 13 && full.test === 34, 'scoreWork', JSON.stringify(full));
const part = scoreWork([1, 2, 3], [true, false, true]);
ok(
  part.test === null && part.primary === 2 && part.percent === 67,
  'scoreWork неполный',
  JSON.stringify(part),
);

/* ── Разделы ────────────────────────────────────────────────────── */

const adapters = new Map();
for (let n = 1; n <= 13; n += 1) {
  const p = String(n).padStart(2, '0');
  const { section } = requireSrc(`lib/variant/adapters/z${p}/index`);
  const df = `lib/variant/data/z${p}`;
  const data = fs.existsSync(path.join(SRC, `${df}.ts`)) ? requireSrc(df).dannye() : null;
  adapters.set(
    n,
    section.init(data === undefined || data === null ? null : JSON.parse(JSON.stringify(data))),
  );
}
const subtypeIds = {};
for (let n = 1; n <= 13; n += 1) subtypeIds[n] = adapters.get(n).info.subtypes.map((s) => s.id);

function series(seed, source = 'mix', count = 10) {
  const config = { tasks: ALL, subtypes: {}, source, stars: [], count, parallel: false };
  const code = encodeCode({ seed, config, zameny: {}, version: '00' }, subtypeIds);
  return buildVariantSet({ config, seed, zameny: {}, version: '00', code }, adapters);
}
function fingerprint(set) {
  return JSON.stringify(
    set.variants.map((v) =>
      v.tasks.map((t) => [t.taskId, t.statement, t.answer, t.figure?.svg ?? '']),
    ),
  );
}

/* ── 3–4. Серия: детерминизм и нет повторов ─────────────────────── */

console.log(`3–4. Серии из 10 вариантов: ${SETS} шт.`);
const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const seedRng = rngOf('check-variant-online');
for (let k = 0; k < SETS; k += 1) {
  const seed = Array.from({ length: 4 }, () => ALPHA[seedRng.int(0, 31)]).join('');
  const source = ['mix', 'fipi', 'own'][k % 3];
  const a = series(seed, source);
  const b = series(seed, source);
  ok(fingerprint(a) === fingerprint(b), `серия ${seed} ${source}`, 'тот же код дал другие задачи');
  ok(a.variants.length === 10, `серия ${seed}`, `вариантов ${a.variants.length}`);
  const ids = a.variants.flatMap((v) => v.tasks.map((t) => `${t.egeNumber}:${t.taskId}`));
  ok(new Set(ids).size === ids.length, `серия ${seed} ${source}`, 'задача повторилась');
  ok(
    seriesRepeats(a).length === 0,
    `серия ${seed} ${source}`,
    `пометка repeat: ${seriesRepeats(a).join(',')}`,
  );
  for (const v of a.variants) {
    ok(
      v.tasks.map((t) => t.egeNumber).join() === ALL.join(),
      `серия ${seed} В${v.index}`,
      'не все задания 1–13',
    );
    for (const t of v.tasks) {
      ok(
        normalizeAnswer(t.answer).ok,
        `серия ${seed} В${v.index} №${t.egeNumber}`,
        `ответ не в формате ЕГЭ: ${t.answer}`,
      );
      for (const h of t.hints ?? []) {
        ok(
          h.correct >= 0 && h.correct < h.options.length,
          `подсказка №${t.egeNumber}`,
          'нет верного варианта',
        );
      }
    }
  }
  /* Код серии читается обратно в те же настройки. */
  const d = decodeCode(a.code, subtypeIds);
  ok(
    d !== null && d.config.count === 10 && d.config.parallel === false && d.seed === seed,
    `код серии ${a.code}`,
    'не читается',
  );
}
/* Проверка ловит повтор: серия, где задача взята дважды. */
const dup = series('AAAA');
dup.variants[1].tasks[0] = dup.variants[0].tasks[0];
ok(seriesRepeats(dup).includes(1), 'seriesRepeats', 'повтор не найден');

/* ── 5. Код результата ──────────────────────────────────────────── */

console.log('5. Код результата');
const set = series('K7M2');
const rr = rngOf('result-code');
const pool = ['', '5', '-3', '0.25', '1000000', '-0.125', '12.5', '0', '99999999999'];
for (let k = 0; k < 300; k += 1) {
  const timerKind = ['none', 'up', 'down'][k % 3];
  const data = {
    code: set.code,
    variant: rr.int(1, 10),
    mode: k % 2 === 0 ? 'trening' : 'kontrol',
    timer: timerKind === 'down' ? { kind: 'down', minutes: rr.int(1, 300) } : { kind: timerKind },
    date: `2026-${String(rr.int(1, 12)).padStart(2, '0')}-${String(rr.int(1, 28)).padStart(2, '0')}`,
    tasks: ALL.map(() => ({
      answer: rr.pick(pool),
      seconds: rr.int(0, 5000),
      hinted: rr.next() < 0.3,
      fixed: rr.next() < 0.2,
    })),
    seconds: rr.int(0, 20000),
  };
  const code = encodeResult(data);
  const back = decodeResult(code);
  ok(
    JSON.stringify(back) === JSON.stringify(data),
    `результат #${k}`,
    `\n    было  ${JSON.stringify(data)}\n    стало ${JSON.stringify(back)}`,
  );
  ok(
    decodeResult(code.toLowerCase()) !== null,
    `результат #${k}`,
    'код в нижнем регистре не читается',
  );
  if (k < 40) {
    /* Испорченный знак — контрольная сумма не сходится. */
    const at = code.length - 1 - (k % 10);
    const ch = code[at] === 'A' ? 'B' : 'A';
    const broken = code.slice(0, at) + ch + code.slice(at + 1);
    ok(decodeResult(broken) === null, `результат #${k}`, 'испорченный код принят');
  }
}
const sample = encodeResult({
  code: set.code,
  variant: 3,
  mode: 'kontrol',
  timer: { kind: 'down', minutes: 90 },
  date: '2026-10-24',
  seconds: 5400,
  tasks: ALL.map((n) => ({ answer: String(n * 7), seconds: 300, hinted: false, fixed: false })),
});
console.log(`   пример: ${sample.length} знаков`);
ok(
  sample.length <= 140,
  'длина кода',
  `${sample.length} знаков — слишком длинно для QR и переписывания`,
);
ok(decodeResult('мусор') === null && decodeResult('') === null, 'decodeResult', 'мусор принят');

/* Проверка учителя по коду: ответы ученика против ключа варианта. */
const v3 = set.variants[2].tasks;
const answers = v3.map((t, i) => (i % 3 === 0 ? '12345' : normalizeAnswer(t.answer).value));
const checked = await localProverka(v3).finish(answers);
ok(
  checked.right.every((r, i) => r === (i % 3 !== 0)),
  'localProverka.finish',
  JSON.stringify(checked.right),
);

/* ── 6. Статистика ──────────────────────────────────────────────── */

console.log('6. Статистика');
const works = [1, 2, 3].map((v) => ({
  id: `x|${v}`,
  code: 'S',
  variant: v,
  mode: 'kontrol',
  title: 't',
  finishedAt: v * 1000,
  resultCode: '',
  primary: v,
  max: 13,
  test: testScore(v),
  seconds: 100,
  tasks: ALL.map((n) => ({ egeNumber: n, right: n <= v * 3, empty: false, seconds: n * 10 + v })),
}));
works.push({ ...works[0], id: 'other', code: 'T', finishedAt: 5000 });
const st = computeStats(works, 'S');
ok(
  st.works === 3 && st.trend.map((p) => p.label).join() === 'В1,В2,В3',
  'тренд',
  JSON.stringify(st.trend),
);
ok(st.trend[2].value === testScore(3), 'тренд', 'тестовый балл');
const n1 = st.numbers[0];
const n13 = st.numbers[12];
ok(
  n1.rate === 1 && n13.rate === 0 && st.numbers[3].rate === 2 / 3,
  'решаемость',
  JSON.stringify(st.numbers.slice(0, 4)),
);
ok(n1.avgSeconds === 12, 'среднее время', String(n1.avgSeconds));
ok(
  st.weak[0].egeNumber === 10 && st.weak.every((w) => w.rate < 0.6),
  'слабые номера',
  JSON.stringify(st.weak.map((w) => w.egeNumber)),
);
ok(computeStats(works).works === 4, 'за всё время', 'не все работы');

/* ── 7. Работа над ошибками ─────────────────────────────────────── */

console.log('7. Аналоги для работы над ошибками');
const used = new Set(set.variants.flatMap((v) => v.tasks.map((t) => t.taskId)));
let analogs = 0;
for (const t of set.variants[0].tasks) {
  const a = analogOf(adapters.get(t.egeNumber), t, used, 'check');
  const b = analogOf(adapters.get(t.egeNumber), t, used, 'check');
  if (a === null) continue;
  analogs += 1;
  ok(
    a.prototypeId === t.prototypeId,
    `аналог №${t.egeNumber}`,
    `прототип ${a.prototypeId} ≠ ${t.prototypeId}`,
  );
  ok(!used.has(a.taskId), `аналог №${t.egeNumber}`, 'задача из партии');
  ok(b !== null && a.taskId === b.taskId, `аналог №${t.egeNumber}`, 'не детерминирован');
}
console.log(`   аналогов нашлось: ${analogs} из 13`);
ok(analogs >= 10, 'аналоги', `только ${analogs} из 13`);

/* ── Ссылки ─────────────────────────────────────────────────────── */

const link = {
  code: set.code,
  variant: 4,
  mode: 'kontrol',
  timer: { kind: 'down', minutes: 90 },
  kind: 'custom',
  title: 'Пробник 1',
};
const parsed = parseReshat(new URL(`https://x${reshatHref(link)}`).searchParams);
ok(JSON.stringify(parsed) === JSON.stringify(link), 'ссылка решения', JSON.stringify(parsed));
const sp = parseSeriya(new URL(`https://x${seriyaHref(set.code, link)}`).searchParams);
ok(
  sp !== null && sp.code === set.code && sp.settings.mode === 'kontrol',
  'ссылка серии',
  JSON.stringify(sp),
);

console.log(`\nПроверок: ${checks}, ошибок: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
