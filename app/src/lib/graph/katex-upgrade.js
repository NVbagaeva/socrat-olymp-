/* graph/katex-upgrade.js — подстановка вёрстки KaTeX в готовую разметку.

   Формула в разметке живёт одним способом: <span class="math"
   data-tex="…">. Здесь она заменяется вёрсткой KaTeX.

   Модуль ничего не импортирует и ничего не загружает: экземпляр KaTeX
   передаётся снаружи. В приложении его даёт обычный импорт пакета
   (graph/katex.js), автономной странице preview.html — временно CDN.
*/

'use strict';

var OPTIONS = { throwOnError: false, displayMode: false, output: 'html' };

/* Формула в строке текста не должна раздувать высоту строки: дробь
   \dfrac (выносной размер) набирается как \tfrac. Правило одно на
   сайт и на листы для печати — здесь и в graph/katex.js. */
function inlineTex(tex) {
  return String(tex).replace(/\\dfrac(?![a-zA-Z])/g, '\\tfrac');
}

/* Исключение — формула с классом math--display-frac: решения в ключе
   учителя стоят отдельной строкой, а не внутри текста, и строчная
   дробь там мелкая — на телефоне и в печати не читается. Там \dfrac
   остаётся крупной. */
var DISPLAY_FRAC = 'math--display-frac';

/* Сам KaTeX проекта (graph/katex.js) тоже сводит \dfrac к \tfrac у
   формулы в строке — ему признак передаётся опцией displayFrac. KaTeX
   незнакомую опцию пропускает. */
var DISPLAY_FRAC_OPTIONS = { throwOnError: false, displayMode: false, output: 'html',
                             displayFrac: true };

function displayFrac(node) {
  return !!(node.classList && node.classList.contains(DISPLAY_FRAC));
}

/* Обработанные формулы помечаются, поэтому повторный вызов
   на том же куске страницы ничего не ломает. */
function upgrade(root, katex) {
  if (!katex || !root) { return 0; }

  var nodes = root.querySelectorAll('.math[data-tex]:not([data-katex])');
  var done = 0;

  Array.prototype.forEach.call(nodes, function (node) {
    try {
      var tex = node.getAttribute('data-tex');
      if (displayFrac(node)) { katex.render(tex, node, DISPLAY_FRAC_OPTIONS); }
      else { katex.render(inlineTex(tex), node, OPTIONS); }
      node.setAttribute('data-katex', 'on');
      done++;
    } catch {
      /* Формула остаётся в исходном виде: пустого места не будет.
         Сам объект ошибки не нужен — важен только факт неудачи. */
      node.setAttribute('data-katex', 'error');
    }
  });
  return done;
}

function render(tex, node, katex) {
  if (!katex || !node) { return false; }
  katex.render(inlineTex(tex), node, OPTIONS);
  node.setAttribute('data-katex', 'on');
  return true;
}

const api = { upgrade: upgrade, render: render, inlineTex: inlineTex, OPTIONS: OPTIONS };

export default api;
export { upgrade, render, inlineTex, OPTIONS };
