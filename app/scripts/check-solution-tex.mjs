#!/usr/bin/env node
/* scripts/check-solution-tex.mjs — запись подстановки в решениях №12.

   Решения на листе учителя (краткие у прямой и параболы, по шагам у
   гиперболы и графика корня) и разборы тренажёра собирает движок разборов
   (lib/graph/solution*.js). Проверка строит задачи всех наборов
   подтем на серии seed, берёт формулы каждого шага разбора и ищет
   записи, которых в решении быть не должно:

     f((−5))      — двойные скобки: аргумент функции в скобках уже стоит;
     … + (−3)     — прибавление отрицательного: пишется «… − 3»;
     1 · x, (−1) · x — умножение на 1 и на −1 не пишется;
     c : 1, c : (−1) — и деление на них тоже;
     k = −1       — у прямой k без вывода через треугольник: итог шага
                    «Находим k» — k = tg α = \dfrac{4}{4} = 1 или
                    k = −tg(180° − α) = −\dfrac{6}{3} = −2.

   Плюс то, что лист учителя печатает краткое решение дробью \dfrac
   (крупной), а не строчной.

   Запуск: pnpm test:solution-tex [--seeds N]   (по умолчанию 40) */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import generator from '../src/lib/graph/generate.js';
import solutionBuilder from '../src/lib/graph/solution.js';
import quadraticBuilder from '../src/lib/graph/solution-quadratic.js';
import rationalSolution from '../src/lib/graph/solution-rational.js';
import sqrtBuilder from '../src/lib/graph/solution-sqrt.js';
import { variantAnswersItems } from '../src/lib/sheet/answers12.js';

const args = process.argv.slice(2);
const seeds = args.includes('--seeds') ? Number(args[args.indexOf('--seeds') + 1]) : 40;

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
  return fs.existsSync(full)
    ? fs
        .readdirSync(full)
        .filter((name) => name.endsWith('.json'))
        .sort()
        .map((name) => JSON.parse(fs.readFileSync(path.join(full, name), 'utf8')))
    : [];
}

