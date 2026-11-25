#!/usr/bin/env node
/* scripts/check-actions-pin.mjs — сторонние действия GitHub Actions закреплены коммитом.

   Запуск: pnpm test:actions-pin

   В .github/workflows и .github/actions (все файлы .yml) каждое
   `uses: владелец/действие@…` — полный SHA коммита (40 знаков), а не
   метка вроде @v5: метку владелец действия может перевесить на другой
   код. Свои действия (./.github/actions/…) не проверяются. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const GH = path.join(ROOT, '.github');

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return files(p);
    return /\.ya?ml$/.test(e.name) ? [p] : [];
  });
}

const bad = [];
let n = 0;
for (const f of files(GH)) {
  fs.readFileSync(f, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      const m = /^\s*(?:-\s*)?uses:\s*['"]?([^'"\s#]+)/.exec(line);
      if (!m || m[1].startsWith('./') || m[1].startsWith('docker://')) return;
      n += 1;
      if (!/@[0-9a-f]{40}$/.test(m[1])) bad.push(`${path.relative(ROOT, f)}:${i + 1}: ${m[1]}`);
    });
}

if (bad.length > 0) {
  console.error('Действия без закрепления коммитом (нужен полный SHA и комментарий с версией):');
  for (const b of bad) console.error(`  - ${b}`);
  process.exit(1);
}
console.log(`Сторонние действия: все ${n} закреплены коммитом.`);
