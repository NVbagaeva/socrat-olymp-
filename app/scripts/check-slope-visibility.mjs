#!/usr/bin/env node
/* scripts/check-slope-visibility.mjs — где треугольник наклона есть, а где нет.

   Запуск: pnpm test:slope-visibility

   Треугольник наклона (пунктир, катеты, угол α или 180° − α) фактически
   подсказывает ответ, поэтому ученику он виден только тогда, когда
   ученик сам попросил помощи. Правило:

     НЕТ  чертежи условий (задания для отработки и их PDF), листы
          ученика генератора, исходный чертёж задачи в тренажёре;
     ЕСТЬ подсказка тренажёра — начиная с шага «Построй треугольник»,
          не раньше; разбор опорной задачи; лист ответов учителя.

   Признак — атрибут data-slope-triangle, который рендерер ставит
   только на чертёж, где треугольник действительно нарисован (сцена
   с showSlopeTriangle: true). Ненулевой код возврата — нарушение. */

import { register } from 'node:module';

register('./lib/ts-esm-hooks.mjs', import.meta.url);

const MARK = 'data-slope-triangle';
const has = (value) => JSON.stringify(value ?? '').includes(MARK);

const { prep, prototypes } = await import('../src/lib/graph/data/index.js');
const { default: generator } = await import('../src/lib/graph/generate.js');
generator.setSets({ prep, prototypes });
const { trainerTaskFrom } = await import('../src/lib/trainer.ts');
const { prepSolutionSteps } = await import('../src/lib/prep.ts');
const { sheetSpec } = await import('../src/lib/generatorSheet.ts');

const SETS = [...prep, ...prototypes];
const SEEDS = [undefined, 3001, 3002, 3003];
const failures = [];
const count = { student: 0, trainer: 0, hint: 0, prep: 0, teacher: 0, sheets: 0 };
const fail = (where, what) => failures.push(where + ': ' + what);

/* Есть ли у задачи прямая, k которой ищется треугольником. */
function slopedLine(task) {
  const meta = task.meta;
  if (!meta.window) { return false; }
  if (meta.family === 'quadratic') {
    return (meta.curves || []).some((curve) => curve.kind === 'line' && curve.k !== 0);
  }
  return (meta.lines || []).some((line) => line.k !== 0 && (line.points || []).length >= 2);
}

for (const set of SETS) {
  for (const seed of SEEDS) {
    let tasks;
    try { tasks = generator.generateSet(set.id, seed); } catch { continue; }
    for (const task of tasks) {
      const where = task.id + ' (seed ' + task.meta.seed + ')';

      /* Чертёж условия: задания для отработки, листы, тренажёр. */
      count.student += 1;
      if (has(task.svg)) { fail(where, 'треугольник на чертеже условия'); }

      /* Тренажёр: исходный чертёж без треугольника; в подсказке он
         появляется на шаге «Построй треугольник», не раньше. */
      const trainer = trainerTaskFrom(task);
      count.trainer += 1;
      if (has(trainer.chartSvg)) { fail(where, 'треугольник на исходном чертеже тренажёра'); }
      let seen = false;
      trainer.steps.forEach((step, i) => {
        const shows = has(step.chartSvg);
        const building = /Построй треугольник/.test(step.titleHtml);
        if (shows && !seen && !building) { fail(where, 'треугольник в подсказке раньше шага «Построй треугольник» (шаг ' + (i + 1) + ')'); }
        if (building) {
          if (!shows) { fail(where, 'на шаге «Построй треугольник» чертёж без треугольника'); }
          /* Строящийся треугольник — последний на чертеже: у него длин
             катетов ещё нет (их ученик считает на следующем шаге).
             Треугольник прошлой прямой у пары остаётся подписанным. */
          const svg = String(step.chartSvg);
          const current = (svg.match(/id="teacher-leg-x-\d+"/g) || []).length;
          if (svg.includes('id="teacher-label-x-' + current + '"')) {
            fail(where, 'на шаге «Построй треугольник» уже подписаны катеты');
          }
          count.hint += 1;
        }
        if (shows) { seen = true; }
      });

      /* Разбор опорной задачи: треугольник есть, если k ищется по нему. */
      if (set.kind === 'prep' && seed === undefined && slopedLine(task)) {
        const steps = prepSolutionSteps(task) || [];
        count.prep += 1;
        if (!has(steps)) { fail(where, 'в разборе опорной задачи нет чертежа с треугольником'); }
      }
    }
  }
}

/* Генератор: лист ученика — без треугольника, лист учителя — с ним. */
for (const set of SETS) {
  const params = { skills: [set.id], count: 6, level: null, seed: 'slope-check', theme: 'color',
                   layout: 'single', kind: '', date: '', variants: 2 };
  let student;
  let teacher;
  try {
    student = sheetSpec(params, false);
    teacher = sheetSpec(params, true);
  } catch (error) {
    fail(set.id, 'лист генератора не собрался: ' + error.message);
    continue;
  }
  count.sheets += 1;
  if (has(student)) { fail(set.id, 'треугольник в листе ученика генератора'); }
  const lines = (student.variants || [{ blocks: student.blocks }])
    .flatMap((variant) => variant.blocks.flatMap((block) => block.tasks))
    .some((task) => slopedLine(task));
  if (lines) {
    count.teacher += 1;
    if (!has(teacher.extraItems)) { fail(set.id, 'в листе учителя нет треугольника'); }
    if (has(teacher.blocks) || has(teacher.variants)) { fail(set.id, 'треугольник на чертеже условия в листе учителя'); }
  }
}

console.log('Чертежей условий: ' + count.student + ', заданий тренажёра: ' + count.trainer +
  ', шагов «Построй треугольник»: ' + count.hint + ', разборов опорных задач: ' + count.prep +
  ', листов генератора: ' + count.sheets + ' (из них с треугольником у учителя: ' + count.teacher + ')');
if (!count.hint || !count.prep || !count.teacher) {
  console.log('Не проверено ни одного места, где треугольник должен быть.');
  process.exit(1);
}
if (failures.length) {
  console.log('Нарушения — ' + failures.length + ':');
  failures.slice(0, 100).forEach((line) => console.log('  ' + line));
  process.exit(1);
}
console.log('Треугольник только там, где он нужен.');
