/* graph/katex-boot.js — подключение KaTeX и подстановка его вёрстки.

   Формулы уже набраны своими средствами (graph/math.js) и читаются
   без единого килобайта стороннего кода. KaTeX улучшает набор там,
   где он доступен: каждый <span class="math" data-tex="…"> заменяется
   его версткой. Не загрузился — на странице остаётся свой набор,
   и ничего не ломается.

   Источник ищется по порядку: сначала локальная копия в graph/vendor,
   потом CDN. Локальная копия предпочтительна: сайт школьный, он должен
   открываться и без стороннего домена.
*/

(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.GraphKatex = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SOURCES = [
    { css: 'vendor/katex/katex.min.css', js: 'vendor/katex/katex.min.js', local: true },
    { css: 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css',
      js:  'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js', local: false }
  ];

  var state = { tried: false, ready: false };

  function element(tag, attrs) {
    var node = document.createElement(tag);
    Object.keys(attrs).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    return node;
  }

  function loadOne(source, onDone) {
    var css = element('link', { rel: 'stylesheet', href: source.css });
    document.head.appendChild(css);

    var script = element('script', { src: source.js, defer: 'defer' });
    script.onload = function () { onDone(true); };
    script.onerror = function () { onDone(false); };
    document.head.appendChild(script);
  }

  /* Загрузка по цепочке источников; молча сдаётся, если ни один не ответил. */
  function load(options, done) {
    var sources = (options && options.sources) || SOURCES;
    var base = (options && options.base) || '';
    var index = 0;

    function next() {
      if (state.ready) { return finish(); }
      if (index >= sources.length) { return finish(); }
      var source = sources[index++];
      loadOne({
        css: source.local ? base + source.css : source.css,
        js:  source.local ? base + source.js  : source.js
      }, function (ok) {
        state.ready = ok && typeof window.katex !== 'undefined';
        if (state.ready) { finish(); } else { next(); }
      });
    }

    function finish() {
      state.tried = true;
      upgrade(document);
      if (done) { done(state.ready); }
    }

    if (typeof document === 'undefined') { return; }

    /* KaTeX мог быть подключён самой страницей — тогда грузить нечего. */
    if (typeof window !== 'undefined' && typeof window.katex !== 'undefined') {
      state.ready = true;
      return finish();
    }
    next();
  }

  /* Замена своей разметки вёрсткой KaTeX. Идемпотентна: уже
     обработанные формулы помечаются и второй раз не трогаются. */
  function upgrade(root) {
    if (typeof window === 'undefined' || typeof window.katex === 'undefined') { return 0; }
    state.ready = true;
    var nodes = (root || document).querySelectorAll('.math[data-tex]:not([data-katex])');
    var done = 0;

    Array.prototype.forEach.call(nodes, function (node) {
      try {
        window.katex.render(node.getAttribute('data-tex'), node, {
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

  return { load: load, upgrade: upgrade, ready: function () { return state.ready; }, SOURCES: SOURCES };
});
