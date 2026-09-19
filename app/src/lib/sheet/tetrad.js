/* sheet/tetrad.js — пять типов страниц методической тетради:
   титул, разделитель, теория, тренировка (с плашкой репетитора),
   схема/памятка.

   Тот же принцип, что у sheet.js: модуль про предмет ничего не
   знает. Он получает готовые куски разметки — тексты, чертежи
   движка, уже посчитанный ответ и уже собранный разбор — и
   раскладывает их по одному из пяти типов страницы. Какую задачу
   взять из банка и что показать в плашке репетитора, решает
   сборщик (scripts/build-tetrad-12.mjs), а не этот файл.

   Оформление — в tetrad.css, вся палитра приходит токенами
   из theme.css: здесь нет ни цвета, ни кегля значением.
*/

import typo from './typography.js';
import marks from './marks.js';
import sheet from './sheet.js';

/* Стрелка «→» рисуется SVG, а не набирается знаком: в подмножестве
   Inter его нет, и Chromium подтягивал бы к нему посторонний
   системный шрифт (тот же приём, что и у стрелки между формулами
   краткого решения — sheet/answers.js, marks.arrow()). Тексты
   тетради (content/tetrad12.js) пишут «→» как обычный символ —
   здесь, при вёрстке, он меняется на настоящую отрисовку. */
function withArrows(html) {
  return String(html).split('→').join('<span class="tetrad-arrow">' + marks.arrow() + '</span>');
}

/* ══════════════════════════════════════════════════════════
   Зубчатый край титульной карточки
   ══════════════════════════════════════════════════════════
   Полоса треугольников тем же цветом, что и карточка, — не второй
   слой фона, а буквально низ карточки, вырезанный зигзагом.
   preserveAspectRatio="none" тянет её на всю ширину карточки,
   сколько бы ни было зубцов. */
function jaggedEdge(teeth) {
  var n = teeth || 14;
  var w = n * 10;
  var h = 14;
  var d = 'M0 0 ';
  for (var i = 0; i < n; i += 1) {
    var x0 = i * 10;
    d += 'L' + (x0 + 5) + ' ' + h + ' L' + (x0 + 10) + ' 0 ';
  }
  d += 'Z';
  return '<svg class="tetrad-title-jagged" viewBox="0 0 ' + w + ' ' + h + '" ' +
    'preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '"/></svg>';
}

/* ══════════════════════════════════════════════════════════
   1. Титульная страница
   ══════════════════════════════════════════════════════════
   Возвращает HTML целой страницы — её кладёт к себе paginate.js
   первым листом документа, в общий обмер потока титул не входит:
   ни правило «кусок не разрывается», ни шапка со счётчиком
   к нему неприменимы, у него нет ни шапки, ни подвала.

   lines    — заголовок, каждая строка отдельным элементом массива
   subtitle — подзаголовок в скобках, например «(задание №12)»
   teacher  — строка «Преподаватель: …»
   meta     — строка «2026/27 · Тетрадь · Урок 1»
*/
function titlePage(spec) {
  var stripes = '<span></span><span></span><span></span><span></span>' +
    '<span></span><span></span><span></span><span></span>';

  var titleLines = (spec.lines || []).map(function (line) {
    return '<span>' + typo.text(line) + '</span>';
  }).join('');

  return '<section class="sheet-page tetrad-title-page">' +
    '<div class="tetrad-title-stripes">' + stripes + '</div>' +
    '<div class="tetrad-title-body">' +
      '<div>' +
        '<div class="tetrad-title-card">' +
          '<h1 class="tetrad-title-lines">' + titleLines + '</h1>' +
          (spec.subtitle
            ? '<p class="tetrad-title-subtitle">' + typo.text(spec.subtitle) + '</p>' : '') +
          '<div class="tetrad-title-rule"></div>' +
          '<p class="tetrad-title-teacher">' + typo.text(spec.teacher) + '</p>' +
          '<p class="tetrad-title-meta">' + typo.text(spec.meta) + '</p>' +
        '</div>' +
        jaggedEdge(14) +
      '</div>' +
      '<div class="tetrad-title-logo">' + marks.logoMark(9) +
        '<span>' + typo.escape(spec.logoText || 'Будет на ЕГЭ') + '</span></div>' +
    '</div>' +
    '</section>';
}

