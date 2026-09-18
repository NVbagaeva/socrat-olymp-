#!/usr/bin/env node
/* scripts/check-z3-round.mjs — подход тренажёра задания №3.

   Проверяет две вещи, которые на глаз не поймать: в смешанном
   режиме подряд не больше двух заданий одного типа, и задания
   в подходе не повторяются. Прогоняется на тысяче зёрен —
   случайность не должна уметь сломать правило. */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require0 = createRequire(import.meta.url);

function loadTypeScript() {
  try {
    return require0('typescript');
  } catch {
    return createRequire('/opt/node22/lib/node_modules/typescript/package.json')('typescript');
  }
}

const ts = loadTypeScript();
const out = path.join(root, '.z3round.check.cjs');
fs.writeFileSync(
  out,
  ts.transpileModule(fs.readFileSync(path.join(root, 'src/lib/zadanie3/podhod.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
);
const { buildRound, otherVariant, seeded, ROUND_SIZE } = require0(out);
fs.rmSync(out);

/** Столько типов и вариантов, сколько в самых разных разделах банка. */
function kinds(count) {
  return Array.from({ length: count }, (_, k) => ({
    id: `P${String(k + 1).padStart(2, '0')}`,
    variants: Array.from({ length: 10 }, (_, i) => ({ n: i + 1 })),
  }));
}

let bad = 0;
const sizes = [1, 2, 3, 7, 8, 11, 19, 21];
sizes.forEach((count) => {
  let worstRun = 0;
  let repeats = 0;
  let short = 0;
  for (let seed = 1; seed <= 1000; seed += 1) {
    const round = buildRound(kinds(count), seeded(seed));
    if (round.length !== ROUND_SIZE) {
      short += 1;
    }
    const seen = new Set();
    let run = 1;
    round.forEach((item, i) => {
      const key = `${item.kind}:${item.n}`;
      if (seen.has(key)) {
        repeats += 1;
      }
      seen.add(key);
      if (i > 0 && round[i - 1].kind === item.kind) {
        run += 1;
      } else {
        run = 1;
      }
      worstRun = Math.max(worstRun, run);
    });
  }
  /* Один тип — подряд идут все десять его вариантов, это и есть
     режим «один тип». Правило про два подряд — про смешанный. */
  const limit = count === 1 ? 10 : 2;
  const ok = worstRun <= limit && repeats === 0 && short === 0;
  if (!ok) {
    bad += 1;
  }
  console.log(
    `${ok ? '  ок ' : 'МИМО'} типов ${String(count).padStart(2)}: подряд одного типа не больше ${worstRun} (предел ${limit}), повторов ${repeats}, коротких подходов ${short}`,
  );
});

/* «Ещё один вариант» всегда даёт другой номер. */
const variants = Array.from({ length: 10 }, (_, i) => ({ n: i + 1 }));
let same = 0;
for (let seed = 1; seed <= 1000; seed += 1) {
  const from = (seed % 10) + 1;
  if (otherVariant(variants, from, seeded(seed)) === from) {
    same += 1;
  }
}
console.log(
  `${same === 0 ? '  ок ' : 'МИМО'} «ещё один вариант» повторил текущий ${same} раз из 1000`,
);
if (same > 0) {
  bad += 1;
}

if (bad > 0) {
  console.error(`\nПодход собирается неверно: ${bad} проверок не прошли.`);
  process.exit(1);
}
console.log('\nПодход собирается верно.');
