/**
 * Строительные блоки условий и разборов задания №6.
 *
 * Числа решения — точные обыкновенные дроби модуля задания №11 (запись
 * с запятой), вопрос-подсказка с кнопками — оттуда же, панель «Считаем
 * с умом» с признаками делимости — из задания №10. Своих правил
 * сокращения и записи чисел у раздела нет.
 */

import { sokrashchenie } from '../zadanie10/kit';
import { vopros } from '../zadanie11/kit';
import { add, d, div, fq, gcd, mul, nice, q, sub, val, type Q } from '../zadanie11/num';
import type { CalcLine, Etap, Params, StrokaTablicy, Tablica } from './types';

export { add, d, div, fq, gcd, mul, nice, q, sub, val, vopros, type Q };

/* ── Параметры ──────────────────────────────────────────────────── */

export function num(p: Params, key: string): number {
  const v = p[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new Error(`параметр ${key}: ожидалось число, пришло ${String(v)}`);
  }
  return v;
}

export function arr(p: Params, key: string): number[] {
  const v = p[key];
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'number' || !Number.isFinite(x))) {
    throw new Error(`параметр ${key}: ожидался набор чисел, пришло ${String(v)}`);
  }
  return v;
}

export function str<T extends string>(p: Params, key: string, allowed: readonly T[]): T {
  const v = p[key] ?? allowed[0];
  if (typeof v !== 'string' || !allowed.includes(v as T)) {
    throw new Error(
      `параметр ${key}: ожидалось одно из ${allowed.join(', ')}, пришло ${String(v)}`,
    );
  }
  return v as T;
}

export function strOpt(p: Params, key: string): string | undefined {
  const v = p[key];
  return typeof v === 'string' ? v : undefined;
}

/* ── Запись чисел ───────────────────────────────────────────────── */

/** Число в TeX: 0{,}25; 20\,000; −3. */
export function t(x: number): string {
  return d(x);
}

/** Дробь в TeX: целое — числом, конечная — десятичной, иначе \dfrac. */
export function tq(x: Q): string {
  return fq(x, true);
}

/** Дробь в TeX всегда обыкновенной (у 6.13): \dfrac35. */
export function drob(x: Q): string {
  if (x.m === 1) {
    return d(x.n);
  }
  return `${x.n < 0 ? '-' : ''}\\dfrac{${d(Math.abs(x.n))}}{${d(x.m)}}`;
}

/** Число в TeX в скобках, если отрицательное: (−3). */
export function sk(x: number): string {
  return x < 0 ? `(${d(x)})` : d(x);
}

export function skq(x: Q): string {
  return x.n < 0 ? `(${tq(x)})` : tq(x);
}

/** Неразрывный пробел: «20 000», «1,5 млн». */
export const NBSP = ' ';

/** Число для текста условия: 20 000; 0,05; 1700. Тысячи — неразрывным пробелом. */
export function tx(x: number): string {
  const v = Math.round(x * 1e9) / 1e9;
  if (v < 0) {
    throw new Error(`отрицательное число в тексте: ${v} — только в $…$`);
  }
  const [int = '0', frac] = String(v).split('.');
  const grouped = int.length > 4 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) : int;
  return grouped + (frac ? `,${frac}` : '');
}

/** Вероятность из целых долей: n/den. */
export function pq(n: number, den: number): Q {
  return q(n, den);
}

/** Вероятность в TeX десятичной дробью (у 6.13 — обыкновенной). */
export function pt(n: number, den: number, obyknovennaya = false): string {
  return obyknovennaya ? drob(q(n, den)) : tq(q(n, den));
}

/** Сумма дробей. */
export function sumQ(xs: readonly Q[]): Q {
  return xs.reduce((s, x) => add(s, x), q(0));
}

/** Сумма слагаемых TeX: «a+b+c»; отрицательные слагаемые уже в скобках. */
export function plus(terms: readonly string[]): string {
  return terms.join('+');
}

/** Ответ — последняя строка разбора. */
export function otvetLine(x: number): string {
  return `**Ответ:** $${t(x)}$.`;
}

/** Этапы с подписью «Шаг N. …»; null и false пропускаются, номера сдвигаются. */
export function etapy(
  ...items: Array<(Omit<Etap, 'title'> & { t: string }) | null | false>
): Etap[] {
  const out: Etap[] = [];
  for (const it of items) {
    if (!it) {
      continue;
    }
    const { t: title, ...rest } = it;
    out.push({ title: `Шаг ${out.length + 1}. ${title}`, ...rest });
  }
  return out;
}

export function tablica(
  stroki: StrokaTablicy[],
  vydelit?: number[],
  vydelitStroki?: number[],
): Tablica {
  return {
    stroki,
    ...(vydelit && vydelit.length > 0 ? { vydelit } : {}),
    ...(vydelitStroki && vydelitStroki.length > 0 ? { vydelitStroki } : {}),
  };
}

/** Ячейка таблицы: число в формуле (минус и запятая — как в KaTeX). */
export function yach(x: number): string {
  return `$${t(x)}$`;
}

