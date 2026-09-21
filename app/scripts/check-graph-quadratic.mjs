#!/usr/bin/env node
/* scripts/check-graph-quadratic.mjs — генератор параболы собирает
   все девять наборов подтемы «Квадратичная функция».

   Запуск: pnpm test:graph-quadratic [--svg папка] [--seeds N]

   Наборы берутся из scripts/lib/quadratic-sets.mjs: там только
   ограничения задач, без текстов. Проверяется, что каждый набор
   собирается на своём seed без единого «нет вариантов», что каждая
   задача проходит правила читаемости и состава, что все ответы —
   целые или конечные десятичные, и что наборы собираются на серии
   случайных seed: так работает тренажёр, и ему нужны свежие числа.

   --svg кладёт чертёж каждой задачи набора по умолчанию в папку:
   для просмотра глазами. Ненулевой код возврата — проверка не прошла. */

import fs from 'node:fs';
import path from 'node:path';

import generator from '../src/lib/graph/generate.js';
import { QUADRATIC_SETS } from './lib/quadratic-sets.mjs';
import { INTERSECTION_CHECKS, checkQuadraticComposition, checkQuadraticTask,
         intersectionAudit } from './lib/graph-quadratic-checks.mjs';

/* Цель по окну: ±5…±6; шире — исключение, о котором отчёт говорит вслух. */
const WINDOW_TARGET = 6;

const args = process.argv.slice(2);
const svgDir = args.includes('--svg') ? args[args.indexOf('--svg') + 1] : null;
const seedRuns = args.includes('--seeds') ? Number(args[args.indexOf('--seeds') + 1]) : 20;
/* Доля случайных seed, на которых набор обязан собраться: тренажёр
   перебирает до 24 seed на набор, и при такой доле пустых подходов
   не бывает. */
const SEED_SHARE = 0.9;

generator.setSets({ prep: QUADRATIC_SETS, prototypes: [] });

const errors = [];
const report = [];
let distinctAll = new Set();

function signatureOf(task) {
  return task.meta.curves.map((curve) =>
    curve.kind === 'line' ? `l:${curve.k}@${curve.b}` : `q:${curve.a}@${curve.m};${curve.n}`).join('|');
}

for (const set of QUADRATIC_SETS) {
  const started = Date.now();
  let tasks;
  try {
    tasks = generator.generateSet(set.id);
  } catch (error) {
    errors.push(`${set.id}: набор не собрался на своём seed — ${error.message}`);
    continue;
  }

  tasks.forEach((task) => {
    errors.push(...checkQuadraticTask(set, task));
  });
  errors.push(...checkQuadraticComposition(set, tasks));

  const distinct = new Set(tasks.map(signatureOf));
  tasks.forEach((task) => distinctAll.add(signatureOf(task)));

  /* Окна шире цели — списком с причиной разобраться на этапе наборов. */
  const wide = tasks.filter((task) => task.meta.window.xmax > WINDOW_TARGET);
  const wideNote = wide.length === 0 ? 'все окна ±' + WINDOW_TARGET + ' или теснее'
    : `окно шире ±${WINDOW_TARGET} у ${wide.length}: ` +
      wide.map((task) => `${task.id} (±${task.meta.window.xmax})`).join(', ');

  /* Пересечения: сколько задач прошло каждую проверку. */
  const crossTasks = tasks.filter((task) => task.meta.intersection);
  let crossNote = '';
  if (crossTasks.length) {
    const passed = {};
    crossTasks.forEach((task) => {
      const audit = intersectionAudit(set, task);
      INTERSECTION_CHECKS.forEach(([id]) => { passed[id] = (passed[id] || 0) + (audit.ok[id] ? 1 : 0); });
    });
    crossNote = '\n    пересечения: ' + INTERSECTION_CHECKS
      .map(([id, title]) => `${title} — ${passed[id] || 0}/${crossTasks.length}`).join('; ');
  }
  const symmetric = tasks.filter((task) => task.meta.symmetricPair).map((task) => task.id);
  const symmetricNote = symmetric.length ? `; симметричные пары: ${symmetric.join(', ')}` : '';

  /* Случайные seed: столько же, сколько перебирает тренажёр. */
  let ok = 0;
  const seedErrors = [];
  for (let i = 0; i < seedRuns; i++) {
    const seed = `probe:${set.id}:${i}`;
    try {
      const fresh = generator.generateSet(set.id, seed);
      const bad = fresh.flatMap((task) => checkQuadraticTask(set, task))
        .concat(checkQuadraticComposition(set, fresh));
      if (bad.length) {
        seedErrors.push(`${seed}: ${bad[0]}`);
      } else {
        ok += 1;
      }
      fresh.forEach((task) => distinctAll.add(signatureOf(task)));
    } catch (error) {
      seedErrors.push(`${seed}: ${error.message}`);
    }
  }
  if (ok < Math.ceil(seedRuns * SEED_SHARE)) {
    errors.push(`${set.id}: на случайных seed собрался ${ok} раз из ${seedRuns}; ` +
      `первые сбои: ${seedErrors.slice(0, 3).join(' | ')}`);
  }

  report.push(`  ${set.id} «${set.title}»: собрано ${tasks.length}, ответы: ` +
    tasks.map((task) => task.answer).join(', ') +
    `; разных чертежей ${distinct.size}; случайные seed ${ok}/${seedRuns}; ` +
    `${Date.now() - started} мс\n    ${wideNote}${symmetricNote}${crossNote}`);

  if (svgDir) {
    fs.mkdirSync(svgDir, { recursive: true });
    tasks.forEach((task) => {
      fs.writeFileSync(path.join(svgDir, `${task.id}.svg`), task.svg);
    });
  }
}

console.log('graph/check-graph-quadratic');
report.forEach((line) => console.log(line));
console.log(`  разных чертежей по всем наборам и seed: ${distinctAll.size}`);

if (errors.length) {
  console.error(`\nОШИБКИ (${errors.length}):`);
  errors.slice(0, 60).forEach((line) => console.error(`  • ${line}`));
  if (errors.length > 60) { console.error(`  … и ещё ${errors.length - 60}`); }
  process.exit(1);
}
console.log('\nвсё чисто');
