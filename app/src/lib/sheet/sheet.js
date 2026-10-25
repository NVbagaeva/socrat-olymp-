/* sheet/sheet.js — шаблон печатного листа: собирает HTML документа
   из описания.

   Модуль ничего не знает ни про задание №12, ни про движок графиков:
   он получает готовые куски разметки и раскладывает их по листу.
   Поэтому им пользуются и сборка PDF, и генератор вариантов
   на сайте, и задание №3 с чертежами стереометрии.

   Ни DOM, ни файловой системы здесь нет: на входе описание и
   ассеты строками, на выходе строка HTML. Разбиение на страницы
   делает paginate.js уже в браузере — до обмера настоящими
   шрифтами высоту карточки не знает никто.

   Тема выбирается одним полем: theme: 'color' | 'print' | 'strict'.
*/

import marks from './marks.js';
import typo from './typography.js';
import { figureSize, strokeFloor } from './figureRules.js';
import { FIRST_ROWS, spaceHtml } from './space.js';

var THEMES = ['color', 'print', 'strict'];
var LAYOUTS = ['single', 'double'];
/* Рисунки на листе: 'large' — по правилам figureRules.js (клетчатый
   рисунок крупно под условием, остальные не мельче минимумов),
   'normal' — прежняя компактная раскладка по клетке раздела. */
var FIGURES = ['large', 'normal'];

/* ══════════════════════════════════════════════════════════
   Шапка
   ══════════════════════════════════════════════════════════ */
function tail() {
  return '<span class="sheet-tail"><span class="sheet-tail-line"></span>' +
    '<span class="sheet-tail-dot"></span></span>';
}

function logo(size, wordClass) {
  return '<span class="sheet-logo">' + marks.logoMark(size) +
    '<span class="' + wordClass + '">Будет&nbsp;на<br>ЕГЭ</span></span>';
}

function fullHead(head) {
  return '<header class="sheet-head">' +
    logo(11, 'sheet-logo-word') +
    '<span class="sheet-head-rule"></span>' +
    '<span class="sheet-head-course">' +
      '<span class="sheet-course-name">' + typo.text(head.course) + '</span><br>' +
      '<span class="sheet-course-author">' + typo.text(head.author) + '</span>' +
    '</span>' +
    '<span class="sheet-motto">' +
      '<span class="sheet-motto-text">' + typo.escape(head.motto) + '</span>' +
      tail() +
    '</span>' +
    '</header>';
}

/* Следующие страницы — компактная шапка в одну строку. */
function compactHead(head, runner) {
  return '<header class="sheet-head sheet-head--compact">' +
    '<span class="sheet-logo">' + marks.logoMark(7) +
      '<span class="sheet-logo-word">Будет&nbsp;на&nbsp;ЕГЭ</span></span>' +
    '<span class="sheet-head-rule"></span>' +
    '<span class="sheet-runner"><b>' + typo.text(runner) + '</b> · ' +
      typo.text(head.course) + '</span>' +
    tail() +
    '</header>';
}

/* ══════════════════════════════════════════════════════════
   Блок названия
   ══════════════════════════════════════════════════════════ */
function titleBlock(title) {
  return '<div class="sheet-title-block">' +
    '<div class="sheet-title-row">' +
      '<span class="sheet-chip">' + typo.text(title.chip) + '</span>' +
      '<div class="sheet-title-col">' +
        '<h1 class="sheet-title">' + typo.text(title.text) + '</h1>' +
        (title.subtitle ? '<p class="sheet-subtitle">' + typo.text(title.subtitle) + '</p>' : '') +
      '</div>' +
      (title.variant ? '<span class="sheet-variant">' + typo.text(title.variant) + '</span>' : '') +
    '</div>' +
    '</div>';
}

/* Значение поля или пустая линия для заполнения от руки. */
function fieldValue(value) {
  return value
    ? '<span class="sheet-field-value">' + typo.escape(value) + '</span>'
    : '<span class="sheet-field-blank"></span>';
}

