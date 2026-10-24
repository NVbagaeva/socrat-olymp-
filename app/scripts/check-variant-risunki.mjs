#!/usr/bin/env node
/* scripts/check-variant-risunki.mjs — рисунки листов вариантов.

   Запуск: pnpm test:variant-risunki

   Обходит рисунки ученика и учителя «Вариантов повышенной сложности»
   (все готовые варианты, все версии) и «Собрать вариант» (по каждому
   заданию — несколько партий на разных seed) и проверяет:

     1. Рисунок нарисован движком раздела: у корневого <svg> есть
        data-engine. Рисунок без отметки — нарисован в обход движков.
     2. У графиков функций (движки graph и proizvodnaya) нет
        stroke-dasharray: графики — сплошные линии.
     3. У каждого графика функции есть подпись (y = f(x), y = f′(x) …).
     4. Клеточные рисунки (graph, proizvodnaya, vektory) печатаются
        крупно: клетка не меньше 6 мм, подписи на бумаге не меньше 10 pt
        (lib/variant/pechat).

   Пересечения подписей меряются в браузере по настоящим
   прямоугольникам текста — test:povyshennye-site.

   Ненулевой код возврата — проверка не прошла. */

import fs from 'node:fs';
import path from 'node:path';
import { requireSrc, SRC } from './lib/load-ts.mjs';

const { buildVariantSet } = requireSrc('lib/variant/build');
const { rngOf } = requireSrc('lib/vychisleniya/rng');
const { povSetIz } = requireSrc('lib/povyshennye/set');
const { GOTOVY } = requireSrc('lib/povyshennye/dannye/index');
const { KLETKA_EDINIC, MIN_KLETKA_MM, MIN_PT } = requireSrc('lib/variant/pechat');
const { sheetFigure } = requireSrc('lib/variant/sheets');

const PARTIY = Number(process.argv.find((a) => /^--partiy=/.test(a))?.slice(9) ?? 4);

let failures = 0;
let figures = 0;
const poDvizhkam = new Map();
function fail(where, message) {
  failures += 1;
  if (failures <= 60) console.error(`  ✗ ${where}: ${message}`);
}

const KLETOCHNYE = new Set(['graph', 'proizvodnaya', 'vektory']);
const OTCHET = process.argv.includes('--kegli');
const kegli = new Map();
const MM_V_PT = 25.4 / 72;

function proverit(where, fig) {
  if (fig === null || fig === undefined) return;
  figures += 1;
  /* Ширина — та, с которой рисунок печатается на листе (sheetFigure). */
  const f = { svg: fig.svg, width: sheetFigure(fig).width };
  const svg = f.svg;
  const root = /^\s*<svg\b[^>]*>/.exec(svg);
  if (root === null) {
    fail(where, 'рисунок не <svg>');
    return;
  }
  const engine = /\sdata-engine="([^"]+)"/.exec(root[0])?.[1];
  if (engine === undefined) {
    fail(where, 'у рисунка нет data-engine — нарисован не движком раздела');
    return;
  }
  poDvizhkam.set(engine, (poDvizhkam.get(engine) ?? 0) + 1);

  if (engine === 'graph' || engine === 'proizvodnaya') {
    const klass = engine === 'graph' ? 'graph-curve' : 'pr-curve';
    const krivye = [...svg.matchAll(new RegExp(`<path class="${klass}[ "][^>]*>`, 'g'))].map(
      (m) => m[0],
    );
    if (krivye.length === 0) fail(where, 'на графике нет ни одной кривой');
    if (krivye.some((p) => /stroke-dasharray/.test(p))) fail(where, 'график функции штрихом');
    const podpisi = (svg.match(new RegExp(`class="${klass}-label"`, 'g')) ?? []).length;
    if (podpisi < krivye.length) fail(where, `графиков ${krivye.length}, подписей ${podpisi}`);
  }

  if (OTCHET) {
    /* Справка --kegli: наименьший кегль подписей каждого движка на бумаге, pt. */
    const vb = /viewBox="[-0-9.]+ [-0-9.]+ ([0-9.]+) /.exec(root[0]);
    if (vb !== null && f.width !== undefined) {
      const mmNaEd = f.width / Number(vb[1]);
      for (const m of svg.matchAll(/font-size[=:]"?\s*([0-9.]+)/g)) {
        const pt = (Number(m[1]) * mmNaEd) / MM_V_PT;
        if (!(kegli.get(engine) <= pt)) kegli.set(engine, Math.round(pt * 10) / 10);
      }
    } else if (!kegli.has(`${engine} (без ширины)`)) kegli.set(`${engine} (без ширины)`, 0);
  }

  const vb = /viewBox="[-0-9.]+ [-0-9.]+ ([0-9.]+) /.exec(root[0]);
  const mmNaEd = vb === null || f.width === undefined ? null : f.width / Number(vb[1]);
  if (KLETOCHNYE.has(engine)) {
    if (mmNaEd === null) {
      fail(where, 'нет ширины рисунка на листе');
      return;
    }
    const kletka = mmNaEd * KLETKA_EDINIC;
    if (kletka < MIN_KLETKA_MM - 1e-6)
      fail(where, `клетка ${kletka.toFixed(2)} мм < ${MIN_KLETKA_MM}`);
  }
  /* Кегль каждой подписи — атрибут font-size у <text> (у tspan штриха
     и индекса — доли кегля, они не подписи). Кегли из CSS меряет
     браузерная проверка. */
  if (mmNaEd !== null) {
    for (const m of svg.matchAll(/<text\b[^>]*\sfont-size="([0-9.]+)"[^>]*>([\s\S]*?)<\/text>/g)) {
      const pt = (Number(m[1]) * mmNaEd) / MM_V_PT;
      if (pt < MIN_PT - 0.05) {
        const text = m[2].replace(/<[^>]+>/g, '');
        fail(where, `подпись «${text}» ${pt.toFixed(1)} pt < ${MIN_PT}`);
        break;
      }
    }
  }
}

