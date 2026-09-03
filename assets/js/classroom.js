/* Страница класса: вход по коду, домашние задания со сроками,
   теория и рабочие файлы.

   Про защиту честно: код отсекает случайных посетителей, но не защищает
   данные — файлы лежат в публичном репозитории и доступны по прямой ссылке.
   Поэтому здесь не должно быть ничего личного об учениках. */

(function () {
  'use strict';

  var esc = Site.esc;

  var params = new URLSearchParams(location.search);
  var grade = Number(params.get('grade'));

  var gate = document.getElementById('gate');
  var room = document.getElementById('room');
  var missing = document.getElementById('missing');

  var storageKey = 'socrat-class-' + grade;
  var doneKeyPrefix = 'socrat-hw-' + grade + '-';

  var classEntry = null;
  var classData = null;
  var filter = 'active';

  /* ---- Небольшая обёртка над localStorage: приватный режим может кидать. -- */

  var store = {
    get: function (key) {
      try { return window.localStorage.getItem(key); } catch (e) { return null; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, value); } catch (e) { /* не критично */ }
    },
    remove: function (key) {
      try { window.localStorage.removeItem(key); } catch (e) { /* не критично */ }
    }
  };

  /* ---- Хеш кода ---------------------------------------------------------- */

  function sha256(text) {
    if (!window.crypto || !window.crypto.subtle) {
      return Promise.reject(new Error('crypto.subtle недоступен'));
    }
    var bytes = new TextEncoder().encode(text);
    return window.crypto.subtle.digest('SHA-256', bytes).then(function (buffer) {
      return Array.prototype.map.call(new Uint8Array(buffer), function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    });
  }

  /* ---- Домашние задания --------------------------------------------------- */

  function isDone(item) {
    return store.get(doneKeyPrefix + item.id) === '1';
  }

  function submitHref(item) {
    var target = classData.submitTo;
    if (!target) return null;

    var text = 'Здравствуйте! ' + classData.title + ', задание «' + item.title + '».';
    var separator = target.indexOf('?') === -1 ? '?' : '&';

    /* Telegram умеет подставлять текст только в ссылку share; для остальных
       адресов (почта, свой сайт) просто открываем как есть. */
    if (/^https:\/\/t\.me\//.test(target)) {
      return target + separator + 'text=' + encodeURIComponent(text);
    }
    if (/^mailto:/.test(target)) {
      return target + separator + 'subject=' + encodeURIComponent(text);
    }
    return target;
  }

  function homeworkCard(item) {
    var done = isDone(item);
    var status = Deadlines.status(item.deadline, done);

    var attachment = '';
    if (item.file) {
      attachment = '<a class="material__action" href="' + esc(item.file) + '" download>Скачать задание</a>';
    } else if (item.href) {
      attachment = '<a class="material__action" href="' + esc(item.href) + '" target="_blank" rel="noopener">Открыть задание</a>';
    }

    var submit = submitHref(item);
    var submitBtn = submit
      ? '<a class="btn btn--ghost btn--sm" href="' + esc(submit) + '" target="_blank" rel="noopener">Сдать решение</a>'
      : '<a class="btn btn--ghost btn--sm" href="index.html#contacts">Сдать решение</a>';

    var notes = item.notes
      ? '<p class="hw__notes"><b>На что обратить внимание:</b> ' + esc(item.notes) + '</p>'
      : '';

    return '' +
      '<article class="hw' + (done ? ' hw--done' : '') + '" data-id="' + esc(item.id) + '">' +
        '<div class="hw__head">' +
          '<span class="tag">' + esc(item.topic || 'Задание') + '</span>' +
          '<span class="due ' + status.modifier + '">' + esc(status.label) + '</span>' +
        '</div>' +
        '<h3 class="hw__title">' + esc(item.title) + '</h3>' +
        '<p class="hw__text">' + esc(item.description) + '</p>' +
        notes +
        '<div class="hw__meta">' +
          '<span>Выдано ' + esc(Deadlines.formatDate(item.assigned)) + '</span>' +
          '<span>Сдать до ' + esc(Deadlines.formatDate(item.deadline)) + '</span>' +
        '</div>' +
        '<div class="hw__foot">' +
          '<label class="hw__check">' +
            '<input type="checkbox" data-done="' + esc(item.id) + '"' + (done ? ' checked' : '') + '>' +
            '<span>Сделал</span>' +
          '</label>' +
          attachment +
          submitBtn +
        '</div>' +
      '</article>';
  }

  function sortHomework(items) {
    /* Сначала то, что горит: активные по возрастанию срока,
       затем просроченные, в самом низу — сданное. */
    var weight = { today: 0, soon: 1, later: 2, none: 3, late: 4, done: 5 };

    return items.slice().sort(function (a, b) {
      var wa = weight[Deadlines.status(a.deadline, isDone(a)).key];
      var wb = weight[Deadlines.status(b.deadline, isDone(b)).key];
      if (wa !== wb) return wa - wb;
      return String(a.deadline).localeCompare(String(b.deadline));
    });
  }

  function renderHomework() {
    var list = document.getElementById('hw-list');
    var empty = document.getElementById('hw-empty');
    var count = document.getElementById('hw-count');
    var all = classData.homework || [];

    var shown = filter === 'all' ? all : all.filter(function (item) {
      var status = Deadlines.status(item.deadline, isDone(item));
      return status.key !== 'done' && status.key !== 'late';
    });

    list.innerHTML = '';
    if (shown.length) {
      list.appendChild(Site.fragment(sortHomework(shown).map(homeworkCard).join('')));
    }

    empty.hidden = shown.length > 0;
    count.innerHTML = filter === 'all'
      ? 'Всего <b>' + all.length + '</b> ' + Deadlines.plural(all.length, ['задание', 'задания', 'заданий'])
      : 'Актуальных: <b>' + shown.length + '</b>';
  }

  /* ---- Теория и файлы ------------------------------------------------------ */

  function resourceCard(item) {
    var action;
    if (item.file) {
      action = '<a class="btn btn--ghost btn--sm" href="' + esc(item.file) + '" download>Скачать</a>';
    } else if (item.href) {
      action = '<a class="btn btn--ghost btn--sm" href="' + esc(item.href) + '" target="_blank" rel="noopener">Открыть</a>';
    } else {
      action = '<span class="res__soon">Скоро добавлю</span>';
    }

    return '' +
      '<article class="res">' +
        '<div>' +
          '<h4 class="res__title">' + esc(item.title) + '</h4>' +
          '<p class="res__text">' + esc(item.description) + '</p>' +
        '</div>' +
        action +
      '</article>';
  }

  function renderTheory() {
    var host = document.getElementById('theory-list');
    var items = classData.theory || [];

    if (!items.length) {
      host.innerHTML = '<div class="empty"><h3>Конспектов пока нет</h3>' +
        '<p>Появятся по мере прохождения тем.</p></div>';
      return;
    }

    /* Группируем по разделам курса. */
    var sections = [];
    var bySection = {};
    items.forEach(function (item) {
      var key = item.section || 'Разное';
      if (!bySection[key]) { bySection[key] = []; sections.push(key); }
      bySection[key].push(item);
    });

    host.innerHTML = sections.map(function (section) {
      return '' +
        '<div class="theory-section">' +
          '<h3 class="theory-section__title">' + esc(section) + '</h3>' +
          '<div class="res-list">' + bySection[section].map(resourceCard).join('') + '</div>' +
        '</div>';
    }).join('');
  }

  function renderFiles() {
    var host = document.getElementById('files-list');
    var items = classData.files || [];

    host.innerHTML = items.length
      ? items.map(resourceCard).join('')
      : '<div class="empty"><h3>Файлов пока нет</h3><p>Рабочие листы появятся к ближайшему занятию.</p></div>';
  }

  /* ---- Экран класса --------------------------------------------------------- */

  function showRoom() {
    gate.hidden = true;
    room.hidden = false;

    document.title = classData.title + ' — материалы и домашние задания';
    document.getElementById('room-title').textContent = classData.title;
    document.getElementById('room-summary').textContent = classData.summary;
    document.getElementById('hw-summary').textContent =
      'Отметка «Сделал» сохраняется только в этом браузере — учитель её не видит.';

    if (classData.sample) document.getElementById('room-sample').hidden = false;

    Array.prototype.forEach.call(document.querySelectorAll('#logout, #logout-mobile'), function (btn) {
      btn.hidden = false;
      btn.addEventListener('click', function () {
        store.remove(storageKey);
        location.reload();
      });
    });

    renderHomework();
    renderTheory();
    renderFiles();

    /* Отметка о выполнении и переключатель фильтра. */
    document.getElementById('hw-list').addEventListener('change', function (event) {
      var id = event.target.dataset && event.target.dataset.done;
      if (!id) return;
      if (event.target.checked) store.set(doneKeyPrefix + id, '1');
      else store.remove(doneKeyPrefix + id);
      renderHomework();
    });

    Array.prototype.forEach.call(document.querySelectorAll('input[name="hw-filter"]'), function (input) {
      input.addEventListener('change', function () {
        filter = input.value;
        renderHomework();
      });
    });
  }

  function showGate() {
    gate.hidden = false;
    document.getElementById('gate-title').textContent = classEntry.title;
    document.getElementById('gate-summary').textContent = classEntry.summary;

    var form = document.getElementById('gate-form');
    var input = document.getElementById('code');
    var error = document.getElementById('gate-error');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      error.hidden = true;

      sha256(input.value.trim()).then(function (hash) {
        if (hash !== classEntry.codeHash) {
          error.textContent = 'Код не подошёл. Проверьте раскладку и регистр.';
          error.hidden = false;
          input.select();
          return;
        }

        /* Храним хеш: если учитель сменит код, старый доступ отвалится сам. */
        store.set(storageKey, hash);
        loadClassData();
      }).catch(function () {
        error.textContent = 'Проверка кода недоступна: откройте сайт по адресу https.';
        error.hidden = false;
      });
    });
  }

  function loadClassData() {
    Site.load('data/classes/' + grade + '.json').then(function (data) {
      classData = data;
      showRoom();
    }).catch(function (error) {
      console.error('Не удалось загрузить материалы класса', error);
      gate.hidden = true;
      missing.hidden = false;
      missing.querySelector('h1').textContent = 'Материалы не загрузились';
    });
  }

  /* ---- Запуск --------------------------------------------------------------- */

  if (!(grade >= 5 && grade <= 11)) {
    missing.hidden = false;
    return;
  }

  Site.load('data/classes.json').then(function (config) {
    classEntry = config.classes.filter(function (item) { return item.grade === grade; })[0];

    if (!classEntry || classEntry.enabled === false) {
      missing.hidden = false;
      return;
    }

    if (store.get(storageKey) === classEntry.codeHash) loadClassData();
    else showGate();
  }).catch(function (error) {
    console.error('Не удалось загрузить список классов', error);
    missing.hidden = false;
  });
})();