/* ══════════════════════════════════════════════════════════
   2. Разделитель
   ══════════════════════════════════════════════════════════
   Один смысл — одна страница: кусок сам растягивается на весь
   поток (flex:1 внутри .sheet-flow) и помечен data-page-break,
   чтобы всегда начинать новый лист, сколько бы места ни оставалось
   на предыдущем.
*/
function dividerItem(spec) {
  return '<div class="sheet-item" data-page-break="1">' +
    '<div class="tetrad-divider">' +
      '<h2 class="tetrad-divider-title">' + typo.text(spec.title) + '</h2>' +
      (spec.phrase
        ? '<p class="tetrad-divider-phrase sheet-hand">' + typo.text(spec.phrase) + '</p>' : '') +
    '</div></div>';
}

/* ══════════════════════════════════════════════════════════
   3. Теория
   ══════════════════════════════════════════════════════════
   Один кусок — одна страница: не больше одного правила и одного
   чертежа. Компоновка текст+чертёж — в ряд, если чертёж есть;
   без него — просто колонка.

   label      — маленькая цветная подпись сверху («Теория 1.2»)
   title      — заголовок страницы
   paragraphs — HTML-абзацы, каждый отдельным элементом
   frame      — HTML ключевой формулировки в рамке (необязательно)
   figureSvg  — чертёж движка (необязательно)
   figureCaption — рукописная подпись рядом с чертежом
   note       — HTML-абзац под рамкой, обычным цветом (необязательно)
   triples    — три строки итога в ряд (используется в теме 1.4)
*/
function theoryItem(spec) {
  var textCol = '<div class="tetrad-theory-col">' +
    (spec.frame ? '<p class="tetrad-frame">' + typo.markup(spec.frame) + '</p>' : '') +
    (spec.paragraphs || []).map(function (p) {
      return '<p class="tetrad-theory-text">' + typo.markup(p) + '</p>';
    }).join('') +
    (spec.note ? '<p class="tetrad-theory-note">' + typo.markup(spec.note) + '</p>' : '') +
    '</div>';

  var figureCol = spec.figureSvg
    ? '<figure class="tetrad-theory-figure sheet-figure' +
      '" style="width:' + (spec.figureWidth || 62) + 'mm">' + spec.figureSvg +
      (spec.figureCaption
        ? '<figcaption>' + typo.text(spec.figureCaption) + '</figcaption>' : '') +
      '</figure>'
    : '';

  var triples = spec.triples
    ? '<div class="tetrad-theory-triples">' +
      spec.triples.map(function (t) { return '<span>' + typo.markup(t) + '</span>'; }).join('') +
      '</div>'
    : '';

  return '<div class="sheet-item" data-page-break="1">' +
    '<div class="tetrad-theory">' +
      (spec.label ? '<span class="tetrad-theory-label">' + typo.text(spec.label) + '</span>' : '') +
      '<h2 class="tetrad-theory-title">' + typo.text(spec.title) + '</h2>' +
      '<div class="tetrad-theory-row">' + textCol + figureCol + '</div>' +
      triples +
    '</div></div>';
}

