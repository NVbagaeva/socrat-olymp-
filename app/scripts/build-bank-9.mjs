#!/usr/bin/env node
/* scripts/build-bank-9.mjs — подбор банка задания №9.

   Запуск: pnpm build:bank-9

   Для каждого прототипа перебирает seed «9.X.Y#1», «9.X.Y#2», … и
   оставляет первые десять вариантов, у которых:
   — разные signature (и разная подпись узлов рисунка);
   — разные условия;
   — не больше четырёх с одним `vid`;
   — ответы все разные; если у прототипа меньше десяти возможных
     ответов — один ответ не чаще двух (в крайнем случае трёх) раз;
   — рисунок чист во всех режимах: ученик, подсказка, учитель.

   Результат пишется в src/lib/proizvodnaya/bank.ts: только seed,
   ответов в файле нет. Скрипт — единственный, кто пишет этот файл.
   Краткий отчёт печатается в консоль. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const { PROTOTYPES } = requireSrc('lib/proizvodnaya/prototypes/index');
const { generate } = requireSrc('lib/proizvodnaya/generate');
const { renderFigura, pustoyOtchet } = requireSrc('lib/proizvodnaya/render');
const { podpisUzlov } = requireSrc('lib/proizvodnaya/prototypes/common');
const { chislaOtvet } = requireSrc('lib/proizvodnaya/otvet');

/* Генератор рисунка считает до 0,4 с на задачу: перебор ограничен. Не набралось
   десять за столько попыток — прототип мало разнообразен, он попадёт в отчёт. */
const MAX_ATTEMPTS = Number(process.env.BANK9_ATTEMPTS ?? 300);
const PER_PROTOTYPE = 10;
const MAX_SAME_VID = 4;
const MAX_SAME_ANSWER = 4;

/** Проблемы рисунка во всех трёх режимах. */
function risunokProblems(fig) {
  const out = [];
  for (const rezhim of ['student', 'hint', 'teacher']) {
    const rep = pustoyOtchet();
    renderFigura(fig, { rezhim }, rep);
    out.push(...rep.problems.map((p) => `${rezhim}: ${p}`));
  }
  return out;
}

const entries = [];
const refusals = new Map();
const short = [];
const stubs = [];

function refuse(reason) {
  refusals.set(reason, (refusals.get(reason) ?? 0) + 1);
}

const started = Date.now();

/** Подбор десяти вариантов при ограничении «ответ повторяется не чаще maxSame раз». */
function podobrat(prototype, maxSame) {
  const variants = [];
  const statements = new Set();
  const signatures = new Set();
  const drawings = new Set();
  const vids = new Map();
  const answers = new Map();
  for (let attempt = 1; attempt <= MAX_ATTEMPTS && variants.length < PER_PROTOTYPE; attempt += 1) {
    const seed = `${prototype.id}#${attempt}`;
    let task;
    try {
      task = generate(prototype.id, seed);
    } catch {
      refuse('генератор не подобрал параметры');
      continue;
    }
    /* У задач с рисунком условие одно и то же, различает их рисунок (signature и узлы). */
    if (task.risunok === null && statements.has(task.uslovie)) {
      refuse('то же условие');
      continue;
    }
    if (signatures.has(task.signature)) {
      refuse('та же signature');
      continue;
    }
    const vid = task.vid ?? '';
    if (vid !== '' && (vids.get(vid) ?? 0) >= MAX_SAME_VID) {
      refuse('больше четырёх одного вида');
      continue;
    }
    const answer = chislaOtvet(task.otvet);
    if ((answers.get(answer) ?? 0) >= maxSame) {
      refuse('ответ уже есть в банке');
      continue;
    }
    if (task.risunok !== null) {
      const key = podpisUzlov(task.risunok);
      if (drawings.has(key)) {
        refuse('тот же рисунок');
        continue;
      }
      if (risunokProblems(task.risunok).length > 0) {
        refuse('рисунок нечист в одном из режимов');
        continue;
      }
      drawings.add(key);
    }
    statements.add(task.uslovie);
    signatures.add(task.signature);
    if (vid !== '') {
      vids.set(vid, (vids.get(vid) ?? 0) + 1);
    }
    answers.set(answer, (answers.get(answer) ?? 0) + 1);
    variants.push({ n: variants.length + 1, seed });
  }
  return variants;
}

const povtory = [];
for (const prototype of PROTOTYPES) {
  if (prototype.zaglushka) {
    stubs.push(prototype.id);
  }
  /* Сначала — десять разных ответов. Если у прототипа возможных ответов
     меньше десяти (счёт точек на читаемом рисунке), разрешается повтор:
     не больше двух, потом трёх одинаковых. */
  let variants = [];
  let maxSame = 1;
  for (; maxSame <= MAX_SAME_ANSWER; maxSame += 1) {
    variants = podobrat(prototype, maxSame);
    if (variants.length >= PER_PROTOTYPE) {
      break;
    }
  }
  if (maxSame > 1) {
    povtory.push(`${prototype.id}: ответ повторяется до ${maxSame} раз`);
  }
  if (variants.length < PER_PROTOTYPE) {
    short.push(`${prototype.id}: ${variants.length}`);
    process.exitCode = 1;
  }
  entries.push({ prototype: prototype.id, variants });
  console.error(
    `  ${prototype.id}: ${variants.length} вариантов, ${((Date.now() - started) / 1000).toFixed(1)} с`,
  );
}

const lines = [
  '/**',
  ' * Банк задания №9: десять зафиксированных вариантов на прототип.',
  ' *',
  ' * Файл собирается скриптом scripts/build-bank-9.mjs (pnpm build:bank-9)',
  ' * и правится только им. Здесь только seed: ответов нет, задача',
  ' * воспроизводится как generate(prototype, seed).',
  ' */',
  '',
  'export interface BankVariant {',
  '  /** Номер варианта: 1…10. */',
  '  n: number;',
  '  seed: string;',
  '}',
  '',
  'export interface BankEntry {',
  '  prototype: string;',
  '  variants: BankVariant[];',
  '}',
  '',
  'export const BANK: BankEntry[] = [',
];
for (const entry of entries) {
  lines.push('  {', `    prototype: '${entry.prototype}',`, '    variants: [');
  for (const v of entry.variants) {
    lines.push(`      { n: ${v.n}, seed: '${v.seed}' },`);
  }
  lines.push('    ],', '  },');
}
lines.push('];', '');

const bankPath = path.join(APP, 'src', 'lib', 'proizvodnaya', 'bank.ts');
fs.writeFileSync(bankPath, lines.join('\n'));

const total = entries.reduce((sum, e) => sum + e.variants.length, 0);
console.log(
  `банк №9: ${entries.length} прототипов, ${total} вариантов → ${path.relative(APP, bankPath)}`,
);
if (stubs.length > 0) {
  console.log(`заглушки: ${stubs.join(', ')}`);
}
if (refusals.size > 0) {
  console.log('отказы при подборе:');
  for (const [reason, count] of [...refusals].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${reason}: ${count}`);
  }
}
if (povtory.length > 0) {
  console.log(`ответы не все разные (возможных ответов меньше десяти): ${povtory.join('; ')}`);
}
if (short.length > 0) {
  console.error(`! не набрано десять вариантов: ${short.join('; ')}`);
}
