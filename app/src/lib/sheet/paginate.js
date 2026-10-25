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
     3. Кусок с data-page-break начинает новую страницу. Если у него
        ещё и data-full-head — страница получает полную шапку, как
        первая: так начинается каждый вариант листа.
     4. Кусок с data-section-start открывает свою нумерацию страниц
        «N / M»: у каждого варианта она своя.

   Две колонки (spec.columns === 2, справочник №1): поток страницы
   делится на две колонки, куски встают сверху вниз сначала в левую,
   потом в правую, потом на новую страницу. Кусок с data-span="all"
   (заголовок раздела) встаёт на всю ширину; data-span="auto" — в
   колонку, а если выше колонки, то на всю ширину. Правила 1, 3 и 4
   действуют и здесь.

   Оглавление: элемент с data-toc-ref="X" получает номер страницы,
   на которой стоит элемент с data-toc-id="X".

   Поле «на страницу» (data-fill-page, вторая часть варианта): поле в
   клетку 5 мм после карточки задачи растягивается до нижнего поля
   страницы — высота и ширина целым числом клеток, без обрезанной
   клетки. Если карточка заняла больше половины страницы, поле
   продолжается на следующей странице, тоже до конца листа.
*/

(function () {
  'use strict';

  function el(html) {
    var box = document.createElement('div');
    box.innerHTML = html;
    return box.firstElementChild;
  }

  /* Набор в две колонки (spec.columns === 2). Поток страницы — полосы:
     полоса двух колонок или кусок на всю ширину. Открытая (последняя)
     полоса колонок занимает всю оставшуюся высоту, и влезло ли —
     сравнение scrollHeight с clientHeight колонки, как у потока
     страницы. Кусок на всю ширину закрывает полосу над собой: её высота
     становится высотой содержимого, под куском открывается новая.
     Кусок с data-span="auto" встаёт в колонку, а если он выше целой
     колонки — на всю ширину (data-span-active, оформление — у листа). */
  function naborVKolonki(items, addPage, pages, overflowing, fits) {
    var cur = null;

    function polosa(posle) {
      var band = document.createElement('div');
      band.className = 'sheet-cols';
      band.innerHTML = '<div class="sheet-col"></div><div class="sheet-col"></div>';
      cur.flow.insertBefore(band, posle ? posle.nextSibling : null);
      var cols = band.querySelectorAll('.sheet-col');
      cur.band = band;
      cur.cols = [cols[0], cols[1]];
      cur.ci = 0;
    }

    function stranica(full) {
      var flow = addPage(full);
      flow.className += ' sheet-flow--cols';
      cur = { flow: flow };
      polosa(null);
    }

    function pustaya() {
      return cur.flow.querySelector('.sheet-item') === null;
    }

    function polosaPusta() {
      return cur.band.querySelector('.sheet-item') === null;
    }

    /* Новая страница для куска, который не встал. Если над пустой
       полосой стоит заголовок с data-keep-with-next, он уходит вместе
       с куском: заголовок без своей первой карточки внизу не остаётся. */
    function stranicaSZagolovkom() {
      var z = polosaPusta() ? cur.band.previousElementSibling : null;
      if (z && (z.getAttribute('data-keep-with-next') !== '1' ||
                cur.flow.querySelectorAll('.sheet-item').length === 1)) { z = null; }
      if (z) { cur.flow.removeChild(z); }
      stranica(false);
      if (z) { cur.flow.insertBefore(z, cur.band); }
    }

    /* Кусок — единственный на странице, кроме заголовков над ним:
       дальше переносить некуда (заголовок пошёл бы следом). */
    function podZagolovkom(node) {
      return Array.prototype.every.call(cur.flow.querySelectorAll('.sheet-item'), function (x) {
        return x === node || x.getAttribute('data-keep-with-next') === '1';
      });
    }

    function imya(node, i) {
      return node.getAttribute('data-item-id') || node.getAttribute('data-task') ||
        node.getAttribute('data-block') || String(i);
    }

    /* Кусок на всю ширину: над пустой полосой — перед ней; иначе
       полоса закрывается, кусок встаёт под ней, под ним — новая. */
    /* Влезет ли следующий кусок в открытую полосу — для заголовка с
       data-keep-with-next: заголовок раздела не остаётся внизу
       страницы без первой карточки под ним. */
    function vlezetSleduyushiy(html) {
      if (!html) { return true; }
      var proba = el(html);
      cur.cols[0].appendChild(proba);
      var ok = fits(cur.cols[0]);
      cur.cols[0].removeChild(proba);
      return ok;
    }

    function naVsyuShirinu(node, i, sleduyushiy) {
      var sVnizu = node.getAttribute('data-keep-with-next') === '1' ? sleduyushiy : null;
      if (polosaPusta()) {
        cur.flow.insertBefore(node, cur.band);
        if (fits(cur.flow) && vlezetSleduyushiy(sVnizu)) { return; }
        if (cur.flow.querySelectorAll('.sheet-item').length > 1) {
          cur.flow.removeChild(node);
          stranicaSZagolovkom();
          cur.flow.insertBefore(node, cur.band);
        }
      } else {
        var staraya = cur.band;
        staraya.className += ' sheet-cols--zakryta';
        cur.flow.insertBefore(node, staraya.nextSibling);
        polosa(node);
        if (fits(cur.flow) && vlezetSleduyushiy(sVnizu)) { return; }
        cur.flow.removeChild(cur.band);
        cur.flow.removeChild(node);
        stranica(false);
        cur.flow.insertBefore(node, cur.band);
      }
      if (!fits(cur.flow)) { overflowing.push(imya(node, i)); }
    }

    stranica(false);

    for (var i = 0; i < items.length; i += 1) {
      var node = el(items[i]);
      if (node.getAttribute('data-page-break') === '1' && !pustaya()) {
        stranica(node.getAttribute('data-full-head') === '1');
      }

      if (node.getAttribute('data-span') === 'all') {
        naVsyuShirinu(node, i, items[i + 1]);
        continue;
      }

      var col = cur.cols[cur.ci];
      col.appendChild(node);
      /* Выше колонки целой страницы: в колонку не встанет нигде. */
      var vysokiy = node.offsetHeight > cur.flow.clientHeight;
      while (!fits(col) && !vysokiy && !podZagolovkom(node)) {
        col.removeChild(node);
        if (cur.ci === 0 && cur.cols[0].childElementCount > 0) {
          cur.ci = 1;
        } else {
          stranicaSZagolovkom();
        }
        col = cur.cols[cur.ci];
        col.appendChild(node);
      }
      if (fits(col)) { continue; }
      /* Выше колонки. Можно на всю ширину — встаёт так; нельзя —
         разрывать всё равно не будем, сообщаем наверх. */
      if (node.getAttribute('data-span') === 'auto') {
        col.removeChild(node);
        node.setAttribute('data-span-active', '1');
        naVsyuShirinu(node, i);
        continue;
      }
      overflowing.push(imya(node, i));
    }

    /* Сверка готового набора: оформление может зависеть от соседей
       (стык карточки с разбором), и колонка, которая влезала при
       обмере, обязана влезать и в конце. */
    Array.prototype.forEach.call(document.querySelectorAll('#sheet-pages .sheet-col'),
      function (col) {
        if (!fits(col) && col.lastElementChild) {
          overflowing.push(imya(col.lastElementChild, -1));
        }
      });
    return pages;
  }

  /* Экранный предпросмотр на узком экране: страница A4 шире телефона,
     и вся страница ехала вбок. Лист целиком уменьшается под ширину
     окна (zoom из переменной — только на экране, см. sheet.css);
     печать и обмер при наборе идут в настоящем размере. */
  var PREVIEW_GAP = 16;

  function fitPreview() {
    var host = document.getElementById('sheet-pages');
    var page = host && host.querySelector('.sheet-page');
    if (!page) {
      return;
    }
    host.style.removeProperty('--sheet-preview-zoom');
    var room = document.documentElement.clientWidth - PREVIEW_GAP;
    var width = page.offsetWidth;
    if (width > 0 && room < width) {
      host.style.setProperty('--sheet-preview-zoom', String(Math.max(room / width, 0.3)));
    }
  }

  var fitBound = false;
  function bindFit() {
    fitPreview();
    if (!fitBound) {
      fitBound = true;
      window.addEventListener('resize', fitPreview);
    }
  }

  /* ── Поле в клетку до конца страницы ───────────────────────────── */

  var KLETKA_MM = 5;
  var LINIYA_MM = 0.2;

  function setkaSvg(cols, rows) {
    var w = cols * KLETKA_MM;
    var h = rows * KLETKA_MM;
    var d = '';
    for (var x = 1; x < cols; x += 1) { d += 'M' + x * KLETKA_MM + ' 0V' + h; }
    for (var y = 1; y < rows; y += 1) { d += 'M0 ' + y * KLETKA_MM + 'H' + w; }
    return '<svg class="sheet-space__grid" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"' +
      ' viewBox="0 0 ' + w + ' ' + h + '" width="' + w + 'mm" height="' + h + 'mm">' +
      '<path d="' + d + '" fill="none" stroke="var(--sheet-space-line, #b3b3b3)"' +
      ' stroke-width="' + LINIYA_MM + '"/></svg>';
  }

  /* Сколько пикселей в клетке на этой странице (обмер, а не расчёт:
     масштаб экрана и печати разный). */
  function kletkaPx(flow) {
    var probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;width:' + 10 * KLETKA_MM +
      'mm;height:' + 10 * KLETKA_MM + 'mm';
    flow.appendChild(probe);
    var px = probe.getBoundingClientRect().height / 10;
    flow.removeChild(probe);
    return px;
  }

  /* Растянуть поле node (уже в потоке, последним) до конца страницы.
     Возвращает число строк клеток; 0 — места нет совсем. */
  function zapolnit(node, flow) {
    var box = node.querySelector('.sheet-fill');
    box.style.height = '0px';
    box.innerHTML = '';
    var cell = kletkaPx(flow);
    /* Остаток страницы — от низа пустого поля (рамка уже в обмере) до
       низа потока, за вычетом отступа куска снизу. scrollHeight потока
       для этого не годится: он не меньше высоты потока. */
    var flowBox = flow.getBoundingClientRect();
    var niz = box.getBoundingClientRect().bottom;
    var otstup = node.getBoundingClientRect().bottom - niz +
      (parseFloat(getComputedStyle(node).marginBottom) || 0);
    var free = flowBox.bottom - niz - otstup - 1;
    var wrap = box.parentNode;
    var rows = Math.max(0, Math.floor(free / cell));
    var cols = Math.max(1, Math.floor((wrap.clientWidth - 2) / cell));
    box.style.height = rows * KLETKA_MM + 'mm';
    box.style.width = cols * KLETKA_MM + 'mm';
    box.setAttribute('data-rows', String(rows));
    box.setAttribute('data-cols', String(cols));
    box.innerHTML = rows > 0 ? setkaSvg(cols, rows) : '';
    /* Защита от округления: не влезло — на клетку меньше. */
    while (rows > 0 && flow.scrollHeight > flow.clientHeight + 0.5) {
      rows -= 1;
      box.style.height = rows * KLETKA_MM + 'mm';
      box.setAttribute('data-rows', String(rows));
      box.innerHTML = rows > 0 ? setkaSvg(cols, rows) : '';
    }
    return rows;
  }

  function run(spec) {
    var host = document.getElementById('sheet-pages');
    host.style.removeProperty('--sheet-preview-zoom');
    host.textContent = '';

    var pages = [];
    var overflowing = [];

    /* Новая страница: шапка по номеру, поток, подвал. full — полная
       шапка не на первой странице; at — вставить перед страницей
       с этим номером, а не в конец. */
    function addPage(full, at) {
      var first = pages.length === 0;
      var page = document.createElement('section');
      page.className = 'sheet-page';
      page.innerHTML = spec.arcs +
        (first || full ? spec.fullHead : spec.compactHead) +
        (first ? spec.opening : '') +
        '<div class="sheet-flow"></div>' +
        spec.footer;
      var flow = page.querySelector('.sheet-flow');
      if (at === undefined || at >= pages.length) {
        host.appendChild(page);
        pages.push({ page: page, flow: flow });
      } else {
        host.insertBefore(page, pages[at].page);
        pages.splice(at, 0, { page: page, flow: flow });
      }
      return flow;
    }

    /* Страница начинается с принудительного разрыва: на неё нельзя
       переносить куски с предыдущей — они чужого варианта. */
    function startsFresh(item) {
      var head = item.flow.firstElementChild;
      return Boolean(head && head.getAttribute('data-page-break') === '1');
    }

    /* Влезло ли содержимое потока в отведённую высоту. clientHeight
       здесь — именно та высота, которую даёт flex между шапкой
       и подвалом, поэтому сравнение честное. */
    function fits(flow) {
      return flow.scrollHeight <= flow.clientHeight + 0.5;
    }

    var items = spec.items || [];
    var i = 0;

    if (spec.columns === 2) {
      naborVKolonki(items, addPage, pages, overflowing, fits);
      i = items.length;
    }

    var flow = spec.columns === 2 ? null : addPage();

    while (i < items.length) {
      var node = el(items[i]);
      var breakBefore = node.getAttribute('data-page-break') === '1';

      /* Поле «на страницу»: до конца этой страницы, а если карточка
         заняла больше половины — ещё и вся следующая страница. */
      if (node.getAttribute('data-fill-page') === '1') {
        /* Сколько заняли куски над полем (карточка задачи, заголовок). */
        var posl = flow.lastElementChild;
        var zanyato = posl
          ? posl.getBoundingClientRect().bottom - flow.getBoundingClientRect().top
          : 0;
        var bolshe = zanyato > flow.clientHeight / 2;
        flow.appendChild(node);
        if (zapolnit(node, flow) === 0) { flow.removeChild(node); }
        if (bolshe) {
          flow = addPage();
          var dalshe = el(items[i]);
          dalshe.setAttribute('data-fill-cont', '1');
          flow.appendChild(dalshe);
          zapolnit(dalshe, flow);
        }
        i += 1;
        continue;
      }

      if (breakBefore && flow.childElementCount > 0) {
        flow = addPage(node.getAttribute('data-full-head') === '1');
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
       Проверяется после набора — тогда видно, кто у кого последний.
       В две колонки заголовок раздела и так стоит в начале страницы. */
    for (var p = 0; spec.columns !== 2 && p < pages.length - 1; p += 1) {
      var last = pages[p].flow.lastElementChild;
      while (last && last.getAttribute('data-keep-with-next') === '1' &&
             !startsFresh(pages[p + 1])) {
        var next = pages[p + 1].flow;
        next.insertBefore(last, next.firstChild);
        last = pages[p].flow.lastElementChild;
      }
    }

    /* Заголовок остался последним на странице — после того, как
       перенос вниз увёл за ним первую задачу. Правило 2 для такой
       страницы надо применить ещё раз. */
    function endsWithHead(flow) {
      var last = flow.lastElementChild;
      return Boolean(last && last.getAttribute('data-keep-with-next') === '1');
    }

    /* Перенос заголовка мог оставить следующую страницу переполненной:
       на ней стало на кусок больше. Догоняем переносом вниз, пока
       всё не встанет — и пока страница не кончается заголовком:
       сдвинутая вниз задача могла оставить его последним. */
    for (var q = 0; spec.columns !== 2 && q < pages.length; q += 1) {
      while ((!fits(pages[q].flow) || endsWithHead(pages[q].flow)) &&
             pages[q].flow.childElementCount > 1) {
        var moved = pages[q].flow.lastElementChild;
        var target = pages[q + 1];
        if (!target || startsFresh(target)) {
          addPage(false, q + 1);
          target = pages[q + 1];
        }
        target.flow.insertBefore(moved, target.flow.firstChild);
      }
    }

    /* Пустая последняя страница ни к чему. */
    while (pages.length > 1 && (spec.columns === 2
      ? pages[pages.length - 1].flow.querySelector('.sheet-item') === null
      : pages[pages.length - 1].flow.childElementCount === 0)) {
      host.removeChild(pages[pages.length - 1].page);
      pages.pop();
    }

    /* Номера страниц: «N / M». Раньше набора их не знает никто.
       Без разделов — сквозные; с разделами (варианты) — свои в
       каждом, начиная со страницы, где стоит data-section-start. */
    var sections = [];
    pages.forEach(function (item, index) {
      var head = item.flow.firstElementChild;
      if (index === 0 || (head && head.getAttribute('data-section-start') === '1')) {
        sections.push([]);
      }
      sections[sections.length - 1].push(item);
    });
    sections.forEach(function (list) {
      list.forEach(function (item, index) {
        var slot = item.page.querySelector('[data-page-number]');
        if (slot) { slot.textContent = (index + 1) + ' / ' + list.length; }
      });
    });

    /* Оглавление: номер страницы, на которой стоит раздел. */
    Array.prototype.forEach.call(host.querySelectorAll('[data-toc-ref]'), function (slot) {
      var target = host.querySelector('[data-toc-id="' + slot.getAttribute('data-toc-ref') + '"]');
      var page = target && target.closest('.sheet-page');
      for (var n = 0; page && n < pages.length; n += 1) {
        if (pages[n].page === page) { slot.textContent = String(n + 1); }
      }
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
          if (!no) { continue; }
          /* Точное значение берётся из атрибута: у дроби, набранной
             столбиком, текст ячейки склеился бы в «13». */
          var cell = cells[c + 1];
          answerRows.push({ no: Number(no),
            answer: cell.getAttribute('data-answer') || textOf(cell) });
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
      /* Записи формул кратких решений: по ним проверяется, что числа
         точные. Сплошной текст страницы для этого не годится —
         соседние ячейки таблицы склеиваются и дают мнимые дроби. */
      solutionTex: Array.prototype.map.call(
        host.querySelectorAll('.sheet-solution .math[data-tex]'),
        function (node) { return node.getAttribute('data-tex'); }),
      answerLines: host.querySelectorAll('.sheet-answer-line').length,
      links: Array.prototype.map.call(host.querySelectorAll('.sheet-social-item a'),
        function (node) { return node.getAttribute('href'); }),
      /* Куски с data-item-id по страницам и колонкам — проверка
         справочника №1: каждая карточка встала, и ровно один раз. */
      itemIds: Array.prototype.map.call(host.querySelectorAll('[data-item-id]'),
        function (node) { return node.getAttribute('data-item-id'); }),
      tocPages: Array.prototype.map.call(host.querySelectorAll('[data-toc-ref]'),
        function (node) { return textOf(node); }),
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
      bindFit();
    }).catch(function (error) {
      window.sheetPagination = { error: String(error && error.message || error) };
    });
  }

  /* Страница генератора кладёт спецификацию в документ уже после
     загрузки скрипта и запускает набор сама. Обычному листу это
     свойство не мешает. */
  window.sheetPaginate = start;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
