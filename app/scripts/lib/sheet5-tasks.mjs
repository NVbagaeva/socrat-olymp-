/* scripts/lib/sheet5-tasks.mjs — состав сборника «Задание 5»: задачи
   из банка, их рисунки и описание листа.

   Один модуль на сборку (build-pdf-5.mjs) и проверку (check-pdf-5.mjs):
   оба смотрят на один и тот же список задач, поэтому разойтись не могут.

   Откуда что берётся:
     • задачи — 40 задач конспекта (PODGOTOVKA_5) по его же шести
       блокам и первый вариант каждого из 12 прототипов банка (BANK_5)
       по методам. У задач конспекта модели нет: условие, шаги и ответ
       берутся из самой задачи; у прототипов всё считает модель задачи
       (model-zadachi.ts), как у сборника №4;
     • рисунок — тот же Vizualizatsiya, что рисует карточку в тренажёре,
       отрисованный в строку SVG (общие сборщики sheet4-tasks.mjs).
       Ученику — заготовка без подсветки, учителю — с подсветкой.
       Лабиринт задачи 33 — готовый файл labirint-glass.svg;
     • решение — шаги разбора банка с их формулами в TeX;
     • слова листа — src/content/sheet5.js.

   Задача, не попавшая ни в один раздел, — ошибка сборки, а не
   молчаливая потеря. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import answers from '../../src/lib/sheet/answers.js';
import marks from '../../src/lib/sheet/marks.js';
import typo from '../../src/lib/sheet/typography.js';
import content from '../../src/content/sheet5.js';
import { requireSrc } from './load-ts.mjs';
import { figureSize, figureSvg } from './sheet4-tasks.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '..', '..');
/* Лабиринт — единственный чертёж конспекта: готовый SVG из public. */
const LABIRINT = path.join(APP, 'public', 'images', 'veroyatnost', 'labirint-glass.svg');

let libs = null;
function lib() {
  if (!libs) {
    libs = {
      bank: requireSrc('lib/veroyatnost/index'),
      modeli: requireSrc('lib/veroyatnost/model-zadachi'),
      model: requireSrc('lib/veroyatnost/model'),
      types: requireSrc('lib/veroyatnost/types'),
      list: requireSrc('content/veroyatnost'),
    };
  }
  return libs;
}

/* ══════════════════════════════════════════════════════════
   Задачи
   ══════════════════════════════════════════════════════════ */

/** Шаги разбора → разметка решения: слова, формула в TeX и словами. */
function stepsHtml(shagi, answer) {
  const { model } = lib();
  const items = shagi.map((step) => ({
    text: step.text,
    tex: step.formula,
    plain: step.formula ? model.texPlain(step.formula) : '',
  }));
  return answers.steps(items, answer);
}

/** Задача конспекта: условие, ответ и шаги — из самой задачи. */
function konspektTask(zadacha, withAnswers) {
  const { bank, types } = lib();
  const answer = types.dec(bank.prepOtvet(zadacha));
  const task = {
    id: zadacha.id,
    method: null,
    questionHtml: typo.escape(zadacha.uslovie),
    options: null,
    figureSvg: null,
    answer,
    answerHtml: null,
    solutionHtml: withAnswers ? stepsHtml(zadacha.shagi, answer) : null,
  };
  if (zadacha.risunok !== undefined) {
    const svg = fs.readFileSync(LABIRINT, 'utf8');
    const size = figureSize(svg);
    Object.assign(task, { figureSvg: svg, figureWidth: size.width, figureBelow: size.below });
  }
  return task;
}

