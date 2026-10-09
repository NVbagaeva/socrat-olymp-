/* sheet/answers12.js — раздел «Ответы» для задания №12.

   Таблица ответов по блокам и краткие решения из разбора движка.
   Модуль общий для сборника (scripts/build-pdf-12.mjs) и для листа
   с ответами, который генератор собирает в браузере: движок и
   сборщик разбора приходят аргументами, поэтому один код работает
   и в Node, и в бандле.

   Ни одного условия и ни одного ответа здесь нет: всё считает
   движок, здесь только раскладка по кускам потока.
*/

import answers from './answers.js';

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
/* Краткое решение задачи о параболе: разбор строит свой модуль, и
   задача несёт в meta всё, что ему нужно. Берётся тот же итог каждого
   шага, что и у прямой. */
function shortSolutionQuadratic(task, quadraticBuilder) {
  if (!quadraticBuilder) { return null; }
  let steps;
  try { steps = quadraticBuilder.fromTask(task); }
  catch { return null; }
  const formulas = [];
  steps.forEach((step) => {
    const own = (step.blocks || []).filter((piece) => piece.type === 'formula' && piece.tex);
    if (own.length) { formulas.push(own[own.length - 1].tex); }
  });
  return formulas.length < 2 ? null : formulas;
}

/* Гипербола и график корня: полное решение по шагам — заголовок шага
   и все его формулы. Шаг без формул (асимптота на оси) печатается
   одной строкой. rationalBuilder — сборщик разбора по шагам: у листа
   с задачами двух семейств он сам выбирает модуль по meta.family. */
function fullSolutionRational(task, rationalBuilder) {
  if (!rationalBuilder) { return null; }
  let steps;
  try { steps = rationalBuilder.fromTask(task); }
  catch { return null; }
  return steps.filter((step) => step.id !== 'answer' || step.blocks.some((b) => b.type === 'formula'))
    .map((step) => ({
      title: step.title,
      formulas: (step.blocks || []).filter((piece) => piece.type === 'formula' && piece.tex)
        .map((piece) => piece.tex),
    }));
}

/* Решение задачи для листа: у гиперболы полное, у прямой и параболы
   краткое. Возвращает готовый кусок листа или null. */
/* Семейства с полным решением по шагам: у каждого этапа подпись. */
function stepwise(task) {
  return !!task.meta && (task.meta.family === 'rational' || task.meta.family === 'sqrt');
}

function solutionItem(task, generator, solutionBuilder, quadraticBuilder, rationalBuilder) {
  if (stepwise(task)) {
    const full = fullSolutionRational(task, rationalBuilder);
    return full ? answers.fullSolution(task.no, full, task.answer) : null;
  }
  const formulas = shortSolution(task, generator, solutionBuilder, quadraticBuilder);
  return formulas ? answers.solution(task.no, formulas, task.answer) : null;
}

function shortSolution(task, generator, solutionBuilder, quadraticBuilder) {
  if (task.meta && task.meta.family === 'quadratic') {
    return shortSolutionQuadratic(task, quadraticBuilder);
  }
  const rule = task.answerRule;
  let steps;

  /* Две прямые (12.C, 12.D): разбор строится по коэффициентам
     и отмеченным точкам обеих прямых из meta, треугольник наклона
     ему не нужен. */
  const lines = task.meta && task.meta.lines;
  if (lines && lines.length === 2) {
    try {
      steps = solutionBuilder.build({
        lines,
        window: task.meta.window,
        task: { rule, answer: task.answer },
      });
    } catch { return null; }
  } else {
    let analysis = null;
    try { analysis = generator.analysis(task.id, task.seed); }
    catch { return null; }
    if (!analysis) { return null; }

    try {
      steps = solutionBuilder.build({
        triangle: analysis.triangle,
        line: analysis.line,
        window: analysis.task.meta.window,
        task: { rule, answer: task.answer, query: task.meta.query, probe: task.meta.probe },
      });
    } catch { return null; }
  }

  /* Пятый шаг разбора умеет не всякое правило ответа. Чего он
     не умеет — отдаёт общей фразой вместо вывода. Печатать такие
     формулы как решение нельзя — из них заявленный ответ
     не выводится. Ловим по самой фразе, а не по списку правил. */
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

/**
 * Куски раздела «Ответы»: заголовок с новой страницы, таблица
 * по блокам, затем краткие решения — те, что движок умеет вывести.
 *
 * blocks — [{ title, tasks: [{ no, id, answer, answerHtml, options,
 *             answerRule, seed, meta }] }]
 */
export function answersItems(blocks, generator, solutionBuilder, quadraticBuilder,
                             rationalBuilder) {
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
      const item = solutionItem(task, generator, solutionBuilder, quadraticBuilder, rationalBuilder);
      if (item) { solved.push(item); }
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

/**
 * Раздел «Ответы» листа генератора: с новой страницы, с пометкой
 * «Только для учителя». У каждой задачи — номер, ответ и метод (на
 * листе ученика метод не подписан). Несколько вариантов — по ним:
 * подзаголовок «Вариант K» и ключ его задач, нумерация в каждом своя,
 * как на листах учеников. Краткие решения — так же по вариантам.
 *
 * variants — [{ title: 'Вариант 1' | null, blocks }]; у задачи
 *            сверх полей answersItems есть method
 */
export function variantAnswersItems(variants, generator, solutionBuilder, quadraticBuilder,
                                    rationalBuilder) {
  const many = variants.length > 1;
  const items = [answers.sectionHead('Ответы', 'Только для учителя', { section: many })];

  variants.forEach((variant) => {
    const rows = [];
    variant.blocks.forEach((block) => {
      block.tasks.forEach((task) => {
        rows.push({ no: task.no, answer: task.answer, html: answerHtml(task), method: task.method });
      });
    });
    if (variant.title) { items.push(answers.subHead(variant.title)); }
    answers.keyTable(null, rows).forEach((item) => items.push(item));
  });

  let total = 0;
  let count = 0;
  let full = false;
  const solved = [];
  variants.forEach((variant) => {
    const own = [];
    variant.blocks.forEach((block) => {
      block.tasks.forEach((task) => {
        total += 1;
        const item = solutionItem(task, generator, solutionBuilder, quadraticBuilder,
          rationalBuilder);
        if (item) { own.push(item); }
        if (stepwise(task)) { full = true; }
      });
    });
    count += own.length;
    if (own.length) {
      if (variant.title) { solved.push(answers.subHead(variant.title)); }
      own.forEach((item) => solved.push(item));
    }
  });

  if (count) {
    items.push(answers.sectionHead(full ? 'Решения по шагам' : 'Краткие решения',
      'Только для учителя · ' + count + ' задач из ' + total));
    solved.forEach((item) => items.push(item));
  }

  return items;
}

const api = { answersItems: answersItems, variantAnswersItems: variantAnswersItems };

export default api;
