/* Общее поведение сайта: мобильное меню, появление секций, год в подвале,
   плюс маленькие утилиты, которыми пользуются остальные скрипты. */

(function () {
  'use strict';

  /* ---- Утилиты, доступные другим скриптам ---------------------------- */

  var Site = {
    /* Загрузка JSON с понятным сообщением об ошибке. */
    load: function (path) {
      return fetch(path, { cache: 'no-cache' }).then(function (res) {
        if (!res.ok) throw new Error(path + ': ' + res.status);
        return res.json();
      });
    },

    /* Экранирование текста, пришедшего из data/*.json. */
    esc: function (value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    },

    /* Разметка из строки — чтобы собирать карточки одним куском. */
    fragment: function (html) {
      var tpl = document.createElement('template');
      tpl.innerHTML = html.trim();
      return tpl.content;
    },

    reducedMotion: function () {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    /* Ссылка на контакт: телефон, почта или обычный URL. */
    contactHref: function (key, contact) {
      if (contact.href) return contact.href;
      return null;
    }
  };

  window.Site = Site;

  /* ---- Мобильное меню ------------------------------------------------- */

  var burger = document.querySelector('.burger');
  var mobileNav = document.getElementById('mobile-nav');

  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      mobileNav.classList.toggle('is-open', !open);
    });

    mobileNav.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        burger.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('is-open');
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && mobileNav.classList.contains('is-open')) {
        burger.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('is-open');
        burger.focus();
      }
    });
  }

  /* ---- Появление секций при прокрутке --------------------------------- */

  document.documentElement.classList.add('js');

  var revealables = document.querySelectorAll('.reveal');

  function revealAll() {
    Array.prototype.forEach.call(revealables, function (el) {
      el.classList.add('is-visible');
    });
  }

  if (!('IntersectionObserver' in window) || Site.reducedMotion()) {
    revealAll();
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

    Array.prototype.forEach.call(revealables, function (el) {
      observer.observe(el);
    });

    /* Страховка: если наблюдатель почему-то не сработал (печать, снимок
       страницы целиком, нестандартный браузер), контент всё равно виден.
       Блоки, которые собираются из data/*.json, появляются позже разметки,
       поэтому ждём полной загрузки страницы, а не только DOM. */
    window.addEventListener('load', function () {
      window.setTimeout(revealAll, 600);
    });
  }

  /* ---- Год в подвале --------------------------------------------------- */

  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---- Текущий раздел в навигации -------------------------------------- */

  var here = location.pathname.split('/').pop() || 'index.html';
  Array.prototype.forEach.call(document.querySelectorAll('.nav__link'), function (link) {
    var href = link.getAttribute('href');
    if (href && href.indexOf('#') !== 0 && href === here) {
      link.setAttribute('aria-current', 'page');
    }
  });
})();