/* Строка полей ученика под названием: фамилия, класс, дата. Дату
   (и класс), выбранные в генераторе, лист ставит сам — иначе пустая
   линия. extra — дополнительные подписи строкой ниже: «Учитель: …»,
   «Время выполнения: …»; пустые не печатаются. */
function fieldsLine(fields) {
  if (!fields) { return ''; }
  var extra = (fields.extra || []).filter(function (item) { return item.value; });
  return '<div class="sheet-fields">' +
    '<span class="sheet-field sheet-field--wide">Фамилия, имя<span class="sheet-field-blank"></span></span>' +
    '<span class="sheet-field">Класс' + fieldValue(fields.group) + '</span>' +
    '<span class="sheet-field">Дата' + fieldValue(fields.date) + '</span>' +
    '</div>' +
    (extra.length
      ? '<div class="sheet-fields sheet-fields--extra">' + extra.map(function (item) {
          return '<span class="sheet-field">' + typo.escape(item.label) +
            '<span class="sheet-field-value">' + typo.escape(item.value) + '</span></span>';
        }).join('') + '</div>'
      : '');
}

/* Начало варианта в потоке: с новой страницы, с полной шапкой,
   названием и строкой полей; нумерация страниц варианта — своя. */
function variantOpening(title, fields) {
  return '<div class="sheet-item sheet-opening" data-page-break="1" data-full-head="1"' +
    ' data-section-start="1">' + titleBlock(title) + fieldsLine(fields) + '</div>';
}

/* ══════════════════════════════════════════════════════════
   Рамка «Повторяем:»
   ══════════════════════════════════════════════════════════ */
function recapBlock(recap) {
  if (!recap) { return ''; }

  var items = (recap.items || []).map(function (item, i) {
    return '<li class="sheet-recap-item">' +
      '<span class="sheet-recap-no">' + (i + 1) + '</span>' +
      '<span>' + typo.markup(item) + '</span>' +
      '</li>';
  }).join('');

  /* Фраза — рукописным шрифтом, не курсивом: курсив в проекте занят
     чужими цитатами с автором. */
  var aside = recap.phrase
    ? '<div class="sheet-recap-aside">' +
        '<p class="sheet-hand">' + typo.text(recap.phrase) + '</p>' +
        tail() +
      '</div>'
    : '';

  return '<section class="sheet-recap">' +
    '<div class="sheet-recap-main">' +
      '<h2 class="sheet-recap-title">' + typo.text(recap.title) + '</h2>' +
      '<ul class="sheet-recap-list">' + items + '</ul>' +
    '</div>' + aside +
    '</section>';
}

/* ══════════════════════════════════════════════════════════
   Разобранный пример
   ══════════════════════════════════════════════════════════ */

/**
 * Пример — кусок потока в оформлении рамки «Повторяем»: подпись,
 * название, условие, решение и рисунок. Идёт в потоке, а не в шапке
 * первой страницы: пример с рисунком высок, и в шапке два таких
 * не помещались бы на лист вместе с задачами. Кусок неделим.
 */
function exampleItem(example) {
  var placed = placeFigure(example.figureSvg, { width: example.figureWidth,
                                               figures: example.figures });
  return '<div class="sheet-item sheet-example' +
      (example.figureBelow || placed.below ? ' sheet-example--stack' : '') + '">' +
    '<span class="sheet-example-label">' + typo.text(example.label) + '</span>' +
    '<div class="sheet-example-text">' +
      (example.title ? '<p class="sheet-example-title">' + typo.markup(example.title) + '</p>' : '') +
      '<p class="sheet-task-question">' + typo.markup(example.conditionHtml) + '</p>' +
      (example.solutionHtml ? '<div class="sheet-task-solution">' + example.solutionHtml + '</div>' : '') +
    '</div>' +
    placed.html +
    '</div>';
}

