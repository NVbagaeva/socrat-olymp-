#!/usr/bin/env node
/* scripts/check-bundle-secrets.mjs — ответы и разборы не уезжают в бандл.

   Запуск: pnpm test:secrets [папка сборки, по умолчанию out]

   Правило раздела: правильный ответ не попадает в разметку и в бандл
   открытым текстом. В тренажёре ответ закрыт отпечатком, а разбор
   лежит зашифрованным (см. lib/zadanie3/secret.ts) — но всё это
   бесполезно, если в клиентский кусок случайно уехал сам банк: там
   и формула ответа, и разбор строкой.

   Так и случилось однажды: SheetBlock стоял в общей бочке
   components/tasks, бочку брал клиентский экран банка заданий, а
   SheetBlock тянул lib/solid/drawings — тот собирает чертежи
   разделов из данных прототипов и потому импортирует весь банк.
   Проверка ищет ровно этот след.

   Витрина /styleguide/ — единственное исключение: она служебная,
   помечена noindex и показывает ответы намеренно.

   Ненулевой код возврата — в сборке лежит то, чего там быть не должно.
*/

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require0 = createRequire(import.meta.url);

function loadTypeScript() {
  try {
    return require0('typescript');
  } catch {
    const global = createRequire('/opt/node22/lib/node_modules/typescript/package.json');
    return global('typescript');
  }
}

const ts = loadTypeScript();

function walk(dir, ok) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(full, ok);
    }
    return ok(full) ? [full] : [];
  });
}

/* Банк читается из исходников: нужны тексты разборов, чтобы искать
   именно их, а не абстрактный признак. */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'secrets-'));
const src = path.join(root, 'src', 'lib');
for (const file of walk(path.join(src, 'solid'), (f) => f.endsWith('.ts'))
  .concat(walk(path.join(src, 'zadanie3'), (f) => f.endsWith('.ts')))
  .concat(walk(path.join(src, 'veroyatnost'), (f) => f.endsWith('.ts')))
  .concat([path.join(src, 'answer.ts')])) {
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: file,
  }).outputText;
  const target = path.join(tmp, path.relative(src, file).replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, js);
}
const { BANK } = require0(path.join(tmp, 'zadanie3', 'index.js'));
const { BANK_4 } = require0(path.join(tmp, 'veroyatnost', 'index.js'));

/* Отпечаток разбора: начало первого шага первого варианта. Строка
   длинная и в обычной вёрстке не встречается. Банки обоих разделов
   проверяются одинаково — правило «ответа в бандле нет» общее. */
const marks = [...BANK, ...BANK_4]
  .map((prototype) => {
    const first = prototype.varianty[0];
    const step = prototype.shagi(first.params)[0];
    return { id: prototype.id, text: (step?.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 40) };
  })
  .filter((m) => m.text.length >= 20);

/* Имена полей прототипа: если они есть в куске, уехал весь банк. */
const FIELDS = ['poModeli:', 'perebor:', 'dopustimo:', 'varianty:'];

const outDir = path.resolve(root, process.argv[2] ?? 'out');
if (!fs.existsSync(outDir)) {
  console.error(`Папки сборки нет: ${outDir}`);
  process.exit(1);
}

/* Витрина показывает ответы намеренно: она служебная и noindex. */
const allowed = (file) => path.relative(outDir, file).split(path.sep).includes('styleguide');

const files = walk(outDir, (f) => /\.(js|html|txt|json)$/.test(f)).filter((f) => !allowed(f));
const bad = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const fields = FIELDS.filter((f) => text.includes(f));
  const hits = marks.filter((m) => text.includes(m.text));
  if (fields.length > 0 || hits.length > 0) {
    bad.push({
      file: path.relative(outDir, file),
      fields,
      ids: hits.map((h) => h.id),
    });
  }
}

fs.rmSync(tmp, { recursive: true, force: true });

console.log(`Просмотрено файлов сборки: ${files.length}; прототипов в банках: ${BANK.length + BANK_4.length}`);
if (bad.length === 0) {
  console.log('Ответов и разборов в бандле нет.');
  process.exit(0);
}

console.error('\nВ сборку уехал банк задания:');
bad.forEach((row) => {
  console.error(`  ${row.file}`);
  if (row.fields.length > 0) {
    console.error(`    поля прототипа: ${row.fields.join(' ')}`);
  }
  if (row.ids.length > 0) {
    console.error(`    разборы прототипов: ${row.ids.slice(0, 8).join(', ')}${row.ids.length > 8 ? ` и ещё ${row.ids.length - 8}` : ''}`);
  }
});
process.exit(1);
