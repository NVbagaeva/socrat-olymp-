#!/usr/bin/env node
/* scripts/check-quadratic-hints.mjs — подсказки тренажёра «Парабола».

   Строит все наборы подтемы (опорные и прототипы) на серии seed и для
   каждой задачи проверяет подсказку (lib/graph/hints-quadratic.js):

     1. Шаги те же, что в полном решении: номер и название.
     2. Ветка выбрана верно: «вершина в узле?» и «c видно по графику?»
        сверяются с чертежом, посчитанным здесь заново.
     3. В каждом вопросе с кнопками верный вариант ровно один, тексты
        не повторяются, у каждого неверного есть пояснение.
     4. Подсказка ведёт к ответу из ключа: последнее поле (или выбор
        корня) — ответ задачи; у вопросов о коэффициенте — поле этого
        коэффициента; у знака a — кнопка с направлением ветвей.
     5. Плохой случай: предупреждения о тождестве и о точке из той же
        пары есть, их точки не числятся верными, а ключ — не ловушка.
     6. На чертеже задачи (он же в листе ученика) вспомогательной
        системы координат нет; на чертеже шага 3а и листа учителя — есть.

   Запуск: pnpm test:quadratic-hints [--seeds N]   (по умолчанию 20) */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import generator from '../src/lib/graph/generate.js';
import Hints from '../src/lib/graph/hints-quadratic.js';
import Solution from '../src/lib/graph/solution-quadratic.js';
import Aux from '../src/lib/graph/quadratic-aux.js';

const args = process.argv.slice(2);
const seeds = args.includes('--seeds') ? Number(args[args.indexOf('--seeds') + 1]) : 20;

const ROOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'lib',
  'graph',
  'data',
);
function readSets(dir) {
  const full = path.join(ROOT, dir);
  return fs
    .readdirSync(full)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(full, name), 'utf8')));
}

const PREP = readSets(path.join('prep', '12q'));
const PROTO = readSets(path.join('prototypes', '12q'));
generator.setSets({ prep: PREP, prototypes: PROTO });

function parse(text) {
  const clean = String(text).replace(/[−–]/g, '-').replace(',', '.').trim();
  const parts = clean.split('/');
  return parts.length === 2 ? Number(parts[0]) / Number(parts[1]) : Number(clean);
}
const same = (a, b) => Math.abs(parse(a) - parse(b)) < 1e-9;

/* Ветки — заново, по чертежу. */
function vertexInNode(meta) {
  const win = meta.window;
  return (
    Number.isInteger(meta.m) &&
    Number.isInteger(meta.n) &&
    meta.m > win.xmin &&
    meta.m < win.xmax &&
    meta.n > win.ymin &&
    meta.n < win.ymax
  );
}
function interceptOnChart(meta) {
  return Number.isInteger(meta.c) && Math.abs(meta.c) <= meta.window.ymax - 1;
}

const problems = new Map();
function note(label, item) {
  if (!problems.has(label)) {
    problems.set(label, []);
  }
  const list = problems.get(label);
  if (list.length < 4) {
    list.push(item);
  }
}

