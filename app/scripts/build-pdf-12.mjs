#!/usr/bin/env node
/* scripts/build-pdf-12.mjs — сборник PDF «Задание 12. Линейная функция».

   Запуск:
     node scripts/build-pdf-12.mjs            все четыре файла сборника
     node scripts/build-pdf-12.mjs --sample   образец: первый блок, обе темы
     node scripts/build-pdf-12.mjs --draft    то же, что без ключей, но
                                              без требования KaTeX

   Готовый сборник собирается только с KaTeX: формулы в нём должны
   быть настоящими. Ключ --draft нужен, чтобы проверить состав
   и разбиение на страницы там, где пакет недоступен; выпускать
   такой файл нельзя, и в его отчёте так и написано.

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
import solutionBuilder from '../src/lib/graph/solution.js';
import { answersItems } from '../src/lib/sheet/answers12.js';
import content from '../src/content/sheet12.js';
import { buildSheet } from './lib/sheet-build.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '..');
const DATA = path.join(APP, 'src', 'lib', 'graph', 'data');
/* Куда ложится готовый файл и как печатается лист, решает общая
   сборка scripts/lib/sheet-build.mjs: файл для ученика идёт в public
   и отдаётся сайтом, файл для учителя — в папку вне репозитория
   и уезжает архивом из CI. Промежуточный HTML — в служебной папке. */
const SECTION = 'zadanie-12';

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
/* Правило ответа лежит в описании задачи, а не в результате сборки:
   раздел решений выбирает по нему ветку разбора. */
const rules = {};
for (const set of [...readSets('prep/12'), ...readSets('prototypes/12')]) {
  for (const task of set.tasks || []) { rules[task.id] = task.answerRule; }
}

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
          /* Ответ, набранный движком: обыкновенная дробь приходит
             дробью, а не строкой с косой чертой. */
          answerHtml: task.answerHtml,
          /* Для раздела ответов: правило и разбор берутся у движка. */
          answerRule: rules[task.id],
          seed: task.meta.seed,
          meta: task.meta,
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
    frame: options.frame,
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

/* Раскладка сборника — одна колонка, чертёж справа от текста:
   утверждено автором по образцу Этапа 1. Раскладка в две колонки
   в шаблоне осталась и работает, но сборник её не использует —
   она пригодится генератору вариантов. */
const LAYOUT = 'single';

/* Размер чертежа. Окна у задач разные (±5 — десять клеток, ±8 —
   шестнадцать), поэтому одна рамка и одна клетка одновременно
   недостижимы: либо рамка одна и клетка разная, либо наоборот.
   Привести окна к одному нельзя — у 17 задач 12.C и 12.D точка
   пересечения оказалась бы внутри окна, а прототип требует, чтобы
   ответ нельзя было снять с чертежа.

   FRAME — одна рамка на все задачи в миллиметрах. Клетка тогда
   считается сама: рамка делится на число клеток окна. Прежняя
   постоянная клетка (3,4 мм на одну колонку) этим и отменена. */
const FRAME = 62;

/* ══════════════════════════════════════════════════════════
   Сборка
   ══════════════════════════════════════════════════════════ */
async function build(name, blocks, options) {
  const expected = blocks.reduce((sum, block) => sum + block.tasks.length, 0);
  return buildSheet(APP, SECTION, name, spec(blocks, options), {
    withAnswers: Boolean(options.answers),
    expectTasks: expected,
    requireKatex: options.requireKatex,
    keepHtml: options.keepHtml,
  });
}

async function sample() {
  /* Образец: первый блок, 8 задач, в утверждённой раскладке. */
  const blocks = collectBlocks(1, 8);
  const title = blocks[0].title.replace(/<[^>]*>/g, '');
  console.log('Образец: блок «' + title + '», задач ' + blocks[0].tasks.length);

  for (const theme of ['color', 'print']) {
    await build('obrazec' + (theme === 'print' ? '-chb' : '-cvet'), blocks, {
      theme, layout: LAYOUT, frame: FRAME, withAnswerLine: true, keepHtml: true,
      answers: false,
    });
  }
}

async function full(draft) {
  const blocks = collectBlocks();
  const total = blocks.reduce((sum, block) => sum + block.tasks.length, 0);
  console.log('Сборник: блоков ' + blocks.length + ', задач ' + total);

  const tail = answersItems(blocks, generator, solutionBuilder);

  /* Четыре файла: ученику — со строкой ответа и без ответов вовсе,
     учителю — те же задачи и раздел «Ответы» с новой страницы. */
  const files = [
    { name: content.files.uchenik, theme: 'color', answers: false },
    { name: content.files.uchenikChb, theme: 'print', answers: false },
    { name: content.files.uchitel, theme: 'color', answers: true },
    { name: content.files.uchitelChb, theme: 'print', answers: true },
  ];

  for (const file of files) {
    await build(file.name, blocks, {
      theme: file.theme,
      layout: LAYOUT,
      frame: FRAME,
      withAnswerLine: !file.answers,
      extraItems: file.answers ? tail : [],
      /* Ответы есть — значит файл в репозиторий не ложится. */
      answers: file.answers,
      requireKatex: !draft,
      keepHtml: true,
      expectTasks: total,
    });
  }
}

async function main() {
  if (process.argv.includes('--sample')) {
    await sample();
    return;
  }
  await full(process.argv.includes('--draft'));
}

main().catch((error) => {
  console.error('\nсборка не удалась: ' + error.message);
  process.exit(1);
});