/* ══════════════════════════════════════════════════════════
   Задача
   ══════════════════════════════════════════════════════════ */

/* Размер чертежа задаётся одним из двух способов, и выбор между ними
   не технический, а смысловой: окна у задач разные (±5 — десять клеток,
   ±8 — шестнадцать), поэтому одновременно одинаковой рамкой
   и одинаковой клеткой быть не может.

     frame: 80        одна рамка на все задачи. Страница ровная,
                      но клетка у окна ±8 мельче, чем у ±5
     cell: 3.4        одна клетка на все задачи. Точки читаются
                      одинаково, но рамки разного размера

   У движка клетка всегда 34 единицы viewBox — отсюда пересчёт. */
var CELL_UNITS = 34;

/* Ширина, которую просит лист: прямо в мм, рамкой или по клетке. */
function requestedWidth(svg, options) {
  /* Рисунок без клетки (плитки, дерево, ось): ширина задаётся прямо
     в миллиметрах тем, кто собирает лист. */
  if (options.width) { return options.width; }
  var box = /viewBox="0 0 ([0-9.]+) /.exec(svg);
  if (!box) { return null; }
  var units = Number(box[1]) / CELL_UNITS;
  return options.frame ? options.frame : units * (options.cell || 0) || null;
}

function mmStyle(mm) {
  return mm ? ' style="width:' + (Math.round(mm * 100) / 100) + 'mm"' : '';
}

/**
 * Где и какого размера встанет рисунок. options.figures — 'large'
 * (по умолчанию) или 'normal'. → { html, grid, below }
 *
 * 'large' (lib/sheet/figureRules.js): клетчатый рисунок — по клетке
 * 7 мм, под условием, по центру; остальной — не уже 40 % строки и не
 * мельче, чем нужно подписям, основные линии утолщены до минимума;
 * слишком широкий для места справа — под условием.
 */
function placeFigure(svg, options) {
  if (!svg) { return { html: '', grid: false, below: false, widthMm: 0 }; }
  var want = requestedWidth(svg, options);
  /* options.cls — свой класс рисунка (рисунок к разбору у учителя). */
  var own = options.cls ? ' ' + options.cls : '';
  if (options.figures === 'normal') {
    return { html: '<figure class="sheet-figure' + own + '"' + mmStyle(want) + '>' + svg + '</figure>',
             grid: false, below: false, widthMm: want };
  }
  var size = figureSize(svg, want, options.rowMm);
  var cls = 'sheet-figure sheet-figure--large' + (size.grid ? ' sheet-figure--grid' : '') + own;
  var drawn = size.grid ? svg : strokeFloor(svg, size.widthMm);
  return {
    html: '<figure class="' + cls + '"' + mmStyle(size.widthMm) +
      (size.grid ? ' data-cell-mm="' + (Math.round(size.cellMm * 100) / 100) + '"' : '') + '>' +
      drawn + '</figure>',
    grid: size.grid,
    below: size.below,
    widthMm: size.widthMm
  };
}

function figure(svg, options) {
  return placeFigure(svg, options || {}).html;
}

/** Физический размер клетки при заданной рамке — для отчёта сборки. */
function cellOf(svg, options) {
  var box = /viewBox="0 0 ([0-9.]+) /.exec(svg || '');
  if (!box) { return null; }
  var units = Number(box[1]) / CELL_UNITS;
  return options.frame ? options.frame / units : options.cell;
}

function optionList(options) {
  if (!options || !options.length) { return ''; }
  return '<ol class="sheet-options">' + options.map(function (option) {
    return '<li class="sheet-option">' +
      '<span class="sheet-option-no">' + typo.escape(option.number) + ')</span>' +
      '<span>' + typo.markup(option.html || option.text) + '</span>' +
      '</li>';
  }).join('') + '</ol>';
}

var ANSWER_LINE = '<p class="sheet-answer-line">Ответ:<span class="sheet-answer-blank"></span></p>';

