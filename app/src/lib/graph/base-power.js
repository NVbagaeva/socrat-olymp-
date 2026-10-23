/* graph/base-power.js — основание степени и точные степени.

   Общий модуль показательной и логарифмической подтем. Основание
   хранится точно: a = r^(1/m), где r — точная дробь, m = 1 или 2.
   При m = 2 это √2, √3, 1/√2 … — такие основания встречаются в
   открытом банке ФИПИ (график проходит через точки, отстоящие на две
   клетки). Степень aⁿ рациональна, только если n кратно m: тогда
   aⁿ = r^(n/m). Других степеней движок не считает — они не нужны ни
   для узлов сетки, ни для ответа.

   Числа — точные дроби families/line.js. */

'use strict';

import Line from './families/line.js';
import { decimalFriendly } from './text.js';

var frac = Line.frac, num = Line.num, isInt = Line.isInt;

var MINUS = '−';

/** Основание из данных: { r: 2 } или { r: [1, 2] }, m — по умолчанию 1. */
function base(spec) {
  var r = Array.isArray(spec.r) ? frac(spec.r[0], spec.r[1]) : Line.toFrac(spec.r);
  var m = spec.m === undefined ? 1 : spec.m;
  if (r.p <= 0) { throw new Error('base-power: основание должно быть положительным'); }
  if (r.p === r.q) { throw new Error('base-power: основание не может быть единицей'); }
  return { r: r, m: m };
}

/** Значение основания числом: для рисования и сравнений. */
function value(b) { return Math.pow(num(b.r), 1 / b.m); }

/** Основание больше единицы — функция возрастает. */
function growing(b) { return num(b.r) > 1; }

/** Целая степень точной дроби, показатель любого знака. */
function powInt(f, k) {
  var p = 1, q = 1;
  for (var i = 0; i < Math.abs(k); i++) { p *= f.p; q *= f.q; }
  return k >= 0 ? frac(p, q) : frac(q, p);
}

/** aⁿ точно или null, если n не кратно m. */
function pow(b, n) {
  if (n % b.m !== 0) { return null; }
  return powInt(b.r, n / b.m);
}

/** Сколько знаков после запятой у конечной дроби; Infinity — бесконечная. */
function places(f) {
  if (!decimalFriendly(f)) { return Infinity; }
  var n = 0;
  var v = Math.abs(num(f));
  while (Math.abs(v - Math.round(v)) > 1e-9 && n < 12) { v *= 10; n++; }
  return n;
}

/** Ключ числа для сравнений и словарей. */
function key(f) { return String(Math.round(num(f) * 1e9) / 1e9); }

/** Число в условие: запятая и типографский минус. */
function valueText(f) {
  var sign = f.p < 0 ? MINUS : '';
  return sign + String(Math.abs(Math.round(num(f) * 1e9) / 1e9)).replace('.', ',');
}

/** Число в формулу TeX: конечная дробь — с запятой, иначе дробью. */
function tex(f) {
  if (decimalFriendly(f)) {
    return String(Math.round(num(f) * 1e9) / 1e9).replace('.', '{,}');
  }
  return (f.p < 0 ? '-' : '') + '\\dfrac{' + Math.abs(f.p) + '}{' + f.q + '}';
}

/** Основание в формулу: 2, \dfrac{1}{3}, \sqrt{2}, \dfrac{1}{\sqrt{3}}. */
function baseTex(b) {
  if (b.m === 1) { return isInt(b.r) ? String(b.r.p) : '\\dfrac{' + b.r.p + '}{' + b.r.q + '}'; }
  if (isInt(b.r)) { return '\\sqrt{' + b.r.p + '}'; }
  if (b.r.p === 1) { return '\\dfrac{1}{\\sqrt{' + b.r.q + '}}'; }
  return '\\sqrt{\\dfrac{' + b.r.p + '}{' + b.r.q + '}}';
}

/** Основание в степени: дробь и корень берутся в скобки. */
function baseInPower(b) {
  return b.m === 1 && isInt(b.r) ? baseTex(b) : '\\left(' + baseTex(b) + '\\right)';
}

/** Основание обычным текстом для условия и подписи ответа. */
function baseText(b) {
  if (b.m === 1) { return isInt(b.r) ? String(b.r.p) : b.r.p + '/' + b.r.q; }
  return isInt(b.r) ? '√' + b.r.p : '1/√' + b.r.q;
}

/** Ключ основания: одно и то же основание в наборе узнаётся по нему. */
function baseKey(b) { return b.r.p + '/' + b.r.q + '^1/' + b.m; }

/** Точная запись основания для meta задачи. */
function baseMeta(b) { return { r: { p: b.r.p, q: b.r.q }, m: b.m }; }

function fromMeta(meta) { return { r: frac(meta.r.p, meta.r.q), m: meta.m }; }

const api = {
  base: base, value: value, growing: growing, powInt: powInt, pow: pow, places: places,
  key: key, valueText: valueText, tex: tex, baseTex: baseTex, baseInPower: baseInPower,
  baseText: baseText, baseKey: baseKey, baseMeta: baseMeta, fromMeta: fromMeta, MINUS: MINUS
};

export default api;
export { base, value, growing, powInt, pow, places, key, valueText, tex, baseTex, baseInPower,
         baseText, baseKey, baseMeta, fromMeta, MINUS };
