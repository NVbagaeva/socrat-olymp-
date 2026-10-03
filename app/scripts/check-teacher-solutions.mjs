#!/usr/bin/env node
/* scripts/check-teacher-solutions.mjs — решения листа ответов учителя.

   Запуск:
     pnpm test:teacher-solutions               проверка на серии seed
     pnpm test:teacher-solutions --seeds 40    другое число seed
     pnpm test:teacher-solutions --print 12Q.H 12.D
                                                текст решений по наборам

   Для каждой задачи всех наборов задания №12 решение строится заново
   (graph/solution-teacher.js) и сверяется с движком:

     - коэффициенты, найденные по точкам рисунка, равны точным
       коэффициентам задачи — у f и у g;
     - точки, взятые в решении, лежат на своих графиках;
     - каждый найденный корень даёт f(x) = g(x) (или f(x) = y₀);
     - ответ решения равен ответу ключа;
     - в формулах нет «+ −», «− −», двойных скобок и округлений,
       и KaTeX принимает каждую формулу.

   Задачи с расхождениями печатаются списком; код возврата 1. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import katex from 'katex';

import generator from '../src/lib/graph/generate.js';
import teacher from '../src/lib/graph/solution-teacher.js';
import Line from '../src/lib/graph/families/line.js';
import Slope from '../src/lib/graph/slope.js';
import SlopeFigure from '../src/lib/graph/slope-figure.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'graph', 'data');
function readSets(dir) {
  const full = path.join(ROOT, dir);
  return fs.readdirSync(full).filter((name) => name.endsWith('.json')).sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(full, name), 'utf8')));
}
const prep = [...readSets('prep/12'), ...readSets('prep/12q')];
const prototypes = [...readSets('prototypes/12'), ...readSets('prototypes/12q')];
generator.setSets({ prep, prototypes });
const SETS = [...prep, ...prototypes];

const rules = {};
SETS.forEach((set) => set.tasks.forEach((task) => { rules[task.id] = task.answerRule; }));

const args = process.argv.slice(2);
const seedRuns = args.includes('--seeds') ? Number(args[args.indexOf('--seeds') + 1]) : 20;
const printAt = args.indexOf('--print');

const { toFrac, add, mul } = Line;
const same = (a, b) => a.p * b.q === b.p * a.q;
const show = (f) => (f.q === 1 ? String(f.p) : f.p + '/' + f.q);

/** Значение кривой решения в точке. */
function valueOf(curve, x) {
  const X = typeof x === 'object' ? x : toFrac(x);
  if (curve.kind === 'line') { return add(mul(curve.k, X), curve.b); }
  return add(add(mul(curve.a, mul(X, X)), mul(curve.b, X)), curve.c);
}

/** Ответ ключа точной дробью: «−19,5» → −39/2. */
function keyValue(answer) {
  return toFrac(Number(String(answer).replace(/−/g, '-').replace(',', '.')));
}

/** Все формулы решения: отдельные и внутри текста. */
function formulasOf(steps) {
  const out = [];
  steps.forEach((step) => String(step.title).split('$').forEach((piece, i) => { if (i % 2) { out.push(piece); } }));
  steps.forEach((step) => step.rows.forEach((item) => {
    if (item.tex) { out.push(item.tex); }
    String(item.text || '').split('$').forEach((piece, i) => { if (i % 2) { out.push(piece); } });
  }));
  return out;
}

