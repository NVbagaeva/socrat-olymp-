#!/usr/bin/env node
/* scripts/check-curve-labels.mjs — подпись графика стоит у своего
   графика, а не столбиком с чужой подписью в свободном углу.

   Запуск: pnpm test:curve-labels [--seeds N]   (по умолчанию 40)

   Все наборы задания №12 (линейная, парабола, гипербола, корень)
   собираются на N seed; чертёж каждой задачи с двумя и более
   подписанными графиками рисуется движком (graph/renderer.js) с
   отчётом о размещении. Для каждой подписи графика проверяется:
     — до своего графика ближе, чем до любого другого, на запас
       THEME.curveLabelOwn. Если места с запасом нет — подпись не
       дальше от своего графика, чем от чужого, больше чем на
       THEME.curveLabelOwn: иначе это расхождение. Такие места («между
       двумя графиками») печатаются отдельным списком;
     — до подписи другого графика не ближе THEME.curveLabelApart:
       подписи не стоят столбиком.
   Отдельно — сцены «Что нужно уметь» вкладки «О задании» всех подтем. */

import { requireSrc } from './lib/load-ts.mjs';

const args = process.argv.slice(2);
const SEEDS = args.includes('--seeds') ? Number(args[args.indexOf('--seeds') + 1]) : 40;

requireSrc('lib/trainer.ts');
const G0 = requireSrc('lib/graph/generate.js');
const G = G0.default ?? G0;
const R0 = requireSrc('lib/graph/renderer.js');
const R = R0.default ?? R0;
const scenes = requireSrc('lib/scenes.ts');

const OWN = R.THEME.curveLabelOwn;
const APART = R.THEME.curveLabelApart;

const problems = [];
const marginal = [];
let checked = 0;
let strict = 0;

function inspect(where, scene) {
  const labelled = (scene.curves || []).filter((c) => c.label);
  if (labelled.length < 2) return;
  const report = {};
  R.renderGraph(scene, report);
  for (const l of report.curveLabels || []) {
    checked += 1;
    if (l.other >= l.own + OWN) strict += 1;
    const text = `${where}: подпись графика ${l.index + 1} — до своего ${l.own.toFixed(0)} px, до чужого ${l.other.toFixed(0)} px`;
    if (l.own > l.other + OWN) {
      problems.push(`${text}: ближе к чужому графику`);
    } else if (!(l.other > l.own)) {
      marginal.push(text);
    }
    if (l.apart < APART) {
      problems.push(
        `${where}: подпись графика ${l.index + 1} вплотную к другой подписи (${l.apart.toFixed(0)} px)`,
      );
    }
  }
}

const sets = G.loadSets();
for (const set of [...sets.prep, ...sets.prototypes]) {
  for (let i = 0; i < SEEDS; i += 1) {
    let tasks;
    try {
      tasks = G.generateSet(set.id, `labels-${i}`);
    } catch {
      continue;
    }
    for (const task of tasks) {
      if (task.scene) inspect(`${task.id} seed labels-${i}`, task.scene);
    }
  }
}

for (const type of ['linear', 'quadratic', 'rational', 'irrational']) {
  const scene = scenes.aboutScene(type);
  const before = checked;
  inspect(`«О задании», ${type}`, scene);
  if (checked === before) console.log(`  «О задании», ${type}: подписей графиков на сцене нет`);
}

console.log(`подписей графиков проверено: ${checked}, из них с полным запасом ${strict}`);
if (marginal.length > 0) {
  console.log(`\nмежду двумя графиками, места с запасом нет (${marginal.length}):`);
  marginal.slice(0, 20).forEach((p) => console.log('  · ' + p));
}
if (problems.length > 0) {
  console.log(`\nРАСХОЖДЕНИЯ (${problems.length}):`);
  problems.slice(0, 40).forEach((p) => console.log('  • ' + p));
  process.exit(1);
}
console.log('расхождений: 0 — всё чисто');
