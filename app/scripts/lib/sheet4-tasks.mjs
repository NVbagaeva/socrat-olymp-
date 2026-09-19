/* scripts/lib/sheet4-tasks.mjs — состав сборника «Задание 4»: задачи
   из банка, их рисунки и описание листа.

   Один модуль на сборку (build-pdf-4.mjs) и проверку (check-pdf-4.mjs):
   оба смотрят на один и тот же список задач, поэтому разойтись не могут.

   Откуда что берётся:
     • задачи — 18 задач конспекта (PODGOTOVKA_4) и первый вариант
       каждого из 21 прототипа банка (BANK_4). Ни одного условия здесь
       нет: всё считает банк через модель задачи (model-zadachi.ts);
     • рисунок — тот же компонент Vizualizatsiya, что рисует карточку
       в тренажёре, отрисованный в строку SVG. Ученику — без подсветки
       благоприятного (это заготовка), учителю — с подсветкой и счётом;
     • решение — шаги разбора банка с их формулами в TeX;
     • слова листа — src/content/sheet4.js.

   Раздел листа выбирается по методу задачи; исключения перечислены
   в content (ids раздела). Задача, не попавшая ни в один раздел, —
   ошибка сборки, а не молчаливая потеря. */

import { createRequire } from 'node:module';

import answers from '../../src/lib/sheet/answers.js';
import marks from '../../src/lib/sheet/marks.js';
import sheet from '../../src/lib/sheet/sheet.js';
import typo from '../../src/lib/sheet/typography.js';
import content from '../../src/content/sheet4.js';
import { requireSrc } from './load-ts.mjs';

const require = createRequire(import.meta.url);

/* Масштаб рисунков: миллиметров на единицу viewBox. Подписи внутри
   рисунков набраны кеглем 13–16 единиц, при 0,19 мм это 7–8,5 пунктов
   на бумаге. Один масштаб на все рисунки — и штриховка одна на всех. */
const SCALE = 0.19;
/* Шире этого рисунок справа от условия не встаёт — идёт под него. */
const SIDE_MAX = 88;
/* Шире этого не бывает: ширина карточки без номера и полей. */
const WIDTH_MAX = 160;
/* Примеры в рамке «Повторяем» — мельче задач: это образец, а не
   заготовка для заполнения, и места на первой странице немного. */
const EXAMPLE_SCALE = 0.14;
const EXAMPLE_SIDE_MAX = 90;

let libs = null;
function lib() {
  if (!libs) {
    libs = {
      bank: requireSrc('lib/veroyatnost/index'),
      modeli: requireSrc('lib/veroyatnost/model-zadachi'),
      model: requireSrc('lib/veroyatnost/model'),
      primery: requireSrc('lib/veroyatnost/primery'),
      list: requireSrc('content/veroyatnost'),
      viz: requireSrc('components/tasks/card/Vizualizatsiya'),
      React: require('react'),
      server: require('react-dom/server'),
    };
  }
  return libs;
}

/* ══════════════════════════════════════════════════════════
   Рисунки
   ══════════════════════════════════════════════════════════ */

/** SVG рисунка по параметрам модели; подсветка — только с решением. */
export function figureSvg(parametry, podsvetka) {
  const { viz, React, server } = lib();
  const props = podsvetka ? { parametry, podsvetka } : { parametry };
  return server.renderToStaticMarkup(React.createElement(viz.Vizualizatsiya, props));
}

/** Ширина рисунка на бумаге и место: справа от условия или под ним. */
export function figureSize(svg, scale = SCALE, sideMax = SIDE_MAX) {
  const box = /viewBox="0 0 ([0-9.]+) /.exec(svg);
  if (!box) { throw new Error('у рисунка нет viewBox'); }
  const natural = Number(box[1]) * scale;
  return {
    width: Math.round(Math.min(natural, WIDTH_MAX) * 10) / 10,
    below: natural > sideMax,
  };
}

/* ══════════════════════════════════════════════════════════
   Задачи
   ══════════════════════════════════════════════════════════ */