const HYGIENE = [
  [/[+-]\s*[+-]/, 'два знака подряд'],
  [/\(\s*\(/, 'двойные скобки'],
  [/\{,\}\d{3}/, 'округлённое число'],
  [/NaN|undefined|Infinity|null/, 'пустое значение'],
  [/(^|[^\d}{\\a-z])1x/, 'единица перед x'],
  [/[a-z0-9})]-[\d\\a-z]/, 'минус без пробелов между слагаемыми'],
  [/[a-z](_\d)?\d\^/, 'буква вплотную к числу в степени'],
  [/[ka] = \\dfrac\{[^{}]*\d - [^{}]*\}\{[^{}]*\d - /, 'k через разность координат'],
  [/\\Delta/, 'k через разность координат'],
];

function checkTask(task) {
  const problems = [];
  let solved;
  try { solved = teacher.build({ ...task, answerRule: rules[task.id] }); }
  catch (error) { return ['решение не строится: ' + error.message]; }
  const { check, steps } = solved;

  check.curves.forEach((curve, i) => {
    const name = i === 0 ? 'f' : 'g';
    Object.keys(curve.exact).forEach((key) => {
      if (curve[key] && !same(curve[key], curve.exact[key])) {
        problems.push(name + ': ' + key + ' = ' + show(curve[key]) + ', а в задаче ' + show(curve.exact[key]));
      }
    });
  });
  check.points.forEach((point) => {
    const curve = check.curves[point.curve];
    if (!curve || curve.partial) { return; }
    if (!same(valueOf(curve, point.x), toFrac(point.y))) {
      problems.push('точка (' + point.x + '; ' + point.y + ') не лежит на ' + (point.curve ? 'g' : 'f'));
    }
  });
  /* Треугольник наклона: вершина прямого угла под прямой, катеты —
     положительные целые, знак k — по направлению прямой, k из
     треугольника равен точному k задачи. */
  (check.triangles || []).forEach(({ curve: index, triangle: t }) => {
    const curve = check.curves[index];
    const name = index ? 'g' : 'f';
    const exactK = curve.exact.k;
    if (!same(t.k, exactK)) { problems.push(name + ': k по треугольнику ' + show(t.k) + ', в ключе ' + show(exactK)); }
    if (t.flat) {
      if (exactK.p !== 0) { problems.push(name + ': прямая не горизонтальна, а треугольник не построен'); }
      return;
    }
    if (!(t.dx > 0 && t.dy > 0 && Number.isInteger(t.dx) && Number.isInteger(t.dy))) {
      problems.push(name + ': катеты ' + t.dx + ' и ' + t.dy + ' — не положительные целые');
    }
    if (!Slope.vertexBelow(t, Line.create(curve.exact.k, curve.exact.b))) {
      problems.push(name + ': вершина прямого угла (' + t.C.x + '; ' + t.C.y + ') не под прямой');
    }
    if (t.rising !== (exactK.p > 0)) { problems.push(name + ': знак k не совпадает с направлением прямой'); }
  });
  if (check.curves.some((curve) => curve.kind === 'line') && !(check.triangles || []).length &&
      check.points.length) {
    /* Прямая с чертежа без треугольника — k найден не тем способом. */
    if (check.curves.some((curve, i) => curve.kind === 'line' && check.points.some((p) => p.curve === i))) {
      problems.push('k найден без треугольника наклона');
    }
  }
  if (check.roots && check.curves.length === 2) {
    check.roots.forEach((r) => {
      const fv = valueOf(check.curves[0], r);
      const gv = valueOf(check.curves[1], r);
      if (!same(fv, gv)) { problems.push('корень x = ' + show(r) + ': f = ' + show(fv) + ', g = ' + show(gv)); }
    });
  }
  (check.rootsCheck || []).forEach((item) => {
    if (!same(item.f, item.g)) { problems.push('корень x = ' + show(item.x) + ': f(x) = ' + show(item.f) + ' ≠ ' + show(item.g)); }
  });
  if (check.answerOption !== undefined) {
    if (String(check.answerOption) !== String(task.answer)) {
      problems.push('вариант в решении ' + check.answerOption + ', в ключе ' + task.answer);
    }
  } else if (check.answerValue) {
    if (!same(check.answerValue, keyValue(task.answer))) {
      problems.push('ответ в решении ' + show(check.answerValue) + ', в ключе ' + task.answer);
    }
  } else {
    problems.push('в решении нет ответа');
  }

  /* Точки в тексте — слева направо; у возрастающей прямой названа
     вершина угла α, у убывающей — угла 180° − α. */
  steps.forEach((step) => step.rows.forEach((item) => {
    const textRow = String(item.text || '');
    const pair = /(?:точками|берём точки) \$\((-?\d+);[^$]*\$[^$]*? и \$\((-?\d+);/.exec(textRow);
    if (pair && Number(pair[1]) >= Number(pair[2])) {
      problems.push('точки не слева направо: «' + textRow.slice(0, 120) + '»');
    }
    if (/Прямая возрастает/.test(textRow) && !/при вершине \$[^$]+\$ равен \$\\alpha\$/.test(textRow)) {
      problems.push('у возрастающей прямой не названа вершина угла α');
    }
    if (/Прямая убывает/.test(textRow) && !/при вершине \$[^$]+\$ — смежный/.test(textRow)) {
      problems.push('у убывающей прямой не названа вершина угла 180° − α');
    }
  }));

  /* Чертёж учителя: без треугольников — байт в байт чертёж ученика,
     с ними — на нём есть катеты каждого треугольника. */
  if (task.svg) {
    if (teacher.figure(task, null, { triangles: false }) !== task.svg) {
      problems.push('чертёж учителя без треугольников не совпадает с чертежом условия');
    }
    const drawn = (check.triangles || []).filter((item) => !item.triangle.flat);
    if (drawn.length) {
      const svg = teacher.figure(task, solved) || '';
      drawn.forEach((item, i) => {
        if (!svg.includes('id="teacher-leg-x-' + (i + 1) + '"')) { problems.push('на чертеже нет треугольника ' + (i + 1)); }
      });
    }
  }

  const drawnItems = (check.triangles || []).filter((item) => !item.triangle.flat);
  if (task.svg && drawnItems.length) { problems.push(...SlopeFigure.layoutProblems(task, drawnItems)); }

  formulasOf(steps).forEach((tex) => {
    HYGIENE.forEach(([pattern, what]) => { if (pattern.test(tex)) { problems.push(what + ': «' + tex + '»'); } });
    try { katex.renderToString(tex, { throwOnError: true }); }
    catch (error) { problems.push('KaTeX: «' + tex + '» — ' + error.message); }
  });
  return problems;
}

/* ── Печать примеров ─────────────────────────────────────── */
if (printAt >= 0) {
  const countAt = args.indexOf('--count');
  const count = countAt >= 0 ? Number(args[countAt + 1]) : 2;
  const ids = args.slice(printAt + 1).filter((id, i) => !id.startsWith('--') && printAt + 1 + i !== countAt + 1);
  SETS.filter((set) => !ids.length || ids.includes(set.id)).forEach((set) => {
    generator.generateSet(set.id).slice(0, count).forEach((task) => {
      const solved = teacher.build({ ...task, answerRule: rules[task.id] });
      console.log('\n━━ ' + task.id + ' — ' + set.title);
      console.log('Условие: ' + String(task.question || '').replace(/\s+/g, ' '));
      solved.steps.forEach((step, i) => {
        console.log((i + 1) + '. ' + step.title);
        step.rows.forEach((item) => {
          console.log('   ' + [item.text, item.tex ? '$$ ' + item.tex + ' $$' : ''].filter(Boolean).join(' '));
        });
      });
      console.log('Ответ: ' + task.answer);
    });
  });
  process.exit(0);
}

/* ── Проверка ────────────────────────────────────────────── */
const failures = [];
let checked = 0;
let skipped = 0;
SETS.forEach((set) => {
  const seeds = [undefined];
  for (let i = 1; i <= seedRuns; i += 1) { seeds.push(1000 + i * 7919); }
  seeds.forEach((seed) => {
    let tasks;
    try { tasks = generator.generateSet(set.id, seed); }
    catch { skipped += 1; return; }
    tasks.forEach((task) => {
      checked += 1;
      const problems = checkTask(task);
      if (problems.length) { failures.push({ id: task.id, seed: task.meta.seed, problems }); }
    });
  });
});

console.log('Решений проверено: ' + checked + ' (наборов ' + SETS.length + ', seed на набор ' +
  (seedRuns + 1) + ', не собралось вариантов набора: ' + skipped + ')');
if (failures.length) {
  console.log('\nРасхождения — ' + failures.length + ' задач:');
  failures.slice(0, 200).forEach((item) => {
    console.log('  ' + item.id + ' (seed ' + item.seed + ')');
    item.problems.slice(0, 6).forEach((problem) => console.log('      ' + problem));
  });
  process.exit(1);
}
console.log('Расхождений нет.');
