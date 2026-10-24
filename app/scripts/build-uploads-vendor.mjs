#!/usr/bin/env node
/* scripts/build-uploads-vendor.mjs — автопроверка части 2 для сервиса
   загрузки (infra/lite/uploads/vendor/).

   Сервис проверяет ответы тем же кодом, что сайт: lib/chast2/vyrazhenie.ts
   и sravnenie.ts переводятся TypeScript'ом в обычные ES-модули. Второй
   копии правил сравнения нет; `pnpm test:chast2` следит, что vendor не
   отстал от исходников.

   Запуск: node scripts/build-uploads-vendor.mjs [--check] */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(APP, '..', 'infra', 'lite', 'uploads', 'vendor');
const FILES = ['vyrazhenie', 'sravnenie'];

export function vendorFiles() {
  return FILES.map((f) => {
    const src = fs.readFileSync(path.join(APP, 'src', 'lib', 'chast2', `${f}.ts`), 'utf8');
    const js = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, removeComments: false },
    }).outputText.replace(/from '\.\/(\w+)'/g, "from './$1.mjs'");
    return [`${f}.mjs`, `/* Собрано из app/src/lib/chast2/${f}.ts (scripts/build-uploads-vendor.mjs). Не править руками. */\n${js}`];
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes('--check');
  let stale = 0;
  fs.mkdirSync(OUT, { recursive: true });
  for (const [name, text] of vendorFiles()) {
    const file = path.join(OUT, name);
    if (check) {
      if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) {
        console.error(`  ✗ ${name} отстал от исходника — pnpm build:uploads-vendor`);
        stale += 1;
      }
    } else {
      fs.writeFileSync(file, text);
      console.log(`  ${name}`);
    }
  }
  process.exit(stale === 0 ? 0 : 1);
}