/* ══════════════════════════════════════════════════════════
   4. Схема / памятка
   ══════════════════════════════════════════════════════════
   cards — [{ title, text }]. Три карточки укладываются в две
   колонки с растянутой последней, четыре — ровно 2×2.
*/
function memoItem(spec) {
  var cards = (spec.cards || []).map(function (card, i) {
    return '<div class="tetrad-card">' +
      '<span class="tetrad-card-no">' + (i + 1) + '</span>' +
      (card.title ? '<h3 class="tetrad-card-title">' + typo.text(card.title) + '</h3>' : '') +
      '<p class="tetrad-card-text">' + withArrows(typo.markup(card.text)) + '</p>' +
      '</div>';
  }).join('');

  return '<div class="sheet-item" data-page-break="1">' +
    '<div class="tetrad-memo">' +
      (spec.title ? '<h2 class="tetrad-memo-title">' + typo.text(spec.title) + '</h2>' : '') +
      '<div class="tetrad-memo-grid" data-count="' + (spec.cards || []).length + '">' +
        cards +
      '</div>' +
    '</div></div>';
}

/* Акцентная памятка (2.2): одна крупная рамка заливкой светлого
   тона accent — единственное место в тетради вне палитры primary. */
function calloutItem(spec) {
  var items = (spec.items || []).map(function (item) {
    return '<li>' + typo.markup(item) + '</li>';
  }).join('');

  return '<div class="sheet-item" data-page-break="1">' +
    '<div class="tetrad-theory">' +
      (spec.label ? '<span class="tetrad-theory-label">' + typo.text(spec.label) + '</span>' : '') +
      '<div class="tetrad-callout">' +
        '<h2 class="tetrad-callout-title">' + typo.text(spec.title) + '</h2>' +
        '<ul class="tetrad-callout-list">' + items + '</ul>' +
      '</div>' +
      (spec.phrase
        ? '<p class="tetrad-callout-phrase sheet-hand">' + typo.text(spec.phrase) + '</p>' : '') +
    '</div></div>';
}

/* ══════════════════════════════════════════════════════════
   5. Тренировка + плашка репетитора
   ══════════════════════════════════════════════════════════
   Карточка задачи — тот же taskCard, что и у сборника №12: вид
   задачи не должен отличаться от того, что ученик уже видел.
   Ниже, за линией, — плашка репетитора: заголовок рукописным
   шрифтом, ответ, разбор в 2–3 строки. Строится не здесь: сборщик
   уже посчитал ответ и разбор движком, сюда приходит готовая
   разметка (см. scripts/build-tetrad-12.mjs, tutorSummary()).

   tutor.steps — [{ type: 'text', html }] | [{ type: 'formula', tex }]
*/
function tutorBox(tutor) {
  var lines = (tutor.steps || []).map(function (step) {
    var body = step.type === 'formula'
      ? '<span class="math" data-tex="' + typo.attr(step.tex) + '">' + typo.escape(step.tex) + '</span>'
      : withArrows(typo.markup(step.html));
    return '<li>' + body + '</li>';
  }).join('');

  /* tutor.answerHtml приходит уже готовой разметкой движка (та же
     строка, что легла бы в таблицу ответов сборника №12) — типографике
     сборщик её не отдаёт, чтобы не тронуть вложенные спаны дроби. */
  return '<div class="tetrad-tutor">' +
    '<div class="tetrad-tutor-box">' +
      '<p class="tetrad-tutor-title">Для репетитора</p>' +
      '<p class="tetrad-tutor-answer">Ответ: ' + tutor.answerHtml + '</p>' +
      (lines ? '<ol class="tetrad-tutor-steps">' + lines + '</ol>' : '') +
    '</div></div>';
}

function trainingItem(task, options, tutor) {
  var card = sheet.taskCard(task, options);
  return '<div class="sheet-item tetrad-training" data-page-break="1">' +
    card +
    '<div class="tetrad-training-spacer"></div>' +
    tutorBox(tutor) +
    '</div>';
}

const api = {
  jaggedEdge: jaggedEdge,
  titlePage: titlePage,
  dividerItem: dividerItem,
  theoryItem: theoryItem,
  memoItem: memoItem,
  calloutItem: calloutItem,
  trainingItem: trainingItem,
  tutorBox: tutorBox,
};

export default api;
export { jaggedEdge, titlePage, dividerItem, theoryItem, memoItem, calloutItem,
  trainingItem, tutorBox };