function obkhod(label, set) {
  set.variants.forEach((v, vi) => {
    for (const t of v.tasks) {
      const where = `${label}, версия ${vi + 1}, №${t.egeNumber}`;
      proverit(`${where} (ученик)`, t.figure);
      proverit(`${where} (учитель)`, t.figureTeacher);
    }
  });
}

/* ── Варианты повышенной сложности ──────────────────────────────── */

for (const k of GOTOVY) {
  const { VARIANT } = requireSrc(`lib/povyshennye/dannye/v${String(k).padStart(2, '0')}`);
  obkhod(`вариант ${k}`, povSetIz(k, VARIANT.versii));
}
console.log(`  «Варианты повышенной сложности»: варианты ${GOTOVY.join(', ')}`);

/* ── «Собрать вариант» ──────────────────────────────────────────── */

for (let n = 1; n <= 13; n += 1) {
  const dir = `lib/variant/adapters/z${String(n).padStart(2, '0')}`;
  if (!fs.existsSync(path.join(SRC, dir, 'index.ts'))) continue;
  const { section } = requireSrc(`${dir}/index`);
  const dataFile = `lib/variant/data/z${String(n).padStart(2, '0')}`;
  const data = fs.existsSync(path.join(SRC, `${dataFile}.ts`))
    ? requireSrc(dataFile).dannye()
    : null;
  const adapter = section.init(data === undefined ? null : JSON.parse(JSON.stringify(data)));
  if (adapter.info.figure === 'none') continue;
  const map = new Map([[n, adapter]]);
  for (let k = 0; k < PARTIY; k += 1) {
    const r = rngOf(`variant-risunki|${n}|${k}`);
    const config = {
      tasks: [n],
      subtypes: {},
      source: ['mix', 'fipi', 'own'][r.int(0, 2)],
      stars: [],
      count: 10,
      parallel: false,
    };
    const set = buildVariantSet(
      { config, seed: `R${k}`, zameny: {}, version: '00', code: '' },
      map,
    );
    obkhod(`«Собрать вариант» №${n}, партия ${k}`, set);
  }
}
console.log('  «Собрать вариант»: все задания с рисунками');

console.log(
  `  рисунков ${figures}; по движкам: ${[...poDvizhkam].map(([e, c]) => `${e} ${c}`).join(', ')}`,
);
if (OTCHET) console.log('  наименьший кегль, pt:', JSON.stringify(Object.fromEntries(kegli)));
if (failures > 0) {
  console.error(`\nРисунки листов вариантов: ошибок ${failures}`);
  process.exit(1);
}
console.log('\nРисунки листов вариантов: все нарисованы движками разделов, правила соблюдены');
