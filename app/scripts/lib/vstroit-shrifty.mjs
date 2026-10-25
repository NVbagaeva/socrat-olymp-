/* scripts/lib/vstroit-shrifty.mjs — шрифты KaTeX внутрь отдельного SVG.

   На страницах сайта шрифты подписей (lib/risunki/shrifty.js) приходят
   с katex.min.css. Отдельный SVG или сводный PDF их не видит и рисует
   запасной антиквой — поэтому сюда вкладываются @font-face с теми
   начертаниями, что встречаются в подписях: KaTeX_Main прямой и курсив,
   KaTeX_Math курсив (woff2 в base64). */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FONTS = path.join(root, 'node_modules', 'katex', 'dist', 'fonts');

const NACHERTANIYA = [
  ['KaTeX_Main', 'normal', 'KaTeX_Main-Regular.woff2'],
  ['KaTeX_Main', 'italic', 'KaTeX_Main-Italic.woff2'],
  ['KaTeX_Math', 'italic', 'KaTeX_Math-Italic.woff2'],
];

let css = null;

/** @font-face для подписей рисунков — строкой CSS. */
export function shriftyCss() {
  if (css === null) {
    css = NACHERTANIYA.map(([family, style, file]) => {
      const data = fs.readFileSync(path.join(FONTS, file)).toString('base64');
      return `@font-face{font-family:${family};font-style:${style};font-weight:400;src:url(data:font/woff2;base64,${data}) format('woff2')}`;
    }).join('');
  }
  return css;
}

/** SVG со встроенными шрифтами: <style> сразу после открывающего тега. */
export function vstroitShrifty(svg) {
  if (svg.includes('data-shrifty="vstroeny"')) return svg;
  return svg.replace(
    /<svg\b[^>]*>/,
    (open) => `${open}<style data-shrifty="vstroeny">${shriftyCss()}</style>`,
  );
}
