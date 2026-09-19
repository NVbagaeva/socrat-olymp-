#!/usr/bin/env node
/* scripts/build-bank-8.mjs — подбор банка задания №8.

   Запуск: pnpm build:bank-8

   Для каждого прототипа перебирает seed «8.X#1», «8.X#2», … и
   оставляет первые десять вариантов, у которых условия разные,
   ни один ответ не повторяется чаще трёх раз и уровни распределены
   шесть базовых к четырём повышенным (если у прототипа есть оба).
   Ответ «0» у 8.I допускается не чаще одного раза.

   Результат пишется в src/lib/vychisleniya/bank.ts и в отчёт
   docs/tasks/08-vychisleniya-03-bank.md — с условиями и ответами
   для ручной проверки. В клиентский код ответы не попадают: bank.ts
   хранит только seed. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const { PROTOTYPES } = requireSrc('lib/vychisleniya/prototypes/index');
const { generate, hasLevel } = requireSrc('lib/vychisleniya/generate');
const { ru } = requireSrc('lib/vychisleniya/numbers');
const { SKILLS } = requireSrc('lib/vychisleniya/skills');

const entries = [];
const report = [];

for (const prototype of PROTOTYPES) {
  const both = hasLevel(prototype, 'base') && hasLevel(prototype, 'advanced');
  const plan = both
    ? ['base', 'advanced', 'base', 'base', 'advanced', 'base', 'advanced', 'base', 'base', 'advanced']
    : Array(10).fill(null);
  const variants = [];
  const statements = new Set();
  const signatures = new Set();
  const answers = new Map();
  let attempt = 0;
  while (variants.length < 10 && attempt < 5000) {
    attempt += 1;
    const level = plan[variants.length];
    const seed = `${prototype.id}#${attempt}`;
    let task;
    try {
      task = generate(prototype.id, seed, level);
    } catch {
      continue;
    }
    const key = ru(task.otvet);
    if (statements.has(task.uslovie)) continue;
    if ((answers.get(key) ?? 0) >= (key === '0' ? 1 : 3)) continue;
    const signature = `${task.podtip}|${task.signature ?? ''}`;
    if (task.signature !== undefined && signatures.has(signature)) continue;
    signatures.add(signature);
    statements.add(task.uslovie);
    answers.set(key, (answers.get(key) ?? 0) + 1);
    variants.push({ n: variants.length + 1, seed, level, task });
  }
  if (variants.length < 10) {
    console.error(`! ${prototype.id}: набрано только ${variants.length} вариантов`);
    process.exitCode = 1;
  }
  entries.push({ prototype: prototype.id, variants });
}

const tsLines = [];
for (const entry of entries) {
  tsLines.push(`  {\n    prototype: '${entry.prototype}',\n    variants: [`);
  for (const v of entry.variants) {
    tsLines.push(`      { n: ${v.n}, seed: '${v.seed}', level: ${v.level === null ? 'null' : `'${v.level}'`} },`);
  }
  tsLines.push('    ],\n  },');
}

const bankPath = path.join(APP, 'src', 'lib', 'vychisleniya', 'bank.ts');
const bankSource = fs.readFileSync(bankPath, 'utf8');
const marker = 'export const BANK: BankEntry[] = [';
const head = bankSource.slice(0, bankSource.indexOf(marker) + marker.length);
fs.writeFileSync(bankPath, `${head}\n${tsLines.join('\n')}\n];\n`);

report.push('# Задание №08. Этап 3 — банк из 10 вариантов на прототип', '');
report.push('Файл собран скриптом `scripts/build-bank-8.mjs` для ручной проверки: условия и ответы. На сайт ответы не попадают.', '');
for (const skill of SKILLS) {
  report.push(`## ${skill.id} · ${skill.nazvanie}`, '');
  for (const id of skill.prototypes) {
    const entry = entries.find((e) => e.prototype === id);
    const prototype = PROTOTYPES.find((p) => p.id === id);
    report.push(`### ${id} · ${prototype.nazvanie}`, '', '| № | Уровень | Условие | Ответ |', '|---|---|---|---|');
    for (const v of entry.variants) {
      const level = v.task.level === 'base' ? 'Б' : 'П';
      report.push(`| ${v.n} | ${level} | ${v.task.uslovie.replace(/\|/g, '\\|')} | **${ru(v.task.otvet)}** |`);
    }
    report.push('');
  }
}
const reportPath = path.join(APP, '..', 'docs', 'tasks', '08-vychisleniya-03-bank.md');
fs.writeFileSync(reportPath, report.join('\n'));
console.log(`банк: ${entries.length} прототипов, ${entries.reduce((s, e) => s + e.variants.length, 0)} вариантов → ${path.relative(APP, bankPath)}, отчёт → ${path.relative(APP, reportPath)}`);
