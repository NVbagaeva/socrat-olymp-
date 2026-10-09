#!/usr/bin/env node
/* scripts/check-about-examples.mjs — разборы типов задач на вкладке
   «О задании» квадратичной функции и ярлыки «Потренироваться».

   Запуск: pnpm test:about-examples

   Разборы (content/quadraticTypes.ts, числа — lib/quadraticCross.ts):
     — общая точка лежит на обоих графиках;
     — вторая точка по теореме Виета (сумма корней f − g = 0 минус
       известный корень) — тоже корень и лежит на обоих графиках;
     — ответ в тексте разбора совпадает с пересчитанной абсциссой
       или ординатой;
     — искомую координату нельзя прочитать с рисунка: точка в окне, но
       нужная координата не на линии сетки, — или точка за рамкой не
       ближе клетки (graph/hidden.js);
     — в SVG рисунка у искомой точки нет маркера;
     — оранжевые пунктиры не кончаются на линии сетки: ни один конец
       пунктира не лежит в узле, по которому ответ читался бы с сетки.

   Ярлыки «Потренироваться» (content/trainerModes.ts): для каждой из
   четырёх ссылок тренировка собирается так же, как в тренажёре
   (lib/trainerSession.ts, pickTasks), на нескольких seed и количествах,
   и у всех задач правило ответа — то, что обещает ярлык; задач столько,
   сколько просили. */

import { requireSrc } from './lib/load-ts.mjs';

const R0 = requireSrc('lib/graph/renderer.js');
const R = R0.default ?? R0;
const H0 = requireSrc('lib/graph/hidden.js');
const H = H0.default ?? H0;
const cross = requireSrc('lib/quadraticCross.ts');
const { QUADRATIC_TYPES } = requireSrc('content/quadraticTypes.ts');
const { theoryFigure } = requireSrc('lib/theoryFigures.ts');
const { findTrainerShortcut } = requireSrc('content/trainerModes.ts');
const { pickTasks, seedFrom } = requireSrc('lib/trainerSession.ts');

const problems = [];
const EPS = 1e-9;
const PAD = R.THEME.geometry.pad;

function near(a, b, eps = 1e-6) {
  return Math.abs(a - b) < eps;
}

function isInt(v) {
  return Math.abs(v - Math.round(v)) < 1e-6;
}

/** «$-1{,}75$» → −1.75. */
function texNumber(tex) {
  const plain = tex.replace(/\$/g, '').replace('{,}', '.').replace(/\s/g, '').replace('−', '-');
  return Number(plain);
}

let examples = 0;
for (const form of QUADRATIC_TYPES) {
  const id = form.analysis?.id;
  if (!id) continue;
  const list = cross.CROSS_EXAMPLES[id];
  if (!list || list.length !== form.analysis.examples.length) {
    problems.push(
      `${id}: примеров в тексте ${form.analysis.examples.length}, в числах ${list?.length}`,
    );
    continue;
  }
  list.forEach((ex, i) => {
    examples += 1;
    const where = `${id}, пример ${i + 1}`;
    const text = form.analysis.examples[i];
    if (text.figure !== ex.figure)
      problems.push(`${where}: рисунок ${text.figure}, а в числах ${ex.figure}`);

    const [cx, cy] = ex.common;
    if (!near(cross.valueOf(ex.f, cx), cy) || !near(cross.valueOf(ex.g, cx), cy)) {
      problems.push(`${where}: общая точка (${cx}; ${cy}) не на обоих графиках`);
    }
    /* Виет: f − g = A·x² + B·x + C, x₁ + x₂ = −B/A. */
    const A = ex.f.a - ex.g.a;
    const B = ex.f.b - ex.g.b;
    const C = ex.f.c - ex.g.c;
    const [x2, y2] = cross.secondPoint(ex);
    if (!near(x2, -B / A - cx)) problems.push(`${where}: x₂ не по Виету`);
    if (!near(A * x2 * x2 + B * x2 + C, 0)) problems.push(`${where}: x₂ = ${x2} — не корень f − g`);
    if (!near(x2 * cx, C / A)) problems.push(`${where}: произведение корней не сходится`);
    if (!near(cross.valueOf(ex.g, x2), y2)) problems.push(`${where}: точка (${x2}; ${y2}) не на g`);

    const want = ex.asks === 'x' ? x2 : y2;
    const said = texNumber(text.answer);
    if (!near(said, want)) problems.push(`${where}: в ответе ${text.answer}, по расчёту ${want}`);

    /* Не читается: за рамкой не ближе клетки — или в окне, но
       спрашиваемая координата не на линии сетки. */
    const w = ex.window;
    const inside = x2 > w.xmin + EPS && x2 < w.xmax - EPS && y2 > w.ymin + EPS && y2 < w.ymax - EPS;
    const hidden = H.isPointHidden({ x: x2, y: y2 }, w);
    if (!hidden && !inside)
      problems.push(`${where}: точка у рамки — ни в окне, ни за рамкой на клетку`);
    if (!hidden && isInt(want))
      problems.push(`${where}: точка в окне, и ответ ${want} читается с сетки`);

    /* SVG: маркеры и пунктиры. */
    const fig = theoryFigure(ex.figure);
    const cell = fig.scene.cell ?? R.THEME.geometry.cell;
    const svg = R.renderGraph(fig.scene);
    const toX = (px) => w.xmin + (px - PAD) / cell;
    const toY = (py) => w.ymax - (py - PAD) / cell;
    for (const m of svg.matchAll(/<circle[^>]*cx="([-\d.]+)"[^>]*cy="([-\d.]+)"/g)) {
      const mx = toX(Number(m[1]));
      const my = toY(Number(m[2]));
      if (Math.hypot(mx - x2, my - y2) < 0.15) {
        problems.push(`${where}: на искомой точке маркер (${mx.toFixed(2)}; ${my.toFixed(2)})`);
      }
    }
    let dashes = 0;
    for (const m of svg.matchAll(
      /<path[^>]*d="M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)"[^>]*stroke-dasharray/g,
    )) {
      dashes += 1;
      const ends = [
        [toX(Number(m[1])), toY(Number(m[2]))],
        [toX(Number(m[3])), toY(Number(m[4]))],
      ];
      /* Пунктир к оси: конец на оси, вторая координата — ответ или
         другая координата точки. В узле сетки он кончаться не должен. */
      const toPoint = ends.some(([x, y]) => near(x, x2, 0.02) && near(y, y2, 0.02));
      if (!toPoint) continue;
      for (const [x, y] of ends) {
        if (isInt(Math.round(x * 100) / 100) && isInt(Math.round(y * 100) / 100)) {
          problems.push(
            `${where}: пунктир кончается в узле сетки (${x.toFixed(2)}; ${y.toFixed(2)})`,
          );
        }
      }
    }
    if (inside && dashes < 2) problems.push(`${where}: точка в окне, а пунктиров к осям ${dashes}`);
  });
}

