#!/usr/bin/env node
/* scripts/build-bank-1.mjs — аналоги задания №1: по десять на прототип.

   Подбор детерминированный (lib/planimetriya/bank/analogi.ts,
   podobratAnalogi): ответ — целое или конечная десятичная дробь,
   сходится с измерением на фигуре, набор не из открытого банка,
   чертёж чист во всех режимах. Результат пишется в
   lib/planimetriya/bank/analogi-dannye.ts — его читают страницы,
   тренажёр и листы; pnpm test:planimetriya сверяет файл с подбором.

   Запуск: pnpm build:bank-1 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireSrc } from './lib/load-ts.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { podobratAnalogi } = requireSrc('lib/planimetriya/bank/analogi');
const { PROTOTIPY } = requireSrc('lib/planimetriya/stseny/index');

const stroki = [];
for (const p of PROTOTIPY) {
  const a = podobratAnalogi(p.id);
  const svoi = a.map(
    (x) =>
      `{ ${Object.entries(x.params)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')} }`,
  );
  stroki.push(`  ${p.id}: [\n${svoi.map((s) => `    ${s},`).join('\n')}\n  ],`);
  console.log(`прототип ${p.id}: ${a.length}`);
}
const text = `/**
 * Аналоги задач открытого банка, по десять на прототип: числа
 * условия. Файл пишет scripts/build-bank-1.mjs (pnpm build:bank-1),
 * руками не правится. Правила подбора — bank/analogi.ts.
 */

import type { Nabor } from '../stseny/dsl';

export const ANALOGI_DANNYE: Record<number, Nabor[]> = {
${stroki.join('\n')}
};
`;
fs.writeFileSync(path.join(app, 'src/lib/planimetriya/bank/analogi-dannye.ts'), text);
console.log('записано');
