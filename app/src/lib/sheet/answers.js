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

/* Название метода в ключе: с формулами $…$ — заглушки KaTeX,
   иначе готовая разметка (у №4, №5 и №8 метод приходит HTML). */
function methodHtml(method) {
  return /\$/.test(method) ? typo.mathText(method) : typo.markup(method);
}

/* Числовой ответ набирается формулой: минус — настоящий, запятая —
   десятичная. Ответ-не-число (номер варианта с текстом) — как есть. */
function answerMath(answer) {
  var value = String(answer);
  if (!/^[-−]?\d+(?:[,.]\d+)?$/.test(value)) { return typo.markup(value); }
  return typo.mathText('$' + value.replace('−', '-').replace(/[,.]/, '{,}') + '$');
}

/**
 * Полоса-заголовок раздела. Начинает новую страницу:
 * ответы не должны начинаться под последней задачей.
 */
function sectionHead(title, note, options) {
  /* section — своя нумерация страниц раздела: у листа с вариантами
     ответы не продолжают счёт страниц последнего варианта. */
  var section = options && options.section ? ' data-section-start="1"' : '';
  return '<div class="sheet-item sheet-block" data-keep-with-next="1" data-page-break="1"' +
    section + '>' +
    '<header class="sheet-block-head">' +
      '<h2 class="sheet-block-title">' + typo.text(title) + '</h2>' +
      (note ? '<span class="sheet-block-note">' + typo.text(note) + '</span>' : '') +
    '</header></div>';
}

/**
 * Подзаголовок внутри раздела: «Вариант 2» над его таблицами.
 * Оформлен как блок второго уровня и не остаётся один внизу страницы.
 */
function subHead(title) {
  return '<div class="sheet-item sheet-block sheet-block--sub" data-keep-with-next="1">' +
    '<header class="sheet-block-head">' +
      '<h2 class="sheet-block-title">' + typo.text(title) + '</h2>' +
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
 * Ключ для учителя: у каждой задачи номер, ответ и метод. Метод на
 * листе ученика не подписан — он есть только здесь, чтобы проверять
 * было удобно. Две задачи в строке. Возвращает список кусков потока.
 *
 * rows — [{ no, answer, html, method }]
 */
function keyTable(title, rows) {
  var perRow = 2;
  var lines = [];
  for (var i = 0; i < rows.length; i += perRow) {
    var chunk = rows.slice(i, i + perRow);
    var cells = chunk.map(function (row) {
      var shown = row.html || typo.markup(row.answer);
      return '<th scope="row">' + row.no + '</th>' +
        '<td class="sheet-key-answer" data-answer="' + typo.attr(row.answer) + '">' + shown + '</td>' +
        '<td class="sheet-key-method">' + methodHtml(row.method || '') + '</td>';
    }).join('');
    for (var pad = chunk.length; pad < perRow; pad += 1) {
      cells += '<th scope="row"></th><td></td><td></td>';
    }
    lines.push('<tr>' + cells + '</tr>');
  }
  /* Длинный ключ режется на куски по десять строк: кусок потока
     неделим, и таблица на сотню задач не влезла бы на страницу. */
  var out = [];
  for (var j = 0; j < lines.length; j += 10) {
    out.push('<div class="sheet-item sheet-answers">' +
      '<table class="sheet-key-table">' +
        (title && j === 0 ? '<caption>' + typo.markup(title) + '</caption>' : '') +
        '<tbody>' + lines.slice(j, j + 10).join('') + '</tbody>' +
      '</table></div>');
  }
  return out;
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
    '<span class="sheet-solution-answer">' + answerMath(answer) + '</span>' +
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

/* Формула разметкой листа: KaTeX заменит её вёрсткой. */
function mathSpan(tex) {
  return '<span class="math" data-tex="' + typo.attr(tex) + '">' + typo.escape(tex) + '</span>';
}

/* Текст с формулами между знаками $…$. */
function inlineText(value) {
  return String(value).split('$').map(function (piece, i) {
    return i % 2 ? mathSpan(piece) : typo.text(piece);
  }).join('');
}

/**
 * Полное решение одной задачи для учителя по пунктам: у пункта номер
 * и жирный заголовок, под ним короткие строки, вычисление — отдельной
 * строкой; ответ — в рамке. Класс sheet-solution тот же, что у
 * краткого: карточка так же не рвётся между страницами и так же
 * считается в отчёте сборки.
 *
 * steps  — [{ block, no, title, rows: [{ text, tex }] }]: block —
 *          подзаголовок блока («II. Находим g(x)») или null, no — номер
 *          пункта в блоке; text — строка, где формулы стоят между
 *          знаками $…$; tex — формула отдельной строкой
 * answer — ответ разметкой, как в ключе
 * figureSvg — чертёж условия с треугольником наклона, если он есть
 */
/* Сколько строк (заголовков пунктов и строк под ними) решение
   держит в одну колонку. */
var LONG_LINES = 34;

function fullSolution(no, steps, answer, figureSvg) {
  /* Пункты идут блоками («I. Находим f(x)» …); у задачи с одной функцией
     блок один и без подзаголовка. Номер пункта — свой в каждом блоке. */
  var groups = [];
  steps.forEach(function (step, i) {
    var last = groups[groups.length - 1];
    if (!last || last.block !== (step.block || null)) {
      last = { block: step.block || null, items: [] };
      groups.push(last);
    }
    last.items.push({ step: step, no: step.no || i + 1 });
  });

  var body = groups.map(function (group) {
    var items = group.items.map(function (entry) {
      var rows = entry.step.rows.map(function (item) {
        return (item.text ? '<div class="sheet-step-row">' + inlineText(item.text) + '</div>' : '') +
          (item.tex ? '<div class="sheet-step-row sheet-step-formula">' + mathSpan(item.tex) + '</div>' : '');
      }).join('');
      return '<li class="sheet-step" value="' + entry.no + '">' +
        '<b class="sheet-step-title">' + entry.no + '. ' + inlineText(entry.step.title) + '</b>' + rows + '</li>';
    }).join('');
    return (group.block ? '<p class="sheet-step-block">' + inlineText(group.block) + '</p>' : '') +
      '<ol class="sheet-steps">' + items + '</ol>';
  }).join('');

  /* Длинное решение (две функции, десятки строк) в одну колонку выше
     страницы, а рвать задачу между страницами нельзя. Тогда пункты идут
     в две колонки, чертёж — в начале первой. */
  var lines = steps.reduce(function (sum, step) { return sum + 1 + step.rows.length; }, 0);
  var long = lines > LONG_LINES;
  var figure = figureSvg ? '<figure class="sheet-figure sheet-solution-figure">' + figureSvg + '</figure>' : '';

  return '<div class="sheet-item sheet-solution sheet-solution--full' + (long ? ' sheet-solution--long' : '') + '">' +
    '<span class="sheet-solution-no">' + no + '</span>' +
    '<div class="sheet-solution-body">' + (long ? figure : '') + body +
      '<p class="sheet-task-answer sheet-task-answer--box">Ответ: <b>' + typo.markup(answer) + '</b></p>' +
    '</div>' +
    (long ? '' : figure) +
    '</div>';
}

const api = { sectionHead: sectionHead, subHead: subHead, table: table, keyTable: keyTable,
              solution: solution, fullSolution: fullSolution, steps: steps };

export default api;
export { sectionHead, subHead, table, keyTable, solution, fullSolution, steps };