/* ── Ярлыки «Потренироваться» ───────────────────────────────── */
const LINKS = {
  'abscissa-line': ['12Q.H', 'intersection-x'],
  'abscissa-parabola': ['12Q.I', 'intersection-x'],
  'ordinate-line': ['12Q.H', 'intersection-y'],
  'ordinate-parabola': ['12Q.I', 'intersection-y'],
};
const links = [];
for (const form of QUADRATIC_TYPES) {
  const id = form.analysis?.trainer;
  if (!id) continue;
  const expected = LINKS[id];
  const found = findTrainerShortcut('quadratic', id);
  if (!expected || !found) {
    problems.push(`ярлык ${id}: нет в тренажёре`);
    continue;
  }
  if (found.skills.join() !== expected[0] || (found.rules ?? []).join() !== expected[1]) {
    problems.push(`ярлык ${id}: ${found.skills} / ${found.rules}, ждали ${expected.join(' / ')}`);
  }
  let total = 0;
  for (const mode of ['practice', 'mixed', 'control']) {
    for (const count of [5, 10, 20]) {
      for (let s = 0; s < 3; s += 1) {
        const picked = pickTasks(
          {
            skills: found.skills,
            level: null,
            count,
            mode,
            mistakes: [],
            choice: true,
            rules: found.rules,
          },
          seedFrom(`about-${id}-${mode}-${count}-${s}`),
          null,
        );
        total += picked.tasks.length;
        if (picked.tasks.length !== count) {
          problems.push(`ярлык ${id}, ${mode}, ${count}: собрано ${picked.tasks.length}`);
        }
        for (const task of picked.tasks) {
          if (task.meta.rule !== expected[1] || task.meta.set !== expected[0]) {
            problems.push(`ярлык ${id}: задача ${task.id} — ${task.meta.set} / ${task.meta.rule}`);
          }
        }
      }
    }
  }
  /* Повтор ошибок: в истории задачи обоих правил — берутся только свои. */
  const mistakes = Array.from(
    { length: 20 },
    (_, i) => `${expected[0]}-${String(i + 1).padStart(2, '0')}`,
  );
  const again = pickTasks(
    {
      skills: found.skills,
      level: null,
      count: 20,
      mode: 'mistakes',
      mistakes,
      choice: true,
      rules: found.rules,
    },
    seedFrom(`about-${id}-mistakes`),
    null,
  );
  for (const task of again.tasks) {
    if (task.meta.rule !== expected[1])
      problems.push(`ярлык ${id}, повтор ошибок: задача ${task.id} — ${task.meta.rule}`);
  }
  links.push(
    `${id}: ${expected[0]} + ${expected[1]}, задач собрано ${total}, повтор ошибок ${again.tasks.length}`,
  );
}

console.log(`разборов проверено: ${examples}`);
links.forEach((line) => console.log('  ' + line));
if (problems.length > 0) {
  console.log(`\nРАСХОЖДЕНИЯ (${problems.length}):`);
  problems.slice(0, 40).forEach((p) => console.log('  • ' + p));
  process.exit(1);
}
console.log('расхождений: 0 — всё чисто');
