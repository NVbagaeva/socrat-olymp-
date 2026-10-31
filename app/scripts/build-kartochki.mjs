#!/usr/bin/env node
/* scripts/build-kartochki.mjs — список колод карточек по теории.

   Колода номера — один файл src/content/kartochki/NN-*.ts (NN — номер
   задания двумя цифрами). Этот скрипт находит все такие файлы и пишет
   два списка:
     — index.ts: колоды целиком (серверные страницы, сборка);
     — spisok.ts: только номера с колодами (лёгкий, для ленты вкладок
       в браузере — вкладка «Карточки» появляется сама).
   Запускается перед pnpm dev и pnpm build; руками списки не правятся.

   --check — ничего не пишет, падает, если списки устарели (CI). */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(HERE, '..', 'src', 'content', 'kartochki');
const CHECK = process.argv.includes('--check');

const SHAPKA = '/* Сгенерировано scripts/build-kartochki.mjs — не править руками. */\n';

const faily = fs
  .readdirSync(DIR)
  .filter((f) => /^\d\d-[a-z0-9-]+\.ts$/.test(f))
  .sort();

const kolody = faily.map((f) => ({
  file: f.replace(/\.ts$/, ''),
  task: Number(f.slice(0, 2)),
  imya: `k${f.slice(0, 2)}`,
}));

const index =
  SHAPKA +
  "import type { Koloda } from '@/lib/kartochki/tipy';\n" +
  kolody.map((k) => `import ${k.imya} from './${k.file}';\n`).join('') +
  '\n/** Все колоды по номеру задания. */\n' +
  `export const KOLODY: readonly Koloda[] = [${kolody.map((k) => k.imya).join(', ')}];\n` +
  '\nexport function kolodaNomera(task: number): Koloda {\n' +
  '  const k = KOLODY.find((x) => x.task === task);\n' +
  '  if (k === undefined) throw new Error(`нет колоды карточек для №${task}`);\n' +
  '  return k;\n' +
  '}\n';

const spisok =
  SHAPKA +
  '\n/** Номера заданий, у которых есть колода карточек (адрес раздела /zadaniya/{номер}/). */\n' +
  `export const NOMERA_S_KARTOCHKAMI: readonly string[] = [${kolody.map((k) => `'${k.task}'`).join(', ')}];\n`;

let ustarelo = false;
for (const [name, text] of [
  ['index.ts', index],
  ['spisok.ts', spisok],
]) {
  const file = path.join(DIR, name);
  const bylo = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (bylo === text) continue;
  if (CHECK) {
    console.error(`kartochki: ${name} устарел — запустите node scripts/build-kartochki.mjs`);
    ustarelo = true;
  } else {
    fs.writeFileSync(file, text);
    console.log(`kartochki: ${name} — колод ${kolody.length}`);
  }
}
if (ustarelo) process.exit(1);
