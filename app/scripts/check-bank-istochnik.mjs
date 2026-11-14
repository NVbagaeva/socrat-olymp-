/*
  Проверка источника «Только ФИПИ» в генераторах с банком готовых задач
  (№7, №10 — общий подбор lib/generator/obshchiy/bank.ts, strogo). У №6
  источник «Только исходные» (демоверсия и образцы) нестрогий: нехватку
  добирают аналоги — это тоже проверяется.

  При источнике «ФИПИ» (i=f) в задачи листа попадают только исходные
  задачи банка (s: 'f'); кончились — позиция пустая и лист короче, а не
  аналог «не из открытого банка» на её месте. Аналоги (i=a) и
  «вперемешку» (i=m) по-прежнему добирают задачи из другого источника.

  Запуск: pnpm test:bank-istochnik. TypeScript переводится в CommonJS во
  временную папку (как в check-veroyatnost.mjs) вместе с модулями, которые
  он просит.
*/

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src');
const require0 = createRequire(import.meta.url);

function loadTypeScript() {
  try {
    return require0('typescript');
  } catch {
    return createRequire('/opt/node22/lib/node_modules/typescript/package.json')('typescript');
  }
}
const ts = loadTypeScript();

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'bank-istochnik-'));

/** Перевести модуль и всё, что он импортирует из src (относительно и через «@/»). */
function perevesti(file, gotovo = new Set()) {
  if (gotovo.has(file)) return;
  gotovo.add(file);
  const code = fs.readFileSync(file, 'utf8');
  for (const m of code.matchAll(/from\s+'((?:\.{1,2}|@)\/[^']+)'/g)) {
    const spec = m[1];
    const base = spec.startsWith('@/')
      ? path.join(src, spec.slice(2))
      : path.join(path.dirname(file), spec);
    const dep = [`${base}.ts`, path.join(base, 'index.ts')].find((f) => fs.existsSync(f));
    if (dep !== undefined) perevesti(dep, gotovo);
  }
  const js = ts
    .transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      fileName: file,
    })
    .outputText.replace(/require\("@\//g, `require("${out.replace(/\\/g, '/')}/`);
  const target = path.join(out, path.relative(src, file).replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, js);
}

perevesti(path.join(src, 'lib', 'generator', 'obshchiy', 'bank.ts'));
const require1 = createRequire(path.join(out, 'x.js'));
const { sobratPoKlyucham } = require1(path.join(out, 'lib', 'generator', 'obshchiy', 'bank.js'));

const problems = [];
let proverok = 0;

for (const razdel of ['zadanie6', 'zadanie7', 'zadanie10']) {
  const strogo = razdel !== 'zadanie6';
  const indeks = JSON.parse(
    fs.readFileSync(path.join(root, 'public', 'data', razdel, 'indeks.json'), 'utf8'),
  );
  const poId = new Map(indeks.map((x) => [x.id, x]));
  const protos = [...new Set(indeks.map((x) => x.p))];
  for (const p of protos) {
    const fipi = indeks.filter((x) => x.p === p && x.s === 'f').length;
    for (const seed of ['AB12CD', 'ZZ9Q', 'K7Q2AB']) {
      for (const [istochnik, variants, n, primery] of [
        ['fipi', 1, 6, 0],
        ['fipi', 2, 4, 2],
        ['analog', 1, 3, 0],
        ['mix', 1, 4, 0],
      ]) {
        const z = {
          sostav: [{ id: p, n }],
          istochnik,
          variants,
          seed,
          zameny: { [`1.${p}_0`]: 2 },
          pamyatka: false,
          primery,
          kind: '',
          date: '',
          qr: false,
        };
        const l = sobratPoKlyucham(z, indeks, `check-${razdel}`, undefined, false, strogo);
        proverok += 1;
        const ids = l.poVariantam.flat().flatMap((x) => (x.id === null ? [] : [x.id]));
        const gde = `${razdel} ${p} seed=${seed} i=${istochnik} v=${variants} n=${n}`;
        if (new Set(ids).size !== ids.length) problems.push(`${gde}: задачи повторяются`);
        if (istochnik === 'fipi' && strogo) {
          const chuzhie = ids.filter((id) => poId.get(id)?.s !== 'f');
          if (chuzhie.length > 0) {
            problems.push(`${gde}: при «ФИПИ» в листе аналоги ${chuzhie.join(', ')}`);
          }
          const zhdali = Math.min(variants * n, fipi);
          if (ids.length !== zhdali) {
            problems.push(`${gde}: задач ФИПИ ${ids.length}, а в банке хватает на ${zhdali}`);
          }
          const pr = l.primery.flatMap((x) => x.ids);
          if (pr.some((id) => ids.includes(id))) problems.push(`${gde}: пример совпал с задачей`);
        } else {
          /* Аналоги и «вперемешку» добирают другим источником: лист полный, если задач хватает. */
          const vsego = indeks.filter((x) => x.p === p).length - 2;
          if (ids.length < Math.min(variants * n, vsego)) {
            problems.push(`${gde}: задач ${ids.length}, ждали ${Math.min(variants * n, vsego)}`);
          }
        }
      }
    }
  }
}

fs.rmSync(out, { recursive: true, force: true });

if (problems.length > 0) {
  console.error(`Источник банка: ${problems.length} проблем(ы):`);
  for (const p of problems.slice(0, 40)) console.error(`  — ${p}`);
  process.exit(1);
}
console.log(
  `Источник банка: ${proverok} листов — у №7 и №10 при «ФИПИ» только задачи открытого банка, у №6 нехватку добирают аналоги.`,
);