/** Прототип: первый вариант через модель задачи, как в сборнике №4. */
function prototypeTask(prototype, withAnswers) {
  const { modeli } = lib();
  const first = prototype.varianty[0];
  if (!first) { throw new Error('у прототипа ' + prototype.id + ' нет вариантов'); }
  const model = modeli.modelVarianta(prototype, first);
  const task = {
    id: model.id,
    method: model.method,
    questionHtml: typo.escape(model.condition),
    options: null,
    figureSvg: null,
    answer: model.answer.display,
    answerHtml: null,
    solutionHtml: withAnswers ? stepsHtml(model.solution.steps, model.answer.display) : null,
  };
  /* У метода «Формула» рисунка нет — задача решается шагами. */
  if (model.method !== 'formula') {
    const svg = figureSvg(model.parameters, withAnswers ? model.solution.highlight : null);
    const size = figureSize(svg);
    Object.assign(task, { figureSvg: svg, figureWidth: size.width, figureBelow: size.below });
  }
  return task;
}

/**
 * Разделы сборника с задачами и сквозной нумерацией: шесть блоков
 * конспекта, затем прототипы по методам.
 *
 * withAnswers — файл для учителя: рисунок с подсветкой и решение
 * в карточке. Без ответов — заготовка рисунка и ни одного ответа.
 */
export function collectSections(withAnswers) {
  const { bank } = lib();
  const sections = [];

  bank.PODGOTOVKA_5.forEach((blok) => {
    sections.push({
      title: blok.nazvanie,
      note: blok.tip,
      set: blok.id,
      tasks: blok.zadachi.map((zadacha) => konspektTask(zadacha, withAnswers)),
    });
  });

  const poMetodam = content.prototypeSections.map((section) => ({
    title: section.title,
    note: section.note,
    set: section.method,
    tasks: [],
  }));
  bank.BANK_5.forEach((prototype) => {
    const task = prototypeTask(prototype, withAnswers);
    const section = poMetodam.find((s) => s.set === task.method);
    if (!section) { throw new Error('прототипу ' + prototype.id + ' не нашлось раздела: метод ' + task.method); }
    section.tasks.push(task);
  });

  let number = 0;
  return [...sections, ...poMetodam]
    .filter((section) => section.tasks.length)
    .map((section) => ({
      ...section,
      tasks: section.tasks.map((task) => {
        number += 1;
        return { no: number, ...task };
      }),
    }));
}

/* ══════════════════════════════════════════════════════════
   Рамка «Повторяем» и описание листа
   ══════════════════════════════════════════════════════════ */

function mathSpan(tex) {
  const { model } = lib();
  return '<span class="math" data-tex="' + typo.attr(tex) + '">' +
    typo.escape(model.texPlain(tex)) + '</span>';
}

export function recap() {
  const { model } = lib();
  return {
    title: content.recap.title,
    items: content.recap.methods.map((item) => {
      const opisanie = model.metodPoId(item.id);
      /* В одну строку пункта — дробь текстового кегля, а не выключная. */
      return typo.escape(item.name) + ' — ' + mathSpan(opisanie.formula.replace(/\\dfrac/g, '\\frac'));
    }),
    phrase: content.recap.phrase,
  };
}

/** Хвост файла для учителя: таблица ответов по разделам с новой страницы. */
export function answersItems(sections) {
  const items = [answers.sectionHead(content.otvety.title, content.otvety.note)];
  sections.forEach((section) => {
    items.push(answers.table(
      section.title,
      section.tasks.map((task) => ({ no: task.no, answer: task.answer, html: null })),
      5));
  });
  return items;
}

/** Название задания и строка компактной шапки — те же, что на сайте. */
export function naming() {
  const { LIST_5 } = lib().list;
  return {
    chip: LIST_5.title.chip,
    text: LIST_5.title.text,
    runner: LIST_5.runner,
    documentTitle: LIST_5.title.chip + '. ' + LIST_5.title.text,
  };
}

/** Описание листа для шаблона. */
export function sheetSpec(sections, options) {
  const name = naming();
  return {
    theme: options.theme,
    layout: 'single',
    documentTitle: name.documentTitle,
    head: content.head,
    runner: name.runner,
    title: { chip: name.chip, text: name.text, subtitle: content.subtitle },
    recap: recap(),
    blocks: sections,
    withAnswerLine: !options.withAnswers,
    extraItems: options.withAnswers ? answersItems(sections) : [],
    foot: content.foot,
    defs: marks.hatchDefs(),
  };
}

export { content };
