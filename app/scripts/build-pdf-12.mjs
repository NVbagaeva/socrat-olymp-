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
import Line from '../src/lib/graph/families/line.js';
import answers from '../src/lib/sheet/answers.js';
import outputs from '../src/lib/sheet/outputs.js';
import content from '../src/content/sheet12.js';
import { renderPdf } from './lib/sheet-render.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '..');
const DATA = path.join(APP, 'src', 'lib', 'graph', 'data');
/* Куда ложится готовый файл, решает sheet/outputs.js, и решение
   зависит от того, есть ли в файле ответы: файл для ученика идёт
   в public и отдаётся сайтом, файл для учителя — в папку вне
   репозитория и уезжает архивом из CI. Репозиторий публичный,
   и всё из public доступно по прямому адресу.

   Промежуточный HTML — в служебной папке, она в сборку не идёт. */
const SECTION = 'zadanie-12';
const BUILD = path.join(APP, '.pdf-build');

function outputFor(name, withAnswers) {
  const where = outputs.target(APP, { name, section: SECTION, withAnswers });
  outputs.assertSafe(where.file, withAnswers);
  return where;
}

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
   Ответы и краткие решения — только файл «Для учителя»
   ══════════════════════════════════════════════════════════ */

/* Ответ для таблицы. У задач с выбором ответ — номер варианта,
   и один номер на бумаге ничего не говорит, поэтому рядом идёт
   текст выбранного варианта. */
function answerHtml(task) {
  if (!task.options) { return task.answerHtml || null; }
  const picked = task.options.filter((option) => option.number === task.answer)[0];
  return picked ? task.answer + ') ' + (picked.html || picked.text) : null;
}

/*  Краткое решение собирается из разбора движка: берутся только
    блоки-формулы пяти шагов и строка ответа. Ничего не дописывается
    и не переформулируется — что посчитал движок, то и печатается.
    Прозаические пояснения разбора на лист не идут: он про ответы,
    а не про обучение.

    Разбор строится не у всех задач. Нет разбора — задача просто
    не попадает в раздел кратких решений, и её ответ остаётся
    в таблице. Придумывать решение нельзя. */
function shortSolution(task) {
  let analysis = null;
  try { analysis = generator.analysis(task.id, task.seed); }
  catch { return null; }
  if (!analysis) { return null; }

  const rule = task.answerRule;
  let steps;
  try {
    steps = solutionBuilder.build({
      triangle: analysis.triangle,
      line: analysis.line,
      window: analysis.task.meta.window,
      task: { rule, answer: task.answer, query: task.meta.query, probe: task.meta.probe },
    });
  } catch { return null; }

  /* Пятый шаг разбора умеет не всякое правило ответа. Чего он
     не умеет — отдаёт общей фразой вместо вывода. Для задач
     на пересечение это именно так: разбор описывает одну прямую,
     а ответ получается из системы двух. Печатать такие формулы
     как решение нельзя — из них заявленный ответ не выводится.

     Ловим по самой фразе, а не по списку правил: если в движке
     появится ветка для пересечений, решения начнут печататься
     сами, без правки этого файла. */
  const last = steps[steps.length - 1] || {};
  const stub = (last.blocks || []).some((piece) =>
    piece.type === 'text' && /Ответ читается из формулы/.test(piece.html || ''));
  if (stub) { return null; }

  /* Из каждого шага берётся ИТОГ — последняя его формула. Промежуточные
     выкладки шага (тангенс через смежный угол, перенос слагаемых) нужны
     ученику в разборе, а в ключе для учителя это шум: там важны k, b,
     сама формула и подстановка. Правило одно на все шаги, поэтому
     выбор не зависит от содержания формулы. */
  const formulas = [];
  steps.forEach((step) => {
    const own = (step.blocks || []).filter((piece) => piece.type === 'formula' && piece.tex);
    if (own.length) { formulas.push(own[own.length - 1].tex); }
  });

  if (formulas.length < 2) { return null; }
  return formulas;
}

function answersItems(blocks) {
  const items = [answers.sectionHead('Ответы', 'по блокам, сквозная нумерация')];

  blocks.forEach((block) => {
    items.push(answers.table(
      block.title,
      block.tasks.map((task) => ({ no: task.no, answer: task.answer, html: answerHtml(task) })),
      5
    ));
  });

  const solved = [];
  blocks.forEach((block) => {
    block.tasks.forEach((task) => {
      const formulas = shortSolution(task);
      if (formulas) { solved.push(answers.solution(task.no, formulas, task.answer)); }
    });
  });

  if (solved.length) {
    items.push(answers.sectionHead('Краткие решения',
      'разбор из банка, ' + solved.length + ' задач из ' +
      blocks.reduce((sum, block) => sum + block.tasks.length, 0)));
    solved.forEach((item) => items.push(item));
  }

  return items;
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
   она пригодится генератору вариантов.

   Клетка чертежа в миллиметрах. Чертёж масштабируется по клетке,
   а не по ширине карточки: тогда клетка одинакова на всех задачах
   и точки читаются одинаково уверенно на всех окнах. 3,4 мм —
   утверждённое значение. */
const LAYOUT = 'single';

/* Размер чертежа. Окна у задач разные (±5 — десять клеток, ±8 —
   шестнадцать), поэтому одна рамка и одна клетка одновременно
   недостижимы: либо рамка одна и клетка разная, либо наоборот.
   Привести окна к одному нельзя — у 17 задач 12.C и 12.D точка
   пересечения оказалась бы внутри окна, а прототип требует, чтобы
   ответ нельзя было снять с чертежа.

   FRAME — одна рамка на все задачи в миллиметрах. Клетка тогда
   считается сама: рамка делится на число клеток окна. */
const FRAME = 62;
const CELL = { single: 3.4, double: 3.0 };

/* ══════════════════════════════════════════════════════════
   Сборка
   ══════════════════════════════════════════════════════════ */
async function build(name, blocks, options) {
  const where = outputFor(name, Boolean(options.answers));
  const file = where.file;
  const report = await renderPdf(spec(blocks, options), file, {
    keepHtml: options.keepHtml ? path.join(BUILD, name + '.html') : null,
    requireKatex: options.requireKatex,
  });

  const expected = blocks.reduce((sum, block) => sum + block.tasks.length, 0);
  if (report.tasks !== expected) {
    throw new Error(name + ': на листе ' + report.tasks + ' задач, в банке ' + expected);
  }
  if (report.overflowing.length) {
    throw new Error(name + ': куски выше страницы — ' + report.overflowing.join(', '));
  }
  if (report.formulasFailed) {
    throw new Error(name + ': KaTeX не принял формул — ' + report.formulasFailed);
  }

  const size = (fs.statSync(file).size / 1024).toFixed(0);
  console.log('  ' + name + '.pdf → ' + (where.published ? 'сайт' : 'только CI') +
    ', страниц ' + report.pages +
    ', задач ' + report.tasks + ', формул ' + report.formulas +
    (report.katex ? ' (KaTeX)' : ' (запасной набор)') + ', ' + size + ' КБ');
  return report;
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

  const tail = answersItems(blocks);

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
