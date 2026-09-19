#!/usr/bin/env node
/* scripts/build-pdf-4-baza.mjs — печатная база PDF «Задание 4»: все
   прототипы тренажёра с вариантами 1–10.

   Запуск:
     node scripts/build-pdf-4-baza.mjs            оба файла базы
     node scripts/build-pdf-4-baza.mjs --draft    то же без требования KaTeX

   Два файла: ученику — условия и строка «Ответ: ____» под каждой
   задачей, учителю — те же условия, под каждой решение по шагам
   и ответ, в конце таблица ответов. Файл с ответами в репозиторий
   не ложится.

   Задачи и решения приходят из банка lib/veroyatnost/ через
   scripts/lib/sheet4-baza-tasks.mjs; слова листа — src/content/sheet4-baza.js;
   печать — общая сборка scripts/lib/sheet-build.mjs, что и у сборников
   №12, №4 и №5. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSheet } from './lib/sheet-build.mjs';
import { collectBlocks, content, sheetSpec, tasksOf } from './lib/sheet4-baza-tasks.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '..');
const SECTION = 'zadanie-4';

/* Стили базы сверх шаблона: место под запись решения в карточке. */
function bazaCss() {
  return fs.readFileSync(path.join(APP, 'src', 'lib', 'sheet', 'baza-sheet.css'), 'utf8');
}

async function main() {
  const draft = process.argv.includes('--draft');
  const files = [
    { name: content.files.uchenik, theme: 'color', answers: false },
    { name: content.files.uchitel, theme: 'color', answers: true },
  ];

  const blocks = collectBlocks(false);
  const total = tasksOf(blocks).length;
  const prototypes = blocks.filter((block) => block.tasks.length).length;
  console.log('База: разделов ' + (blocks.length - prototypes) +
    ', прототипов ' + prototypes + ', задач ' + total);

  for (const file of files) {
    await buildSheet(APP, SECTION, file.name,
      sheetSpec(collectBlocks(file.answers), { theme: file.theme, withAnswers: file.answers }), {
        withAnswers: file.answers,
        expectTasks: total,
        requireKatex: !draft,
        keepHtml: true,
        extraCss: bazaCss(),
      });
  }
}

main().catch((error) => {
  console.error('\nсборка не удалась: ' + error.message);
  process.exit(1);
});
