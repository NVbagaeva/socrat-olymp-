#!/usr/bin/env node
/* scripts/check-trainer-slope.mjs — подсказки тренажёра про k.

   Запуск: pnpm test:trainer-slope [--seeds N]

   В цепочке подсказки k находится через треугольник под прямой:
   «возрастает или убывает» → вершина прямого угла → катеты → k со
   знаком. Для каждой задачи с прямой (12.A–12.D и опорные P12-*) на
   серии seed цепочка собирается настоящим lib/trainer.ts и сверяется
   с движком:

     - направление совпадает со знаком k;
     - вершина прямого угла лежит под прямой, её координаты целые;
     - катеты положительные, их отношение равно |k|;
     - k в последнем шаге равен k задачи;
     - формулы через разность координат (Δy : Δx) в подсказке нет.

   Ненулевой код возврата — нашлось расхождение, список задач печатается. */

import fs from 'node:fs';
import path from 'node:path';
import { register } from 'node:module';
import { fileURLToPath } from 'node:url';

register('./lib/ts-esm-hooks.mjs', import.meta.url);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(HERE, '..', 'src', 'lib', 'graph', 'data');
const { default: generator } = await import('../src/lib/graph/generate.js');
const { trainerTaskFrom } = await import('../src/lib/trainer.ts');

const args = process.argv.slice(2);
const seedRuns = args.includes('--seeds') ? Number(args[args.indexOf('--seeds') + 1]) : 20;

function readSets(dir) {
  const full = path.join(DATA, dir);
  return fs.readdirSync(full).filter((name) => name.endsWith('.json')).sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(full, name), 'utf8')));
}
const prep = readSets('prep/12');
const prototypes = readSets('prototypes/12');
generator.setSets({ prep, prototypes });

/* Ответ поля так, как его читает экран: «1,5», «−6/4». Не число —
   NaN, и проверка ниже это ловит, а не пропускает. */
function num(value) {
  const clean = String(value).replace(/[\u2212]/g, '-').replace(',', '.');
  const parts = clean.split('/');
  return parts.length === 2 ? Number(parts[0]) / Number(parts[1]) : Number(clean);
}

function checkChain(task, steps) {
  const problems = [];
  const text = steps.map((s) => s.titleHtml + s.textHtml + s.wrongHint).join(' ');
  if (/\\Delta|Δ/.test(text)) { problems.push('в подсказке осталась формула через Δy : Δx'); }
  const lines = task.meta.lines.length === 2 ? task.meta.lines : [{ k: task.meta.k, b: task.meta.b }];
  let at = 0;
  lines.forEach((line, index) => {
    const name = lines.length === 2 ? (index ? 'g' : 'f') : 'f';
    const first = steps[at];
    const choice = first && first.fields[0] && first.fields[0].choices;
    if (!choice) { problems.push(name + ': нет шага «возрастает или убывает»'); return; }
    const want = line.k > 0 ? 'возрастает' : line.k < 0 ? 'убывает' : 'параллельна оси Ox';
    if (first.fields[0].answer !== want) { problems.push(name + ': направление «' + first.fields[0].answer + '», а k = ' + line.k); }
    if (line.k === 0) {
      const kStep = steps[at + 1];
      if (num(kStep.fields[0].answer) !== 0) { problems.push(name + ': у горизонтальной прямой k не 0'); }
      at += 2 + 1;   /* направление, k = 0 и шаг про b */
      return;
    }
    const [vx, vy] = steps[at + 1].fields.map((f) => num(f.answer));
    const [dy, dx] = steps[at + 2].fields.map((f) => num(f.answer));
    const k = num(steps[at + 3].fields[0].answer);
    if ([vx, vy, dy, dx, k].some((value) => !Number.isFinite(value))) {
      problems.push(name + ': ответ поля не читается числом');
      return;
    }
    if (!(Number.isInteger(vx) && Number.isInteger(vy))) { problems.push(name + ': вершина не в узле'); }
    if (!(line.k * vx + line.b > vy + 1e-9)) { problems.push(name + ': вершина (' + vx + '; ' + vy + ') не под прямой'); }
    if (!(dx > 0 && dy > 0)) { problems.push(name + ': катеты ' + dy + ' и ' + dx); }
    if (Math.abs(dy / dx - Math.abs(line.k)) > 1e-9) { problems.push(name + ': катеты ' + dy + '/' + dx + ' ≠ |k|'); }
    if (Math.abs(k - line.k) > 1e-9) { problems.push(name + ': k в подсказке ' + k + ', в задаче ' + line.k); }
    at += 4 + 1;   /* четыре шага про k и шаг про b */
  });
  return problems;
}

const failures = [];
let checked = 0;
[...prep, ...prototypes].forEach((set) => {
  const seeds = [undefined];
  for (let i = 1; i <= seedRuns; i += 1) { seeds.push(2000 + i * 7919); }
  seeds.forEach((seed) => {
    let tasks;
    try { tasks = generator.generateSet(set.id, seed); } catch { return; }
    tasks.forEach((task) => {
      const steps = trainerTaskFrom(task).steps;
      if (!steps.length) { return; }
      checked += 1;
      const problems = checkChain(task, steps);
      if (problems.length) { failures.push({ id: task.id, seed: task.meta.seed, problems }); }
    });
  });
});

console.log('Цепочек подсказки проверено: ' + checked);
if (!checked) { console.log('Не проверено ни одной цепочки.'); process.exit(1); }
if (failures.length) {
  console.log('Расхождения — ' + failures.length + ' задач:');
  failures.slice(0, 100).forEach((item) => {
    console.log('  ' + item.id + ' (seed ' + item.seed + ')');
    item.problems.forEach((problem) => console.log('      ' + problem));
  });
  process.exit(1);
}
console.log('Расхождений нет.');