/* Запрещённые записи. Минус в TeX — дефис. */
const RULES = [
  ['двойные скобки', /\(\s*\(|\\left\(\s*\\left\(/],
  ['прибавление отрицательного «+ (−»', /\+\s*(?:\(|\\left\()\s*-/],
  ['умножение на 1', /(?:^|[=+\-(\s{])1\s*\\cdot/],
  ['деление на 1 или −1', /:\s*(?:1|\(\s*-\s*1\s*\))(?![\d{])/],
  ['умножение на −1', /\(\s*-\s*1\s*\)\s*\\cdot|(?:^|[=+(\s{])-\s*1\s*\\cdot/],
];

/* Гипербола: k = x · y — произведение координат точки графика, а не
   коэффициент перед аргументом. Точка (1; 5) даёт честное k = 1 · 5,
   без единицы не видно, откуда k. Такие записи в проверку на 1 и −1
   не идут. */
function coordinateProduct(family, tex) {
  return family === 'rational' && /(?:^|\s)k = /.test(tex);
}

/* У прямой k находится по треугольнику: итог шага «Находим k»
   выписывает тангенс и дробь катетов, а не голое число. */
const SLOPE_DONE = /^k = -?\\operatorname\{tg\}/;

const SUBTOPICS = [
  ['прямая', '12'],
  ['парабола', '12q'],
  ['гипербола', '12r'],
  ['корень', '12s'],
];

/* Разбор по шагам на листе учителя: гипербола и график корня — как
   в lib/generatorSheet.ts, модуль по семейству задачи. */
const rationalBuilder = {
  fromTask: (task) =>
    task.meta.family === 'sqrt' ? sqrtBuilder.fromTask(task) : rationalSolution.fromTask(task),
};

function stepsOf(task) {
  const family = task.meta && task.meta.family;
  if (family === 'quadratic') {
    return quadraticBuilder.fromTask(task);
  }
  if (family === 'rational' || family === 'sqrt') {
    return rationalBuilder.fromTask(task);
  }
  const lines = task.meta && task.meta.lines;
  if (lines && lines.length === 2) {
    return solutionBuilder.build({
      lines,
      window: task.meta.window,
      task: { rule: task.answerRule, answer: task.answer },
    });
  }
  const analysis = generator.analysis(task.id, task.seed);
  if (!analysis) {
    return [];
  }
  return solutionBuilder.build({
    triangle: analysis.triangle,
    line: analysis.line,
    window: analysis.task.meta.window,
    task: {
      rule: task.answerRule,
      answer: task.answer,
      query: task.meta.query,
      probe: task.meta.probe,
    },
  });
}

function formulasOf(steps) {
  const out = [];
  steps.forEach((step) => {
    const walk = (blocks) =>
      (blocks || []).forEach((b) => {
        if (b.type === 'formula' && b.tex) {
          out.push(b.tex);
        }
        if (b.blocks) {
          walk(b.blocks);
        }
      });
    walk(step.blocks);
  });
  return out;
}

function note(label, item) {
  if (!problems.has(label)) {
    problems.set(label, []);
  }
  const list = problems.get(label);
  if (list.length < 4) {
    list.push(item);
  }
}

const problems = new Map();
let formulas = 0;
let tasksSeen = 0;
let sheetFormulas = 0;
for (const [name, dir] of SUBTOPICS) {
  const prep = readSets(path.join('prep', dir));
  const proto = readSets(path.join('prototypes', dir));
  generator.setSets({ prep, prototypes: proto });
  const rules = {};
  for (const set of prep.concat(proto)) {
    for (const task of set.tasks || []) {
      rules[task.id] = task.answerRule;
    }
  }
  for (const set of prep.concat(proto)) {
    for (let run = 0; run < seeds; run++) {
      const seed = run === 0 ? set.seed : set.seed * 1000 + run;
      let tasks;
      try {
        tasks = generator.generateSet(set.id, seed);
      } catch {
        continue;
      }
      const sheetTasks = tasks.map((task, i) => ({
        ...task,
        no: i + 1,
        seed: task.meta.seed,
        answerRule: rules[task.id],
      }));
      for (const task of sheetTasks) {
        tasksSeen += 1;
        let steps;
        try {
          steps = stepsOf(task);
        } catch {
          continue;
        }
        const family = task.meta && task.meta.family;
        for (const tex of formulasOf(steps)) {
          formulas += 1;
          for (const [label, re] of RULES) {
            if (/умножение/.test(label) && coordinateProduct(family, tex)) {
              continue;
            }
            if (re.test(tex)) {
              note(`${name} · ${label}`, `${task.id}: ${tex}`);
            }
          }
        }
        /* Итог шага «Находим k» у прямой с треугольником наклона. */
        const slope = steps.find((step) => step.title === 'Находим $k$');
        if (slope) {
          const own = slope.blocks.filter((b) => b.type === 'formula' && b.tex);
          const last = own.length ? own[own.length - 1].tex : '';
          if (!SLOPE_DONE.test(last) || !last.includes('\\dfrac')) {
            note(`${name} · k без вывода через треугольник`, `${task.id}: ${last}`);
          }
        }
      }
      /* Лист учителя: краткие решения печатаются крупной дробью. */
      if (run === 0) {
        const items = variantAnswersItems(
          [{ title: null, blocks: [{ title: '', tasks: sheetTasks }] }],
          generator,
          solutionBuilder,
          quadraticBuilder,
          rationalBuilder,
        );
        for (const html of items.filter((item) => item.includes('sheet-solution'))) {
          for (const m of html.matchAll(/<span class="([^"]*)" data-tex="([^"]*)"/g)) {
            if (!m[2].includes('dfrac')) {
              continue;
            }
            sheetFormulas += 1;
            if (!/\bmath--display-frac\b/.test(m[1])) {
              note(`${name} · дробь в решении строчная (нет math--display-frac)`, m[2]);
            }
          }
        }
      }
    }
  }
}

console.log(
  `Решения №12: задач ${tasksSeen}, формул ${formulas}, дробей на листе учителя ${sheetFormulas}.`,
);
if (problems.size > 0) {
  console.error(`\nЗапись в решениях (${problems.size}):`);
  for (const [label, list] of problems) {
    console.error('  ✗ ' + label);
    list.forEach((item) => console.error('      ' + item));
  }
  process.exit(1);
}
console.log('Двойных скобок, «+ (−», умножения на 1 и −1 нет; k выведен через треугольник.');
