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
const basics = requireSrc('lib/quadraticBasics.ts');
const { prepSkillsFor } = requireSrc('content/prepSkills.ts');
const GD0 = requireSrc('lib/graph/data/index.js');
const GD = GD0.default ?? GD0;
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
  if (basics.BASIC_EXAMPLES[id] !== undefined) continue;
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

/* ── Основные типы: знак a, a, c, b, формула, значение, аргумент ───── */
const RULE_OF_KIND = {
  sign: 'sign-a',
  a: 'a',
  c: 'c',
  b: 'b',
  formula: 'equation-choice',
  value: 'value-at',
  argument: 'argument-for',
};
const WHY = {
  sign: 'ответ — знак, а не число: определяется по ветвям; вершина ниже оси — ловушка',
  a: 'a не целое: шаг в клетку от вершины не попадает в узел',
  c: 'пересечение с Oy за рамкой (не ближе клетки)',
  b: 'b — не координата ни одной точки графика: считается по вершине',
  formula: 'c не в узле сетки, b не читается: различают знак a, вершина, точка',
};
const fmtQ = (q) => {
  const num = (v) => String(v).replace('.', ',');
  const terms = [
    [q.a, 'x²'],
    [q.b, 'x'],
    [q.c, ''],
  ].filter(([v]) => v !== 0);
  const body = terms
    .map(([v, tail], k) => {
      const abs = Math.abs(v) === 1 && tail !== '' ? '' : num(Math.abs(v));
      return k === 0 ? `${v < 0 ? '−' : ''}${abs}${tail}` : ` ${v < 0 ? '−' : '+'} ${abs}${tail}`;
    })
    .join('');
  return `y = ${body}`;
};

