/* sheet/paginate.js — разбиение потока на страницы A4.

   Работает в браузере и только там: пока настоящие шрифты не
   загрузились, высоту карточки не знает никто, а без точной высоты
   нельзя обещать, что задача не разорвётся между страницами.
   Поэтому страницы набираются обмером, а не расчётом.

   Скрипт кладётся в документ обычным <script> и запускается сам.
   Результат он объявляет в window.sheetPagination — сборка PDF
   ждёт этого поля, прежде чем печатать.

   Правила набора:
     1. Кусок потока неделим. Задача не разрывается никогда.
     2. Кусок с data-keep-with-next не остаётся последним на
        странице: заголовок блока уезжает вниз вместе с первой
        задачей блока.
     3. Кусок с data-page-break начинает новую страницу.
*/

(function () {
  'use strict';

  function el(html) {
    var box = document.createElement('div');
    box.innerHTML = html;
    return box.firstElementChild;
  }

  function run(spec) {
    var host = document.getElementById('sheet-pages');
    host.textContent = '';

    var pages = [];
    var overflowing = [];

    /* Новая страница: шапка по номеру, поток, подвал. */
    function addPage() {
      var first = pages.length === 0;
      var page = document.createElement('section');
      page.className = 'sheet-page';
      page.innerHTML = spec.arcs +
        (first ? spec.fullHead : spec.compactHead) +
        (first ? spec.opening : '') +
        '<div class="sheet-flow"></div>' +
        spec.footer;
      host.appendChild(page);
      var flow = page.querySelector('.sheet-flow');
      pages.push({ page: page, flow: flow });
      return flow;
    }

    /* Влезло ли содержимое потока в отведённую высоту. clientHeight
       здесь — именно та высота, которую даёт flex между шапкой
       и подвалом, поэтому сравнение честное. */
    function fits(flow) {
      return flow.scrollHeight <= flow.clientHeight + 0.5;
    }

    var flow = addPage();
    var items = spec.items || [];
    var i = 0;

    while (i < items.length) {
      var node = el(items[i]);
      var breakBefore = node.getAttribute('data-page-break') === '1';

      if (breakBefore && flow.childElementCount > 0) {
        flow = addPage();
      }

      flow.appendChild(node);

      if (!fits(flow)) {
        if (flow.childElementCount === 1) {
          /* Кусок выше целой страницы. Разрывать его нельзя, поэтому
             оставляем как есть и сообщаем наверх: это не «почти
             влезло», это ошибка вёрстки, и знать о ней надо. */
          overflowing.push(node.getAttribute('data-task') ||
            node.getAttribute('data-block') || String(i));
          i += 1;
          continue;
        }
        flow.removeChild(node);
        flow = addPage();
        flow.appendChild(node);
      }

      i += 1;
    }

    /* Правило 2: заголовок блока не остаётся один внизу страницы.
       Проверяется после набора — тогда видно, кто у кого последний. */
    for (var p = 0; p < pages.length - 1; p += 1) {
      var last = pages[p].flow.lastElementChild;
      while (last && last.getAttribute('data-keep-with-next') === '1') {
        var next = pages[p + 1].flow;
        next.insertBefore(last, next.firstChild);
        last = pages[p].flow.lastElementChild;
      }
    }

    /* Перенос заголовка мог оставить следующую страницу переполненной:
       на ней стало на кусок больше. Догоняем переносом вниз, пока
       всё не встанет. */
    for (var q = 0; q < pages.length; q += 1) {
      while (!fits(pages[q].flow) && pages[q].flow.childElementCount > 1) {
        var moved = pages[q].flow.lastElementChild;
        var target = pages[q + 1];
        if (!target) {
          addPage();
          target = pages[pages.length - 1];
        }
        target.flow.insertBefore(moved, target.flow.firstChild);
      }
    }

    /* Пустая последняя страница ни к чему. */
    while (pages.length > 1 && pages[pages.length - 1].flow.childElementCount === 0) {
      host.removeChild(pages[pages.length - 1].page);
      pages.pop();
    }

    /* Номера страниц: «N / M». Раньше набора их не знает никто. */
    pages.forEach(function (item, index) {
      var slot = item.page.querySelector('[data-page-number]');
      if (slot) { slot.textContent = (index + 1) + ' / ' + pages.length; }
    });

    /* Отчёт о ГОТОВОМ документе, а не о спецификации: проверять надо
       то, что отрисовано. По нему автотесты сверяют состав, нумерацию
       и ответы, поэтому здесь снимаются факты, а не оценки. */
    function textOf(node) {
      return (node.textContent || '').replace(/\s+/g, ' ').trim();
    }

    var answerRows = [];
    Array.prototype.forEach.call(host.querySelectorAll('.sheet-answers-table tr'),
      function (row) {
        var cells = row.children;
        for (var c = 0; c + 1 < cells.length; c += 2) {
          var no = textOf(cells[c]);
          if (no) { answerRows.push({ no: Number(no), answer: textOf(cells[c + 1]) }); }
        }
      });

    return {
      pages: pages.length,
      tasks: host.querySelectorAll('.sheet-task').length,
      overflowing: overflowing,
      formulas: host.querySelectorAll('.math[data-tex]').length,
      formulasTypeset: host.querySelectorAll('.math[data-katex="on"]').length,
      formulasFailed: host.querySelectorAll('.math[data-katex="error"]').length,
      taskIds: Array.prototype.map.call(host.querySelectorAll('.sheet-task'),
        function (node) { return node.getAttribute('data-task'); }),
      taskNumbers: Array.prototype.map.call(host.querySelectorAll('.sheet-task-no'),
        function (node) { return Number(textOf(node)); }),
      answerRows: answerRows,
      solutions: host.querySelectorAll('.sheet-solution').length,
      answerLines: host.querySelectorAll('.sheet-answer-line').length,
      links: Array.prototype.map.call(host.querySelectorAll('.sheet-social-item a'),
        function (node) { return node.getAttribute('href'); }),
      pageNumbers: Array.prototype.map.call(host.querySelectorAll('[data-page-number]'),
        function (node) { return textOf(node); }),
      text: textOf(host)
    };
  }

  function start() {
    var source = document.getElementById('sheet-spec');
    if (!source) { return; }
    var spec = JSON.parse(source.textContent);

    /* Обмер до загрузки шрифтов даёт чужие высоты, поэтому ждём. */
    var ready = document.fonts && document.fonts.ready
      ? document.fonts.ready
      : Promise.resolve();

    ready.then(function () {
      /* Формулы набираются ДО обмера: вёрстка KaTeX выше исходной
         разметки, и по ненабранной высоте карточка обмерялась бы
         неверно — задача поехала бы через разрыв страницы.

         Набор идёт по всему документу сразу, пока куски ещё лежат
         в разметке спецификации, а не по страницам: иначе пришлось бы
         пересчитывать высоты после каждой вставки. */
      if (typeof window.sheetTypeset === 'function') {
        var box = document.createElement('div');
        box.style.cssText = 'position:absolute;left:-9999mm;top:0';
        box.innerHTML = (spec.items || []).join('');
        document.body.appendChild(box);
        window.sheetTypeset(box);
        var typeset = box.querySelectorAll('.sheet-item');
        spec.items = Array.prototype.map.call(typeset, function (node) {
          return node.outerHTML;
        });
        var opening = document.createElement('div');
        opening.innerHTML = spec.opening;
        window.sheetTypeset(opening);
        spec.opening = opening.innerHTML;
        document.body.removeChild(box);
      }

      window.sheetPagination = run(spec);

      /* Уже расставленные по страницам формулы — на случай, если
         какая-то разметка пришла помимо кусков потока. */
      if (typeof window.sheetTypeset === 'function') {
        window.sheetTypeset(document.getElementById('sheet-pages'));
        var host = document.getElementById('sheet-pages');
        window.sheetPagination.formulasTypeset =
          host.querySelectorAll('.math[data-katex="on"]').length;
        window.sheetPagination.formulasFailed =
          host.querySelectorAll('.math[data-katex="error"]').length;
      }
    }).catch(function (error) {
      window.sheetPagination = { error: String(error && error.message || error) };
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