function taskCard(task, options) {
  var layout = options.layout;

  /* Строка ответа: у задачи своя (task.answerLine) — так в одном файле
     лист ученика со строками и лист учителя без них; не задана — как
     у листа (withAnswerLine). */
  var withLine = task.answerLine !== undefined ? task.answerLine : options.withAnswerLine;
  /* С местом для решения строка ответа стоит после поля (spacedItems). */
  var answer = withLine && !task.space ? ANSWER_LINE : '';

  /* Условие со своими абзацами или таблицей (<p>, <table>) — в блоке
     <div>: абзац внутри абзаца браузер разбивает и добавляет пустые
     отступы. */
  var markup = typo.markup(task.questionHtml);
  var tag = /<(?:p|div|table|ol|ul)\b/i.test(markup) ? 'div' : 'p';
  var question = '<' + tag + ' class="sheet-task-question">' + markup + '</' + tag + '>' +
    optionList(task.options);

  /* Решение по шагам — только в файле для учителя: кто собирает лист,
     тот и кладёт его в задачу готовой разметкой. */
  var solution = task.solutionHtml
    ? '<div class="sheet-task-solution">' + task.solutionHtml + '</div>'
    : '';

  /* Строка ответа всегда ниже чертежа: сначала смотрят на рисунок,
     потом пишут ответ. В одну колонку чертёж стоит справа, поэтому
     строка ответа живёт в колонке условия; в две колонки чертёж
     под условием, и строка ответа уходит под чертёж.

     Широкий рисунок (ось, дерево) справа от текста не встаёт: тогда
     задача помечена figureBelow, и рисунок идёт под условием. */
  var size = { cell: options.cell, frame: options.frame, width: task.figureWidth,
               figures: options.figures };
  var placed = placeFigure(task.figureSvg, size);
  /* Крупный рисунок (клетчатый или широкий) стоит под условием и в
     раскладке на две колонки: такая карточка занимает строку целиком. */
  if (placed.below) { layout = 'single'; }
  var stacked = layout === 'single' && (task.figureBelow || placed.below);
  var body = layout === 'single' && !stacked
    ? '<div class="sheet-task-text">' + question + solution + answer + '</div>' + placed.html
    : '<div class="sheet-task-text">' + question + solution + '</div>' + placed.html + answer;

  return '<article class="sheet-task sheet-task--' + layout +
    (stacked ? ' sheet-task--stack' : '') + (placed.grid ? ' sheet-task--grid' : '') +
    '" data-task="' +
    typo.attr(task.id || '') + '">' +
    '<span class="sheet-task-no">' + task.no + '</span>' +
    '<div class="sheet-task-body">' + body + '</div>' +
    '</article>';
}

/* ══════════════════════════════════════════════════════════
   Место для решения (space.js)
   ══════════════════════════════════════════════════════════ */

/**
 * Задача с полем для решения — несколько кусков потока: карточка и
 * первые FIRST_ROWS строк поля неделимы (не встали — задача целиком
 * уходит на следующую страницу), остальные строки — по одной: поле
 * продолжается на следующей странице только по границе строки клеток.
 * Последняя строка и «Ответ: ____» — один кусок.
 */
function spacedItems(task, options) {
  var field = task.space;
  var rows = field.rows;
  var first = Math.min(FIRST_ROWS, rows);
  var withLine = task.answerLine !== undefined ? task.answerLine : options.withAnswerLine;
  var answer = withLine ? ANSWER_LINE : '';
  var out = ['<div class="sheet-item sheet-tasks sheet-tasks--single sheet-tasks--space">' +
    taskCard(task, Object.assign({}, options, { layout: 'single' })) +
    '<div class="sheet-space-wrap">' + spaceHtml(field, first, true, rows === first) +
    (rows === first ? answer : '') + '</div></div>'];
  for (var r = first; r < rows; r += 1) {
    var last = r === rows - 1;
    out.push('<div class="sheet-item sheet-space-item"><div class="sheet-space-wrap">' +
      spaceHtml(field, 1, false, last) + (last ? answer : '') + '</div></div>');
  }
  return out;
}

