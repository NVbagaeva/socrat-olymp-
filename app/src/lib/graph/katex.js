/* graph/katex.js — KaTeX в приложении.

   Боевой путь: зависимость установлена в проекте (app/, Next.js),
   подключается обычным импортом. Копии библиотеки в репозитории нет.

   Использование:

     import { renderFormulas } from '@/graph/katex';
     renderFormulas(containerRef.current);

   Вызывать после того, как разметка оказалась в DOM: модуль заменяет
   каждый <span class="math" data-tex="…"> вёрсткой KaTeX.
*/

import katex from 'katex';
import 'katex/dist/katex.min.css';

import upgradeModule from './katex-upgrade.js';

const { upgrade, render } = upgradeModule;

/** Заменить все формулы внутри узла вёрсткой KaTeX. */
export function renderFormulas(root = document) {
  return upgrade(root, katex);
}

/** Отрисовать одну формулу в заданный узел. */
export function renderFormula(tex, node) {
  return render(tex, node, katex);
}

export { katex };
export default renderFormulas;
