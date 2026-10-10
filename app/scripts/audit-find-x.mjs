#!/usr/bin/env node
/* scripts/audit-find-x.mjs — отчёт: задачи «найдите x, при котором
   f(x) = …» — можно ли прочитать ответ с рисунка.

   Запуск: node scripts/audit-find-x.mjs [N]   (N — наборов на seed, по умолчанию 500)

   Ничего не меняет и в CI не входит: это отчёт для автора. Для каждого
   набора с правилом argument-for (линейная, парабола, гипербола, корень;
   опорные и прототипы) собирается N наборов на разных seed, и для каждой
   задачи искомая точка (x ответа; y из условия) относится к одному из
   классов:
     видна в узле     — внутри окна, обе координаты целые: ответ с рисунка;
     видна, x целый   — внутри окна, x целый, y нет: x читается по линии сетки;
     видна, x нецелый — внутри окна, x между линиями сетки: правило соблюдено;
     у рамки < 1      — за рамкой, но ближе одной клетки (hidden.js, margin 1);
     за рамкой        — не ближе клетки: правило соблюдено. */

import { requireSrc } from './lib/load-ts.mjs';
requireSrc('lib/trainer.ts');
const G0 = requireSrc('lib/graph/generate.js');
const G = G0.default ?? G0;
const H0 = requireSrc('lib/graph/hidden.js');
const H = H0.default ?? H0;
const N = Number(process.argv[2] || 500);
const val = (v) => (v && typeof v === 'object' ? v.p / v.q : v);
const sets = G.loadSets();
const all = [
  ...sets.prep.map((s) => ({ ...s, kind: 'опорные' })),
  ...sets.prototypes.map((s) => ({ ...s, kind: 'прототип' })),
];
const argSets = all.filter((s) => (s.tasks || []).some((t) => t.answerRule === 'argument-for'));
const rows = [];
function soughtPoint(t) {
  const q = t.meta.query;
  if (!q) return null;
  /* Искомая точка: x — ответ (у параболы это выбранный корень), y — из условия. */
  return { x: val(q.answer), y: val(q.y0) };
}
for (const set of argSets) {
  const c = {
    set: set.id,
    kind: set.kind,
    family: set.family || 'line',
    tasks: 0,
    node: 0,
    xint: 0,
    nonnode: 0,
    near: 0,
    hidden: 0,
    examples: [],
  };
  for (let i = 0; i < N; i++) {
    let tasks;
    try {
      tasks = G.generateSet(set.id, `aud${i}`);
    } catch {
      continue;
    }
    for (const t of tasks) {
      if (
        t.answerRule !== 'argument-for' &&
        !(set.tasks.find((x) => x.id === t.id)?.answerRule === 'argument-for')
      )
        continue;
      const P = soughtPoint(t);
      if (!P) continue;
      const w = t.meta.window;
      c.tasks++;
      const out = H.outsideBy(P, w);
      const isNode = Number.isInteger(P.x) && Number.isInteger(P.y);
      if (out <= 0) {
        if (isNode) {
          c.node++;
          if (c.examples.length < 2) c.examples.push(`${t.id}: (${P.x}; ${P.y}) в окне ±${w.xmax}`);
        } else if (Number.isInteger(P.x)) {
          c.xint++;
          if (c.examples.length < 3) c.examples.push(`${t.id}: x=${P.x}, y=${P.y}`);
        } else c.nonnode++;
      } else if (out < 1) c.near++;
      else c.hidden++;
    }
  }
  rows.push(c);
}
const pct = (a, b) => (b ? ((100 * a) / b).toFixed(1) : '0.0');
console.log(
  'набор\tтип\tсемейство\tзадач\tвидна в узле\tвидна, x целый\tвидна, x нецелый\tу рамки<1\tза рамкой',
);
for (const r of rows)
  console.log(
    [
      r.set,
      r.kind,
      r.family,
      r.tasks,
      `${r.node} (${pct(r.node, r.tasks)}%)`,
      `${r.xint} (${pct(r.xint, r.tasks)}%)`,
      `${r.nonnode}`,
      r.near,
      r.hidden,
      r.examples.join('; '),
    ].join('\t'),
  );
const fam = {};
for (const r of rows) {
  const f = (fam[r.family] ??= { tasks: 0, node: 0 });
  f.tasks += r.tasks;
  f.node += r.node;
  f.xint = (f.xint || 0) + r.xint;
  f.near = (f.near || 0) + r.near;
}
console.log(JSON.stringify(fam));