/* ══════════════════════════════════════════════════════════
   Блок задач
   ══════════════════════════════════════════════════════════ */
/* Идентификатор перед названием — плашкой: у прототипа в печатной
   базе это его «p4-07», по которому задачу находят в тренажёре. */
function blockHead(block) {
  var id = block.id
    ? '<span class="sheet-block-id">' + typo.escape(block.id) + '</span>'
    : '';
  return '<header class="sheet-block-head">' +
    '<h2 class="sheet-block-title">' + id + typo.markup(block.title) + '</h2>' +
    (block.note ? '<span class="sheet-block-note">' + typo.markup(block.note) + '</span>' : '') +
    '</header>';
}

/* ══════════════════════════════════════════════════════════
   Подвал
   ══════════════════════════════════════════════════════════ */
function socialList(social, size) {
  return social.map(function (item, i) {
    var sep = i ? '<span class="sheet-social-sep"></span>' : '';
    /* Ссылка настоящая: в PDF она остаётся кликабельной. */
    return sep + '<span class="sheet-social-item">' +
      marks.socialIcon(item.icon, size) +
      '<a href="' + typo.attr(item.href) + '">' + typo.escape(item.label) + '</a>' +
      '</span>';
  }).join('');
}

/* kit — «Комплект 7K3F-2B» (lib/komplekt.ts): мелко у номера
   страницы, на обоих листах комплекта. По нему учитель находит
   комплект в «Моих комплектах» и печатает его снова. */
function footer(foot, kit, qr) {
  return '<footer class="sheet-foot">' +
    '<span class="sheet-foot-brand">' +
      '<span class="sheet-logo">' + marks.logoMark(7) +
        '<span class="sheet-logo-word">Будет&nbsp;на<br>ЕГЭ</span></span>' +
      '<span class="sheet-foot-course">' + typo.text(foot.course) + '</span>' +
    '</span>' +
    '<span class="sheet-foot-middle">' +
      '<span class="sheet-social">' + socialList(foot.social, 3.6) + '</span>' +
      '<p class="sheet-rights">' + typo.text(foot.rights) + '</p>' +
    '</span>' +
    (kit ? '<span class="sheet-kit-code" data-kit-code>' + typo.escape(kit) + '</span>' : '') +
    (qr ? '<span class="sheet-foot-qr">' + qr + '</span>' : '') +
    '<span class="sheet-page-no" data-page-number>—</span>' +
    '</footer>';
}

/* ══════════════════════════════════════════════════════════
   Документ
   ══════════════════════════════════════════════════════════ */

/**
 * Куски потока по порядку. Каждый кусок — неделимая единица набора:
 * заголовок блока или карточка задачи. Разбивать их пополам
 * paginate.js не станет ни при каких условиях.
 *
 * Заголовок помечен data-keep-with-next: он не остаётся один внизу
 * страницы.
 */
