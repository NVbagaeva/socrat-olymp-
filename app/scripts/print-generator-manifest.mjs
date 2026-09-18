#!/usr/bin/env node
/* scripts/print-generator-manifest.mjs — манифест генератора таблицей.

   Запуск: pnpm manifest:generator

   Печатает то, что соберёт src/lib/generator/manifest.js из данных
   движка и списка семейств. Ничего не проверяет и ничего не пишет:
   это способ посмотреть на числа глазами до того, как они попадут
   на экран.

   Список семейств лежит в TypeScript (data/functionTypes.ts), поэтому
   читается через transpileModule — так же, как в check-bundle-secrets.
*/

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { buildManifest } from '../src/lib/generator/manifest.js';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(APP, 'src', 'lib', 'graph', 'data');
const require0 = createRequire(import.meta.url);

function loadTypeScript() {
  try {
    return require0('typescript');
  } catch {
    return createRequire('/opt/node22/lib/node_modules/typescript/package.json')('typescript');
  }
}

/* Наборы — с диска, как в остальных служебных скриптах. */
function readSets(dir) {
  const full = path.join(DATA, dir);
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(full, f), 'utf8')));
}

/* data/functionTypes.ts тянет за собой taskTypes.ts и materials.ts
   по алиасу «@/»: все три переписываются в CommonJS во временную
   папку, алиас заменяется относительным путём. */
function loadFamilies() {
  const ts = loadTypeScript();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-'));
  const src = path.join(APP, 'src');
  for (const name of ['data/functionTypes.ts', 'data/taskTypes.ts', 'data/materials.ts']) {
    const file = path.join(src, name);
    const source = fs.readFileSync(file, 'utf8').replace(/from '@\/data\//g, "from './");
    const js = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      fileName: file,
    }).outputText;
    const target = path.join(tmp, name.replace(/\.ts$/, '.js'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, js);
  }
  const { functionTypes } = require0(path.join(tmp, 'data', 'functionTypes.js'));
  fs.rmSync(tmp, { recursive: true, force: true });
  return functionTypes;
}

const manifest = buildManifest(
  { prep: readSets('prep/12'), prototypes: readSets('prototypes/12') },
  loadFamilies(),
);

function levels(skill) {
  return skill.levels.length === 0
    ? '—'
    : skill.levels.map((l) => `${l} ${skill.levelCounts[l]}`).join(', ');
}

for (const family of manifest.families) {
  console.log(`\n${family.title} (${family.id}) · ${family.status}`);
  console.log(
    `  подготовка: ${family.prep.sets} наб. / ${family.prep.tasks} задач · ` +
      `прототипы: ${family.prototypes.sets} наб. / ${family.prototypes.tasks} задач · ` +
      `всего ${family.total} · уровни: ${family.levels.join(', ') || '—'}`,
  );
  if (family.missing.length) {
    console.log(`  ! в конфиге есть, в данных нет: ${family.missing.join(', ')}`);
  }
  if (family.skills.length === 0) {
    console.log('  навыков нет');
    continue;
  }
  console.log('  набор   | вид       | название                       | задач | уровни               | правило ответа');
  for (const s of family.skills) {
    console.log(
      `  ${s.id.padEnd(7)} | ${s.kind.padEnd(9)} | ${s.title.padEnd(30)} | ${String(s.count).padStart(5)} | ` +
        `${levels(s).padEnd(20)} | ${s.answerRules.join(', ')}${s.hasChart ? '' : ' (без чертежа)'}`,
    );
  }
}
if (manifest.orphans.length) {
  console.log(`\n! наборы без семейства: ${manifest.orphans.join(', ')}`);
}
