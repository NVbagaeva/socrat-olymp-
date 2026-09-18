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
function shortSolution(task, generator, solutionBuilder) {
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

/**
 * Куски раздела «Ответы»: заголовок с новой страницы, таблица
 * по блокам, затем краткие решения — те, что движок умеет вывести.
 *
 * blocks — [{ title, tasks: [{ no, id, answer, answerHtml, options,
 *             answerRule, seed, meta }] }]
 */
export function answersItems(blocks, generator, solutionBuilder) {
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
      const formulas = shortSolution(task, generator, solutionBuilder);
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

const api = { answersItems: answersItems };

export default api;
