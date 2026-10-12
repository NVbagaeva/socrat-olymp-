/* scripts/lib/graph-exponential-checks.mjs — правила задач о показательной
   функции. Одни на validate:graph и на test:graph-exponential.

   Проверяется то, что ученик видит и во что верит:
     • ровно две опорные точки, обе в узлах сетки, на кривой и не ближе
       клетки к рамке;
     • асимптота y = d нарисована пунктиром (если не совпадает с осью);
       кривая её не касается: у края окна зазор не меньше CLEARANCE;
     • ОТВЕТ НЕ ЧИТАЕТСЯ С РИСУНКА: спрошенная точка либо за рамкой с
       запасом не меньше клетки, либо её координаты не в узле сетки.
       Задачи открытого банка (source: fipi) — исходные рисунки, к ним
       правило не применяется;
     • ответ — целое число или конечная десятичная дробь (≤ 3 знаков) и
       сходится при подстановке обратно в формулу;
     • на чертеже нет подписей кривых и вспомогательных построений;
     • разбор собирается: перед каждой формулой фраза, двух формул
       подряд нет, после каждого найденного параметра формула выписана
       заново, ответ последнего шага совпадает с ключом;
     • подсказка: в каждом вопросе ровно один верный вариант, у каждого
       неверного есть пояснение, варианты не повторяются, верный
       вариант последнего вопроса — ключ ответа;
     • набор: число задач и уровней как в составе, среди аналогов не
       меньше minDistinctAnswers различных ответов. */

import solution from '../../src/lib/graph/solution-exponential.js';
import hints from '../../src/lib/graph/hints-exponential.js';
import E from '../../src/lib/graph/generate-exponential.js';

const EPS = 1e-9;
const v = (o) => o.p / o.q;
const near = (a, b) => Math.abs(a - b) < 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));

function braces(tex) {
  return (tex.match(/\{/g) || []).length === (tex.match(/\}/g) || []).length;
}

function baseValue(meta) {
  return Math.pow(v(meta.base.r), 1 / meta.base.m);
}

/** Точка в узле сетки и в окне или в клетке от рамки — читается с рисунка. */
function readable(x, y, win) {
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= win.xmin - 1 - EPS &&
    x <= win.xmax + 1 + EPS &&
    y >= win.ymin - 1 - EPS &&
    y <= win.ymax + 1 + EPS
  );
}

export function checkExponentialTask(set, task) {
  const errors = [];
  const M = task.meta;
  const where = `${set.id}/${task.id} (seed ${M.seed})`;
  const bad = (text) => errors.push(`${where}: ${text}`);
  const a = baseValue(M);
  const f = (x) => Math.pow(a, x + M.c) + M.d;
  const W = M.window;
  const fipi = M.source === 'fipi';
  const answer = Number(String(task.answer).replace(',', '.'));

  if (!/^-?\d+(,\d{1,3})?$/.test(task.answer)) {
    bad(`ответ не конечная дробь до трёх знаков: ${task.answer}`);
  }
  if (!near(answer, v(M.answer))) {
    bad('ответ не совпадает с точным значением');
  }
  if (Math.abs(a - 1) < EPS || a <= 0) {
    bad('основание не годится');
  }

  const marks = M.points.filter((p) => p.role === 'mark');
  if (marks.length !== 2) {
    bad(`опорных точек ${marks.length}, нужно две`);
  }
  for (const p of marks) {
    if (!Number.isInteger(p.x) || !Number.isInteger(p.y)) {
      bad(`точка (${p.x}; ${p.y}) не в узле`);
    }
    if (!near(f(p.x), p.y)) {
      bad(`точка (${p.x}; ${p.y}) не на кривой`);
    }
    if (
      !fipi &&
      (p.x < W.xmin + 1 - EPS ||
        p.x > W.xmax - 1 + EPS ||
        p.y < W.ymin + 1 - EPS ||
        p.y > W.ymax - 1 + EPS)
    ) {
      bad(`точка (${p.x}; ${p.y}) у самой рамки`);
    }
  }
  if (M.d < W.ymin + 1 - EPS || M.d > W.ymax - 1 + EPS) {
    bad('асимптота у рамки или за ней');
  }
  if (!fipi) {
    const gap = E.tailGap(E.fromMeta(M).curve, W);
    if (gap < E.CLEARANCE - EPS) {
      bad(`хвост сливается с асимптотой: зазор ${gap.toFixed(3)} клетки`);
    }
  }
  if (M.d !== 0 && !/stroke-dasharray/.test(task.svg)) {
    bad('асимптота не нарисована пунктиром');
  }
  if (/y = f\(x\)|<tspan[^>]*>f<\/tspan>/.test(task.svg)) {
    bad('на чертеже подпись кривой');
  }

  if (M.query) {
    if (M.query.type === 'value-at') {
      const x0 = v(M.query.x0);
      if (!near(f(x0), answer)) {
        bad('f(x₀) не равно ответу');
      }
      if (!fipi && readable(x0, answer, W)) {
        bad(`ответ читается с рисунка: (${x0}; ${answer})`);
      }
    } else {
      const y0 = v(M.query.y0);
      if (!near(f(answer), y0)) {
        bad('f(ответ) не равно заданному значению');
      }
      if (!fipi && readable(answer, y0, W)) {
        bad(`ответ читается с рисунка: (${answer}; ${y0})`);
      }
    }
  }
  if (M.rule === 'coef-a' && !near(a, answer)) {
    bad('a не равно ответу');
  }
  if (M.rule === 'coef-b' && !near(M.form === 'shiftX' ? M.c : M.d, answer)) {
    bad('b не равно ответу');
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
        if (/(=|\\Rightarrow\\?;?)\s*$/.test(block.tex)) {
          bad(`в шаге «${step.title}» формула оборвана: ${block.tex}`);
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
    return s ? s.blocks.map((b) => b.html || '').join(' ') : '';
  };
  if (!/на глаз не угадываем/.test(stepText('points'))) {
    bad('в разборе нет правила «на глаз не угадываем»');
  }
  if (!/как теперь выглядит формула/.test(stepText('a'))) {
    bad('после нахождения a формула не выписана заново');
  }
  if (M.form !== 'basic' && !/Формула теперь полностью известна/.test(stepText('b'))) {
    bad('после нахождения b формула не выписана заново');
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
    }
  }
  const final = ladder[ladder.length - 1].questions[0];
  const finalRight = final.options.find((o) => o.right);
  if (!finalRight || !near(Number(finalRight.key.replace('n=', '')), answer)) {
    bad('верный вариант последнего вопроса подсказки — не ключ ответа');
  }
  return errors;
}

export function checkExponentialComposition(set, tasks) {
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
      errors.push(
        `${where}: различных ответов ${distinct} из ${analogs.length}, нужно не меньше ${comp.minDistinctAnswers}`,
      );
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
  /* Рисунок повторяется не чаще, чем разрешает набор. */
  const pics = {};
  for (const t of analogs) {
    const key = JSON.stringify([
      t.meta.base,
      t.meta.c,
      t.meta.d,
      t.meta.points.map((p) => [p.x, p.y]),
    ]);
    pics[key] = (pics[key] || 0) + 1;
  }
  const limit = set.uniqueVertices ? 1 : set.maxVertexRepeat || Infinity;
  const worst = Math.max(0, ...Object.values(pics));
  if (worst > limit) {
    errors.push(`${where}: один рисунок повторяется ${worst} раз`);
  }
  return errors;
}
