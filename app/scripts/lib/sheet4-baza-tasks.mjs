/* scripts/lib/sheet4-baza-tasks.mjs — состав печатной базы «Задание 4»:
   все прототипы тренажёра с вариантами 1–10 и описание листа.

   Один модуль на сборку (build-pdf-4-baza.mjs) и проверку
   (check-pdf-4-baza.mjs): оба смотрят на один и тот же список задач,
   поэтому разойтись не могут.

   Откуда что берётся:
     • прототипы — банк задачника BANK_4 и прототипы конспекта
       KONSPEKT_4, кроме двойников (content/sheet4-baza.js): задача
       конспекта, которая есть в банке задачника, печатается там;
     • варианты — с первого по content.variants у каждого прототипа.
       Условие, шаги и ответ считает модель задачи (model-zadachi.ts),
       как в сборнике №4; ни одного условия здесь нет;
     • раздел — блок конспекта: у прототипа конспекта свой, у прототипа
       задачника — по списку ids в content. Внутри раздела прототипы
       идут по номеру, внутри прототипа — варианты по порядку;
     • плашка прототипа — идентификатор, название и метод из каталога
       lib/veroyatnost/model.ts;
     • решение — шаги разбора банка с их формулами в TeX, ответ строкой;
     • слова листа — src/content/sheet4-baza.js.

   Рисунков на листе нет: база печатается без картинок, таблиц и схем. */

import answers from '../../src/lib/sheet/answers.js';
import typo from '../../src/lib/sheet/typography.js';
import content from '../../src/content/sheet4-baza.js';
import { requireSrc } from './load-ts.mjs';

let libs = null;
function lib() {
  if (!libs) {
    libs = {
      bank: requireSrc('lib/veroyatnost/index'),
      modeli: requireSrc('lib/veroyatnost/model-zadachi'),
      model: requireSrc('lib/veroyatnost/model'),
      list: requireSrc('content/veroyatnost'),
    };
  }
  return libs;
}

/* ══════════════════════════════════════════════════════════
   Прототипы
   ══════════════════════════════════════════════════════════ */

/** Номер прототипа из идентификатора: «p4-07» → 7. */
function nomer(id) {
  const found = /-(\d+)$/.exec(id);
  if (!found) { throw new Error('у прототипа ' + id + ' нет номера в идентификаторе'); }
  return Number(found[1]);
}

/** Прототипы конспекта первыми, затем задачника; внутри — по номеру. */
function poNomeru(a, b) {
  const ka = a.id.startsWith('k4-') ? 0 : 1;
  const kb = b.id.startsWith('k4-') ? 0 : 1;
  return ka - kb || nomer(a.id) - nomer(b.id);
}

/**
 * Прототипы базы по разделам конспекта. Каждый прототип банка должен
 * попасть ровно в один раздел; двойник конспекта должен иметь замену
 * в банке задачника. Любое расхождение — ошибка сборки.
 */
export function prototypesBySection() {
  const { bank } = lib();
  const bankIds = new Set(bank.BANK_4.map((p) => p.id));

  Object.entries(content.dvoyniki).forEach(([konspekt, zamena]) => {
    if (!bank.KONSPEKT_4.some((p) => p.id === konspekt)) {
      throw new Error('двойник ' + konspekt + ' не найден среди прототипов конспекта');
    }
    if (!bankIds.has(zamena)) {
      throw new Error('замена ' + zamena + ' для двойника ' + konspekt + ' не найдена в банке');
    }
  });

  const sections = content.sections.map((section) => {
    const blok = bank.PODGOTOVKA_4.find((b) => b.id === section.id);
    if (!blok) { throw new Error('в подготовке №4 нет блока ' + section.id); }
    return { id: blok.id, title: blok.nazvanie, note: blok.tip, ids: section.ids, prototypes: [] };
  });

  /* Конспект: прототип идёт в свой блок, двойники пропускаются. */
  bank.PODGOTOVKA_4.forEach((blok) => {
    const section = sections.find((s) => s.id === blok.id);
    if (!section) { throw new Error('блок конспекта ' + blok.id + ' не описан в content'); }
    blok.zadachi.forEach((zadacha) => {
      if (content.dvoyniki[zadacha.id]) { return; }
      const prototype = bank.KONSPEKT_4.find((p) => p.id === zadacha.id);
      if (!prototype) { throw new Error('у задачи конспекта ' + zadacha.id + ' нет прототипа'); }
      section.prototypes.push(prototype);
    });
  });

  /* Задачник: по спискам content; каждый прототип ровно один раз. */
  const placed = new Map();
  sections.forEach((section) => {
    section.ids.forEach((id) => {
      const prototype = bank.BANK_4.find((p) => p.id === id);
      if (!prototype) { throw new Error('в банке нет прототипа ' + id + ' из раздела ' + section.id); }
      if (placed.has(id)) {
        throw new Error('прототип ' + id + ' назван в двух разделах: ' + placed.get(id) + ' и ' + section.id);
      }
      placed.set(id, section.id);
      section.prototypes.push(prototype);
    });
  });
  bank.BANK_4.forEach((prototype) => {
    if (!placed.has(prototype.id)) {
      throw new Error('прототипу ' + prototype.id + ' не нашлось раздела конспекта');
    }
  });

  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    note: section.note,
    prototypes: [...section.prototypes].sort(poNomeru),
  }));
}

