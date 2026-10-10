#!/usr/bin/env node
/* scripts/build-bank-9-open.mjs — открытый банк задания №9.

   Запуск: pnpm build:bank-9-open

   Читает ../content-source/proizvodnaya/otkrytyj-bank.json (массив
   записей, которые добавляет человек) и пишет
   src/lib/proizvodnaya/otkrytyj-bank.ts. В выходном файле ответа
   числом нет: только отпечаток (sealAnswer) и закрытый разбор
   (sealText). Пустой массив — пустой банк, тренажёр это переживает.

   Запись: { id, prototype, uslovie, kartinka?, otvet, razbor?, istochnik }.
   Подробности — в content-source/proizvodnaya/README.md. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const { PROTOTYPES } = requireSrc('lib/proizvodnaya/prototypes/index');
const { sealAnswer, sealText } = requireSrc('lib/proizvodnaya/secret');

const SOURCE = path.join(APP, '..', 'content-source', 'proizvodnaya', 'otkrytyj-bank.json');
const OUT = path.join(APP, 'src', 'lib', 'proizvodnaya', 'otkrytyj-bank.ts');
const PROTOTYPE_IDS = new Set(PROTOTYPES.map((p) => p.id));

const errors = [];
function fail(where, message) {
  errors.push(`${where}: ${message}`);
}

let records;
try {
  records = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
} catch (error) {
  console.error(`! не прочитан ${path.relative(APP, SOURCE)}: ${error.message}`);
  process.exit(1);
}
if (!Array.isArray(records)) {
  console.error('! исходник должен быть массивом записей');
  process.exit(1);
}

const ids = new Set();
const tasks = [];
records.forEach((record, index) => {
  const where = `запись №${index + 1}${typeof record?.id === 'string' ? ` (${record.id})` : ''}`;
  if (typeof record !== 'object' || record === null) {
    fail(where, 'не объект');
    return;
  }
  if (typeof record.id !== 'string' || !/^[a-z0-9][a-z0-9._-]*$/i.test(record.id)) {
    fail(where, 'id — латиницей, цифрами, точкой, дефисом или подчёркиванием');
    return;
  }
  if (ids.has(record.id)) {
    fail(where, 'id уже занят');
    return;
  }
  ids.add(record.id);
  if (!PROTOTYPE_IDS.has(record.prototype)) {
    fail(where, `прототип «${record.prototype}» не найден в реестре (9.1.1 … 9.5.6)`);
  }
  if (typeof record.uslovie !== 'string' || record.uslovie.trim() === '') {
    fail(where, 'нет условия (uslovie)');
  }
  if (typeof record.otvet !== 'number' || !Number.isFinite(record.otvet)) {
    fail(where, 'otvet — конечное число');
  }
  if (record.istochnik !== 'otkrytyj-bank') {
    fail(where, "istochnik должен быть 'otkrytyj-bank'");
  }
  let kartinka = null;
  if (record.kartinka !== undefined && record.kartinka !== null) {
    const clean = String(record.kartinka).replace(/^\/?public/, '');
    if (!clean.startsWith('/images/proizvodnaya/bank/')) {
      fail(where, 'kartinka — путь в public/images/proizvodnaya/bank/…');
    } else if (!fs.existsSync(path.join(APP, 'public', clean))) {
      fail(where, `нет файла public${clean}`);
    } else {
      kartinka = clean;
    }
  }
  const razbor = Array.isArray(record.razbor)
    ? record.razbor.filter((l) => typeof l === 'string')
    : [];
  if (errors.length === 0) {
    const seal = sealAnswer(record.otvet);
    tasks.push({
      id: record.id,
      prototype: record.prototype,
      uslovie: record.uslovie.trim(),
      kartinka,
      seal,
      razbor: razbor.length === 0 ? null : sealText(JSON.stringify(razbor), seal),
    });
  }
});

if (errors.length > 0) {
  console.error(errors.map((e) => `! ${e}`).join('\n'));
  process.exit(1);
}

const q = (s) => JSON.stringify(s);
const lines = [
  '/**',
  ' * Открытый банк задания №9: задачи, которые добавил человек.',
  ' *',
  ' * Файл создаётся скриптом scripts/build-bank-9-open.mjs',
  ' * (pnpm build:bank-9-open) из content-source/proizvodnaya/',
  ' * otkrytyj-bank.json и правится только им. Ответа числом здесь нет:',
  ' * отпечаток и закрытый разбор, как у сгенерированных задач.',
  ' */',
  '',
  'export interface OpenBankTask {',
  '  id: string;',
  '  prototype: string;',
  '  /** Условие: текст с формулами в $…$. */',
  '  uslovie: string;',
  '  /** Адрес картинки в public, если она есть. */',
  '  kartinka: string | null;',
  '  /** Отпечаток верного ответа. */',
  '  seal: string;',
  '  /** Разбор: JSON-массив строк, закрытый отпечатком; нет разбора — null. */',
  '  razbor: string | null;',
  "  istochnik: 'otkrytyj-bank';",
  '}',
  '',
  'export const OPEN_BANK: OpenBankTask[] = [',
];
for (const t of tasks) {
  lines.push(
    '  {',
    `    id: ${q(t.id)},`,
    `    prototype: ${q(t.prototype)},`,
    `    uslovie: ${q(t.uslovie)},`,
    `    kartinka: ${t.kartinka === null ? 'null' : q(t.kartinka)},`,
    `    seal: ${q(t.seal)},`,
    `    razbor: ${t.razbor === null ? 'null' : q(t.razbor)},`,
    "    istochnik: 'otkrytyj-bank',",
    '  },',
  );
}
lines.push('];', '');
fs.writeFileSync(OUT, lines.join('\n'));
console.log(`открытый банк №9: ${tasks.length} задач → ${path.relative(APP, OUT)}`);
