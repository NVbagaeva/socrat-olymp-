#!/usr/bin/env node
/* scripts/check-prep-order.mjs — порядок обхода задач внутри навыка.

   Проверяет lib/prepOrder.ts на примерах: свободный порядок решения
   означает, что «дальше» ведёт к ближайшей нерешённой, а не к
   следующему номеру. Ненулевой код возврата — логика разошлась
   с ожиданием. */

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
const src = path.join(root, 'src', 'lib', 'prepOrder.ts');
const out = path.join(root, '.prepOrder.check.cjs');
fs.writeFileSync(
  out,
  ts.transpileModule(fs.readFileSync(src, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
);
const { nextUnsolved } = require0(out);
fs.rmSync(out);

/* Набор из десяти задач: R — решена, точка — нет. */
const cases = [
  { name: 'ничего не решено, стоим на первой', row: '..........', from: 0, want: 1 },
  { name: 'решена только седьмая, стоим на ней', row: '......R...', from: 6, want: 7 },
  { name: 'решены все, кроме второй, стоим на десятой', row: 'R.RRRRRRRR', from: 9, want: 1 },
  { name: 'решены подряд с первой, стоим на третьей', row: 'RRR.......', from: 2, want: 3 },
  { name: 'дырка в начале, стоим на девятой', row: '.RRRRRRRR.', from: 8, want: 9 },
  { name: 'дырка в начале, стоим на десятой', row: '.RRRRRRRRR', from: 9, want: 0 },
  { name: 'решены все', row: 'RRRRRRRRRR', from: 4, want: null },
  { name: 'решена одна, стоим на ней, переход через конец', row: 'R.........', from: 0, want: 1 },
];

let bad = 0;
cases.forEach((item) => {
  const status = [...item.row].map((ch) => (ch === 'R' ? 'right' : null));
  const got = nextUnsolved(status, item.from);
  const ok = got === item.want;
  if (!ok) {
    bad += 1;
  }
  const show = (v) => (v === null ? 'некуда' : `задача ${v + 1}`);
  console.log(
    `${ok ? '  ок ' : 'МИМО'} ${item.name}: ${show(got)}${ok ? '' : `, ждали ${show(item.want)}`}`,
  );
});

if (bad > 0) {
  console.error(`\nПорядок обхода разошёлся с ожиданием: ${bad} из ${cases.length}.`);
  process.exit(1);
}
console.log(`\nПорядок обхода сходится: ${cases.length} примеров.`);