const table = [];
let basicExamples = 0;
for (const form of QUADRATIC_TYPES) {
  const id = form.analysis?.id;
  const list = id ? basics.BASIC_EXAMPLES[id] : undefined;
  if (!list) continue;
  if (list.length !== form.analysis.examples.length) {
    problems.push(
      `${id}: примеров в тексте ${form.analysis.examples.length}, в числах ${list.length}`,
    );
    continue;
  }
  list.forEach((ex, i) => {
    basicExamples += 1;
    const where = `${id}, пример ${i + 1}`;
    const text = form.analysis.examples[i];
    if (text.figure !== ex.figure)
      problems.push(`${where}: рисунок ${text.figure}, а в числах ${ex.figure}`);
    const w = ex.window;

    /* Отмеченные точки — узлы сетки на параболе; первая — вершина. */
    ex.marks.forEach(([x, y]) => {
      if (!isInt(x) || !isInt(y)) problems.push(`${where}: отметка (${x}; ${y}) не в узле сетки`);
      if (!near(basics.valueAt(ex.f, x), y))
        problems.push(`${where}: отметка (${x}; ${y}) не на параболе`);
    });
    const [m, n] = ex.marks[0];
    if (!near(-ex.f.b / (2 * ex.f.a), m) || !near(basics.valueAt(ex.f, m), n)) {
      problems.push(`${where}: первая отметка (${m}; ${n}) — не вершина`);
    }

    /* a независимо — шагом от вершины по второй отметке. */
    let aStep = null;
    if (ex.marks.length > 1) {
      const [x, y] = ex.marks[1];
      aStep = (y - n) / ((x - m) * (x - m));
      if (!near(aStep, ex.f.a))
        problems.push(`${where}: a по шагу от вершины ${aStep}, в числах ${ex.f.a}`);
    }

    /* Ответ — пересчётом, не из готового поля. */
    let want;
    let sought = null;
    if (ex.kind === 'sign') want = Math.sign(ex.f.a);
    else if (ex.kind === 'a') want = aStep;
    else if (ex.kind === 'c') want = basics.valueAt(ex.f, 0);
    else if (ex.kind === 'b') want = -2 * 1 * m;
    else if (ex.kind === 'formula') want = ex.correct + 1;
    else if (ex.kind === 'value') {
      want = ex.f.a * (ex.x0 - m) ** 2 + n;
      sought = { x: ex.x0, y: want, coord: want, axis: 'y' };
    } else {
      const d = Math.sqrt((ex.y0 - n) / ex.f.a);
      want = ex.pick === 'greater' ? m + d : m - d;
      sought = { x: want, y: ex.y0, coord: want, axis: 'x' };
      if (!near(ex.f.a * (want - m) ** 2 + n, ex.y0))
        problems.push(`${where}: корень не обращает f в y₀`);
    }
    if (!near(want, ex.answer)) problems.push(`${where}: пересчёт ${want}, в числах ${ex.answer}`);
    if (ex.kind === 'b' && ex.f.a !== 1)
      problems.push(`${where}: в условии y = x² + bx + c, а a = ${ex.f.a}`);
    if (ex.kind === 'b' && !near(ex.f.b, want))
      problems.push(`${where}: b = ${ex.f.b}, по вершине ${want}`);

    /* Ответ в тексте разбора. */
    if (ex.kind === 'sign') {
      const mark = ex.answer > 0 ? '> 0' : '< 0';
      if (!text.answer.includes(mark))
        problems.push(`${where}: в ответе ${text.answer}, ждали ${mark}`);
    } else if (ex.kind === 'formula') {
      if (!text.answer.startsWith(String(ex.correct + 1)))
        problems.push(`${where}: в ответе ${text.answer}`);
    } else if (!near(texNumber(text.answer), ex.answer)) {
      problems.push(`${where}: в ответе ${text.answer}, по расчёту ${ex.answer}`);
    }

    /* Формула по графику: верный вариант один, остальные не проходят. */
    if (ex.kind === 'formula') {
      ex.options.forEach((q, k) => {
        const fits = ex.marks.every(([x, y]) => near(basics.valueAt(q, x), y));
        if (fits !== (k === ex.correct))
          problems.push(`${where}: вариант ${k + 1} ${fits ? 'подходит' : 'не подходит'}`);
      });
      const cond = text.condition;
      ex.options.forEach((q, k) => {
        const shown = `${k + 1}) $${fmtQ(q).replace('y = ', 'y = ').replace(/,/g, '{,}').replace(/−/g, '-').replace(/x²/g, 'x^2')}$`;
        if (!cond.replace(/\s/g, '').includes(shown.replace(/\s/g, '')))
          problems.push(`${where}: вариант ${k + 1} в условии не совпадает с числами (${shown})`);
      });
    }

    /* Ответ с рисунка не читается. */
    let why = WHY[ex.kind];
    if (ex.kind === 'sign' && !(n < 0 && ex.f.a > 0))
      problems.push(`${where}: нет ловушки (вершина ниже Ox, a > 0)`);
    if (ex.kind === 'a' && isInt(ex.f.a))
      problems.push(`${where}: a целое — читается шагом в клетку`);
    if (ex.kind === 'b') {
      const coords = ex.marks.flat();
      if (coords.some((v) => near(v, want)))
        problems.push(`${where}: b совпало с координатой отметки`);
    }
    if (ex.kind === 'formula' && isInt(ex.f.c))
      problems.push(`${where}: c в узле — читается с сетки`);
    if (ex.kind === 'c') {
      if (!H.isPointHidden({ x: 0, y: want }, w))
        problems.push(`${where}: точка (0; ${want}) видна в окне`);
      why += `: (0; ${want}), окно по y до ${w.ymax}`;
    }
    if (sought !== null) {
      const hidden = H.isPointHidden({ x: sought.x, y: sought.y }, w);
      const inside =
        sought.x > w.xmin && sought.x < w.xmax && sought.y > w.ymin && sought.y < w.ymax;
      if (!hidden && !inside) problems.push(`${where}: точка у рамки`);
      if (!hidden && isInt(sought.coord))
        problems.push(
          `${where}: точка в окне, и ${sought.axis} = ${sought.coord} читается с сетки`,
        );
      why = hidden
        ? `точка (${sought.x}; ${sought.y}) за рамкой, не ближе клетки`
        : `точка (${sought.x}; ${sought.y}) в окне, но ${sought.axis} = ${sought.coord} не на линии сетки`;
    }

    /* SVG: нет маркера на искомой точке; пунктиры только при точке в окне. */
    const fig = theoryFigure(ex.figure);
    const cell = fig.scene.cell ?? R.THEME.geometry.cell;
    const svg = R.renderGraph(fig.scene);
    const toX = (px) => w.xmin + (px - PAD) / cell;
    const toY = (py) => w.ymax - (py - PAD) / cell;
    if (sought !== null) {
      for (const c of svg.matchAll(/<circle[^>]*cx="([-\d.]+)"[^>]*cy="([-\d.]+)"/g)) {
        if (Math.hypot(toX(Number(c[1])) - sought.x, toY(Number(c[2])) - sought.y) < 0.15) {
          problems.push(`${where}: на искомой точке маркер`);
        }
      }
      const dashes = [
        ...svg.matchAll(
          /<path[^>]*d="M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)"[^>]*stroke-dasharray/g,
        ),
      ];
      const hidden = H.isPointHidden({ x: sought.x, y: sought.y }, w);
      if (hidden && dashes.length > 0) problems.push(`${where}: точка за рамкой, а пунктиры есть`);
      if (!hidden && dashes.length < 2)
        problems.push(`${where}: точка в окне, а пунктиров ${dashes.length}`);
      /* Конец пунктира на оси — искомая координата — не в узле сетки. */
      for (const d of dashes) {
        const ends = [
          [toX(Number(d[1])), toY(Number(d[2]))],
          [toX(Number(d[3])), toY(Number(d[4]))],
        ];
        for (const [x, y] of ends) {
          const onAxis = sought.axis === 'y' ? near(x, 0, 0.02) : near(y, 0, 0.02);
          const c = sought.axis === 'y' ? y : x;
          if (onAxis && near(c, sought.coord, 0.02) && isInt(Math.round(c * 100) / 100))
            problems.push(
              `${where}: пунктир кончается в узле сетки (${x.toFixed(2)}; ${y.toFixed(2)})`,
            );
        }
      }
    }
    table.push([
      id,
      i + 1,
      fmtQ(ex.f),
      ex.kind === 'sign'
        ? ex.answer > 0
          ? 'a > 0'
          : 'a < 0'
        : ex.kind === 'formula'
          ? `вариант ${ex.answer}`
          : String(ex.answer).replace('.', ','),
      why,
    ]);
  });
}

