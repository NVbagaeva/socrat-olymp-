/* graph/katex-upgrade.js — подстановка вёрстки KaTeX в готовую разметку.

   Формула в разметке живёт одним способом: <span class="math"
   data-tex="…">. Здесь она заменяется вёрсткой KaTeX.

   Модуль ничего не импортирует и ничего не загружает: экземпляр KaTeX
   передаётся снаружи. В приложении его даёт обычный импорт пакета
   (graph/katex.js), автономной странице preview.html — временно CDN.
*/

'use strict';

var OPTIONS = { throwOnError: false, displayMode: false, output: 'html' };

/* Обработанные формулы помечаются, поэтому повторный вызов
   на том же куске страницы ничего не ломает. */
function upgrade(root, katex) {
  if (!katex || !root) { return 0; }

  var nodes = root.querySelectorAll('.math[data-tex]:not([data-katex])');
  var done = 0;

  Array.prototype.forEach.call(nodes, function (node) {
    try {
      katex.render(node.getAttribute('data-tex'), node, OPTIONS);
      node.setAttribute('data-katex', 'on');
      done++;
    } catch (error) {
      /* Формула остаётся в исходном виде: пустого места не будет. */
      node.setAttribute('data-katex', 'error');
    }
  });
  return done;
}

function render(tex, node, katex) {
  if (!katex || !node) { return false; }
  katex.render(tex, node, OPTIONS);
  node.setAttribute('data-katex', 'on');
  return true;
}

const api = { upgrade: upgrade, render: render, OPTIONS: OPTIONS };

export default api;
export { upgrade, render, OPTIONS };
