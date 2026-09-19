#!/usr/bin/env node
/* scripts/pdf-changed.mjs — изменилось ли содержимое собранных PDF.

   Запуск из корня репозитория:
     node app/scripts/pdf-changed.mjs app/public/materials/zadanie-4

   Две сборки одного и того же сборника расходятся байтами всегда:
   в файле лежат дата печати и внутренние идентификаторы. Если
   коммитить по различию байтов, история копится из одинаковых файлов.
   Поэтому сравнивается содержимое: число страниц и текст страниц
   (sheet-check.mjs). Текст читаемым не будет — шрифты подмножествами,
   в потоке номера знаков, — но одно и то же содержимое даёт одну и ту
   же последовательность, а правка разборов или условий её меняет.

   Сравнивается файл на диске с тем, что лежит в ветке (HEAD). Нет
   файла в ветке — он новый, и это изменение.

   В stdout — одно слово для сборки: `changed` или `same`. Подробности
   идут в stderr, чтобы их было видно в журнале запуска и они не
   мешали разбирать ответ. */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { pdfPages, pdfText } from './lib/sheet-check.mjs';

/** Файлы для сравнения: путь к файлу или к папке с ними. */
function pdfFiles(args) {
  return args.flatMap((target) => {
    if (!fs.existsSync(target)) { return [target]; }
    if (!fs.statSync(target).isDirectory()) { return [target]; }
    return fs.readdirSync(target)
      .filter((name) => name.endsWith('.pdf'))
      .sort()
      .map((name) => path.join(target, name));
  });
}

/** Тот же файл из ветки. Нет его там — null. */
function izVetki(file) {
  try {
    return execFileSync('git', ['show', 'HEAD:' + file], { maxBuffer: 256 * 1024 * 1024 });
  } catch {
    return null;
  }
}

const files = pdfFiles(process.argv.slice(2));
if (files.length === 0) {
  console.error('сравнивать нечего: не передано ни одного файла');
  console.log('changed');
  process.exit(0);
}

let izmenilos = false;
for (const file of files) {
  if (!fs.existsSync(file)) {
    console.error(`  ${file}: файла нет на диске`);
    izmenilos = true;
    continue;
  }
  const bylo = izVetki(file);
  if (bylo === null) {
    console.error(`  ${file}: в ветке файла нет — новый`);
    izmenilos = true;
    continue;
  }

  const stalo = fs.readFileSync(file);
  const stranicBylo = pdfPages(bylo);
  const stranicStalo = pdfPages(stalo);
  if (stranicBylo !== stranicStalo) {
    console.error(`  ${file}: страниц было ${stranicBylo}, стало ${stranicStalo}`);
    izmenilos = true;
  } else if (pdfText(bylo) !== pdfText(stalo)) {
    console.error(`  ${file}: текст страниц изменился (страниц ${stranicStalo})`);
    izmenilos = true;
  } else {
    console.error(`  ${file}: содержимое то же (страниц ${stranicStalo})`);
  }
}

console.log(izmenilos ? 'changed' : 'same');
