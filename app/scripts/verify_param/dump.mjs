#!/usr/bin/env node
/* scripts/verify_param/dump.mjs — задачи №19 с ответами в JSON для run.py.

   Запуск (из app/): node scripts/verify_param/dump.mjs /tmp/z19.json

   Берёт разборы, опорные и тренировочные задачи из контента раздела
   (content/teoriya19) — ровно те ответы, которые видит ученик. */

import fs from 'node:fs';
import { requireSrc } from '../lib/load-ts.mjs';

const { vseZadachi19 } = requireSrc('content/teoriya19/index');
const { razbory, opornye, zadachi } = vseZadachi19();
const out = {};
for (const [vid, spisok] of [
  ['razbor', razbory],
  ['opornaya', opornye],
  ['zadacha', zadachi],
]) {
  for (const z of spisok) {
    if (out[z.id] !== undefined) {
      console.error(`Повтор id: ${z.id}`);
      process.exit(1);
    }
    out[z.id] = { vid, otvet: z.otvet, uslovie: z.uslovie };
  }
}
const file = process.argv[2];
if (!file) {
  console.error('Укажите файл: node scripts/verify_param/dump.mjs /tmp/z19.json');
  process.exit(2);
}
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log(`Задач №19: ${Object.keys(out).length} → ${file}`);
