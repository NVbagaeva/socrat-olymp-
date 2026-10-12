#!/usr/bin/env node
/* scripts/build-bank-7.mjs — подбор аналогов задания №7.

   Запуск: pnpm build:bank-7

   Для каждого прототипа подбирает 20 аналогов
   (lib/zadanie7/bank/analogi.ts: podobratAnalogi) и пишет их в
   src/data/zadanie7/analogi.json. Подбор детерминированный: повторный
   запуск даёт тот же файл. Самотест (pnpm test:uravneniya) сверяет
   файл с подбором и падает, если файл устарел. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const { podobratAnalogi, GENERATORY } = requireSrc('lib/zadanie7/bank/analogi');
const { FIPI } = requireSrc('lib/zadanie7/bank/fipi');
const { PROTOTYPES } = requireSrc('lib/zadanie7/prototypes');

const out = {};
for (const { id } of PROTOTYPES) {
  if (!GENERATORY[id]) {
    throw new Error(`нет генератора ${id}`);
  }
  out[id] = podobratAnalogi(id, FIPI);
  const raznyh = new Set(out[id].map((a) => a.answer)).size;
  console.log(`${id}: ${out[id].length} аналогов, разных ответов ${raznyh}`);
}
const file = path.join(APP, 'src/data/zadanie7/analogi.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
console.log(`Записано: ${path.relative(APP, file)}`);

/* Данные для браузера: без ответов, с отпечатком (lib/zadanie7/dannye.ts). */
const { dannyeDlyaBrauzera } = requireSrc('lib/zadanie7/dannye-server');
const dir = path.join(APP, 'public/data/zadanie7');
fs.mkdirSync(dir, { recursive: true });
for (const [fail, soderzhimoe] of Object.entries(dannyeDlyaBrauzera(FIPI, out))) {
  fs.writeFileSync(path.join(dir, `${fail}.json`), soderzhimoe);
}
console.log(`Записано: ${path.relative(APP, dir)}/ (индекс и файлы прототипов)`);
