#!/usr/bin/env node
/* scripts/check-point-labels.mjs — подписи точек на чертежах №12 не
   пересекают кривую и друг друга.

   Запуск: pnpm test:point-labels [--seeds N]   (по умолчанию 30)

   Проверка падает, если рамка подписи точки пересекает:
     — кривую (по плотной выборке отрезков кривой),
     — оси, пунктиры и отрезки построений,
     — другую подпись или чужую точку,
     — или выходит за границу рисунка.

   Что проверяется:
     1. Все рисунки реестра задач раздела — наборы подготовки и
        прототипов линейной, квадратичной, гиперболы и корня на серии
        seed: рисунок условия на сайте, рисунок условия на листе
        ученика и рисунок к разбору на листе учителя (там построения:
        треугольник наклона, система x′Oy′, пунктиры).
     2. Все рисунки теории (components/tasks/theory/rich/KatexFigure):
        подписи точек раскладывает тот же модуль, что и на чертежах.
     3. Сама проверка: она обязана падать на рисунке, где подпись
        заведомо лежит на кривой. Если не падает, проверка сломана. */

import fs from 'node:fs';
import path from 'node:path';

import generator from '../src/lib/graph/generate.js';
import renderer from '../src/lib/graph/renderer.js';
import '../src/lib/graph/families/index.js';
import figures from '../src/lib/sheet/figures12.js';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { labelProblems } from './lib/graph-label-checks.mjs';

const args = process.argv.slice(2);
const seeds = args.includes('--seeds') ? Number(args[args.indexOf('--seeds') + 1]) : 30;

const ROOT = path.join(APP, 'src', 'lib', 'graph', 'data');
const readSets = (dir) => {
  const full = path.join(ROOT, dir);
  return fs.existsSync(full)
    ? fs
        .readdirSync(full)
        .filter((name) => name.endsWith('.json'))
        .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
        .map((name) => JSON.parse(fs.readFileSync(path.join(full, name), 'utf8')))
    : [];
};

const FAMILIES = [
  ['линейная', '12'],
  ['квадратичная', '12q'],
  ['гипербола', '12r'],
  ['корень', '12s'],
];

const errors = [];
let checked = 0;
let withLabels = 0;
let moved = 0;

function inspect(scene, where, mode) {
  const report = {};
  if (mode) {
    renderer.renderFigure(JSON.parse(JSON.stringify(scene)), mode, report);
  } else {
    renderer.renderGraph(JSON.parse(JSON.stringify(scene)), report);
  }
  checked += 1;
  if ((report.boxes || []).some((box) => box.kind === 'pointLabel')) withLabels += 1;
  if ((report.boxes || []).some((box) => box.kind === 'pointLabel' && box.leader)) moved += 1;
  errors.push(...labelProblems(report, where));
}

/* ── 1. Реестр задач ─────────────────────────────────────────── */
const PREP = [];
const PROTO = [];
for (const [, dir] of FAMILIES) {
  PREP.push(...readSets(path.join('prep', dir)));
  PROTO.push(...readSets(path.join('prototypes', dir)));
}
generator.setSets({ prep: PREP, prototypes: PROTO });

for (const set of PREP.concat(PROTO)) {
  for (let run = 0; run < seeds; run += 1) {
    const seed = run === 0 ? set.seed : set.seed * 1000 + run;
    let tasks;
    try {
      tasks = generator.generateSet(set.id, seed);
    } catch {
      continue;
    }
    for (const task of tasks) {
      const where = `${set.id}/${task.id} (seed ${seed})`;
      if (task.scene) {
        inspect(task.scene, `${where}, сайт`);
        const condition = figures.conditionScene(task);
        if (condition) inspect(condition, `${where}, условие`);
        let solution = null;
        try {
          solution = figures.solutionScene(task, generator);
        } catch {
          solution = null;
        }
        if (solution) inspect(solution, `${where}, разбор`, 'teacherSolution');
      }
    }
  }
}

/* ── 2. Рисунки теории ───────────────────────────────────────── */
const { THEORY_FIGURE_IDS, theoryFigure } = requireSrc('lib/theoryFigures');
const { layoutFigure } = requireSrc('lib/theoryLabels');
let theoryFigures = 0;
let theoryPoints = 0;
for (const id of THEORY_FIGURE_IDS) {
  const layout = layoutFigure(theoryFigure(id));
  theoryFigures += 1;
  const report = {
    ...layout.report,
    boxes: layout.labels.map((item) => ({
      kind: item.auto ? 'pointLabel' : 'text',
      x: item.x,
      y: item.y,
      halfW: item.halfW,
      halfH: item.halfH,
    })),
  };
  theoryPoints += layout.labels.filter((item) => item.auto).length;
  errors.push(...labelProblems(report, `теория «${id}»`));
  layout.labels
    .filter((item) => item.auto && !item.free)
    .forEach((item) =>
      errors.push(`теория «${id}»: для подписи «${item.label.text}» не нашлось свободного места`),
    );
}

/* ── 3. Проверка обязана падать ──────────────────────────────── */
{
  const scene = {
    window: { xmin: -1, xmax: 10, ymin: -1, ymax: 5 },
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    axisLabels: 'minimal',
    curves: [{ type: 'sqrt', a: 1.5, c: 0, d: 0, color: 'lineA', label: null }],
    points: [{ x: 4, y: 3, style: 'solid', color: 'lineA', label: null }],
    shapes: [],
  };
  const report = {};
  renderer.renderGraph(scene, report);
  /* Подпись, поставленная ровно на кривую правее точки. */
  const at = report.points[0];
  const onCurve = {
    ...report,
    boxes: [{ kind: 'pointLabel', x: at.x + 14, y: at.y - 5, halfW: 20, halfH: 8, at }],
  };
  if (labelProblems(onCurve, 'самопроверка').length === 0) {
    errors.push('самопроверка: подпись, лежащая на кривой, не поймана — проверка сломана');
  }
}

console.log(
  `Подписи точек: чертежей ${checked} (с подписями точек ${withLabels}, с выноской ${moved}), ` +
    `рисунков теории ${theoryFigures} (подписей точек ${theoryPoints}), ошибок ${errors.length}.`,
);
errors.slice(0, 40).forEach((message) => console.log(`  ✗ ${message}`));
if (errors.length > 40) console.log(`  … и ещё ${errors.length - 40}`);
if (errors.length > 0) process.exitCode = 1;
