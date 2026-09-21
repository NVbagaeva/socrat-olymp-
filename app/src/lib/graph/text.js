/* graph/text.js — тексты условий и ответов.

   Подстановка значений в шаблон условия, набор формул из долларов,
   запись чисел и точек, строка ответа. Слой текста: ни математики
   семейств, ни SVG. Вынесено из generate.js без изменения поведения:
   теми же функциями пользуется генератор параболы.
*/

'use strict';

import math from './math.js';
import Line from './families/line.js';

var MINUS = '−';         /* типографский минус в формулах вариантов */

/* Формулы внутри текста размечаются долларами, как в наборе:
   «График функции $y = kx + b$ …». В обычном тексте доллары снимаются,
   в разметке — заменяются набранной формулой. */
function typesetText(text) {
  return String(text).replace(/\$([^$]+)\$/g, function (match, formula) {
    return math.html(formula);
  });
}

function plainText(text) {
  return String(text).replace(/\$([^$]+)\$/g, function (match, formula) {
    return math.plain(formula);
  });
}

/* Подстановка значений в шаблон условия: {x}, {y}, {equation}. */
function fillTemplate(text, values) {
  return String(text).replace(/\{(\w+)\}/g, function (match, key) {
    return values[key] === undefined ? match : values[key];
  });
}

/* Числа в условии и на чертеже: запятая и типографский минус. */
function numberText(value) {
  return String(Math.round(value * 100) / 100).replace('.', ',').replace('-', MINUS);
}

function pointText(name, x, y) {
  return name + '(' + numberText(x) + '; ' + numberText(y) + ')';
}

/* Точная дробь -> строка ответа. Конечная десятичная — с запятой,
   как в бланке; несократимая треть остаётся дробью. */
function answerText(value) {
  if (typeof value === 'string') { return value; }
  var f = Line.toFrac(value);
  var q = f.q;
  while (q % 2 === 0) { q /= 2; }
  while (q % 5 === 0) { q /= 5; }
  if (q === 1) {
    /* Разделитель — запятая, как в бланке ЕГЭ; минус обычный, чтобы
       ответ можно было сравнивать с тем, что вводит ученик. */
    return String(Line.num(f)).replace('.', ',');
  }
  return (f.p < 0 ? '-' : '') + Math.abs(f.p) + '/' + f.q;
}

/* Есть ли у точной дроби конечная десятичная запись. */
function decimalFriendly(f) {
  var q = Math.abs(f.q);
  while (q % 2 === 0) { q /= 2; }
  while (q % 5 === 0) { q /= 5; }
  return q === 1;
}

const api = { MINUS: MINUS, typesetText: typesetText, plainText: plainText,
              fillTemplate: fillTemplate, numberText: numberText, pointText: pointText,
              answerText: answerText, decimalFriendly: decimalFriendly };

export default api;
export { MINUS, typesetText, plainText, fillTemplate, numberText, pointText, answerText,
         decimalFriendly };
