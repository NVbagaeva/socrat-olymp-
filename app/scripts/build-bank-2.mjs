#!/usr/bin/env node
/* scripts/build-bank-2.mjs — подбор банка задания №2.

   Запуск: pnpm build:bank-2

   Для каждого прототипа перебирает seed «A1#1», «A1#2», … и
   оставляет первые десять вариантов, у которых условия и наборы
   векторов разные, ответы не повторяются (у косинуса — не чаще
   двух раз: двухзначных десятичных косинусов всего восемь), а вид
   условия (набор коэффициентов, форма выражения) встречается не
   больше трёх раз.

   Результат пишется в src/lib/vektory/bank.ts и в отчёт
   docs/tasks/02-vektory-02-bank.md — с условиями, векторами и
   ответами для ручной проверки. В клиентский код ответы не
   попадают: bank.ts хранит только seed. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const { PROTOTYPES } = requireSrc('lib/vektory/prototypes/index');
const { generate } = requireSrc('lib/vektory/generate');
const { ru } = requireSrc('lib/vychisleniya/numbers');

const entries = [];
const report = [];

for (const prototype of PROTOTYPES) {
  const variants = [];
  const statements = new Set();
  const signatures = new Set();
  const answers = new Map();
  const vidy = new Map();
  const maxAnswers = prototype.gruppa === 'C' ? 2 : 1;
  let attempt = 0;
  while (variants.length < 10 && attempt < 5000) {
    attempt += 1;
    const seed = `${prototype.id}#${attempt}`;
    let task;
    try {
      task = generate(prototype.id, seed);
    } catch {
      continue;
    }
    const key = ru(task.otvet);
    if (statements.has(task.uslovie + task.signature)) continue;
    if (signatures.has(task.signature)) continue;
    if ((answers.get(key) ?? 0) >= maxAnswers) continue;
    if (task.vid !== undefined && (vidy.get(task.vid) ?? 0) >= 3) continue;
    if (task.vid !== undefined) vidy.set(task.vid, (vidy.get(task.vid) ?? 0) + 1);
    signatures.add(task.signature);
    statements.add(task.uslovie + task.signature);
    answers.set(key, (answers.get(key) ?? 0) + 1);
    variants.push({ n: variants.length + 1, seed, task });
  }
  if (variants.length < 10) {
    console.error(`! ${prototype.id}: набрано только ${variants.length} вариантов`);
    process.exitCode = 1;
  }
  entries.push({ prototype, variants });
}

/* ── bank.ts ─────────────────────────────────────────────────────── */
const tsLines = [];
for (const { prototype, variants } of entries) {
  tsLines.push('  {');
  tsLines.push(`    prototype: '${prototype.id}',`);
  tsLines.push('    variants: [');
  for (const v of variants) {
    tsLines.push(`      { n: ${v.n}, seed: '${v.seed}' },`);
  }
  tsLines.push('    ],');
  tsLines.push('  },');
}
const bankPath = path.join(APP, 'src', 'lib', 'vektory', 'bank.ts');
const bankSource = fs.readFileSync(bankPath, 'utf8');
const marker = 'export const BANK: BankEntry[] = [';
const head = bankSource.slice(0, bankSource.indexOf(marker) + marker.length);
fs.writeFileSync(bankPath, `${head}\n${tsLines.join('\n')}\n];\n`);

/* ── Отчёт ───────────────────────────────────────────────────────── */
report.push('# Задание №02. Этап 2 — банк из 10 вариантов на прототип');
report.push('');
report.push(
  'Файл собран скриптом `scripts/build-bank-2.mjs` для ручной проверки: условия, векторы рисунков и ответы. На сайт ответы не попадают.',
);
report.push('');
const vektory = (task) =>
  task.risunok === null
    ? '—'
    : task.risunok.vectors
        .map((v) => `${v.name}: (${v.from.join('; ')}) → (${v.to.join('; ')})`)
        .join('; ');
for (const { prototype, variants } of entries) {
  report.push(`## ${prototype.id} · ${prototype.nazvanie}`);
  report.push('');
  report.push('| № | Условие | Векторы на рисунке | Ответ |');
  report.push('|---|---|---|---|');
  for (const v of variants) {
    report.push(
      `| ${v.n} | ${v.task.uslovie.replace(/\|/g, '\\|')} | ${vektory(v.task).replace(/\|/g, '\\|')} | **${ru(v.task.otvet)}** |`,
    );
  }
  report.push('');
}
const reportPath = path.join(APP, '..', 'docs', 'tasks', '02-vektory-02-bank.md');
fs.writeFileSync(reportPath, report.join('\n'));
console.log(
  `банк: ${entries.length} прототипов, отчёт ${path.relative(process.cwd(), reportPath)}`,
);
