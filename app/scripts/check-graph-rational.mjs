#!/usr/bin/env node
/* scripts/check-graph-rational.mjs — генератор гиперболы собирает все
   наборы подтемы на серии seed, и каждая задача проходит правила
   из lib/graph-rational-checks.mjs.

   Запуск: pnpm test:graph-rational [--seeds N]   (по умолчанию 200)

   Наборы — из данных движка (data/prep/12r, data/prototypes/12r): те же
   файлы, по которым собираются экраны. Ненулевой код возврата —
   проверка не прошла. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import generator from '../src/lib/graph/generate.js';
import { checkRationalComposition, checkRationalTask } from './lib/graph-rational-checks.mjs';

const args = process.argv.slice(2);
const seeds = args.includes('--seeds') ? Number(args[args.indexOf('--seeds') + 1]) : 200;

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'graph', 'data');
function readSets(dir) {
  const full = path.join(ROOT, dir);
  return fs.existsSync(full) ? fs.readdirSync(full)
    .filter((name) => name.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
    .map((name) => JSON.parse(fs.readFileSync(path.join(full, name), 'utf8'))) : [];
}

const PREP = readSets(path.join('prep', '12r'));
const PROTO = readSets(path.join('prototypes', '12r'));
if (PREP.length + PROTO.length === 0) {
  console.error('В данных нет наборов подтемы «Гипербола»');
  process.exit(1);
}
generator.setSets({ prep: PREP, prototypes: PROTO });

const errors = [];
const failed = [];
let checked = 0;
console.log(`гипербола: наборов ${PREP.length + PROTO.length}, seed на набор ${seeds}`);
for (const set of PREP.concat(PROTO)) {
  const answers = new Set();
  let built = 0;
  for (let run = 0; run < seeds; run++) {
    const seed = run === 0 ? set.seed : set.seed * 1000 + run;
    let tasks;
    try { tasks = generator.generateSet(set.id, seed); } catch (error) {
      failed.push(`${set.id} seed ${seed}: ${error.message}`);
      continue;
    }
    built += 1;
    errors.push(...checkRationalComposition(set, tasks));
    for (const task of tasks) {
      errors.push(...checkRationalTask(set, task));
      answers.add(task.answer);
      checked += 1;
    }
  }
  console.log(`  ${set.id.padEnd(8)} собран на ${built}/${seeds} seed, разных ответов ${answers.size}`);
}

/* Тренажёр перебирает до 24 seed на набор: доля несобравшихся
   должна быть мала, иначе подход останется без задач. */
const share = failed.length / ((PREP.length + PROTO.length) * seeds);
console.log(`задач проверено: ${checked}; несобравшихся наборов: ${failed.length} (${(share * 100).toFixed(1)} %)`);
if (share > 0.1) { errors.push('слишком много seed, на которых набор не собирается'); }
if (failed.length) { console.log(failed.slice(0, 10).map((line) => '  · ' + line).join('\n')); }
if (errors.length) {
  console.error(`\nРАСХОЖДЕНИЯ (${errors.length}):`);
  errors.slice(0, 40).forEach((line) => console.error('  • ' + line));
  process.exit(1);
}
console.log('\nрасхождений: 0 — всё чисто');
