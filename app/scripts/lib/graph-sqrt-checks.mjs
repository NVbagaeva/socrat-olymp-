/* scripts/lib/graph-sqrt-checks.mjs — правила задач о графике корня.

   Одни на validate:graph и на test:graph-sqrt. Проверяется то, что
   ученик видит и во что верит:

     • начало графика и отмеченные точки — в узлах сетки, на кривой,
       не у рамки; хотя бы одна целая точка кроме начала;
     • ответ — целое число или конечная десятичная дробь (≤ 2 знаков)
       и сходится при подстановке обратно в формулу;
     • ответ задач на f(x₀) и на x по значению не читается с рисунка;
     • с прямой: A — общая точка, B — тоже, B ≠ A; спрошенная точка
       B на рисунке не видна — за рамкой не ближе клетки, по общему
       правилу graph/hidden.js;
       вторая точка прямой не на корне; прямая видна не меньше шести
       клеток;
     • на чертеже нет подписей кривых — подписана только точка A;
     • разбор собирается, формулы закрыты, ответ последнего шага
       совпадает с ключом;
     • подсказка: в каждом вопросе ровно один верный вариант, у
       каждого неверного есть пояснение, варианты не повторяются;
       верный вариант последнего вопроса — ключ ответа. */

import solution from '../../src/lib/graph/solution-sqrt.js';
import hints from '../../src/lib/graph/hints-sqrt.js';
import Line from '../../src/lib/graph/families/line.js';
import hidden from '../../src/lib/graph/hidden.js';

const EPS = 1e-9;
const v = (o) => o.p / o.q;
const near = (a, b) => Math.abs(a - b) < EPS;

function braces(tex) {
  return (tex.match(/\{/g) || []).length === (tex.match(/\}/g) || []).length;
}

