#!/usr/bin/env node
/* scripts/check-zakrytoe-13.mjs — «Опорные задачи» №13: разбор файлом.

   Запуск: pnpm build && pnpm test:zakrytoe-13

   Разбор и подсказки задач блока больше не лежат в странице блока, а
   загружаются файлом по кнопке (lib/zadanie13/opornye/zakrytoe.ts).
   Проверяется по готовой сборке app/out:

     1. На каждую задачу каждого блока есть файл, и задача страницы
        вместе с файлом — ровно прежняя задача пула (prepPool13):
        условие, таблица, отпечатки, подсказки, разбор.
     2. Версия в адресе файла — отпечаток его содержимого.
     3. В HTML блока закрытых разборов нет. Страница блока не тяжелее
        400 КБ (было до 2 МБ); у блоков «Таблица руками» — не тяжелее
        3 МБ: таблица для заполнения с закрытыми клетками остаётся в
        странице, без неё задача не рисуется. */

import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { APP, requireSrc } from './lib/load-ts.mjs';

const OUT = path.join(APP, 'out');
const { prepPool13 } = requireSrc('lib/zadanie13/opornye/pool.ts');
const { zadachiStranitsy13 } = requireSrc('lib/zadanie13/opornye/zakrytoe-server.ts');
const { fingerprint } = requireSrc('lib/secret.ts');

let checks = 0;
let failed = 0;
function check(name, ok, detail = '') {
  checks += 1;
  if (!ok) {
    failed += 1;
    console.log(`  FAIL  ${name}${detail === '' ? '' : ` — ${detail}`}`);
  }
}

if (!fs.existsSync(path.join(OUT, 'zadaniya', '13', 'opornye-zadachi'))) {
  console.error('Нет сборки app/out: сначала pnpm build');
  process.exit(1);
}

let zadach = 0;
let maxVes = 0;
for (const blok of prepPool13()) {
  const stranitsa = zadachiStranitsy13(blok);
  const html = fs.readFileSync(
    path.join(OUT, 'zadaniya/13/opornye-zadachi', blok.slug, 'index.html'),
    'utf8',
  );
  const ves = Buffer.byteLength(html);
  maxVes = Math.max(maxVes, ves);
  const tablitsa = blok.zadachi.some((t) => t.zapolni !== null);
  const predel = tablitsa ? 3 * 1024 : 400;
  check(`${blok.slug}: HTML ${Math.round(ves / 1024)} КБ ≤ ${predel} КБ`, ves <= predel * 1024);
  blok.zadachi.forEach((task, i) => {
    zadach += 1;
    const s = stranitsa[i];
    const [put, v] = (s?.zakryto ?? '').split('?v=');
    const fayl = path.join(OUT, put ?? '');
    check(`${blok.slug} №${task.no}: файл есть`, put !== undefined && fs.existsSync(fayl), put);
    if (put === undefined || !fs.existsSync(fayl)) return;
    const text = fs.readFileSync(fayl, 'utf8');
    const z = JSON.parse(text);
    const { zakryto: _z, ...otkrytoe } = s;
    check(
      `${blok.slug} №${task.no}: страница + файл = задача пула`,
      isDeepStrictEqual({ ...otkrytoe, ...z }, task),
    );
    check(
      `${blok.slug} №${task.no}: на странице разбора нет`,
      s.razbor === '' && s.podskazki === '',
    );
    check(
      `${blok.slug} №${task.no}: версия = отпечаток файла`,
      v === fingerprint('z13-op:', JSON.stringify(z)).slice(0, 10),
    );
    if (task.razbor.length > 200) {
      check(
        `${blok.slug} №${task.no}: разбора нет в HTML`,
        !html.includes(task.razbor.slice(0, 200)),
      );
    }
  });
}

console.log(`Задач: ${zadach}, самая тяжёлая страница блока — ${Math.round(maxVes / 1024)} КБ`);
console.log(`Проверок: ${checks}, не прошло: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
