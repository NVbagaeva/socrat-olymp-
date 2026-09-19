#!/usr/bin/env node
/* scripts/build-pdf-4.mjs — сборник PDF «Задание 4. Теория вероятностей».

   Запуск:
     node scripts/build-pdf-4.mjs            все четыре файла сборника
     node scripts/build-pdf-4.mjs --draft    то же без требования KaTeX

   Четыре файла: ученику — цветной и ч/б с заготовками рисунков
   и строкой «Ответ: ____», учителю — те же задачи с заполненными
   рисунками, решением по шагам и таблицей ответов на последней
   странице. Файлы с ответами в репозиторий не ложатся.

   Задачи, рисунки и решения приходят из банка lib/veroyatnost/
   через scripts/lib/sheet4-tasks.mjs; слова листа — src/content/sheet4.js;
   печать — общая сборка scripts/lib/sheet-build.mjs. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSheet } from './lib/sheet-build.mjs';
import { collectSections, content, sheetSpec } from './lib/sheet4-tasks.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '..');
const SECTION = 'zadanie-4';

/* Стили рисунков: те же, что на сайте, плюс лист и ч/б штриховка. */
function figuresCss() {
  return fs.readFileSync(path.join(APP, 'src', 'components', 'probability', 'probability.css'), 'utf8') +
    '\n' + fs.readFileSync(path.join(APP, 'src', 'lib', 'sheet', 'probability-sheet.css'), 'utf8');
}

async function main() {
  const draft = process.argv.includes('--draft');
  const files = [
    { name: content.files.uchenik, theme: 'color', answers: false },
    { name: content.files.uchenikChb, theme: 'print', answers: false },
    { name: content.files.uchitel, theme: 'color', answers: true },
    { name: content.files.uchitelChb, theme: 'print', answers: true },
  ];

  const total = collectSections(false).reduce((sum, s) => sum + s.tasks.length, 0);
  console.log('Сборник: разделов ' + collectSections(false).length + ', задач ' + total);

  for (const file of files) {
    const sections = collectSections(file.answers);
    await buildSheet(APP, SECTION, file.name,
      sheetSpec(sections, { theme: file.theme, withAnswers: file.answers }), {
        withAnswers: file.answers,
        expectTasks: total,
        requireKatex: !draft,
        keepHtml: true,
        extraCss: figuresCss(),
      });
  }
}

main().catch((error) => {
  console.error('\nсборка не удалась: ' + error.message);
  process.exit(1);
});
