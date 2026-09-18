#!/usr/bin/env node
/* scripts/build-pdf-12.mjs — сборник PDF «Задание 12. Линейная функция».

   Запуск:
     node scripts/build-pdf-12.mjs            все четыре файла сборника
     node scripts/build-pdf-12.mjs --sample   образец: первый блок, обе темы,
                                              обе раскладки

   Задачи, условия и ответы приходят из движка graph/. В этом файле
   ни одного условия и ни одного ответа нет и быть не может: он
   раскладывает по листу то, что посчитал движок. Ответы берутся
   у движка напрямую, а не из data/answers.json, — тогда таблица
   ответов не может разойтись с задачами.

   Слова листа — в src/content/sheet12.js, вёрстка — в src/lib/sheet/.
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import generator from '../src/lib/graph/generate.js';
import content from '../src/content/sheet12.js';
import { renderPdf } from './lib/sheet-render.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '..');
const DATA = path.join(APP, 'src', 'lib', 'graph', 'data');
/* Готовые файлы лежат там, откуда их отдаёт сайт: карточка материала
   для репетиторов ссылается на /materials/... (см. content/sections.ts).
   Промежуточный HTML — в служебной папке, она в сборку не идёт. */
const OUT = path.join(APP, 'public', 'materials', 'zadanie-12');
const BUILD = path.join(APP, '.pdf-build');

/* ══════════════════════════════════════════════════════════
   Банк
   ══════════════════════════════════════════════════════════ */
function readSets(dir) {
  const full = path.join(DATA, dir);
  return fs.readdirSync(full)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(full, name), 'utf8')));
}

generator.setSets({ prep: readSets('prep/12'), prototypes: readSets('prototypes/12') });

/**
 * Блоки сборника с задачами и сквозной нумерацией 1, 2, 3…
 *
 * Нумерация одна на весь сборник и не зависит от блока: номер
 * задачи в листе и номер в таблице ответов — одно и то же число.
 */
function collectBlocks(limitBlocks, limitTasks) {
  let number = 0;
  const chosen = limitBlocks ? content.blocks.slice(0, limitBlocks) : content.blocks;

  return chosen.map((block) => {
    let tasks = generator.generateSet(block.set);
    if (limitTasks) { tasks = tasks.slice(0, limitTasks); }

    return {
      title: block.title,
      note: block.note,
      set: block.set,
      tasks: tasks.map((task) => {
        number += 1;
        return {
          no: number,
          id: task.id,
          questionHtml: task.questionHtml,
          options: task.options,
          figureSvg: task.svg,
          answer: task.answer,
        };
      }),
    };
  });
}

/* ══════════════════════════════════════════════════════════
   Описание листа
   ══════════════════════════════════════════════════════════ */
function spec(blocks, options) {
  return {
    theme: options.theme,
    layout: options.layout,
    cell: options.cell,
    documentTitle: content.title.chip + '. ' + content.title.text,
    head: content.head,
    runner: content.runner,
    title: content.title,
    recap: content.recap,
    blocks,
    withAnswerLine: options.withAnswerLine,
    extraItems: options.extraItems || [],
    foot: content.foot,
  };
}

/* Клетка чертежа в миллиметрах. В две колонки карточка вдвое уже,
   поэтому клетка мельче — но остаётся крупнее 4 мм, иначе точки
   на печати читаются неуверенно. */
const CELL = { single: 3.4, double: 3.0 };

/* ══════════════════════════════════════════════════════════
   Сборка
   ══════════════════════════════════════════════════════════ */
async function build(name, blocks, options) {
  const file = path.join(OUT, name + '.pdf');
  const report = await renderPdf(spec(blocks, options), file, {
    keepHtml: options.keepHtml ? path.join(BUILD, name + '.html') : null,
  });

  const expected = blocks.reduce((sum, block) => sum + block.tasks.length, 0);
  if (report.tasks !== expected) {
    throw new Error(name + ': на листе ' + report.tasks + ' задач, в банке ' + expected);
  }
  if (report.overflowing.length) {
    throw new Error(name + ': куски выше страницы — ' + report.overflowing.join(', '));
  }

  const size = (fs.statSync(file).size / 1024).toFixed(0);
  console.log('  ' + name + '.pdf — страниц ' + report.pages +
    ', задач ' + report.tasks + ', ' + size + ' КБ');
  return report;
}

async function sample() {
  /* Образец: первый блок, 8 задач. Первые две страницы листа. */
  const blocks = collectBlocks(1, 8);
  console.log('Образец: блок «' + blocks[0].title + '», задач ' + blocks[0].tasks.length);

  for (const layout of ['single', 'double']) {
    for (const theme of ['color', 'print']) {
      const suffix = (layout === 'single' ? '1-kolonka' : '2-kolonki') +
        (theme === 'print' ? '-chb' : '-cvet');
      await build('obrazec-' + suffix, blocks, {
        theme, layout, cell: CELL[layout], withAnswerLine: true, keepHtml: true,
      });
    }
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  if (process.argv.includes('--sample')) {
    await sample();
    return;
  }
  throw new Error('полный сборник собирается на следующем этапе: пока есть только --sample');
}

main().catch((error) => {
  console.error('\nсборка не удалась: ' + error.message);
  process.exit(1);
});
