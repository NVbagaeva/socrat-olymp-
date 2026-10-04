/* graph/katex.js — KaTeX в приложении.

   Боевой путь: зависимость установлена в проекте (app/, Next.js),
   подключается обычным импортом. Копии библиотеки в репозитории нет.

   Использование:

     import { renderFormulas } from '@/graph/katex';
     renderFormulas(containerRef.current);

   Вызывать после того, как разметка оказалась в DOM: модуль заменяет
   каждый <span class="math" data-tex="…"> вёрсткой KaTeX.
*/

import katexLib from 'katex';
import 'katex/dist/katex.min.css';

import upgradeModule from './katex-upgrade.js';

const { upgrade, render, inlineTex } = upgradeModule;

/* KaTeX проекта — тот же пакет с одним правилом поверх: формула в
   строке (displayMode не задан) набирает дроби \tfrac, а не \dfrac,
   и не раздувает высоту строки текста. Выносные формулы не трогаются.
   Все места сайта берут KaTeX отсюда, поэтому правило одно. */
const katex = {
  ...katexLib,
  renderToString(tex, options) {
    return katexLib.renderToString(options && options.displayMode ? tex : inlineTex(tex), options);
  },
  render(tex, node, options) {
    return katexLib.render(options && options.displayMode ? tex : inlineTex(tex), node, options);
  },
};

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
