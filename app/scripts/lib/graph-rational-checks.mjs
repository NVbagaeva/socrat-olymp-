/* scripts/lib/graph-rational-checks.mjs — правила задач о гиперболе.

   Одни на validate:graph и на test:graph-rational. Проверяется то,
   что ученик видит и во что верит:

     • отмеченные точки — в узлах сетки, на своей кривой, не у рамки;
     • ответ — целое число или конечная десятичная дробь (≤ 2 знаков);
     • ответ сходится при подстановке обратно в формулу;
     • у (kx + a)/(x + b) точки лежат на кривой, записанной через k, a, b;
     • с прямой: A — точка пересечения обеих кривых, B — тоже, B ≠ A,
       вторая точка прямой не на гиперболе и не совпадает с B;
     • B за рамкой не ближе трёх клеток по x или по y;
     • ответ задач на f(x₀) и на x по значению не читается с рисунка;
     • на чертеже нет подписей кривых — подписана только точка A;
     • ответ последнего шага разбора совпадает с ключом. */

import solution from '../../src/lib/graph/solution-rational.js';

const EPS = 1e-9;
const OFFSCREEN_MIN = 3;

const v = (o) => o.p / o.q;
const near = (a, b) => Math.abs(a - b) < EPS;

export function checkRationalTask(set, task) {
  const errors = [];
  const where = `${set.id}/${task.id} (seed ${task.meta.seed})`;
  const bad = (text) => errors.push(`${where}: ${text}`);
  const M = task.meta;
  const m = v(M.m), s = v(M.s), t = v(M.t);
  const f = (x) => m / (x - s) + t;
  const W = M.window.xmax;
  const answer = Number(String(task.answer).replace(',', '.'));

  if (!/^-?\d+(,\d{1,2})?$/.test(task.answer)) { bad(`ответ не конечная дробь: ${task.answer}`); }
  if (!near(answer, v(M.answer))) { bad('ответ не совпадает с точным значением'); }
  if (!Number.isInteger(s) || !Number.isInteger(t)) { bad('асимптота не в узле сетки'); }

  for (const p of M.points) {
    if (!Number.isInteger(p.x) || !Number.isInteger(p.y)) { bad(`точка (${p.x}; ${p.y}) не в узле`); }
    if (Math.abs(p.x) > W - 1 || Math.abs(p.y) > W - 1) { bad(`точка (${p.x}; ${p.y}) у самой рамки`); }
    if (p.role !== 'line' && !near(f(p.x), p.y)) { bad(`точка (${p.x}; ${p.y}) не на гиперболе`); }
  }

  /* Ответ не читается с рисунка: целая точка в поле — это чтение по клеткам. */
  const node = (x, y) => Number.isInteger(x) && Number.isInteger(y) && Math.abs(x) <= W && Math.abs(y) <= W;
  if (M.query) {
    if (M.query.type === 'value-at') {
      const x0 = v(M.query.x0);
      if (!near(f(x0), answer)) { bad('f(x₀) не равно ответу'); }
      if (node(x0, answer)) { bad('f(x₀) читается с рисунка'); }
    } else {
      const y0 = v(M.query.y0);
      if (!near(f(answer), y0)) { bad('f(ответ) не равно заданному значению'); }
      if (node(answer, y0)) { bad('x читается с рисунка'); }
    }
  }

  const co = Object.fromEntries(Object.entries(M.coefficients).map(([name, value]) => [name, v(value)]));
  if (M.form === 'linear') {
    for (const p of M.points) {
      if (!near((co.k * p.x + co.a) / (p.x + co.b), p.y)) { bad('точка не на (kx + a)/(x + b)'); }
    }
  }
  const coefRule = { 'coef-k': 'k', 'coef-a': 'a', 'coef-b': 'b' }[M.rule];
  if (coefRule && !near(co[coefRule], answer)) { bad(`коэффициент ${coefRule} не равен ответу`); }
  if (M.rule === 'coef-sum' && !near(co.k + co.a + co.b, answer)) { bad('k + a + b не равно ответу'); }

  if (M.form === 'line') {
    const g = (x) => v(M.line.k) * x + v(M.line.b);
    const A = M.intersection.A;
    const B = { x: v(M.intersection.B.x), y: v(M.intersection.B.y) };
    const P = M.points.find((p) => p.role === 'line');
    if (!near(f(A.x), A.y) || !near(g(A.x), A.y)) { bad('A — не точка пересечения'); }
    if (!near(f(B.x), B.y) || !near(g(B.x), B.y)) { bad('B — не точка пересечения'); }
    if (near(A.x, B.x)) { bad('B совпала с A'); }
    if (!near(g(P.x), P.y)) { bad('вторая точка не на прямой'); }
    if (near(f(P.x), P.y)) { bad('вторая точка прямой лежит на гиперболе'); }
    if (near(P.x, B.x) && near(P.y, B.y)) { bad('вторая точка прямой совпала с B'); }
    if (!(Math.abs(B.x) >= W + OFFSCREEN_MIN - EPS || Math.abs(B.y) >= W + OFFSCREEN_MIN - EPS)) {
      bad(`B (${B.x}; ${B.y}) ближе ${OFFSCREEN_MIN} клеток к рамке ±${W}`);
    }
    const asked = M.rule === 'cross-x' ? B.x : M.rule === 'cross-y' ? B.y
      : M.rule === 'line-a' ? v(M.line.k) : v(M.line.b);
    if (!near(asked, answer)) { bad('ответ не совпадает с B или коэффициентом прямой'); }
    if (/>B</.test(task.svg)) { bad('точка B подписана на чертеже'); }
  }
  if (/y = [fg]\(x\)|<tspan[^>]*>[fg]<\/tspan>/.test(task.svg)) { bad('на чертеже подпись кривой'); }

  let steps;
  try { steps = solution.fromTask(task); } catch (error) { bad(`разбор не собрался: ${error.message}`); return errors; }
  const last = steps[steps.length - 1].blocks.find((block) => block.type === 'answer');
  if (!last || last.text.replace('−', '-') !== task.answer) {
    bad(`ответ разбора ${last ? last.text : '—'} не совпадает с ключом ${task.answer}`);
  }
  for (const step of steps) {
    for (const block of step.blocks) {
      const tex = block.tex || '';
      if ((tex.match(/\{/g) || []).length !== (tex.match(/\}/g) || []).length) {
        bad(`в шаге «${step.title}» незакрытая формула`);
      }
      if (/NaN|undefined|Infinity/.test((block.html || '') + tex)) { bad(`в шаге «${step.title}» мусор`); }
    }
  }
  return errors;
}

export function checkRationalComposition(set, tasks) {
  const errors = [];
  const rules = set.composition || {};
  if (rules.count !== undefined && tasks.length !== rules.count) {
    errors.push(`${set.id}: задач ${tasks.length}, по составу нужно ${rules.count}`);
  }
  if (set.uniqueAnswers) {
    const seen = new Set();
    for (const task of tasks) {
      if (seen.has(task.answer)) { errors.push(`${set.id}: ответ ${task.answer} повторяется`); }
      seen.add(task.answer);
    }
  }
  return errors;
}