function flowItems(spec) {
  var out = [];
  var size = { cell: spec.cell || null, frame: spec.frame || null };
  var layout = spec.layout;

  (spec.blocks || []).forEach(function (block, bi) {
    /* Блок второго уровня — подзаголовок внутри раздела: плашка
       прототипа в печатной базе. Оформляется легче полосы раздела. */
    var sub = block.level === 2 ? ' sheet-block--sub' : '';
    /* head: false — блок без полосы: на листе генератора навык или
       метод задачи не подписывается. */
    if (block.head !== false) {
      out.push('<div class="sheet-item sheet-block' + sub + '" data-keep-with-next="1" data-block="' + bi + '">' +
        blockHead(block) + '</div>');
    }
    /* Рамка «Повторяем» и разобранные примеры перед задачами блока:
       генератор №1 ставит их к каждому типу задач. */
    if (block.recap) {
      out.push('<div class="sheet-item sheet-block-recap">' + recapBlock(block.recap) + '</div>');
    }
    (block.leadItems || []).forEach(function (item) { out.push(item); });

    var tasks = block.tasks || [];
    var opts = { layout: layout, cell: size.cell, frame: size.frame,
                 withAnswerLine: spec.withAnswerLine, figures: spec.figures };
    var single = function (task) {
      if (task.space) { return spacedItems(task, opts); }
      return ['<div class="sheet-item sheet-tasks sheet-tasks--single">' +
        taskCard(task, opts) + '</div>'];
    };
    if (layout === 'double') {
      /* В две колонки единица набора — строка из двух карточек:
         карточка не делится, а строка либо встаёт целиком,
         либо уходит на следующую страницу. Карточка с крупным
         рисунком (под условием) занимает строку одна. */
      var pending = [];
      var flush = function () {
        if (!pending.length) { return; }
        out.push('<div class="sheet-item sheet-tasks sheet-tasks--double">' +
          pending.map(function (task) { return taskCard(task, opts); }).join('') + '</div>');
        pending = [];
      };
      tasks.forEach(function (task) {
        if (task.space || placeFigure(task.figureSvg, { cell: size.cell, frame: size.frame,
              width: task.figureWidth, figures: spec.figures }).below) {
          flush();
          single(task).forEach(function (item) { out.push(item); });
          return;
        }
        pending.push(task);
        if (pending.length === 2) { flush(); }
      });
      flush();
    } else {
      tasks.forEach(function (task) {
        single(task).forEach(function (item) { out.push(item); });
      });
    }
  });

  return out;
}

/**
 * Документ целиком.
 *
 * spec:
 *   theme    'color' | 'print' | 'strict' (ч/б с одним акцентом)
 *   layout   'single' | 'double'
 *   figures  'large' (по умолчанию) | 'normal' — размер рисунков:
 *            'large' — правила figureRules.js (клетчатый рисунок под
 *            условием с клеткой 7 мм, подписи не мельче 10 pt), 'normal'
 *            — прежняя компактная раскладка по cell/frame
 *   cell     размер клетки чертежа в мм (одна клетка на все задачи)
 *   frame    размер рамки чертежа в мм (одна рамка на все задачи);
 *            задаётся вместо cell, не вместе с ним
 *   head     { course, author, motto }
 *   runner   строка компактной шапки следующих страниц
 *   title    { chip, text, subtitle }
 *   recap    { title, items[], phrase } либо null
 *   leadItems  куски потока перед блоками задач: например,
 *            разобранные примеры (exampleItem)
 *   blocks   [ { title, note, tasks[] } ]; у задачи сверх условия
 *            и чертежа могут быть figureWidth (мм), figureBelow
 *            (рисунок под условием), solutionHtml (для учителя) и
 *            answerLine — строка «Ответ: ____» у этой задачи (поверх
 *            withAnswerLine листа), space — место для решения { mode:
 *            'blank' | 'grid', rows } (space.js, applySpace).
 *            У блока могут быть id (плашка перед названием) и
 *            level: 2 — подзаголовок внутри раздела; блок без задач
 *            даёт одну полосу заголовка; head: false — блок без полосы;
 *            recap — рамка «Повторяем» блока, leadItems — куски потока
 *            перед его задачами (разобранные примеры, exampleItem)
 *   defs     разметка, которая кладётся в документ один раз перед
 *            страницами: например, SVG-паттерны штриховки для ч/б
 *   fields   { date, group, extra } — строка «Фамилия, имя / Класс /
 *            Дата» под названием (group и date — готовые значения, иначе
 *            линия), extra — [{ label, value }] строкой ниже; не задано —
 *            строки нет (сборники)
 *   variants [ { title: { chip, text, subtitle, variant }, blocks[] } ]
 *            — несколько вариантов: каждый с новой страницы, с полной
 *            шапкой и своей нумерацией страниц; у варианта могут быть
 *            свои fields (null — без строки полей). Задано — blocks,
 *            leadItems и recap не используются
 *   withAnswerLine  ставить ли строку «Ответ: ____»
 *   extraItems  куски потока после задач: раздел «Ответы».
 *               Первый из них помечается data-page-break, чтобы
 *               раздел начинался с новой страницы
 *   foot     { course, social[], rights }
 *   kit      «Комплект 7K3F-2B» — код комплекта в колонтитуле; нет — нет
 *   qr       готовая разметка SVG с QR-кодом в подвале (лист генератора №13:
 *            онлайн-версия набора); нет — нет
 *
 * assets: { css, fontCss, extraCss, script }
 */
