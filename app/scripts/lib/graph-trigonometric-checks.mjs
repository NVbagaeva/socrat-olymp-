/* scripts/lib/graph-trigonometric-checks.mjs — правила задач о
   тригонометрических функциях. Одни на validate:graph и на
   test:graph-trigonometric.

   Проверяется то, что ученик видит и во что верит:
     • ровно две опорные точки, обе в узлах сетки, на кривой и не ближе
       клетки к рамке; значения функции в них — −1, 0 или 1;
     • у косинуса и синуса вся волна в окне с запасом в клетку; у
       тангенса асимптоты нарисованы пунктиром, у рамок ветвь отстоит
       от асимптоты не меньше чем на CLEARANCE клетки;
     • ОТВЕТ НЕ ЧИТАЕТСЯ С РИСУНКА: у аналогов ответ не совпадает ни с
       одной координатой отмеченных точек. Задачи открытого банка
       (source: fipi) — исходные рисунки, к ним правило не применяется;
     • ответ — целое число или конечная десятичная дробь и равен a или b;
     • на чертеже подписаны π и единица, подписей кривых нет;
     • разбор собирается: перед каждой формулой фраза, двух формул
       подряд нет, после каждого найденного параметра формула выписана
       заново, ответ последнего шага совпадает с ключом;
     • подсказка: в каждом вопросе ровно один верный вариант, у каждого
       неверного есть пояснение, верный вариант последнего вопроса —
       ключ ответа;
     • набор: число задач и уровней как в составе, среди аналогов не
       меньше minDistinctAnswers различных ответов, рисунки не
       повторяются. */

import solution from '../../src/lib/graph/solution-trigonometric.js';
import hints from '../../src/lib/graph/hints-trigonometric.js';
import T from '../../src/lib/graph/generate-trigonometric.js';

const EPS = 1e-9;
const v = (o) => o.p / o.q;
const near = (a, b) => Math.abs(a - b) < 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));

function braces(tex) {
  return (tex.match(/\{/g) || []).length === (tex.match(/\}/g) || []).length;
}

