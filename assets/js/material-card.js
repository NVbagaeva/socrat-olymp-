/* Карточка материала — одна разметка для главной и для каталога. */

(function () {
  'use strict';

  var esc = Site.esc;

  var TYPE_LABELS = {
    notes: 'Конспект',
    publication: 'Публикация',
    lesson: 'Урок и интенсив',
    masterclass: 'Мастер-класс',
    video: 'Видеоразбор',
    interactive: 'Интерактив'
  };

  var TRACK_LABELS = {
    olympiad: 'Олимпиады',
    ege: 'ЕГЭ',
    oge: 'ОГЭ',
    school: 'Школьный курс',
    method: 'Коллегам'
  };

  var LEVEL_LABELS = {
    basic: 'База',
    medium: 'Средний',
    advanced: 'Продвинутый'
  };

  var ICONS = {
    notes: '<path d="M4 3h11l5 5v13H4z"/><path d="M15 3v5h5"/>',
    publication: '<path d="M4 4h7a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2H4z"/><path d="M20 4h-3a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2H20z"/>',
    lesson: '<path d="M3 5h18v11H3z"/><path d="M8 20h8"/><path d="M12 16v4"/>',
    masterclass: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M7 11v5c0 1.7 2.2 3 5 3s5-1.3 5-3v-5"/>',
    video: '<path d="M3 5h13v14H3z"/><path d="M16 10l5-3v10l-5-3z"/>',
    interactive: '<path d="M3 12h18"/><path d="M12 3v18"/><circle cx="8" cy="8" r="2"/><circle cx="16" cy="16" r="2"/>'
  };

  function gradesLabel(grades) {
    if (!grades || !grades.length) return '';
    if (grades.length === 1) return grades[0] + ' класс';
    var sorted = grades.slice().sort(function (a, b) { return a - b; });
    var isRange = sorted[sorted.length - 1] - sorted[0] === sorted.length - 1;
    return isRange
      ? sorted[0] + '–' + sorted[sorted.length - 1] + ' класс'
      : sorted.join(', ') + ' класс';
  }

  function materialCard(material) {
    var icon = ICONS[material.type] || ICONS.notes;
    var typeLabel = TYPE_LABELS[material.type] || 'Материал';

    var action;
    if (material.href) {
      action = '<a class="material__action" href="' + esc(material.href) + '" target="_blank" rel="noopener">' +
        esc(material.linkLabel || 'Открыть') +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
        '<path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg></a>';
    } else if (material.file) {
      action = '<a class="material__action" href="' + esc(material.file) + '" download>' +
        esc(material.linkLabel || 'Скачать PDF') +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
        '<path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 21h16"/></svg></a>';
    } else {
      action = '<span class="material__grades">Материал по запросу</span>';
    }

    var topics = (material.topics || []).slice(0, 3).map(function (topic) {
      return '<span class="tag">' + esc(topic) + '</span>';
    }).join('');

    return '' +
      '<article class="material">' +
        '<div class="material__top">' +
          '<span class="material__icon" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + icon + '</svg>' +
          '</span>' +
          '<span class="material__type">' + esc(typeLabel) + '</span>' +
          '<span class="material__year">' + esc(material.year) + '</span>' +
        '</div>' +
        '<h3 class="material__title">' + esc(material.title) + '</h3>' +
        '<p class="material__desc">' + esc(material.description) + '</p>' +
        '<div class="tag-row">' + topics + '</div>' +
        '<div class="material__foot">' +
          '<span class="material__grades">' + esc(gradesLabel(material.grades)) + '</span>' +
          action +
        '</div>' +
      '</article>';
  }

  window.materialCard = materialCard;
  window.materialLabels = {
    type: TYPE_LABELS,
    track: TRACK_LABELS,
    level: LEVEL_LABELS,
    grades: gradesLabel
  };
})();
