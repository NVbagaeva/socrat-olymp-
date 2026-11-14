#!/usr/bin/env node
/* scripts/build-bank-11.mjs — файлы тренажёра №11 для браузера.

   Запуск: pnpm build:bank-11

   Пишет public/data/zadanie11/<подтип>.json: задачи открытого банка,
   разминки и пула аналогов (src/data/zadanie11) с теми же ключами, что
   у прежнего тренажёра («DP-07|b12»), без ответов — с отпечатком
   (lib/zadanie11/trening/dannye-server.ts). Банк не меняется: файлы
   только пересобираются из него. С флагом --check ничего не пишет и
   падает, если файлы устарели (pnpm test:bank-11). */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const check = process.argv.includes('--check');
const { dannyeDlyaBrauzera11 } = requireSrc('lib/zadanie11/trening/dannye-server');
const dir = path.join(APP, 'public/data/zadanie11');
const fayly = dannyeDlyaBrauzera11();
let bad = 0;
if (!check) fs.mkdirSync(dir, { recursive: true });
for (const [fail, soderzhimoe] of Object.entries(fayly)) {
  const file = path.join(dir, `${fail}.json`);
  if (check) {
    const est = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (est !== soderzhimoe) {
      console.error(`устарел: public/data/zadanie11/${fail}.json`);
      bad += 1;
    }
  } else {
    fs.writeFileSync(file, soderzhimoe);
  }
}
const lishnie = fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => !(f.replace(/\.json$/, '') in fayly))
  : [];
for (const f of lishnie) {
  console.error(`лишний файл: public/data/zadanie11/${f}`);
  bad += 1;
}
if (check) {
  if (bad > 0) {
    console.error('Пересоберите: pnpm build:bank-11');
    process.exit(1);
  }
  console.log(`public/data/zadanie11: ${Object.keys(fayly).length} файлов, свежие`);
} else {
  console.log(`Записано: public/data/zadanie11/ (${Object.keys(fayly).length} файлов)`);
}