export function checkTrigonometricTask(set, task) {
  const errors = [];
  const M = task.meta;
  const where = `${set.id}/${task.id} (seed ${M.seed})`;
  const bad = (text) => errors.push(`${where}: ${text}`);
  const W = M.window;
  const fipi = M.source === 'fipi';
  const answer = Number(String(task.answer).replace(',', '.'));
  const a = v(M.a), b = v(M.b), yu = v(M.yu);
  const cv = T.fromMeta(M).curve;

  if (!/^-?\d+(,\d{1,2})?$/.test(task.answer)) {
    bad(`ответ не конечная дробь: ${task.answer}`);
  }
  if (!near(answer, v(M.answer))) {
    bad('ответ не совпадает с точным значением');
  }
  if (!near(answer, M.rule === 'coef-a' ? a : b)) {
    bad('ответ не равен спрошенному параметру');
  }
  if (a === 0) {
    bad('a = 0 — функция постоянна');
  }

  const marks = M.points.filter((p) => p.role === 'mark');
  if (marks.length !== 2) {
    bad(`опорных точек ${marks.length}, нужно две`);
  }
  for (const p of marks) {
    if (!Number.isInteger(p.X) || !Number.isInteger(p.Y)) {
      bad(`точка (${p.X}; ${p.Y}) не в узле`);
    }
    if (T.unitValue(M.fn, p.X) !== p.v) {
      bad(`в точке X = ${p.X} значение функции не ${p.v}`);
    }
    if (!near(T.cellValue(cv, p.X), p.Y)) {
      bad(`точка (${p.X}; ${p.Y}) не на кривой`);
    }
    if (!fipi && (p.X < W.xmin + 1 - EPS || p.X > W.xmax - 1 + EPS || p.Y < W.ymin + 1 - EPS || p.Y > W.ymax - 1 + EPS)) {
      bad(`точка (${p.X}; ${p.Y}) у самой рамки`);
    }
    if (!fipi && near(p.Y * yu, answer)) {
      bad(`ответ читается с рисунка: ордината точки X = ${p.X}`);
    }
  }
  if (!fipi && !T.waveFits(cv, W)) {
    bad('волна не помещается в окно с запасом');
  }
  if (M.fn === 'tg') {
    if (T.tailGap(cv, W) < T.CLEARANCE - EPS) {
      bad(`ветвь сливается с асимптотой: зазор ${T.tailGap(cv, W).toFixed(3)} клетки`);
    }
    if (!/stroke-dasharray/.test(task.svg)) {
      bad('асимптоты тангенса не нарисованы пунктиром');
    }
  }
  if (W.xmin < 4 && W.xmax > 4 && !/π/.test(task.svg)) {
    bad('на оси x не подписано π');
  }
  if (/y = f\(x\)|<tspan[^>]*>f<\/tspan>/.test(task.svg)) {
    bad('на чертеже подпись кривой');
  }

  let steps;
  try {
    steps = solution.fromTask(task);
  } catch (error) {
    bad(`разбор не собрался: ${error.message}`);
    return errors;
  }
  const last = steps[steps.length - 1].blocks.find((block) => block.type === 'answer');
  if (!last || last.text.replace('−', '-') !== task.answer) {
    bad(`ответ разбора ${last ? last.text : '—'} не совпадает с ключом ${task.answer}`);
  }
  for (const step of steps) {
    if (step.blocks[0].type !== 'text') {
      bad(`шаг «${step.title}» начинается с формулы без слов`);
    }
    let previous = null;
    for (const block of step.blocks) {
      if (block.type === 'formula') {
        if (previous && previous.type === 'formula') {
          bad(`в шаге «${step.title}» две формулы подряд без фразы`);
        }
        if (!braces(block.tex)) {
          bad(`в шаге «${step.title}» скобки не закрыты: ${block.tex}`);
        }
        if (/NaN|undefined|Infinity|null/.test(block.tex)) {
          bad(`в шаге «${step.title}» мусор в формуле: ${block.tex}`);
        }
      }
      if (block.type === 'text' && /NaN|undefined|Infinity|null/.test(block.html)) {
        bad(`в шаге «${step.title}» мусор в тексте`);
      }
      previous = block;
    }
  }
  const stepText = (id) => {
    const s = steps.find((item) => item.id === id);
    return s ? s.blocks.map((x) => x.html || '').join(' ') : '';
  };
  if (!/на глаз не угадываем/.test(stepText('points'))) {
    bad('в разборе нет правила «на глаз не угадываем»');
  }
  if (!/как теперь выглядит формула/.test(stepText('b'))) {
    bad('после нахождения b формула не выписана заново');
  }
  if (!/Формула теперь полностью известна/.test(stepText('a'))) {
    bad('после нахождения a формула не выписана заново');
  }
  if (!/Проверка по графику/.test(stepText('answer'))) {
    bad('нет проверки по графику');
  }

  let ladder;
  try {
    ladder = hints.fromTask(task);
  } catch (error) {
    bad(`подсказка не собралась: ${error.message}`);
    return errors;
  }
  if (ladder.length !== steps.length) {
    bad('шагов подсказки не столько, сколько шагов разбора');
  }
  for (const hint of ladder) {
    for (const q of hint.questions) {
      const right = q.options.filter((o) => o.right);
      if (right.length !== 1) {
        bad(`в вопросе «${q.prompt}» верных вариантов ${right.length}`);
      }
      if (q.options.length < 2) {
        bad(`в вопросе «${q.prompt}» меньше двух вариантов`);
      }
      if (q.options.some((o) => !o.right && !o.why)) {
        bad(`в вопросе «${q.prompt}» неверный вариант без пояснения`);
      }
      if (new Set(q.options.map((o) => o.key)).size !== q.options.length) {
        bad(`в вопросе «${q.prompt}» повтор варианта`);
      }
      if (new Set(q.options.map((o) => o.text)).size !== q.options.length) {
        bad(`в вопросе «${q.prompt}» два варианта с одинаковым текстом`);
      }
    }
  }
  const final = ladder[ladder.length - 1].questions[0];
  const finalRight = final.options.find((o) => o.right);
  if (!finalRight || !near(Number(finalRight.key.replace('n=', '')), answer)) {
    bad('верный вариант последнего вопроса подсказки — не ключ ответа');
  }
  return errors;
}

export function checkTrigonometricComposition(set, tasks) {
  const errors = [];
  const where = `${set.id} (seed ${tasks[0] ? tasks[0].meta.seed : '?'})`;
  const comp = set.composition || {};
  if (comp.count !== undefined && tasks.length !== comp.count) {
    errors.push(`${where}: задач ${tasks.length} вместо ${comp.count}`);
  }
  const analogs = tasks.filter((t) => t.meta.source !== 'fipi');
  if (comp.analogs !== undefined && analogs.length !== comp.analogs) {
    errors.push(`${where}: аналогов ${analogs.length} вместо ${comp.analogs}`);
  }
  if (comp.minDistinctAnswers !== undefined) {
    const distinct = new Set(analogs.map((t) => t.answer)).size;
    if (distinct < comp.minDistinctAnswers) {
      errors.push(`${where}: различных ответов ${distinct} из ${analogs.length}, нужно не меньше ${comp.minDistinctAnswers}`);
    }
  }
  if (comp.levels) {
    for (const [level, count] of Object.entries(comp.levels)) {
      const got = analogs.filter((t) => t.level === level).length;
      if (got !== count) {
        errors.push(`${where}: уровня ${level} ${got} вместо ${count}`);
      }
    }
  }
  const pics = {};
  for (const t of analogs) {
    const key = JSON.stringify([t.meta.fn, t.meta.a, t.meta.b, t.meta.yu]);
    pics[key] = (pics[key] || 0) + 1;
  }
  const limit = set.uniqueVertices ? 1 : set.maxVertexRepeat || Infinity;
  const worst = Math.max(0, ...Object.values(pics));
  if (worst > limit) {
    errors.push(`${where}: один рисунок повторяется ${worst} раз`);
  }
  return errors;
}
