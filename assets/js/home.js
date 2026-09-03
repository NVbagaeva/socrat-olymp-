/* Наполнение главной страницы из data/site.json, data/results.json
   и data/materials.json. Тексты секций лежат в разметке, здесь —
   только то, что удобно править как данные. */

(function () {
  'use strict';

  var esc = Site.esc;

  /* ---- Направления подготовки ----------------------------------------- */

  function renderServices(site) {
    var host = document.getElementById('services');
    if (!host) return;

    var html = site.services.map(function (service) {
      var points = service.points.map(function (point) {
        return '<li>' + esc(point) + '</li>';
      }).join('');

      var price = /^TODO/i.test(service.price)
        ? '<span class="todo">' + esc(service.price) + '</span>'
        : '<span class="card__price">' + esc(service.price) + '</span>';

      return '' +
        '<article class="card' + (service.featured ? ' card--feature' : '') + '">' +
          '<span class="card__kicker">' + esc(service.grades) + '</span>' +
          '<h3 class="card__title">' + esc(service.title) + '</h3>' +
          '<p class="card__text">' + esc(service.summary) + '</p>' +
          '<ul class="card__list">' + points + '</ul>' +
          '<div class="card__meta">' + price + '</div>' +
        '</article>';
    }).join('');

    host.appendChild(Site.fragment(html));
  }

  /* ---- Шаги и вопросы -------------------------------------------------- */

  function renderFaq(site) {
    var host = document.getElementById('faq-list');
    if (!host) return;

    var html = site.faq.map(function (item) {
      var answer = /^TODO/i.test(item.a)
        ? '<p><span class="todo">' + esc(item.a) + '</span></p>'
        : '<p>' + esc(item.a) + '</p>';
      return '<details><summary>' + esc(item.q) + '</summary>' + answer + '</details>';
    }).join('');

    host.appendChild(Site.fragment(html));
  }

  /* ---- Контакты -------------------------------------------------------- */

  function renderContacts(site) {
    var host = document.getElementById('contact-list');
    if (!host) return;

    var order = ['telegram', 'phone', 'email', 'hours'];
    var html = order.map(function (key) {
      var contact = site.contacts[key];
      if (!contact) return '';

      var value = /^TODO/i.test(contact.value)
        ? '<span class="todo">' + esc(contact.value) + '</span>'
        : (contact.href
            ? '<a href="' + esc(contact.href) + '">' + esc(contact.value) + '</a>'
            : '<span class="contact__val">' + esc(contact.value) + '</span>');

      return '<li><div class="contact__key">' + esc(contact.label) + '</div>' + value + '</li>';
    }).join('');

    host.appendChild(Site.fragment(html));

    /* Кнопки «Записаться» ведут в контакты, пока не задан адрес в site.json. */
    if (site.cta && site.cta.href) {
      Array.prototype.forEach.call(document.querySelectorAll('a[href="#contacts"].btn'), function (btn) {
        btn.setAttribute('href', site.cta.href);
        btn.setAttribute('rel', 'noopener');
      });
    }
  }

  /* ---- Результаты ------------------------------------------------------ */

  function renderResults(results) {
    var scores = document.getElementById('ege-scores');
    if (scores) {
      var html = results.ege.highlights.map(function (item) {
        return '' +
          '<div class="score' + (item.gold ? ' score--gold' : '') + '">' +
            '<div class="score__value">' + esc(item.score) + '</div>' +
            '<div class="score__caption">' + esc(item.caption) + '<br>' + esc(item.student) + '</div>' +
          '</div>';
      }).join('');
      scores.appendChild(Site.fragment(html));
    }

    var note = document.getElementById('ege-note');
    if (note) note.textContent = results.ege.note;

    var host = document.getElementById('olympiads');
    if (!host) return;

    var rows = results.olympiads.map(function (item) {
      var link = item.href
        ? '<a class="result__link" href="' + esc(item.href) + '" target="_blank" rel="noopener">Протокол &#8599;</a>'
        : '<span class="result__link" style="color: var(--ink-muted);">Диплом в архиве</span>';

      return '' +
        '<article class="result">' +
          '<div class="result__year">' + esc(item.year) + '</div>' +
          '<div>' +
            '<p class="result__title">' + esc(item.title) + '</p>' +
            '<p class="result__detail">' + esc(item.stage) + ' · ' + esc(item.detail) + '</p>' +
          '</div>' +
          link +
        '</article>';
    }).join('');

    host.appendChild(Site.fragment(rows));
  }

  /* ---- Превью материалов ------------------------------------------------ */

  function renderMaterialsPreview(materials) {
    var host = document.getElementById('materials-preview');
    if (!host) return;

    var featured = ['m-planimetry-17', 'm-golden-ratio', 'm-oge-geometry'];
    var picked = featured.map(function (id) {
      return materials.filter(function (m) { return m.id === id; })[0];
    }).filter(Boolean);

    if (picked.length < 3) {
      picked = materials.slice(0, 3);
    }

    host.appendChild(Site.fragment(picked.map(window.materialCard).join('')));
  }

  /* ---- Запуск ----------------------------------------------------------- */

  Site.load('data/site.json').then(function (site) {
    renderServices(site);
    renderFaq(site);
    renderContacts(site);
  }).catch(function (error) {
    console.error('Не удалось загрузить data/site.json', error);
  });

  Site.load('data/results.json').then(renderResults).catch(function (error) {
    console.error('Не удалось загрузить data/results.json', error);
  });

  Site.load('data/materials.json').then(renderMaterialsPreview).catch(function (error) {
    console.error('Не удалось загрузить data/materials.json', error);
  });
})();
