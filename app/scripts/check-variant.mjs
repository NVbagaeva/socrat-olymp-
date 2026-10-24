#!/usr/bin/env node
/* scripts/check-variant.mjs — генератор «Собрать вариант» (задания 1–13).

   Запуск: pnpm test:variant [номера заданий] [--sets N] [--report]
           pnpm test:variant 13 --sets 50

   Для каждого задания с адаптером (lib/variant/adapters/zNN) собирается
   N партий вариантов — так же, как их собирает экран /variant/:
   случайные настройки (источник, звёзды, подтипы, число вариантов,
   параллельность) и seed. И проверяется:

     1. Детерминизм: та же партия, собранная второй раз, побайтно та же.
     2. Задача целая: условие, ответ, номер задания; у решения нет
        сырого TeX вне формул; на листе ученика нет ответа.
     3. Повторов задачи внутри партии нет (если раздел не сообщил, что
        задачи кончились, — пометка `repeat`).
     4. Параллельные варианты: у задания k во всех вариантах один
        прототип (или пометка `prototype` — прототип кончился).
     5. Фильтры: подтип, источник и звёзды соблюдены, либо у задачи
        пометка, какой фильтр ослаблен.
     6. Код партии: настройки и замены переживают кодирование туда и
        обратно; замена одной задачи не трогает остальные.

   --report — таблица возможностей разделов и запасных вариантов.

   Ненулевой код возврата — проверка не прошла. */

import fs from 'node:fs';
import path from 'node:path';
import { requireSrc, SRC } from './lib/load-ts.mjs';

const args = process.argv.slice(2);
const SETS = args.includes('--sets') ? Number(args[args.indexOf('--sets') + 1]) : 20;
const REPORT = args.includes('--report');
const only = args.filter((a, i) => /^\d+$/.test(a) && args[i - 1] !== '--sets').map(Number);

const { buildVariantSet } = requireSrc('lib/variant/build');
const { encodeCode, decodeCode } = requireSrc('lib/variant/code');
const { rngOf } = requireSrc('lib/vychisleniya/rng');

let failures = 0;
function fail(where, message) {
  failures += 1;
  if (failures <= 60) console.error(`  ✗ ${where}: ${message}`);
}

/* ── Разделы ────────────────────────────────────────────────────── */

const adapters = new Map();
for (let n = 1; n <= 13; n += 1) {
  if (only.length > 0 && !only.includes(n)) continue;
  const dir = `lib/variant/adapters/z${String(n).padStart(2, '0')}`;
  if (!fs.existsSync(path.join(SRC, dir, 'index.ts'))) continue;
  const t0 = Date.now();
  const { section } = requireSrc(`${dir}/index`);
  const dataFile = `lib/variant/data/z${String(n).padStart(2, '0')}`;
  const data = fs.existsSync(path.join(SRC, `${dataFile}.ts`))
    ? requireSrc(dataFile).dannye()
    : null;
  const adapter = section.init(data === undefined ? null : JSON.parse(JSON.stringify(data)));
  if (adapter.info.egeNumber !== n) fail(`№${n}`, `info.egeNumber = ${adapter.info.egeNumber}`);
  adapters.set(n, adapter);
  console.log(`№${n} ${adapter.info.title}: загружен за ${Date.now() - t0} мс`);
}
if (adapters.size === 0) {
  console.error('Нет ни одного адаптера.');
  process.exit(1);
}

const subtypeIds = {};
for (let n = 1; n <= 13; n += 1) {
  subtypeIds[n] = adapters.get(n)?.info.subtypes.map((s) => s.id) ?? [];
}

/* ── Проверки задачи ────────────────────────────────────────────── */

/* Сырой TeX вне формул: формулы набраны KaTeX (class="katex") или
   стоят заглушкой (class="math" data-tex="…"); в остальном тексте
   долларов и команд быть не должно. */
