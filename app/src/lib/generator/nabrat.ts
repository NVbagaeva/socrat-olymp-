/**
 * Формулы листа печати → KaTeX для предпросмотра общего генератора.
 *
 * Листы №9 и №12 ставят формулы заглушками typography.mathText
 * (`<span class="math" data-tex="…">…</span>`): их набирает страница
 * печати перед раскладкой. Предпросмотр набирает их сам, той же
 * функцией, что и названия подтипов.
 */

import { typeset } from '@/lib/tex';

/* class="math" и его разновидности: «math math--display-frac» у выкладок разбора. */
const ZAGLUSHKA = /<span class="math(?: [^"]*)?" data-tex="([^"]*)">(?:(?!<\/span>).)*<\/span>/gs;

function bezSushchnostey(tex: string): string {
  return tex
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export function nabratFormuly(html: string): string {
  return html.replace(ZAGLUSHKA, (_, tex: string) => typeset(`$${bezSushchnostey(tex)}$`));
}
