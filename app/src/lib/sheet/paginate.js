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

    return {
      pages: pages.length,
      tasks: host.querySelectorAll('.sheet-task').length,
      overflowing: overflowing
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
      window.sheetPagination = run(spec);
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
