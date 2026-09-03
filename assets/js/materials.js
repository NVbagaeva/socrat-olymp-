/* Каталог материалов: поиск, фильтры, сортировка и синхронизация
   состояния с query-строкой, чтобы выборку можно было отправить ссылкой. */

(function () {
  'use strict';

  var labels = window.materialLabels;

  var GROUPS = {
    track: {
      title: 'Направление',
      options: [
        { value: 'olympiad', label: 'Олимпиады' },
        { value: 'ege', label: 'ЕГЭ' },
        { value: 'oge', label: 'ОГЭ' },
        { value: 'school', label: 'Школьный курс' },
        { value: 'method', label: 'Коллегам' }
      ]
    },
    grade: {
      title: 'Класс',
      options: [5, 6, 7, 8, 9, 10, 11].map(function (grade) {
        return { value: String(grade), label: String(grade) };
      })
    },
    type: {
      title: 'Тип материала',
      options: [
        { value: 'notes', label: 'Конспекты' },
        { value: 'publication', label: 'Публикации' },
        { value: 'lesson', label: 'Уроки и интенсивы' },
        { value: 'masterclass', label: 'Мастер-классы' },
        { value: 'video', label: 'Видео' },
        { value: 'interactive', label: 'Интерактив' }
      ]
    },
    level: {
      title: 'Уровень',
      options: [
        { value: 'basic', label: 'База' },
        { value: 'medium', label: 'Средний' },
        { value: 'advanced', label: 'Продвинутый' }
      ]
    }
  };

  var filtersForm = document.getElementById('filters');
  var grid = document.getElementById('grid');
  var empty = document.getElementById('empty');
  var countEl = document.getElementById('count');
  var searchInput = document.getElementById('search');
  var searchClear = document.getElementById('search-clear');
  var sortSelect = document.getElementById('sort');
  var filtersToggle = document.getElementById('filters-toggle');
  var filtersCount = document.getElementById('filters-count');

  var materials = [];
  var state = { query: '', sort: 'year', track: [], grade: [], type: [], level: [] };

  /* «Ё» и регистр не должны мешать поиску. */
  function normalize(text) {
    return String(text || '').toLowerCase().replace(/ё/g, 'е');
  }

  function haystack(material) {
    return normalize([
      material.title,
      material.description,
      (material.topics || []).join(' ')
    ].join(' '));
  }

  function plural(n, forms) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return forms[0];
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
    return forms[2];
  }

  /* ---- Разметка фильтров ------------------------------------------------ */

  function renderFilters() {
    Object.keys(GROUPS).forEach(function (group) {
      var host = filtersForm.querySelector('[data-group="' + group + '"]');
      if (!host) return;

      host.innerHTML = GROUPS[group].options.map(function (option) {
        return '' +
          '<label class="chip">' +
            '<input type="checkbox" name="' + group + '" value="' + Site.esc(option.value) + '">' +
            '<span>' + Site.esc(option.label) + '</span>' +
          '</label>';
      }).join('');
    });
  }

  /* ---- Состояние в адресной строке -------------------------------------- */

  function readUrl() {
    var params = new URLSearchParams(location.search);

    Object.keys(GROUPS).forEach(function (group) {
      var raw = params.get(group);
      state[group] = raw ? raw.split(',').filter(Boolean) : [];
    });

    state.query = params.get('q') || '';
    state.sort = params.get('sort') || 'year';
  }

  function writeUrl() {
    var params = new URLSearchParams();

    Object.keys(GROUPS).forEach(function (group) {
      if (state[group].length) params.set(group, state[group].join(','));
    });
    if (state.query) params.set('q', state.query);
    if (state.sort !== 'year') params.set('sort', state.sort);

    var query = params.toString();
    history.replaceState(null, '', query ? location.pathname + '?' + query : location.pathname);
  }

  function syncControls() {
    Array.prototype.forEach.call(filtersForm.querySelectorAll('input[type="checkbox"]'), function (input) {
      input.checked = state[input.name].indexOf(input.value) !== -1;
    });
    searchInput.value = state.query;
    sortSelect.value = state.sort;
    searchClear.hidden = !state.query;
  }

  /* ---- Фильтрация и сортировка ------------------------------------------ */

  function matches(material) {
    if (state.track.length && state.track.indexOf(material.track) === -1) return false;
    if (state.type.length && state.type.indexOf(material.type) === -1) return false;
    if (state.level.length && state.level.indexOf(material.level) === -1) return false;

    if (state.grade.length) {
      var grades = (material.grades || []).map(String);
      var hit = state.grade.some(function (grade) { return grades.indexOf(grade) !== -1; });
      if (!hit) return false;
    }

    if (state.query) {
      var needle = normalize(state.query);
      if (haystack(material).indexOf(needle) === -1) return false;
    }

    return true;
  }

  function sortItems(items) {
    var sorted = items.slice();

    if (state.sort === 'title') {
      sorted.sort(function (a, b) { return a.title.localeCompare(b.title, 'ru'); });
    } else if (state.sort === 'grade') {
      sorted.sort(function (a, b) {
        var minA = Math.min.apply(null, a.grades || [99]);
        var minB = Math.min.apply(null, b.grades || [99]);
        return minA - minB || b.year - a.year;
      });
    } else {
      sorted.sort(function (a, b) { return b.year - a.year || a.title.localeCompare(b.title, 'ru'); });
    }

    return sorted;
  }

  function render() {
    var found = sortItems(materials.filter(matches));

    grid.innerHTML = '';
    if (found.length) {
      grid.appendChild(Site.fragment(found.map(window.materialCard).join('')));
    }

    /* Счётчик активных фильтров на свёрнутой панели. */
    if (filtersCount) {
      var active = Object.keys(GROUPS).reduce(function (sum, group) {
        return sum + state[group].length;
      }, 0);
      filtersCount.hidden = active === 0;
      filtersCount.textContent = String(active);
    }

    empty.hidden = found.length > 0;
    countEl.innerHTML = found.length
      ? 'Найдено <b>' + found.length + '</b> ' + plural(found.length, ['материал', 'материала', 'материалов'])
      : 'Ничего не найдено';

    writeUrl();
  }

  /* ---- События ---------------------------------------------------------- */

  function bind() {
    filtersForm.addEventListener('change', function (event) {
      var input = event.target;
      if (input.type !== 'checkbox') return;

      var selected = state[input.name];
      var position = selected.indexOf(input.value);

      if (input.checked && position === -1) selected.push(input.value);
      if (!input.checked && position !== -1) selected.splice(position, 1);

      render();
    });

    var debounce = null;
    searchInput.addEventListener('input', function () {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(function () {
        state.query = searchInput.value.trim();
        searchClear.hidden = !state.query;
        render();
      }, 150);
    });

    searchClear.addEventListener('click', function () {
      state.query = '';
      searchInput.value = '';
      searchClear.hidden = true;
      searchInput.focus();
      render();
    });

    sortSelect.addEventListener('change', function () {
      state.sort = sortSelect.value;
      render();
    });

    function reset() {
      Object.keys(GROUPS).forEach(function (group) { state[group] = []; });
      state.query = '';
      syncControls();
      render();
    }

    if (filtersToggle) {
      /* На узких экранах панель фильтров свёрнута, чтобы карточки были сразу видны. */
      var collapse = function (collapsed) {
        filtersForm.classList.toggle('is-collapsed', collapsed);
        filtersToggle.setAttribute('aria-expanded', String(!collapsed));
      };

      collapse(window.innerWidth < 1000);

      filtersToggle.addEventListener('click', function () {
        collapse(!filtersForm.classList.contains('is-collapsed'));
      });
    }

    document.getElementById('reset').addEventListener('click', reset);
    Array.prototype.forEach.call(document.querySelectorAll('[data-reset]'), function (btn) {
      btn.addEventListener('click', reset);
    });
  }

  /* ---- Запуск ------------------------------------------------------------ */

  renderFilters();
  readUrl();

  Site.load('data/materials.json').then(function (data) {
    materials = data;
    syncControls();
    bind();
    render();
  }).catch(function (error) {
    console.error('Не удалось загрузить data/materials.json', error);
    countEl.textContent = 'Не удалось загрузить список материалов';
  });
})();