/* Ярлыки основных типов: свой набор опорных P12Q-n и ярлык тренажёра. */
const prepOf = new Map(prepSkillsFor('quadratic').map((skill) => [skill.id, skill.setId]));
const allSets = [...GD.prep, ...GD.prototypes];
const TRAINER_SET = {
  'sign-a': '12Q.A',
  'value-a': '12Q.B',
  'value-c': '12Q.C',
  'value-b': '12Q.D',
  formula: '12Q.G',
  'value-at': '12Q.E',
  'argument-for': '12Q.F',
};
for (const form of QUADRATIC_TYPES) {
  const a = form.analysis;
  const list = a ? basics.BASIC_EXAMPLES[a.id] : undefined;
  if (!list) continue;
  const rule = RULE_OF_KIND[list[0].kind];
  const setId = prepOf.get(a.prep);
  const prep = allSets.find((set) => set.id === setId);
  if (!prep) problems.push(`${a.id}: нет набора опорных для «${a.prep}»`);
  else if (!prep.tasks.every((task) => task.answerRule === rule))
    problems.push(`${a.id}: набор ${setId} — не только правило ${rule}`);
  const trainer = findTrainerShortcut('quadratic', a.trainer);
  if (!trainer || trainer.skills.join() !== TRAINER_SET[a.id])
    problems.push(`${a.id}: ярлык тренажёра ${a.trainer} ведёт не в ${TRAINER_SET[a.id]}`);
  else {
    const set = allSets.find((item) => item.id === TRAINER_SET[a.id]);
    if (!set.tasks.every((task) => task.answerRule === rule))
      problems.push(`${a.id}: набор ${TRAINER_SET[a.id]} — не только правило ${rule}`);
  }
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
  if (!id || basics.BASIC_EXAMPLES[form.analysis.id] !== undefined) continue;
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

console.log(`разборов пересечений проверено: ${examples}, основных типов: ${basicExamples}`);
console.log('\nтип | № | функция | ответ | почему не читается');
table.forEach((row) => console.log('  ' + row.join(' | ')));
console.log('');
links.forEach((line) => console.log('  ' + line));
if (problems.length > 0) {
  console.log(`\nРАСХОЖДЕНИЯ (${problems.length}):`);
  problems.slice(0, 40).forEach((p) => console.log('  • ' + p));
  process.exit(1);
}
console.log('расхождений: 0 — всё чисто');