/* ══════════════════════════════════════════════════════════
   Задачи
   ══════════════════════════════════════════════════════════ */

function stepsHtml(model) {
  const { model: m } = lib();
  const items = model.solution.steps.map((step) => ({
    text: step.text,
    tex: step.formula,
    plain: step.formula ? m.texPlain(step.formula) : '',
  }));
  return answers.steps(items, model.answer.display);
}

/** Варианты прототипа с первого по content.variants — модели задач. */
function modelsOf(prototype) {
  const { modeli } = lib();
  const varianty = prototype.varianty.filter((v) => v.n >= 1 && v.n <= content.variants);
  if (varianty.length !== content.variants) {
    throw new Error('у прототипа ' + prototype.id + ' вариантов 1–' + content.variants +
      ' нашлось ' + varianty.length);
  }
  return varianty
    .sort((a, b) => a.n - b.n)
    .map((variant) => modeli.modelVarianta(prototype, variant));
}

/** Плашка прототипа: идентификатор, название и метод из каталога. */
function plaque(prototype, method) {
  const { model } = lib();
  const opisanie = model.metodPoId(method);
  return {
    id: prototype.id,
    title: prototype.nazvanie,
    note: content.metodLabel(opisanie.nomer, opisanie.nazvanie),
  };
}

/**
 * Блоки листа со сквозной нумерацией: полоса раздела конспекта без
 * задач, затем плашка каждого прототипа со своими вариантами.
 *
 * withAnswers — файл для учителя: под условием решение по шагам и
 * ответ. Без ответов — только условие и строка «Ответ: ____».
 */
export function collectBlocks(withAnswers) {
  let number = 0;
  const blocks = [];
  prototypesBySection().forEach((section) => {
    blocks.push({ title: section.title, note: section.note, set: section.id, tasks: [] });
    section.prototypes.forEach((prototype) => {
      const models = modelsOf(prototype);
      const head = plaque(prototype, models[0].method);
      blocks.push({
        level: 2,
        id: head.id,
        title: head.title,
        note: head.note,
        set: prototype.id,
        tasks: models.map((model) => {
          number += 1;
          return {
            no: number,
            id: model.id,
            method: model.method,
            questionHtml: typo.escape(model.condition),
            options: null,
            figureSvg: null,
            answer: model.answer.display,
            answerHtml: null,
            solutionHtml: withAnswers ? stepsHtml(model) : null,
          };
        }),
      });
    });
  });
  return blocks;
}

/** Задачи базы по порядку — для сверки и таблицы ответов. */
export function tasksOf(blocks) {
  return blocks.flatMap((block) => block.tasks);
}

/* ══════════════════════════════════════════════════════════
   Описание листа
   ══════════════════════════════════════════════════════════ */

/** Хвост файла для учителя: таблица ответов по прототипам с новой страницы. */
export function answersItems(blocks) {
  const items = [answers.sectionHead(content.otvety.title, content.otvety.note)];
  blocks
    .filter((block) => block.tasks.length)
    .forEach((block) => {
      items.push(answers.table(
        block.id + ' · ' + block.title,
        block.tasks.map((task) => ({ no: task.no, answer: task.answer, html: null })),
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
    runner: LIST_4.runner + ' · база',
    documentTitle: LIST_4.title.chip + '. ' + LIST_4.title.text + ' — печатная база',
  };
}

/** Описание листа для шаблона. Рамки «Повторяем» у базы нет. */
export function sheetSpec(blocks, options) {
  const name = naming();
  return {
    theme: options.theme,
    layout: 'single',
    documentTitle: name.documentTitle,
    head: content.head,
    runner: name.runner,
    title: { chip: name.chip, text: name.text, subtitle: content.subtitle },
    recap: null,
    blocks,
    withAnswerLine: !options.withAnswers,
    extraItems: options.withAnswers ? answersItems(blocks) : [],
    foot: content.foot,
  };
}

export { content };