/* ── Панель «Считаем с умом» ────────────────────────────────────── */

/**
 * Значение дроби chislitel/znamenatel с умным сокращением: сначала
 * общие нули на конце (одним шагом, а не десятью по очереди), потом
 * признаки делимости решателя №11.
 */
export function schitaem(chislitel: number, znamenatel: number, imya: string): CalcLine[] {
  const out: CalcLine[] = [];
  let a = Math.abs(chislitel);
  let b = znamenatel;
  let nuley = 0;
  while (a !== 0 && a % 10 === 0 && b % 10 === 0) {
    a /= 10;
    b /= 10;
    nuley += 1;
  }
  if (nuley > 0) {
    const k = 10 ** nuley;
    out.push({
      tekst: `У числителя и знаменателя ${nuley === 1 ? 'один общий нуль' : `общих нулей ${nuley}`} на конце — сокращаем на $${t(k)}$.`,
      tex: `${imya}=\\dfrac{${t(Math.abs(chislitel))}}{${t(znamenatel)}}=\\dfrac{${t(a)}}{${t(b)}}`,
    });
  }
  if (b === 1) {
    const last = out.at(-1);
    if (last?.tex) {
      last.tex = `${last.tex.replace(/=\\dfrac\{[^{}]*\}\{1\}$/, '')}=${t(a)}`;
    }
    return out;
  }
  if (gcd(a, b) === 1 && nice(a / b, 6)) {
    out.push({
      tekst: 'Больше сократить нечего — делим.',
      tex: `${imya}=\\dfrac{${t(a)}}{${t(b)}}=${t(a / b)}`,
    });
    return out;
  }
  return [...out, ...sokrashchenie([a], b, imya)];
}

/** Десятичная дробь как целое и степень десяти: 0,48 → [48, 100]. */
export function celoe(x: Q): [number, number] {
  let n = x.n;
  let m = x.m;
  let k = 1;
  while (!Number.isInteger((n * k) / m) && k < 1e9) {
    k *= 10;
  }
  n = Math.round((n * k) / m);
  m = k;
  return [n, m];
}

/** Деление двух конечных десятичных дробей «как целых»: 0,48 : 0,64 = 48 : 64. */
export function delimDesyatichnye(a: Q, b: Q, imya: string): CalcLine[] {
  const [an, am] = celoe(a);
  const [bn, bm] = celoe(b);
  const m = Math.max(am, bm);
  const A = (an * m) / am;
  const B = (bn * m) / bm;
  const out: CalcLine[] = [];
  if (m > 1) {
    out.push({
      tekst: `Избавляемся от запятых: умножаем числитель и знаменатель на $${t(m)}$.`,
      tex: `${imya}=\\dfrac{${tq(a)}}{${tq(b)}}=\\dfrac{${t(A)}}{${t(B)}}`,
    });
  }
  return [...out, ...schitaem(A, B, imya)];
}

/* ── Слова ──────────────────────────────────────────────────────── */

/** Склонение по числу: 1 точка, 2 точки, 5 точек. */
export function skl(n: number, odin: string, dva: string, pyat: string): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) {
    return pyat;
  }
  if (b > 1 && b < 5) {
    return dva;
  }
  if (b === 1) {
    return odin;
  }
  return pyat;
}

/** Перечень через запятую с «и» в конце: «a, b и c». */
export function iSpisok(items: readonly string[]): string {
  if (items.length <= 1) {
    return items.join('');
  }
  return `${items.slice(0, -1).join(', ')} и ${items.at(-1)}`;
}

/** Целое из дроби (проверка: ответ — конечная десятичная дробь). */
export function konechnaya(x: Q, znakov = 4): boolean {
  return nice(val(x), znakov);
}

/** Произведение в TeX без множителя 1: «200\cdot600», «0{,}25» вместо «1\cdot0{,}25». */
export function umn(a: string, b: string): string {
  if (a === '1') {
    return b;
  }
  if (b === '1') {
    return a;
  }
  return `${a}\\cdot${b}`;
}

/** Ячейка текста таблицы: положительное — обычным текстом, отрицательное — формулой. */
export function cell(x: number): string {
  return x < 0 ? `$${t(x)}$` : tx(x);
}

/**
 * Неверные числовые ответы подсказки: разные и не равные верному. Если
 * ловушек не хватает (у симметричного распределения $\mathrm{M}(X^2)$ и
 * среднее значений совпадают с ответом), добавляются запасные: вдвое
 * больше, на единицу больше и меньше.
 */
export function lovushki(verno: Q, kandidaty: readonly Q[], fmt: (x: Q) => string = tq): string[] {
  const pravilno = fmt(verno);
  const zapas = [mul(verno, q(2)), add(verno, q(1)), sub(verno, q(1)), add(verno, q(1, 2))];
  const out: string[] = [];
  for (const x of [...kandidaty, ...zapas]) {
    const s = `$${fmt(x)}$`;
    if (s !== `$${pravilno}$` && !out.includes(s)) {
      out.push(s);
    }
    if (out.length >= 3) {
      break;
    }
  }
  return out;
}
