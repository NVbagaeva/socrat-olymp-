#!/usr/bin/env node
/* scripts/build-bank-6.mjs — подбор аналогов задания №6.

   Запуск: pnpm build:bank-6

   Для каждого прототипа подбирает 50 аналогов — 30 «в стиле ФИПИ» и
   20 сюжетных (lib/zadanie6/bank/analogi.ts: podobratAnalogi) — и пишет
   их в src/data/zadanie6/analogi.json. Подбор детерминированный:
   повторный запуск даёт тот же файл. Самотест
   (pnpm test:sluchainye-velichiny) сверяет файл с подбором и падает,
   если файл устарел. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const { podobratAnalogi, otpechatok } = requireSrc('lib/zadanie6/bank/analogi');
const { ISTOCHNIKI } = requireSrc('lib/zadanie6/bank/istochniki');
const { PROTOTYPES } = requireSrc('lib/zadanie6/prototypes');

const zanyatye = ISTOCHNIKI.map((s) => otpechatok(s.prototypeId, s.params));
const out = {};
for (const { id } of PROTOTYPES) {
  out[id] = podobratAnalogi(id, zanyatye);
  const raznyh = new Set(out[id].map((a) => a.answer)).size;
  console.log(`${id}: ${out[id].length} аналогов, разных ответов ${raznyh}`);
}
const file = path.join(APP, 'src/data/zadanie6/analogi.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
console.log(`Записано: ${path.relative(APP, file)}`);
