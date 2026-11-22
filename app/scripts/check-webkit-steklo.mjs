#!/usr/bin/env node
/* scripts/check-webkit-steklo.mjs — у каждого backdrop-filter есть пара
   -webkit-backdrop-filter.

   Safari на iPhone до iOS 18 понимает размытие только с префиксом, а
   сборка (Lightning CSS) его сама не добавляет. Без пары стекло в Safari
   не размывается: липкая шапка становится полупрозрачной, и текст
   страницы читается сквозь неё (docs/launch-audit.md, A5).

   Запуск: pnpm test:webkit-steklo   (сборка не нужна — смотрит src/) */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const src = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

function* cssFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* cssFiles(full);
    else if (entry.name.endsWith('.css')) yield full;
  }
}

const problems = [];
let total = 0;
for (const file of cssFiles(src)) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (!/^\s*backdrop-filter\s*:/.test(line)) return;
    total += 1;
    /* Пара — в соседних двух строках того же правила. */
    const near = lines.slice(Math.max(0, i - 2), i + 3).join('\n');
    if (!/-webkit-backdrop-filter\s*:/.test(near)) {
      problems.push(`${path.relative(src, file)}:${i + 1}  ${line.trim()}`);
    }
  });
}

if (problems.length > 0) {
  console.error(`backdrop-filter без -webkit-backdrop-filter (${problems.length}):`);
  for (const p of problems) console.error(`  ${p}`);
  console.error('Допишите рядом: -webkit-backdrop-filter: <то же значение>;');
  process.exit(1);
}
console.log(`backdrop-filter: ${total} объявлений, у всех есть -webkit-backdrop-filter.`);
