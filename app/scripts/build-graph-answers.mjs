#!/usr/bin/env node
/* scripts/build-graph-answers.mjs — пересборка файла ответов.

   Запуск: pnpm build:graph-answers

   Ответы лежат отдельно от условий и собираются из тех же наборов,
   что и задачи. Файл читается только на сервере: в клиентский бандл
   он не импортируется.
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import generator from '../src/lib/graph/generate.js';

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'graph', 'data');

function readSets(dir) {
  const full = path.join(DATA, dir);
  if (!fs.existsSync(full)) { return []; }
  return fs.readdirSync(full)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(full, name), 'utf8')));
}

generator.setSets({ prep: readSets('prep/12'), prototypes: readSets('prototypes/12') });

const answers = generator.buildAnswers();
const file = path.join(DATA, 'answers.json');
fs.writeFileSync(file, JSON.stringify(answers, null, 2) + '\n');

console.log('answers.json обновлён: подготовка ' + Object.keys(answers.prep).length +
  ', прототипы ' + Object.keys(answers.prototypes).length);
