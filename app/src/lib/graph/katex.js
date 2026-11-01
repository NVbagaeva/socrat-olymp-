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

import './katex-makrosy.js';
import upgradeModule from './katex-upgrade.js';
import { opciiOdin, podpisat, podpisatUzel } from '../katexOdin.js';

const { upgrade, render, inlineTex } = upgradeModule;

/* KaTeX проекта — тот же пакет с одним правилом поверх: формула в
   строке (displayMode не задан) набирает дроби \tfrac, а не \dfrac,
   и не раздувает высоту строки текста. Выносные формулы не трогаются.
   Все места сайта берут KaTeX отсюда, поэтому правило одно.
   Исключение — решения в ключе учителя (опция displayFrac, см.
   katex-upgrade.js): там \dfrac остаётся крупной. */
function keepsDfrac(options) {
  return !!(options && (options.displayMode || options.displayFrac));
}

/* Вывод один — видимая вёрстка с подписью role="math" и aria-label
   (lib/katexOdin.ts): робот поиска и копирование текста больше не
   видят формулу трижды (вёрстка + MathML + TeX). Явный output у вызова
   сохраняется. */
const katex = {
  ...katexLib,
  renderToString(tex, options) {
    const o = opciiOdin(options);
    const html = katexLib.renderToString(keepsDfrac(o) ? tex : inlineTex(tex), o);
    return o.output === 'html' ? podpisat(html, tex) : html;
  },
  render(tex, node, options) {
    const o = opciiOdin(options);
    const out = katexLib.render(keepsDfrac(o) ? tex : inlineTex(tex), node, o);
    if (o.output === 'html') podpisatUzel(node, tex);
    return out;
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