function buildDocument(spec, assets) {
  if (THEMES.indexOf(spec.theme) < 0) {
    throw new Error('sheet: неизвестная тема «' + spec.theme + '»');
  }
  if (LAYOUTS.indexOf(spec.layout) < 0) {
    throw new Error('sheet: неизвестная раскладка «' + spec.layout + '»');
  }
  var figures = spec.figures || 'large';
  if (FIGURES.indexOf(figures) < 0) {
    throw new Error('sheet: неизвестный размер рисунков «' + spec.figures + '»');
  }

  /* Несколько вариантов: у каждого своё начало страницы и свои блоки,
     название в потоке, а не в шапке первой страницы. Один вариант —
     лист как прежде. */
  var variants = spec.variants || null;
  var items = variants
    ? variants.reduce(function (out, variant) {
        /* У варианта могут быть свои поля (null — без строки полей):
           лист учителя в общем файле с листом ученика. */
        var fields = variant.fields !== undefined ? variant.fields : spec.fields;
        return out.concat([variantOpening(variant.title, fields)],
          flowItems({ blocks: variant.blocks, cell: spec.cell, frame: spec.frame,
                      layout: spec.layout, withAnswerLine: spec.withAnswerLine,
                      figures: figures }));
      }, [])
    : (spec.leadItems || []).concat(flowItems(Object.assign({}, spec, { figures: figures })));

  return '<!doctype html>\n<html lang="ru" data-sheet-theme="' + spec.theme +
    '" data-sheet-layout="' + spec.layout + '" data-sheet-figures="' + figures + '">\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<title>' + typo.escape(spec.documentTitle || spec.title.text) + '</title>\n' +
    '<style>\n' + (assets.fontCss || '') + '\n' + (assets.css || '') + '\n' +
    (assets.extraCss || '') + '\n' +
    (spec.cell ? ':root { --sheet-cell: ' + spec.cell + 'mm; }\n' : '') +
    '</style>\n</head>\n<body>\n' +
    '<div id="sheet-measure"></div>\n' +
    (spec.defs || '') +
    '<div id="sheet-pages"></div>\n' +
    '<script type="application/json" id="sheet-spec">' +
      JSON.stringify({
        arcs: marks.arcs(),
        fullHead: fullHead(spec.head),
        compactHead: compactHead(spec.head, spec.runner || spec.title.text),
        opening: variants ? '' : titleBlock(spec.title) + recapBlock(spec.recap) + fieldsLine(spec.fields),
        items: items.concat(spec.extraItems || []),
        footer: footer(spec.foot, spec.kit, spec.qr)
      }).replace(/<\//g, '<\\/') +
    '</script>\n' +
    '<script>\n' + (assets.script || '') + '\n</script>\n' +
    '</body>\n</html>\n';
}

const api = { buildDocument: buildDocument, taskCard: taskCard, figure: figure,
              placeFigure: placeFigure, exampleItem: exampleItem, cellOf: cellOf,
              THEMES: THEMES, LAYOUTS: LAYOUTS, FIGURES: FIGURES };

export default api;
export { buildDocument, taskCard, figure, placeFigure, exampleItem, cellOf, THEMES, LAYOUTS,
         FIGURES };
