/* Наполнение страницы «Обо мне» из data/about.json. */

(function () {
  'use strict';

  var esc = Site.esc;

  function timeline(items) {
    return items.map(function (item) {
      return '' +
        '<li>' +
          '<div class="timeline__period">' + esc(item.period) + '</div>' +
          '<div class="timeline__place">' + esc(item.place) + '</div>' +
          '<p class="timeline__role">' + esc(item.role) + '</p>' +
        '</li>';
    }).join('');
  }

  function fill(id, html) {
    var host = document.getElementById(id);
    if (host) host.appendChild(Site.fragment(html));
  }

  Site.load('data/about.json').then(function (about) {
    fill('experience', timeline(about.experience));
    fill('education', timeline(about.education));

    fill('subjects', about.subjects.map(function (subject) {
      return '<span class="tag">' + esc(subject) + '</span>';
    }).join(''));

    fill('methods', about.methods.map(function (method) {
      return '' +
        '<article class="card">' +
          '<h3 class="card__title">' + esc(method.title) + '</h3>' +
          '<p class="card__text">' + esc(method.text) + '</p>' +
          '<div class="card__meta">' + esc(method.result) + '</div>' +
        '</article>';
    }).join(''));

    fill('monitoring', about.monitoring.map(function (item) {
      return '' +
        '<article class="result">' +
          '<div class="result__year">' + esc(item.year) + '</div>' +
          '<div>' +
            '<p class="result__title">' + esc(item.title) + '</p>' +
            '<p class="result__detail">' + esc(item.result) + '</p>' +
          '</div>' +
        '</article>';
    }).join(''));

    fill('community', about.community.map(function (item) {
      return '' +
        '<article class="card">' +
          '<h3 class="card__title">' + esc(item.title) + '</h3>' +
          '<p class="card__text">' + esc(item.detail) + '</p>' +
        '</article>';
    }).join(''));

    /* График рисует chart.js — отдаём ему уже загруженные данные. */
    if (typeof window.renderQualityChart === 'function') {
      window.renderQualityChart(about.quality);
    } else {
      window.__qualityData = about.quality;
    }
  }).catch(function (error) {
    console.error('Не удалось загрузить data/about.json', error);
  });
})();
