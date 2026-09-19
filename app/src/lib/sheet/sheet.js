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

   Тема выбирается одним полем: theme: 'color' | 'print'.
*/

import marks from './marks.js';
import typo from './typography.js';

var THEMES = ['color', 'print'];
var LAYOUTS = ['single', 'double'];

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
    '</div>' +
    '</div>';
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
  return '<div class="sheet-item sheet-example' +
      (example.figureBelow ? ' sheet-example--stack' : '') + '">' +
    '<span class="sheet-example-label">' + typo.text(example.label) + '</span>' +
    '<div class="sheet-example-text">' +
      (example.title ? '<p class="sheet-example-title">' + typo.markup(example.title) + '</p>' : '') +
      '<p class="sheet-task-question">' + typo.markup(example.conditionHtml) + '</p>' +
      (example.solutionHtml ? '<div class="sheet-task-solution">' + example.solutionHtml + '</div>' : '') +
    '</div>' +
    figure(example.figureSvg, { width: example.figureWidth }) +
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

function figure(svg, options) {
  if (!svg) { return ''; }
  var box = /viewBox="0 0 ([0-9.]+) /.exec(svg);
  var style = '';
  /* Рисунок без клетки (плитки, дерево, ось): ширина задаётся прямо
     в миллиметрах тем, кто собирает лист. */
  if (options.width) {
    style = ' style="width:' + (Math.round(options.width * 100) / 100) + 'mm"';
  } else if (box) {
    var units = Number(box[1]) / CELL_UNITS;
    var mm = options.frame ? options.frame : units * options.cell;
    style = ' style="width:' + (Math.round(mm * 100) / 100) + 'mm"';
  }
  return '<figure class="sheet-figure"' + style + '>' + svg + '</figure>';
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

function taskCard(task, options) {
  var layout = options.layout;

  var answer = options.withAnswerLine
    ? '<p class="sheet-answer-line">Ответ:<span class="sheet-answer-blank"></span></p>'
    : '';

  var question = '<p class="sheet-task-question">' + typo.markup(task.questionHtml) + '</p>' +
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
  var size = { cell: options.cell, frame: options.frame, width: task.figureWidth };
  var stacked = options.layout === 'single' && task.figureBelow;
  var body = options.layout === 'single' && !stacked
    ? '<div class="sheet-task-text">' + question + solution + answer + '</div>' +
      figure(task.figureSvg, size)
    : '<div class="sheet-task-text">' + question + solution + '</div>' +
      figure(task.figureSvg, size) + answer;

  return '<article class="sheet-task sheet-task--' + layout +
    (stacked ? ' sheet-task--stack' : '') + '" data-task="' +
    typo.attr(task.id || '') + '">' +
    '<span class="sheet-task-no">' + task.no + '</span>' +
    '<div class="sheet-task-body">' + body + '</div>' +
    '</article>';
}

/* ══════════════════════════════════════════════════════════
   Блок задач
   ══════════════════════════════════════════════════════════ */
function blockHead(block) {
  return '<header class="sheet-block-head">' +
    '<h2 class="sheet-block-title">' + typo.markup(block.title) + '</h2>' +
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

function footer(foot) {
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
    out.push('<div class="sheet-item sheet-block" data-keep-with-next="1" data-block="' + bi + '">' +
      blockHead(block) + '</div>');

    var tasks = block.tasks || [];
    if (layout === 'double') {
      /* В две колонки единица набора — строка из двух карточек:
         карточка не делится, а строка либо встаёт целиком,
         либо уходит на следующую страницу. */
      for (var i = 0; i < tasks.length; i += 2) {
        var pair = tasks.slice(i, i + 2).map(function (task) {
          return taskCard(task, { layout: layout, cell: size.cell, frame: size.frame,
                                  withAnswerLine: spec.withAnswerLine });
        }).join('');
        out.push('<div class="sheet-item sheet-tasks sheet-tasks--double">' + pair + '</div>');
      }
    } else {
      tasks.forEach(function (task) {
        out.push('<div class="sheet-item sheet-tasks sheet-tasks--single">' +
          taskCard(task, { layout: layout, cell: size.cell, frame: size.frame,
                           withAnswerLine: spec.withAnswerLine }) +
          '</div>');
      });
    }
  });

  return out;
}

/**
 * Документ целиком.
 *
 * spec:
 *   theme    'color' | 'print'
 *   layout   'single' | 'double'
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
 *            (рисунок под условием) и solutionHtml (для учителя)
 *   defs     разметка, которая кладётся в документ один раз перед
 *            страницами: например, SVG-паттерны штриховки для ч/б
 *   withAnswerLine  ставить ли строку «Ответ: ____»
 *   extraItems  куски потока после задач: раздел «Ответы».
 *               Первый из них помечается data-page-break, чтобы
 *               раздел начинался с новой страницы
 *   foot     { course, social[], rights }
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

  var items = (spec.leadItems || []).concat(flowItems(spec));

  return '<!doctype html>\n<html lang="ru" data-sheet-theme="' + spec.theme +
    '" data-sheet-layout="' + spec.layout + '">\n<head>\n' +
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
        opening: titleBlock(spec.title) + recapBlock(spec.recap),
        items: items.concat(spec.extraItems || []),
        footer: footer(spec.foot)
      }).replace(/<\//g, '<\\/') +
    '</script>\n' +
    '<script>\n' + (assets.script || '') + '\n</script>\n' +
    '</body>\n</html>\n';
}

const api = { buildDocument: buildDocument, taskCard: taskCard, figure: figure,
              exampleItem: exampleItem, cellOf: cellOf, THEMES: THEMES, LAYOUTS: LAYOUTS };

export default api;
export { buildDocument, taskCard, figure, exampleItem, cellOf, THEMES, LAYOUTS };
