/* Карусель отзывов: стрелки, точки, свайп, клавиатура и автопрокрутка,
   которая останавливается при наведении, фокусе и prefers-reduced-motion. */

(function () {
  'use strict';

  var root = document.querySelector('[data-reviews]');
  if (!root) return;

  var esc = Site.esc;
  var track = root.querySelector('.reviews__track');
  var dotsHost = root.querySelector('[data-dots]');
  var prevBtn = root.querySelector('[data-prev]');
  var nextBtn = root.querySelector('[data-next]');

  var AUTOPLAY_MS = 6500;
  var index = 0;
  var perView = 1;
  var total = 0;
  var timer = null;

  function star() {
    return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>';
  }

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/);
    return parts.slice(0, 2).map(function (part) { return part.charAt(0); }).join('').toUpperCase();
  }

  function formatDate(value) {
    if (!value) return '';
    var parts = String(value).split('-');
    var months = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
                  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    var month = months[Number(parts[1]) - 1];
    return month ? month + ' ' + parts[0] : parts[0];
  }

  function reviewCard(review) {
    var stars = '';
    for (var i = 0; i < (review.rating || 5); i++) stars += star();

    var flag = review.placeholder
      ? '<span class="review__flag">пример — заменить в data/reviews.json</span>'
      : '';

    var result = review.result
      ? '<span class="review__result">' + esc(review.result) + '</span>'
      : '';

    return '' +
      '<article class="review">' +
        '<div class="review__stars" role="img" aria-label="Оценка ' + (review.rating || 5) + ' из 5">' + stars + '</div>' +
        flag +
        '<p class="review__text">' + esc(review.text) + '</p>' +
        result +
        '<div class="review__author">' +
          '<span class="review__avatar" aria-hidden="true">' + esc(initials(review.name)) + '</span>' +
          '<span>' +
            '<span class="review__name">' + esc(review.name) + '</span><br>' +
            '<span class="review__role">' + esc(review.role) +
              (review.date ? ' · ' + esc(formatDate(review.date)) : '') +
            '</span>' +
          '</span>' +
        '</div>' +
      '</article>';
  }

  function measurePerView() {
    var width = window.innerWidth;
    if (width >= 1080) return 3;
    if (width >= 720) return 2;
    return 1;
  }

  function maxIndex() {
    return Math.max(0, total - perView);
  }

  function renderDots() {
    if (!dotsHost) return;
    var pages = maxIndex() + 1;
    var html = '';
    for (var i = 0; i < pages; i++) {
      html += '<button class="dot" type="button" data-index="' + i + '" aria-label="Отзыв ' + (i + 1) + '"></button>';
    }
    dotsHost.innerHTML = html;
  }

  function update() {
    var card = track.querySelector('.review');
    if (!card) return;

    var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
    var step = card.getBoundingClientRect().width + gap;

    track.style.transform = 'translateX(' + (-index * step) + 'px)';

    if (prevBtn) prevBtn.disabled = index <= 0;
    if (nextBtn) nextBtn.disabled = index >= maxIndex();

    Array.prototype.forEach.call(track.children, function (child, i) {
      var visible = i >= index && i < index + perView;
      child.setAttribute('aria-hidden', visible ? 'false' : 'true');
    });

    if (dotsHost) {
      Array.prototype.forEach.call(dotsHost.children, function (dot, i) {
        dot.setAttribute('aria-current', String(i === index));
      });
    }
  }

  function goTo(next) {
    index = Math.min(Math.max(next, 0), maxIndex());
    update();
  }

  function startAutoplay() {
    if (Site.reducedMotion() || total <= perView) return;
    stopAutoplay();
    timer = window.setInterval(function () {
      index = index >= maxIndex() ? 0 : index + 1;
      update();
    }, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function bind() {
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(index - 1); stopAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(index + 1); stopAutoplay(); });

    if (dotsHost) {
      dotsHost.addEventListener('click', function (event) {
        var dot = event.target.closest('.dot');
        if (!dot) return;
        goTo(Number(dot.dataset.index));
        stopAutoplay();
      });
    }

    root.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') { goTo(index - 1); stopAutoplay(); }
      if (event.key === 'ArrowRight') { goTo(index + 1); stopAutoplay(); }
    });

    root.addEventListener('mouseenter', stopAutoplay);
    root.addEventListener('mouseleave', startAutoplay);
    root.addEventListener('focusin', stopAutoplay);

    /* Свайп указателем — работает и мышью, и пальцем. */
    var startX = null;
    track.addEventListener('pointerdown', function (event) {
      startX = event.clientX;
      stopAutoplay();
    });
    track.addEventListener('pointerup', function (event) {
      if (startX === null) return;
      var delta = event.clientX - startX;
      if (Math.abs(delta) > 40) goTo(index + (delta < 0 ? 1 : -1));
      startX = null;
    });
    track.addEventListener('pointercancel', function () { startX = null; });

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        var next = measurePerView();
        if (next !== perView) {
          perView = next;
          renderDots();
          goTo(index);
        } else {
          update();
        }
      }, 120);
    });
  }

  Site.load('data/reviews.json').then(function (reviews) {
    if (!reviews.length) {
      root.closest('section').hidden = true;
      return;
    }

    total = reviews.length;
    perView = measurePerView();
    track.innerHTML = reviews.map(reviewCard).join('');

    renderDots();
    bind();
    update();
    startAutoplay();
  }).catch(function (error) {
    console.error('Не удалось загрузить data/reviews.json', error);
    var section = root.closest('section');
    if (section) section.hidden = true;
  });
})();