let tasks = 0;
let choices = 0;
let traps = 0;
let badCase = 0;
let auxCharts = 0;
const types = new Set();
for (const set of PREP.concat(PROTO)) {
  for (let run = 0; run < seeds; run++) {
    const seed = run === 0 ? set.seed : set.seed * 1000 + run;
    let built;
    try {
      built = generator.generateSet(set.id, seed);
    } catch {
      continue;
    }
    for (const task of built) {
      tasks += 1;
      const meta = task.meta;
      types.add(meta.rule);
      const where = `${task.id} (seed ${seed})`;
      let hints;
      try {
        hints = Hints.fromTask(task);
      } catch (error) {
        note('подсказка не строится', `${where}: ${error.message}`);
        continue;
      }
      const solution = Solution.fromTask(task);

      /* 1. Номер и название — как в решении. */
      hints.forEach((hint, i) => {
        const sol = solution[i];
        if (!sol || sol.id !== hint.id || sol.number !== hint.number || sol.title !== hint.title) {
          note(
            'шаг подсказки не совпадает с шагом решения',
            `${where}: ${hint.number}. ${hint.title}`,
          );
        }
      });

      for (const hint of hints) {
        hint.parts.forEach((part) => {
          if (part.kind !== 'choice') {
            return;
          }
          choices += 1;
          const rights = part.options.filter((o) => o.right);
          if (rights.length !== 1) {
            note('верный вариант не один', `${where}: ${part.prompt}`);
          }
          const texts = part.options.map((o) => o.text);
          if (new Set(texts).size !== texts.length) {
            note('варианты повторяются', `${where}: ${texts.join(' / ')}`);
          }
          part.options.forEach((o) => {
            if (!o.right && !o.why) {
              note('у неверного варианта нет пояснения', `${where}: ${o.text}`);
            }
          });
        });
      }

      /* 2. Ветки. */
      const vertex = hints.find((h) => h.id === 'vertex');
      if (vertex) {
        const right = vertex.parts[0].options.find((o) => o.right);
        const want = vertexInNode(meta) ? 'yes' : 'no';
        if (!right || right.key !== want) {
          note(
            'ветка «вершина в узле» выбрана неверно',
            `${where}: ${right && right.key} вместо ${want}`,
          );
        }
      }
      const intercept = hints.find((h) => h.id === 'intercept');
      if (intercept) {
        const right = intercept.parts[1].options.find((o) => o.right);
        const want = interceptOnChart(meta) ? 'yes' : 'no';
        if (!right || right.key !== want) {
          note(
            'ветка «c видно по графику» выбрана неверно',
            `${where}: ${right && right.key} вместо ${want}`,
          );
        }
        const value = intercept.parts[2];
        if (want === 'yes' && (!value || !same(value.fields[0].answer, meta.c))) {
          note('ключ c', `${where}`);
        }
      }

      /* 4. Подсказка ведёт к ответу из ключа. */
      const fieldsOf = (label) =>
        hints
          .flatMap((h) => h.parts)
          .filter((p) => p.kind === 'fields')
          .flatMap((p) => p.fields)
          .filter((f) => f.label === label);
      const lastHint = hints[hints.length - 1];
      const lastPart = lastHint.parts[lastHint.parts.length - 1];
      const rule = meta.rule;
      if (rule === 'sign-a') {
        const right = hints[0].parts[0].options.find((o) => o.right);
        const up = /a\s*>\s*0/.test(task.answer) || parse(meta.a) > 0;
        if (right.key !== (up ? 'up' : 'down') || hints.length !== 1) {
          note('знак a', `${where}`);
        }
      } else if (rule === 'a' || rule === 'b' || rule === 'c') {
        const got = fieldsOf(rule + ' =');
        if (!got.some((f) => same(f.answer, task.answer))) {
          note(
            `подсказка не доходит до ключа ${rule}`,
            `${where}: ${got.map((f) => f.answer).join(', ')} / ${task.answer}`,
          );
        }
      } else if (rule === 'equation-choice') {
        if (lastHint.id !== 'formula') {
          note('подсказка к выбору формулы кончается не на формуле', `${where}`);
        }
      } else if (lastPart.kind === 'fields') {
        const f = lastPart.fields[lastPart.fields.length - 1];
        if (!same(f.answer, task.answer)) {
          note('последнее поле не совпадает с ключом', `${where}: ${f.answer} / ${task.answer}`);
        }
      } else {
        const right = lastPart.options.find((o) => o.right);
        if (!right || !same(right.key.replace(/^x=/, ''), task.answer)) {
          note(
            'выбор корня не совпадает с ключом',
            `${where}: ${right && right.key} / ${task.answer}`,
          );
        }
      }

      /* 5. Плохой случай: ловушки. */
      const sub = hints.find((h) => h.id === 'b' && h.parts[0].traps);
      if (sub) {
        badCase += 1;
        const part = sub.parts[0];
        const key = part.fields.map((f) => f.answer);
        const variants = [key].concat(part.variants || []);
        part.traps.forEach((trap) => {
          traps += 1;
          if (variants.some((v) => v.every((x, i) => same(x, trap.values[i])))) {
            note('ловушка числится верной точкой', `${where}: (${trap.values.join('; ')})`);
          }
        });
        if (interceptOnChart(meta) && !part.traps.some((t) => /тождество/.test(t.why))) {
          note('нет предупреждения о тождестве', `${where}`);
        }
        /* Обе точки пары, по которой нашли ось, — ловушки: «в паре» или,
           если пара — это (0; c) и симметричная ей, «тождество». */
        const pair = solution.find((st) => st.id === 'slope').facts.pair || [];
        pair.forEach((pt) => {
          if (!part.traps.some((t) => same(t.values[0], pt.x) && same(t.values[1], pt.y))) {
            note('нет предупреждения о точке из той же пары', `${where}: (${pt.x}; ${pt.y})`);
          }
        });
      }

      /* 6. Вспомогательная система: только там, где ей место. */
      if (task.svg && task.svg.includes(Aux.AUX_CLASS)) {
        note('на чертеже задачи есть вспомогательная система', `${where}`);
      }
      const slope = hints.find((h) => h.id === 'slope');
      if (slope && slope.chart === 'aux') {
        auxCharts += 1;
        if (!slope.reminder || !/a = 1/.test(slope.reminder)) {
          note('нет приёма «на 1 вбок — на 1 вверх» на шаге 3а', `${where}`);
        }
        const svg = Aux.auxSvg(meta, null);
        if (!svg || !svg.includes(Aux.AUX_CLASS) || !Aux.hasAux(meta)) {
          note('в шаге 3а нет вспомогательной системы', `${where}`);
        }
      }
      if (Aux.hasAux(meta) !== vertexInNode(meta)) {
        note('лист учителя: условие вспомогательной системы расходится с веткой', `${where}`);
      }
    }
  }
}

console.log(
  `Подсказки «Парабола»: задач ${tasks}, типов ${types.size}, вопросов с кнопками ${choices}, ` +
    `плохой случай ${badCase} (ловушек ${traps}), чертежей со вспомогательной системой ${auxCharts}.`,
);
if (problems.size > 0) {
  console.error(`\nПодсказки (${problems.size}):`);
  for (const [label, list] of problems) {
    console.error('  ✗ ' + label);
    list.forEach((item) => console.error('      ' + item));
  }
  process.exit(1);
}
console.log(
  'Шаги совпадают с решением, ветки верны, подсказки доходят до ключа, ловушки на месте.',
);
