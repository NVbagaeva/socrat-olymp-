#!/usr/bin/env node
/* scripts/check-graph-quadratic.mjs — генератор параболы собирает
   все девять наборов подтемы «Квадратичная функция».

   Запуск: pnpm test:graph-quadratic [--svg папка] [--seeds N]

   Наборы берутся из данных движка (data/prep/12q/): те же файлы,
   по которым собираются экраны. Проверяется, что каждый набор
   собирается на своём seed без единого «нет вариантов», что каждая
   задача проходит правила читаемости и состава, что все ответы —
   целые или конечные десятичные, и что наборы собираются на серии
   случайных seed: так работает тренажёр, и ему нужны свежие числа.

   --svg кладёт чертёж каждой задачи набора по умолчанию в папку:
   для просмотра глазами. Ненулевой код возврата — проверка не прошла. */

import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';

import generator from '../src/lib/graph/generate.js';
import { HIDDEN_VARIANTS, INTERSECTION_CHECKS, checkQuadraticComposition, checkQuadraticSolution,
         checkQuadraticTask, hiddenVariantCounts, intersectionAudit,
         solutionShape } from './lib/graph-quadratic-checks.mjs';

/* Цель по окну: ±5…±6; шире — исключение, о котором отчёт говорит вслух. */
const WINDOW_TARGET = 6;

const args = process.argv.slice(2);
const svgDir = args.includes('--svg') ? args[args.indexOf('--svg') + 1] : null;
const seedRuns = args.includes('--seeds') ? Number(args[args.indexOf('--seeds') + 1]) : 20;
/* Доля случайных seed, на которых набор обязан собраться: тренажёр
   перебирает до 24 seed на набор, и при такой доле пустых подходов
   не бывает. */
const SEED_SHARE = 0.9;

/* Наборы подтемы — из данных движка: второго источника ограничений
   у них нет. Файлы читаются с диска, а не импортом data/index.js:
   импорт JSON в Node требует своих оговорок, а здесь достаточно
   прочитать папку. */
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)),
  '..', 'src', 'lib', 'graph', 'data');
function readSets(dir) {
  const full = path.join(ROOT, dir);
  return fs.existsSync(full) ? fs.readdirSync(full)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(full, name), 'utf8'))) : [];
}
/* Опорные наборы и наборы прототипов проверяются одними правилами:
   правила читаемости у чертежа одни, кем бы он ни был показан. */
const PREP_SETS = readSets(path.join('prep', '12q'));
const PROTO_SETS = readSets(path.join('prototypes', '12q'));
const QUADRATIC_SETS = PREP_SETS.concat(PROTO_SETS);
if (QUADRATIC_SETS.length === 0) {
  console.error('В данных нет наборов подтемы «Квадратичная функция»');
  process.exit(1);
}
generator.setSets({ prep: PREP_SETS, prototypes: PROTO_SETS });

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
    errors.push(...checkQuadraticSolution(set, task));
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
    const counts = hiddenVariantCounts(crossTasks);
    crossNote = '\n    вторая точка: ' + Object.keys(HIDDEN_VARIANTS)
      .map((id) => `${HIDDEN_VARIANTS[id]} — ${counts[id]}`).join(', ') +
      '\n    пересечения: ' + INTERSECTION_CHECKS
      .map(([id, title]) => `${title} — ${passed[id] || 0}/${crossTasks.length}`).join('; ');
  }
  /* Разборы: сколько шагов доходит до ответа и у скольких задач под
     ответом лежит свёрнутая дописка формулы. */
  const shapes = tasks.map((task) => solutionShape(set, task));
  const stepCounts = [...new Set(shapes.map((shape) => shape.steps))].sort((a, b) => a - b);
  const solutionNote = `\n    разборы: шагов ${stepCounts.join(' или ')}, ` +
    `со свёрнутой дописью формулы ${shapes.filter((shape) => shape.folded).length} из ${shapes.length}`;

  const symmetric = tasks.filter((task) => task.meta.symmetricPair).map((task) => task.id);
  const symmetricNote = symmetric.length ? `; симметричные пары: ${symmetric.join(', ')}` : '';

  /* Случайные seed: столько же, сколько перебирает тренажёр. */
  let ok = 0;
  const seedErrors = [];
  for (let i = 0; i < seedRuns; i++) {
    const seed = `probe:${set.id}:${i}`;
    try {
      const fresh = generator.generateSet(set.id, seed);
      const bad = fresh.flatMap((task) => checkQuadraticTask(set, task)
        .concat(checkQuadraticSolution(set, task)))
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
    `${Date.now() - started} мс\n    ${wideNote}${symmetricNote}${solutionNote}${crossNote}`);

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
