/* graph/katex-boot.js — подключение KaTeX и подстановка его вёрстки.

   Формулы уже набраны своими средствами (graph/math.js) и читаются
   без стороннего кода. KaTeX улучшает набор: каждый
   <span class="math" data-tex="…"> заменяется его вёрсткой.

   Три способа получить KaTeX, в порядке приоритета:

   1. Приложение подключило его само — импортом из пакета:

        import katex from 'katex';
        import 'katex/dist/katex.min.css';
        window.katex = katex;              // или передать через upgrade

      Тогда грузить нечего: модуль видит window.katex и сразу заменяет
      разметку. Это боевой путь, зависимость ставится как обычно:
      pnpm add katex.

   2. Страница передала адреса сама: load({ sources: [{ css, js }] }).

   3. Ничего не передали — берётся CDN. Нужен только автономному
      preview.html, который открывают без сборки.

   Не загрузился ни один источник — на странице остаётся собственный
   набор формул, и ничего не ломается.
*/

(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.GraphKatex = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '0.16.11';
  var CDN = {
    css: 'https://cdn.jsdelivr.net/npm/katex@' + VERSION + '/dist/katex.min.css',
    js:  'https://cdn.jsdelivr.net/npm/katex@' + VERSION + '/dist/katex.min.js'
  };

  var state = { tried: false, ready: false };

  function element(tag, attrs) {
    var node = document.createElement(tag);
    Object.keys(attrs).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    return node;
  }

  function loadOne(source, onDone) {
    if (source.css) { document.head.appendChild(element('link', { rel: 'stylesheet', href: source.css })); }

    var script = element('script', { src: source.js, defer: 'defer' });
    script.onload = function () { onDone(true); };
    script.onerror = function () { onDone(false); };
    document.head.appendChild(script);
  }

  function load(options, done) {
    var sources = (options && options.sources) || [CDN];
    var index = 0;

    function finish() {
      state.tried = true;
      upgrade(document);
      if (done) { done(state.ready); }
    }

    function next() {
      if (state.ready || index >= sources.length) { return finish(); }
      loadOne(sources[index++], function (ok) {
        state.ready = ok && typeof window.katex !== 'undefined';
        if (state.ready) { finish(); } else { next(); }
      });
    }

    if (typeof document === 'undefined') { return; }

    /* KaTeX уже импортирован приложением — грузить нечего. */
    if (typeof window !== 'undefined' && typeof window.katex !== 'undefined') {
      state.ready = true;
      return finish();
    }
    next();
  }

  /* Замена своей разметки вёрсткой KaTeX. Идемпотентна: обработанные
     формулы помечаются и второй раз не трогаются.
     Второй аргумент — экземпляр katex, если приложение не кладёт его
     в window: upgrade(root, katex). */
  function upgrade(root, instance) {
    var katex = instance || (typeof window !== 'undefined' ? window.katex : null);
    if (!katex) { return 0; }
    state.ready = true;

    var nodes = (root || document).querySelectorAll('.math[data-tex]:not([data-katex])');
    var done = 0;

    Array.prototype.forEach.call(nodes, function (node) {
      try {
        katex.render(node.getAttribute('data-tex'), node, {
          throwOnError: false,
          displayMode: false,
          output: 'html'
        });
        node.setAttribute('data-katex', 'on');
        done++;
      } catch (error) {
        /* Формула остаётся набранной своими средствами. */
        node.setAttribute('data-katex', 'fallback');
      }
    });
    return done;
  }

  return { load: load, upgrade: upgrade, ready: function () { return state.ready; },
           CDN: CDN, VERSION: VERSION };
});
