#!/usr/bin/env node
/* scripts/check-variant-kody.mjs — коды вариантов, выданные раньше.

   Запуск: pnpm test:variant-kody
           pnpm test:variant-kody --zapisat   (переписать образец — только
                                               когда задачи по старым кодам
                                               меняются сознательно)

   Код варианта (lib/variant/code.ts) учитель печатает на листе, выдаёт
   классу, ученик сохраняет работу под ним (localStorage, база). Поэтому
   код, выданный раньше, должен читаться всегда и собирать те же самые
   задачи — байт в байт. Образец (scripts/fixtures/variant-kody-prezhnie.json)
   записан до того, как в вариант вошло задание №12 «Наибольшее и
   наименьшее» (номер хранения 21): набор кодов всех видов — задания
   1–13 в любом составе (и №6, №13 прежней структуры), подтипы, замены,
   источник, звёзды, число вариантов, параллельность, хвост места для
   решения.

   Проверяется для каждого кода:
     1. Код читается, и тот же код собирается обратно (encode(decode) =
        код) — сохранённые работы находятся по тому же ключу.
     2. Задачи партии — те же: номер, taskId, ответ и отпечаток всей
        задачи (условие, рисунки, решения, подсказки, пометки).

   Ненулевой код возврата — проверка не прошла. */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireSrc, SRC } from './lib/load-ts.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(HERE, 'fixtures', 'variant-kody-prezhnie.json');
const ZAPISAT = process.argv.includes('--zapisat');

const { buildVariantSet } = requireSrc('lib/variant/build');
const { encodeCode, decodeCode, codeWithSpace, baseCode } = requireSrc('lib/variant/code');
const { rngOf } = requireSrc('lib/vychisleniya/rng');

/* Разделы прежних кодов: задания 1–13. */
const PREZHNIE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const adapters = new Map();
for (const n of PREZHNIE) {
  const p = String(n).padStart(2, '0');
  const { section } = requireSrc(`lib/variant/adapters/z${p}/index`);
  const df = `lib/variant/data/z${p}`;
  const data = fs.existsSync(path.join(SRC, `${df}.ts`)) ? requireSrc(df).dannye() : null;
  adapters.set(
    n,
    section.init(data === undefined || data === null ? null : JSON.parse(JSON.stringify(data))),
  );
}
/* Подтипы — как их видит код варианта на сайте. */
const { SUBTYPE_IDS } = requireSrc('lib/variant/sections');

const otpechatok = (task) =>
  crypto.createHash('sha256').update(JSON.stringify(task)).digest('hex').slice(0, 16);

function sobrat(code) {
  const d = decodeCode(code, SUBTYPE_IDS);
  if (d === null) return null;
  const set = buildVariantSet(
    { config: d.config, seed: d.seed, zameny: d.zameny, version: d.version, code: baseCode(code) },
    adapters,
  );
  return {
    d,
    variants: set.variants.map((v) =>
      v.tasks.map((t) => [t.egeNumber, t.taskId, t.answer, otpechatok(t)]),
    ),
  };
}

/* ── Запись образца ─────────────────────────────────────────────── */

