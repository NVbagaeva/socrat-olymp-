#!/usr/bin/env node
/* scripts/check-imports.mjs — относительные импорты файлов.

   Проверка типов не смотрит на CSS, и забытый или неверный путь
   к стилям находится только на сборке. Здесь каждый относительный
   импорт из src проверяется на то, что файл существует. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(full);
    }
    return /\.(ts|tsx|js|jsx|css)$/.test(entry.name) ? [full] : [];
  });
}

/* Расширения, которые бандлер добавит сам. */
const TRIES = [
  '',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.css',
  '/index.ts',
  '/index.tsx',
  '/index.js',
];

let bad = 0;
let checked = 0;
walk(src).forEach((file) => {
  const text = fs.readFileSync(file, 'utf8');
  const specs = [
    ...text.matchAll(/(?:^|\n)\s*import\s+(?:[^'"]*?from\s+)?['"](\.[^'"]+)['"]/g),
    ...text.matchAll(/@import\s+['"](\.[^'"]+)['"]/g),
  ].map((m) => m[1]);

  specs.forEach((spec) => {
    checked += 1;
    const base = path.resolve(path.dirname(file), spec);
    if (!TRIES.some((ext) => fs.existsSync(base + ext))) {
      bad += 1;
      console.error(`МИМО ${path.relative(root, file)} → ${spec}`);
    }
  });
});

if (bad > 0) {
  console.error(`\nНе найдено файлов по относительным импортам: ${bad}.`);
  process.exit(1);
}
console.log(`Относительные импорты на месте: проверено ${checked}.`);