function rawTex(html) {
  const text = html
    .replace(/<span class="katex[\s\S]*?<\/annotation>/g, ' ')
    .replace(/data-tex="[^"]*"/g, '')
    .replace(/<annotation[\s\S]*?<\/annotation>/g, '')
    .replace(/<[^>]+>/g, ' ');
  const m = /\$|\\(?:frac|dfrac|cdot|sqrt|vec|left|right)\b/.exec(text);
  return m === null ? null : text.slice(Math.max(0, m.index - 40), m.index + 40);
}

function checkTask(where, t, n) {
  if (t.egeNumber !== n) fail(where, `egeNumber ${t.egeNumber}`);
  if (typeof t.taskId !== 'string' || t.taskId === '') fail(where, 'нет taskId');
  if (t.prototypeId === 'missing') fail(where, 'задача не подобрана');
  if (typeof t.statement !== 'string' || t.statement.replace(/<[^>]+>/g, '').trim().length < 10)
    fail(where, 'пустое условие');
  if (typeof t.answer !== 'string' || t.answer.trim() === '') fail(where, 'нет ответа');
  for (const [field, html] of [
    ['statement', t.statement],
    ['solutionTeacher', t.solutionTeacher ?? ''],
    ['solutionStudent', t.solutionStudent ?? ''],
  ]) {
    const raw = rawTex(html);
    if (raw !== null) fail(where, `сырой TeX в ${field}: «${raw}»`);
  }
  if (/Ответ:/.test(t.statement)) fail(where, 'в условии строка «Ответ:»');
  if (t.figure !== null && !/^<svg[\s>]/.test(t.figure.svg.trim()) && !/<img /.test(t.figure.svg))
    fail(where, 'рисунок не SVG');
  for (const f of t.fallbacks) {
    if (typeof f.field !== 'string' || typeof f.note !== 'string') fail(where, 'плохая пометка');
  }
}

/* ── Партии ─────────────────────────────────────────────────────── */

const SOURCES = ['mix', 'fipi', 'own'];
const stats = new Map();

function randomConfig(r, n) {
  const subtypes = {};
  const ids = subtypeIds[n];
  if (ids.length > 1 && r.next() < 0.4) {
    const chosen = ids.filter(() => r.next() < 0.5);
    if (chosen.length > 0 && chosen.length < ids.length) subtypes[n] = chosen;
  }
  const stars = [1, 2, 3].filter(() => r.next() < 0.3);
  return {
    tasks: [n],
    subtypes,
    source: SOURCES[r.int(0, 2)],
    stars,
    count: r.int(1, 10),
    parallel: r.next() < 0.6,
  };
}

function strip(set) {
  return JSON.stringify({ ...set, createdAt: '' });
}

for (const [n, adapter] of adapters) {
  const s = { tasks: 0, fallbacks: new Map(), ms: 0 };
  stats.set(n, s);
  for (let k = 0; k < SETS; k += 1) {
    const r = rngOf(`check-variant|${n}|${k}`);
    const config = randomConfig(r, n);
    const seed = `T${String(k).padStart(3, '0')}`;
    const input = { config, seed, zameny: {}, version: '00', code: '' };
    const map = new Map([[n, adapter]]);
    const t0 = Date.now();
    const set = buildVariantSet(input, map);
    s.ms += Date.now() - t0;
    const where = `№${n} партия ${k} (${JSON.stringify(config)})`;

    /* 1. Детерминизм. */
    if (strip(buildVariantSet(input, map)) !== strip(set)) fail(where, 'вторая сборка другая');

    /* 2–5. */
    const column = set.variants.map((v) => v.tasks[0]);
    const seen = new Set();
    column.forEach((t, i) => {
      const w = `${where}, вариант ${i + 1}, ${t.taskId}`;
      checkTask(w, t, n);
      s.tasks += 1;
      for (const f of t.fallbacks) {
        s.fallbacks.set(f.note, (s.fallbacks.get(f.note) ?? 0) + 1);
      }
      const has = (field) => t.fallbacks.some((f) => f.field === field);
      if (seen.has(t.taskId) && !has('repeat')) fail(w, 'повтор задачи без пометки');
      seen.add(t.taskId);
      if (config.parallel && i > 0 && t.prototypeId !== column[0].prototypeId && !has('prototype'))
        fail(w, `прототип ${t.prototypeId} ≠ ${column[0].prototypeId} без пометки`);
      const subs = config.subtypes[n];
      if (subs !== undefined && !subs.includes(t.subtype) && !has('subtypes') && !has('repeat'))
        fail(w, `подтип ${t.subtype} не из ${subs}`);
      const src = config.source;
      if (src !== 'mix' && t.source.kind !== src && !has('source') && !has('repeat'))
        fail(w, `источник ${t.source.kind} ≠ ${src} без пометки`);
      if (
        config.stars.length > 0 &&
        adapter.info.capabilities.difficulty &&
        t.difficulty !== null &&
        !config.stars.includes(t.difficulty) &&
        !has('stars') &&
        !has('repeat')
      )
        fail(w, `звёзды ${t.difficulty} не из ${config.stars}`);
    });

    /* 6. Код и замены. */
    const decoded = decodeCode(
      encodeCode({ seed: 'K7M2', config, zameny: { [`1.${n}`]: 2 }, version: '4F' }, subtypeIds),
      subtypeIds,
    );
    if (decoded === null) {
      fail(where, 'код не читается');
    } else {
      const want = JSON.stringify({ ...config, subtypes: config.subtypes });
      const got = JSON.stringify({ ...decoded.config });
      if (want !== got) fail(where, `код: ${got} ≠ ${want}`);
      if (decoded.zameny[`1.${n}`] !== 2) fail(where, 'код потерял замену');
    }
    if (config.count > 1) {
      const z = buildVariantSet({ ...input, zameny: { [`1.${n}`]: 1 } }, map);
      const before = set.variants.map((v) => v.tasks[0].taskId);
      const after = z.variants.map((v) => v.tasks[0].taskId);
      if (
        before[0] === after[0] &&
        !z.variants[0].tasks[0].fallbacks.some((f) => f.field === 'repeat')
      )
        fail(where, 'замена не поменяла задачу');
      if (before.slice(1).join() !== after.slice(1).join())
        fail(where, 'замена задачи варианта 1 сдвинула другие варианты');
    }
  }
}

/* ── Отчёт ──────────────────────────────────────────────────────── */

for (const [n, s] of stats) {
  const caps = adapters.get(n).info.capabilities;
  console.log(
    `№${n}: ${s.tasks} задач, ${(s.ms / Math.max(1, SETS)).toFixed(0)} мс на партию; ` +
      `сложность ${caps.difficulty ? 'есть' : 'нет'}, ФИПИ ${caps.fipi ? 'есть' : 'нет'}, ` +
      `разбор ученика: ${caps.studentSolution}, рисунки: ${caps.figure}`,
  );
  if (REPORT) {
    for (const [note, count] of [...s.fallbacks].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${count} × ${note}`);
    }
    for (const note of caps.notes) console.log(`    · ${note}`);
  }
}

if (failures > 0) {
  console.error(`\nОшибок: ${failures}`);
  process.exit(1);
}
console.log('\nВсё сходится.');
