/* sheet/answers.js — раздел «Ответы» печатного листа.

   Модуль про предмет ничего не знает: получает готовые пары
   «номер — ответ» и готовые куски решения, раскладывает их
   таблицей и карточками. Что считать ответом и откуда взять
   решение, решает тот, кто собирает документ.

   Куски возвращаются в том же виде, что и куски потока задач,
   поэтому страницы для них набирает тот же paginate.js: таблица
   не разрывается посреди строки, решение не разрывается пополам.
*/

import marks from './marks.js';
import typo from './typography.js';

/**
 * Полоса-заголовок раздела. Начинает новую страницу:
 * ответы не должны начинаться под последней задачей.
 */
function sectionHead(title, note) {
  return '<div class="sheet-item sheet-block" data-keep-with-next="1" data-page-break="1">' +
    '<header class="sheet-block-head">' +
      '<h2 class="sheet-block-title">' + typo.text(title) + '</h2>' +
      (note ? '<span class="sheet-block-note">' + typo.text(note) + '</span>' : '') +
    '</header></div>';
}

/**
 * Таблица ответов одного блока.
 *
 * rows    — [{ no, answer, html }]: answer — точное значение строкой,
 *           html — тот же ответ, набранный формулой, если он её требует
 * columns — сколько пар «номер — ответ» в строке: по десять ответов
 *           в столбик таблица заняла бы страницу на блок.
 */
function table(title, rows, columns) {
  var perRow = columns || 5;
  var lines = [];

  for (var i = 0; i < rows.length; i += perRow) {
    var chunk = rows.slice(i, i + perRow);
    var cells = chunk.map(function (row) {
      /* Показывается набранный ответ (обыкновенная дробь остаётся
         дробью), а точное значение лежит атрибутом: по нему
         автотест сверяет таблицу с движком, и набор ему не мешает. */
      var shown = row.html || typo.markup(row.answer);
      return '<th scope="row">' + row.no + '</th>' +
        '<td data-answer="' + typo.attr(row.answer) + '">' + shown + '</td>';
    }).join('');
    /* Хвост последней строки добивается пустыми ячейками, иначе
       рамка таблицы поедет. */
    for (var pad = chunk.length; pad < perRow; pad += 1) {
      cells += '<th scope="row"></th><td></td>';
    }
    lines.push('<tr>' + cells + '</tr>');
  }

  return '<div class="sheet-item sheet-answers">' +
    '<table class="sheet-answers-table">' +
      '<caption>' + typo.markup(title) + '</caption>' +
      '<tbody>' + lines.join('') + '</tbody>' +
    '</table></div>';
}

/**
 * Краткое решение одной задачи.
 *
 * steps — уже отобранные куски: [{ tex }] для формул и строка
 * ответа. Ничего не досочиняется: что пришло, то и печатается.
 */
function solution(no, formulas, answer) {
  var body = formulas.map(function (tex) {
    return '<span class="math" data-tex="' + typo.attr(tex) + '">' + typo.escape(tex) + '</span>';
  }).join('<span class="sheet-solution-arrow">' + marks.arrow() + '</span>');

  return '<div class="sheet-item sheet-solution">' +
    '<span class="sheet-solution-no">' + no + '</span>' +
    '<span class="sheet-solution-body">' + body + '</span>' +
    '<span class="sheet-solution-answer">' + typo.markup(answer) + '</span>' +
    '</div>';
}

/**
 * Решение по шагам внутри карточки задачи: текст шага и его формула,
 * затем строка ответа. Печатается в файле для учителя.
 *
 * steps — [{ text, tex, plain }]: tex — формула шага, plain — она же
 * словами для запасного набора без KaTeX. Ничего не досочиняется.
 */
function steps(items, answer) {
  var list = items.map(function (step) {
    return '<li class="sheet-step">' +
      (step.text ? '<span class="sheet-step-text">' + typo.text(step.text) + '</span>' : '') +
      (step.tex
        ? ' <span class="math" data-tex="' + typo.attr(step.tex) + '">' +
          typo.escape(step.plain || step.tex) + '</span>'
        : '') +
      '</li>';
  }).join('');
  return '<ol class="sheet-steps">' + list + '</ol>' +
    '<p class="sheet-task-answer">Ответ: <b>' + typo.text(answer) + '</b></p>';
}

const api = { sectionHead: sectionHead, table: table, solution: solution, steps: steps };

export default api;
export { sectionHead, table, solution, steps };