export function checkSqrtTask(set, task) {
  const errors = [];
  const where = `${set.id}/${task.id} (seed ${task.meta.seed})`;
  const bad = (text) => errors.push(`${where}: ${text}`);
  const M = task.meta;
  const k = v(M.k);
  const f = (x) => (x < M.x0 - EPS ? NaN : k * Math.sqrt(x - M.x0) + M.y0);
  const W = M.window.xmax;
  const answer = Number(String(task.answer).replace(',', '.'));

  if (!/^-?\d+(,\d{1,2})?$/.test(task.answer)) { bad(`ответ не конечная дробь: ${task.answer}`); }
  if (!near(answer, v(M.answer))) { bad('ответ не совпадает с точным значением'); }
  if (!Number.isInteger(M.x0) || !Number.isInteger(M.y0)) { bad('начало графика не в узле'); }
  if (Math.abs(M.x0) > W - 1 || Math.abs(M.y0) > W - 1) { bad('начало графика у самой рамки'); }

  const marks = M.points.filter((p) => p.role === 'mark' || p.role === 'cross');
  if (!marks.length) { bad('на графике нет целой точки'); }
  for (const p of M.points) {
    if (!Number.isInteger(p.x) || !Number.isInteger(p.y)) { bad(`точка (${p.x}; ${p.y}) не в узле`); }
    if (Math.abs(p.x) > W - 1 || Math.abs(p.y) > W - 1) { bad(`точка (${p.x}; ${p.y}) у самой рамки`); }
    if (p.role !== 'line' && !near(f(p.x), p.y)) { bad(`точка (${p.x}; ${p.y}) не на графике корня`); }
  }

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
  if (M.rule === 'coef-k' && !near(k, answer)) { bad('k не равно ответу'); }

  if (M.form === 'line') {
    const g = (x) => v(M.line.k) * x + v(M.line.b);
    const A = M.intersection.A;
    const B = { x: v(M.intersection.B.x), y: v(M.intersection.B.y) };
    const P = M.points.find((p) => p.role === 'line');
    if (!near(f(A.x), A.y) || !near(g(A.x), A.y)) { bad('A — не точка пересечения'); }
    if (!near(f(B.x), B.y) || !near(g(B.x), B.y)) { bad('B — не точка пересечения'); }
    if (near(A.x, B.x)) { bad('B совпала с A'); }
    if (!near(g(P.x), P.y)) { bad('вторая точка не на прямой'); }
    if (P.x >= M.x0 && near(f(P.x), P.y)) { bad('вторая точка прямой лежит на графике корня'); }
    if (M.rule === 'cross-x' || M.rule === 'cross-y') {
      const asked = M.rule === 'cross-x' ? B.x : B.y;
      if (!hidden.isPointHidden(B, M.window)) {
        bad(`B (${B.x}; ${B.y}) видна: за рамкой ближе клетки (${hidden.outsideBy(B, M.window).toFixed(2)})`);
      }
      if (!near(asked, answer)) { bad('ответ не совпадает с координатой B'); }
    } else {
      const asked = M.rule === 'line-a' ? v(M.line.k) : v(M.line.b);
      if (!near(asked, answer)) { bad('ответ не совпадает с коэффициентом прямой'); }
    }
    if (/>B</.test(task.svg)) { bad('точка B подписана на чертеже'); }
    const part = Line.visiblePart({ kValue: v(M.line.k), bValue: v(M.line.b) }, M.window);
    if (part.length < 6 - EPS) { bad(`прямая видна лишь на ${part.length.toFixed(1)} клетки`); }
  }
  if (/y = [fg]\(x\)|<tspan[^>]*>[fg]<\/tspan>/.test(task.svg)) { bad('на чертеже подпись кривой'); }

  let steps;
  try { steps = solution.fromTask(task); } catch (error) { bad(`разбор не собрался: ${error.message}`); return errors; }
  const last = steps[steps.length - 1].blocks.find((block) => block.type === 'answer');
  if (!last || last.text.replace('−', '-') !== task.answer) {
    bad(`ответ разбора ${last ? last.text : '—'} не совпадает с ключом ${task.answer}`);
  }
  /* Подробный разбор: слова перед каждой формулой, вычисление доведено до числа. */
  if (M.form !== 'line') {
    const answerTex = last ? last.tex : '';
    const tail = (tex) => tex.split('=').pop().trim();
    for (const step of steps) {
      if (step.id === 'answer') { continue; }
      if (step.blocks[0].type !== 'text') { bad(`шаг «${step.title}» начинается с формулы без слов`); }
      let previous = null;
      for (const block of step.blocks) {
        if (block.type === 'formula' && previous && previous.type === 'formula') {
          bad(`в шаге «${step.title}» две формулы подряд без фразы`);
        }
        if (block.type === 'formula' && /(=|\\Rightarrow\\?;?)\s*$/.test(block.tex)) {
          bad(`в шаге «${step.title}» формула оборвана: ${block.tex}`);
        }
        previous = block;
      }
    }
    const kStep = steps.find((item) => item.id === 'k');
    const kText = kStep ? kStep.blocks.filter((b) => b.type === 'text').map((b) => b.html).join(' ') : '';
    if (!/формула теперь выглядит так/.test(kText)) { bad('после нахождения k нет фразы «формула теперь выглядит так»'); }
    if (M.form === 'shift') {
      const start = steps.find((item) => item.id === 'start');
      if (!start || !/формула теперь выглядит так/.test(start.blocks.map((b) => b.html || '').join(' '))) {
        bad('у сдвинутого графика нет шага с началом и записью формулы');
      }
    }
    const asked = steps.find((item) => item.id === 'asked');
    const doneTex = asked ? asked.blocks.filter((b) => b.type === 'formula').pop() : null;
    const shown = (answerTex || '').replace(/\\dfrac/g, '\\dfrac');
    if (!doneTex || tail(doneTex.tex) !== tail(shown)) {
      bad(`вычисление не доведено до ответа: ${doneTex ? doneTex.tex : '—'} ≠ ${shown}`);
    }
  }

  for (const step of steps) {
    for (const block of step.blocks) {
      const tex = block.tex || '';
      if (!braces(tex)) { bad(`в шаге «${step.title}» незакрытая формула`); }
      if (/NaN|undefined|Infinity/.test((block.html || '') + tex)) { bad(`в шаге «${step.title}» мусор`); }
    }
  }

  let ladder;
  try { ladder = hints.fromTask(task); } catch (error) { bad(`подсказка не собралась: ${error.message}`); return errors; }
  if (!ladder.length) { bad('подсказка пустая'); }
  let final = null;
  for (const step of ladder) {
    if (!step.questions || !step.questions.length) { bad(`шаг подсказки «${step.title}» без вопросов`); continue; }
    for (const q of step.questions) {
      const right = q.options.filter((o) => o.right);
      if (right.length !== 1) { bad(`«${q.prompt}»: верных вариантов ${right.length}`); }
      if (q.options.length < 2) { bad(`«${q.prompt}»: один вариант`); }
      if (new Set(q.options.map((o) => o.text)).size !== q.options.length) { bad(`«${q.prompt}»: варианты повторяются`); }
      for (const o of q.options) {
        if (!o.right && !o.why) { bad(`«${q.prompt}»: у неверного варианта нет пояснения`); }
        if ((o.text.match(/\$/g) || []).length % 2) { bad(`«${q.prompt}»: незакрытая формула в варианте`); }
        if (/NaN|undefined|Infinity/.test(o.text + (o.why || ''))) { bad(`«${q.prompt}»: мусор в варианте`); }
      }
      final = right[0] || final;
    }
  }
  const finalValue = final && /^\$(-?[\d{},]+)\$$/.exec(final.text);
  if (!finalValue || finalValue[1].replace('{,}', ',') !== task.answer) {
    bad(`последний вопрос подсказки ведёт не к ключу ${task.answer}: ${final ? final.text : '—'}`);
  }
  return errors;
}

export function checkSqrtComposition(set, tasks) {
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
