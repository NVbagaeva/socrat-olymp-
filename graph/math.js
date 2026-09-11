/* graph/math.js — математический набор формул.

   Превращает простую строку формулы («y = 1,5x − 3», «A(2; −3)»)
   в разметку, набранную по правилам математической типографики:
   переменные курсивом, числа и скобки прямым, дроби — столбиком,
   вокруг знаков отношения и операций — тонкие шпации.

   Слой оформления: ни предметной математики, ни знания о задачах.
   Правила набора лежат здесь, начертание — в graph/graph.css.
*/

(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.GraphMath = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MINUS = '−';        /* типографский минус, не дефис   */
  var THIN  = ' ';        /* тонкая шпация вокруг операций  */

  /* Латинские буквы — переменные, их набирают курсивом.
     Цифры, запятая, скобки и знаки — прямым. */
  var VARIABLE = /[A-Za-z]/;
  var FRACTION = /^(\d+)\/(\d+)$/;

  function esc(value) {
    return String(value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Разбор строки на куски: { text, italic } */
  function runs(text) {
    var out = [];
    var buffer = '';
    var italic = null;

    function flush() {
      if (buffer) { out.push({ text: buffer, italic: italic }); }
      buffer = '';
    }

    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var isVar = VARIABLE.test(ch);
      if (italic === null || isVar === italic) { buffer += ch; }
      else { flush(); buffer = ch; }
      italic = isVar;
    }
    flush();
    return out;
  }

  /* Пробелы вокруг = + − приводим к тонкой шпации: в наборе они
     уже, чем обычный пробел, и формула читается как единое целое. */
  function spaced(text) {
    return String(text)
      .replace(/ - /g, ' ' + MINUS + ' ')
      .replace(/-/g, MINUS)
      .replace(/ ([=+−]) /g, THIN + '$1' + THIN);
  }

  /* Дробь столбиком: 1/3 набирается не в строку, а горизонтальной чертой. */
  function fractionHtml(value) {
    var negative = value.charAt(0) === MINUS || value.charAt(0) === '-';
    var match = FRACTION.exec(negative ? value.slice(1) : value);
    if (!match) { return null; }
    var sign = negative ? MINUS : '';
    return '<span class="math">' + sign + '<span class="frac">' +
      '<span class="frac-num">' + esc(match[1]) + '</span>' +
      '<span class="frac-den">' + esc(match[2]) + '</span></span></span>';
  }

  /* ══════════════════════════════════════════════════════════
     Перевод формулы в LaTeX — исходник для KaTeX.
     Десятичная запятая в наборе требует {,}: иначе KaTeX ставит
     после неё пробел, как после разделителя аргументов.
     ══════════════════════════════════════════════════════════ */
  var GREEK = { 'α': '\\alpha', 'β': '\\beta', 'Δ': '\\Delta ' };

  function tex(text) {
    if (text === null || text === undefined) { return ''; }
    var value = String(text).replace(/\u2212/g, '-');

    var fraction = FRACTION.exec(value.charAt(0) === '-' ? value.slice(1) : value);
    if (fraction) {
      return (value.charAt(0) === '-' ? '-' : '') +
        '\\dfrac{' + fraction[1] + '}{' + fraction[2] + '}';
    }

    value = value.replace(/(\d),(\d)/g, '$1{,}$2');
    value = value.replace(/;/g, ';\\,');
    value = value.replace(/[αβΔ]/g, function (ch) { return GREEK[ch]; });

    /* Дробь внутри выражения набирается столбиком: и 6/2, и Δy/Δx. */
    var TOKEN = '(?:\\\\Delta\\s*[A-Za-z]|-?\\d+(?:\\{,\\}\\d+)?|[A-Za-z])';
    value = value.replace(new RegExp('(' + TOKEN + ')\\s*\\/\\s*(' + TOKEN + ')', 'g'),
      '\\dfrac{$1}{$2}');
    return value;
  }

  /* Формула целиком: <span class="math">…</span> с курсивными переменными.
     data-tex несёт исходник для KaTeX: если он подключён, разметка
     заменяется его версткой, если нет — остаётся эта, тоже набранная. */
  function html(text) {
    if (text === null || text === undefined) { return ''; }
    var value = spaced(String(text));

    var fraction = fractionHtml(value);
    if (fraction) {
      return fraction.replace('<span class="math">',
        '<span class="math" data-tex="' + esc(tex(String(text))) + '">');
    }

    var body = runs(value).map(function (run) {
      var content = esc(run.text);
      return run.italic ? '<i>' + content + '</i>' : content;
    }).join('');

    return '<span class="math" data-tex="' + esc(tex(String(text))) + '">' + body + '</span>';
  }

  /* Тот же текст без разметки — для answers.json и проверки ответа. */
  function plain(text) {
    return spaced(text === null || text === undefined ? '' : String(text));
  }

  return { html: html, plain: plain, tex: tex, runs: runs, spaced: spaced,
           MINUS: MINUS, THIN: THIN };
});
