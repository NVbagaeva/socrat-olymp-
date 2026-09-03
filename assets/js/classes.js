/* Витрина классов: карточки 5–11 с количеством материалов и ближайшим сроком. */

(function () {
  'use strict';

  var esc = Site.esc;
  var host = document.getElementById('class-grid');
  if (!host) return;

  function summarize(data) {
    var theory = (data.theory || []).length;
    var files = (data.files || []).length;
    var parts = [];

    if (theory) parts.push(theory + ' ' + Deadlines.plural(theory, ['конспект', 'конспекта', 'конспектов']));
    if (files) parts.push(files + ' ' + Deadlines.plural(files, ['файл', 'файла', 'файлов']));

    var active = (data.homework || []).filter(function (item) {
      var left = Deadlines.daysLeft(item.deadline);
      return left === null || left >= 0;
    });

    var nearest = active.slice().sort(function (a, b) {
      return String(a.deadline).localeCompare(String(b.deadline));
    })[0];

    return {
      contents: parts.join(' · ') || 'Материалы появятся к началу занятий',
      active: active.length,
      nearest: nearest ? nearest.deadline : null
    };
  }

  function card(entry, extra) {
    var due = '';
    if (extra && extra.active) {
      var status = Deadlines.status(extra.nearest, false);
      due = '<span class="due ' + status.modifier + '">' + esc(status.label) + '</span>';
    }

    var counts = extra
      ? '<p class="card__text">' + esc(extra.contents) + '</p>'
      : '<p class="card__text">' + esc(entry.summary) + '</p>';

    var active = extra && extra.active
      ? extra.active + ' ' + Deadlines.plural(extra.active, ['активное задание', 'активных задания', 'активных заданий'])
      : 'Активных заданий нет';

    return '' +
      '<a class="card class-card" href="class.html?grade=' + entry.grade + '">' +
        '<span class="card__kicker">Класс</span>' +
        '<h2 class="class-card__grade">' + entry.grade + '</h2>' +
        '<p class="card__text">' + esc(entry.summary) + '</p>' +
        counts +
        '<div class="card__meta class-card__meta">' +
          '<span>' + esc(active) + '</span>' + due +
        '</div>' +
      '</a>';
  }

  Site.load('data/classes.json').then(function (config) {
    var enabled = config.classes.filter(function (entry) { return entry.enabled !== false; });

    /* Данные каждого класса нужны только ради счётчиков на витрине. */
    return Promise.all(enabled.map(function (entry) {
      return Site.load('data/classes/' + entry.grade + '.json')
        .then(function (data) { return { entry: entry, extra: summarize(data) }; })
        .catch(function () { return { entry: entry, extra: null }; });
    }));
  }).then(function (rows) {
    host.appendChild(Site.fragment(rows.map(function (row) {
      return card(row.entry, row.extra);
    }).join('')));
  }).catch(function (error) {
    console.error('Не удалось загрузить список классов', error);
    host.innerHTML = '<p class="card__text">Не удалось загрузить список классов. Обновите страницу.</p>';
  });
})();