/** Модели всех задач сборника по порядку: конспект, затем банк. */
export function models() {
  const { bank, modeli } = lib();
  const prep = bank.PODGOTOVKA_4.flatMap((blok) => blok.zadachi.map((z) => modeli.modelPrep(z)));
  const proto = bank.BANK_4.map((p) => {
    const first = p.varianty[0];
    if (!first) { throw new Error('у прототипа ' + p.id + ' нет вариантов'); }
    return modeli.modelVarianta(p, first);
  });
  return [...prep, ...proto];
}

function stepsHtml(model) {
  const { model: m } = lib();
  const items = model.solution.steps.map((step) => ({
    text: step.text,
    tex: step.formula,
    plain: step.formula ? m.texPlain(step.formula) : '',
  }));
  return answers.steps(items, model.answer.display);
}

/**
 * Разделы сборника с задачами и сквозной нумерацией.
 *
 * withAnswers — файл для учителя: рисунок с подсветкой и решение
 * в карточке. Без ответов — заготовка рисунка и ни одного ответа.
 */
export function collectSections(withAnswers) {
  const all = models();
  const sections = content.sections.map((section) => ({
    title: section.title,
    note: section.note,
    method: section.method,
    ids: section.ids || [],
    set: section.method,
    tasks: [],
  }));

  /* Идентификатор варианта — «p4-19-1»; в разделе перечислены прототипы. */
  const baseId = (id) => id.replace(/-\d+$/, '');
  const place = (model) => {
    const byId = sections.find((s) => s.ids.includes(model.id) || s.ids.includes(baseId(model.id)));
    if (byId) { return byId; }
    const byMethod = sections.find((s) => s.method === model.method && !s.ids.length);
    if (!byMethod) { throw new Error('задаче ' + model.id + ' не нашлось раздела: метод ' + model.method); }
    return byMethod;
  };
  all.forEach((model) => place(model).tasks.push(model));

  let number = 0;
  return sections
    .filter((section) => section.tasks.length)
    .map((section) => ({
      title: section.title,
      note: section.note,
      set: section.set,
      tasks: section.tasks.map((model) => {
        number += 1;
        const svg = figureSvg(model.parameters, withAnswers ? model.solution.highlight : null);
        const size = figureSize(svg);
        return {
          no: number,
          id: model.id,
          method: model.method,
          questionHtml: typo.escape(model.condition),
          options: null,
          figureSvg: svg,
          figureWidth: size.width,
          figureBelow: size.below,
          answer: model.answer.display,
          answerHtml: null,
          solutionHtml: withAnswers ? stepsHtml(model) : null,
        };
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

/** Примеры из референса — с рисунком и решением в обеих версиях. */
export function examples() {
  const { primery } = lib();
  const vizualy = { pirozhki: primery.PIROZHKI_VIZUAL };
  return content.examples.map((example) => {
    const vizual = vizualy[example.id];
    if (!vizual) { throw new Error('у примера ' + example.id + ' нет рисунка в primery.ts'); }
    const svg = figureSvg(vizual.parametry, vizual.podsvetka);
    const size = figureSize(svg, EXAMPLE_SCALE, EXAMPLE_SIDE_MAX);
    const { model } = lib();
    return {
      label: example.label,
      title: example.title,
      conditionHtml: typo.escape(example.condition),
      solutionHtml: answers.steps(
        example.steps.map((step) => ({ text: step.text, tex: step.formula, plain: model.texPlain(step.formula) })),
        example.answer),
      figureSvg: svg,
      figureWidth: size.width,
      figureBelow: size.below,
    };
  });
}

export function recap() {
  const { model } = lib();
  return {
    title: content.recap.title,
    items: content.recap.methods.map((item) => {
      const opisanie = model.metodPoId(item.id);
      /* В одну строку пункта — дробь текстового кегля, а не выключная:
         с выключной пять пунктов не помещаются в рамку. */
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
  const { LIST_4 } = lib().list;
  return {
    chip: LIST_4.title.chip,
    text: LIST_4.title.text,
    runner: LIST_4.runner,
    documentTitle: LIST_4.title.chip + '. ' + LIST_4.title.text,
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
    /* Примеры идут в потоке сразу за рамкой «Повторяем». */
    leadItems: examples().map((example) => sheet.exampleItem(example)),
    blocks: sections,
    withAnswerLine: !options.withAnswers,
    extraItems: options.withAnswers ? answersItems(sections) : [],
    foot: content.foot,
    defs: marks.hatchDefs(),
  };
}

export { content };
