#!/usr/bin/env node
/* scripts/build-bank-10.mjs — подбор аналогов задания №10.

   Запуск: pnpm build:bank-10

   Для каждого из прототипов подбирает 20 аналогов
   (lib/zadanie10/bank/analogi.ts: podobratAnalogi) и пишет их в
   src/data/zadanie10/analogi.json. Подбор детерминированный: повторный
   запуск даёт тот же файл. Самотест (pnpm test:prikladnye) сверяет
   файл с подбором и падает, если файл устарел. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const { podobratAnalogi, GENERATORY } = requireSrc('lib/zadanie10/bank/analogi');
const { FIPI } = requireSrc('lib/zadanie10/bank/fipi');

const out = {};
for (const id of Object.keys(GENERATORY)) {
  out[id] = podobratAnalogi(id, FIPI);
  console.log(`${id}: ${out[id].length} аналогов`);
}
const file = path.join(APP, 'src/data/zadanie10/analogi.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
console.log(`Записано: ${path.relative(APP, file)}`);
