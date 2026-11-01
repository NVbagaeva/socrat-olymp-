/* lib/risunki/koren.js — знак корня на всех рисунках сайта.

   Почему не символ «√»: в шрифте у символа нет черты над подкоренным
   выражением — её рисует только набор формулы (KaTeX). В SVG-подписи
   символ «√10» выходит без черты, а приклеенная к тексту черта
   (text-decoration: overline, отдельная линия по оценке ширины) не
   совпадает со знаком и с цифрами: шрифт ещё не загружен, в Safari и в
   PDF ширина другая.

   Поэтому знак и черта — один путь SVG, а подкоренное выражение
   набирается с заданной шириной (textLength): черта всегда ровно над
   ним, при любом шрифте, масштабе, в WebKit и в PDF. Все размеры — в
   долях кегля, как у знака корня KaTeX. */

'use strict';

/** Знак корня в долях кегля: ширина до подкоренного выражения, высота черты над базовой линией. */
export var KOREN = {
  /** От начала знака до подкоренного выражения. */
  znak: 0.62,
  /** Черта выходит за подкоренное выражение справа. */
  hvost: 0.06,
  /** Черта над базовой линией: выше прописных цифр (0,68). */
  verh: 0.84,
  /** Толщина линии знака. */
  tolshchina: 0.055,
};

function px(v) {
  return String(Math.round(v * 100) / 100);
}

/** Ширина записи «√» + подкоренное шириной w (в единицах рисунка). */
export function shirinaKornya(w, kegl) {
  return KOREN.znak * kegl + w + KOREN.hvost * kegl;
}

/**
 * Путь знака корня: x — начало знака, base — базовая линия текста,
 * w — ширина подкоренного выражения. Галочка, длинный штрих вверх и
 * черта над всем подкоренным выражением — одной линией.
 */
export function putKornya(x, base, w, kegl) {
  var k = kegl;
  var verh = base - KOREN.verh * k;
  return (
    'M' +
    px(x + 0.02 * k) +
    ' ' +
    px(base - 0.36 * k) +
    'L' +
    px(x + 0.13 * k) +
    ' ' +
    px(base - 0.43 * k) +
    'L' +
    px(x + 0.3 * k) +
    ' ' +
    px(base + 0.1 * k) +
    'L' +
    px(x + 0.56 * k) +
    ' ' +
    px(verh) +
    'H' +
    px(x + KOREN.znak * k + w + KOREN.hvost * k)
  );
}

/** Элемент path знака корня: цвет — как у подписи. */
export function znakKornyaSvg(x, base, w, kegl, cvet, klass) {
  return (
    '<path class="' +
    (klass || 'koren') +
    '" d="' +
    putKornya(x, base, w, kegl) +
    '"' +
    ' fill="none" stroke="' +
    (cvet || 'currentColor') +
    '" stroke-width="' +
    px(KOREN.tolshchina * kegl) +
    '" stroke-linecap="round" stroke-linejoin="round"/>'
  );
}

var koren = {
  KOREN: KOREN,
  shirinaKornya: shirinaKornya,
  putKornya: putKornya,
  znakKornyaSvg: znakKornyaSvg,
};
export default koren;