function kodyDlyaObrazca() {
  const SOURCES = ['mix', 'fipi', 'own'];
  const kody = [];
  const r = rngOf('variant-kody-prezhnie');
  const seedOf = (i) => {
    const A = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    return Array.from({ length: 4 }, (_, j) => A[(i * 7 + j * 13 + r.int(0, 31)) % 32]).join('');
  };
  /* Полные варианты обеих структур и один на все тринадцать. */
  const vse19 = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12];
  const polnye = [
    { tasks: vse19, count: 1, parallel: true },
    { tasks: vse19, count: 4, parallel: true },
    { tasks: vse19, count: 10, parallel: false },
    { tasks: PREZHNIE, count: 1, parallel: true },
    { tasks: PREZHNIE, count: 3, parallel: false },
  ];
  polnye.forEach((c, i) => {
    kody.push(
      encodeCode(
        {
          seed: seedOf(i),
          config: { ...c, tasks: [...c.tasks], subtypes: {}, source: 'mix', stars: [] },
          zameny: {},
          version: '00',
        },
        SUBTYPE_IDS,
      ),
    );
  });
  /* Случайные составы: подтипы, звёзды, источник, замены. */
  for (let i = 0; i < 30; i += 1) {
    const tasks = PREZHNIE.filter(() => r.next() < 0.45);
    if (tasks.length === 0) tasks.push(PREZHNIE[r.int(0, 12)]);
    const subtypes = {};
    for (const n of tasks) {
      const ids = SUBTYPE_IDS[n];
      if (ids.length > 1 && r.next() < 0.5) {
        const chosen = ids.filter(() => r.next() < 0.5);
        if (chosen.length > 0 && chosen.length < ids.length) subtypes[n] = chosen;
      }
    }
    const count = r.int(1, 6);
    const zameny = {};
    for (let k = 0; k < r.int(0, 3); k += 1) {
      zameny[`${r.int(1, count)}.${tasks[r.int(0, tasks.length - 1)]}`] = r.int(1, 3);
    }
    const config = {
      tasks,
      subtypes,
      source: SOURCES[r.int(0, 2)],
      stars: [1, 2, 3].filter(() => r.next() < 0.3),
      count,
      parallel: r.next() < 0.6,
    };
    let code = encodeCode({ seed: seedOf(10 + i), config, zameny, version: '00' }, SUBTYPE_IDS);
    if (i % 7 === 3) code = codeWithSpace(code, 'G3');
    kody.push(code);
  }
  return kody;
}

if (ZAPISAT) {
  const zapisi = kodyDlyaObrazca().map((code) => {
    const s = sobrat(code);
    if (s === null) throw new Error(`код ${code} не читается`);
    return { code, variants: s.variants };
  });
  fs.mkdirSync(path.dirname(FIXTURE), { recursive: true });
  /* Одна задача — одна строка: образец читается и сравнивается в diff. */
  const kodyJson = zapisi
    .map(
      (z) =>
        `  {"code": ${JSON.stringify(z.code)}, "variants": [\n` +
        z.variants
          .map((v) => `   [\n${v.map((t) => `    ${JSON.stringify(t)}`).join(',\n')}\n   ]`)
          .join(',\n') +
        '\n  ]}',
    )
    .join(',\n');
  const note =
    'Коды вариантов до задания №12 «Наибольшее и наименьшее» и их задачи: ' +
    '[номер хранения, taskId, ответ, отпечаток задачи]. Пишет scripts/check-variant-kody.mjs --zapisat.';
  fs.writeFileSync(
    FIXTURE,
    `{\n "note": ${JSON.stringify(note)},\n "kody": [\n${kodyJson}\n ]\n}\n`,
  );
  console.log(`Образец записан: ${zapisi.length} кодов → ${path.relative(process.cwd(), FIXTURE)}`);
  process.exit(0);
}

/* ── Проверка ───────────────────────────────────────────────────── */

const { kody } = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
let oshibok = 0;
let zadach = 0;
const fail = (code, msg) => {
  oshibok += 1;
  if (oshibok <= 40) console.error(`  ✗ ${code}: ${msg}`);
};

for (const { code, variants } of kody) {
  const s = sobrat(code);
  if (s === null) {
    fail(code, 'код не читается');
    continue;
  }
  const obratno = encodeCode(s.d, SUBTYPE_IDS);
  const nado = baseCode(code);
  if (obratno !== nado) fail(code, `код собирается обратно как ${obratno}`);
  if (s.variants.length !== variants.length) {
    fail(code, `вариантов ${s.variants.length}, было ${variants.length}`);
    continue;
  }
  variants.forEach((tasks, v) => {
    const est = s.variants[v];
    if (est.length !== tasks.length) {
      fail(code, `вариант ${v + 1}: задач ${est.length}, было ${tasks.length}`);
      return;
    }
    tasks.forEach((t, i) => {
      zadach += 1;
      const e = est[i];
      if (JSON.stringify(e) !== JSON.stringify(t))
        fail(
          code,
          `вариант ${v + 1}, задача ${i + 1}: ${JSON.stringify(e)} ≠ ${JSON.stringify(t)}`,
        );
    });
  });
}

if (oshibok > 0) {
  console.error(`\nКоды вариантов: ${oshibok} расхождений.`);
  process.exit(1);
}
console.log(`Коды вариантов: ${kody.length} прежних кодов, ${zadach} задач — те же, байт в байт.`);
