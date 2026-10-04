/* sheet/answers12.js — раздел «Ответы» для задания №12.

   Таблица ответов по блокам и полные решения для учителя.
   Модуль общий для сборника (scripts/build-pdf-12.mjs) и для листа
   с ответами, который генератор собирает в браузере: сборщик
   решений приходит аргументом, поэтому один код работает и в Node,
   и в бандле.

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

/*  Решение для учителя строит graph/solution-teacher.js по параметрам
    задачи: обе функции по точкам с рисунка, уравнение, его корни,
    выбор корня и ответ. Здесь оно только раскладывается карточкой.

    Не смог движок построить решение — задача не попадает в раздел
    решений, и её ответ остаётся в таблице. Придумывать решение нельзя. */
/* Гипербола: полный разбор по шагам из graph/solution-rational.js —
   заголовок шага и все его формулы — в формате карточки учителя.
   Полное решение гиперболы в solution-teacher.js — отдельной задачей. */
function rationalSteps(task, rationalBuilder) {
  if (!rationalBuilder) { return null; }
  let steps;
  try { steps = rationalBuilder.fromTask(task); }
  catch { return null; }
  const rows = steps
    .filter((step) => step.id !== 'answer' || step.blocks.some((b) => b.type === 'formula'))
    .map((step) => ({
      title: step.title,
      rows: (step.blocks || []).filter((piece) => piece.type === 'formula' && piece.tex)
        .map((piece) => ({ tex: piece.tex })),
    }));
  return rows.length ? rows : null;
}

function solutionItem(task, teacherBuilder, rationalBuilder) {
  if (task.meta && task.meta.family === 'rational') {
    const steps = rationalSteps(task, rationalBuilder);
    return steps ? answers.fullSolution(task.no, steps, answerHtml(task) || task.answer) : null;
  }
  if (!teacherBuilder) { return null; }
  let solved;
  try { solved = teacherBuilder.build(task); }
  catch { return null; }
  if (!solved || !solved.steps.length) { return null; }
  return answers.fullSolution(task.no, solved.steps, answerHtml(task) || task.answer);
}

/**
 * Куски раздела «Ответы»: заголовок с новой страницы, таблица
 * по блокам, затем решения — те, что движок умеет вывести.
 *
 * blocks — [{ title, tasks: [{ no, id, answer, answerHtml, options,
 *             answerRule, seed, meta }] }]
 */
export function answersItems(blocks, teacherBuilder, rationalBuilder) {
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
      const item = solutionItem(task, teacherBuilder, rationalBuilder);
      if (item) { solved.push(item); }
    });
  });

  if (solved.length) {
    items.push(answers.sectionHead('Решения',
      'по шагам, ' + solved.length + ' задач из ' +
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
 * как на листах учеников. Решения — так же по вариантам.
 *
 * variants — [{ title: 'Вариант 1' | null, blocks }]; у задачи
 *            сверх полей answersItems есть method
 */
export function variantAnswersItems(variants, teacherBuilder, rationalBuilder) {
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
  const solved = [];
  variants.forEach((variant) => {
    const own = [];
    variant.blocks.forEach((block) => {
      block.tasks.forEach((task) => {
        total += 1;
        const item = solutionItem(task, teacherBuilder, rationalBuilder);
        if (item) { own.push(item); }
      });
    });
    count += own.length;
    if (own.length) {
      if (variant.title) { solved.push(answers.subHead(variant.title)); }
      own.forEach((item) => solved.push(item));
    }
  });

  if (count) {
    items.push(answers.sectionHead('Решения',
      'Только для учителя · ' + count + ' задач из ' + total));
    solved.forEach((item) => items.push(item));
  }

  return items;
}

const api = { answersItems: answersItems, variantAnswersItems: variantAnswersItems };

export default api;
