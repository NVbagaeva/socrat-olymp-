/**
 * Строительные блоки разборов задания №7.
 *
 * Разбор любого прототипа — одни и те же подписанные этапы (алгоритм из
 * теории «Как решать любое уравнение №7»):
 *   1) тип уравнения и план;
 *   2) ОДЗ — у дробных, иррациональных и логарифмических;
 *   3) преобразования с пояснением, почему переход можно сделать;
 *   4) корни;
 *   5) отбор — по ОДЗ, по условию $x\ge0$, «меньший», «наименьший
 *      положительный»;
 *   6) проверка подстановкой и ответ.
 * Этапов 2 и 5 бывает не у всех уравнений — тогда номера сдвигаются сами.
 *
 * Числа — точные обыкновенные дроби модуля задания №11 (запись с
 * запятой), вопрос-подсказка с кнопками — оттуда же; панель «Считаем с
 * умом» с признаками делимости — из задания №10.
 */

import { bezEdinic, sokrashchenie } from '../zadanie10/kit';
import { vopros } from '../zadanie11/kit';
import { priznak } from '../zadanie11/proporciya/sokrashchenie';
import { add, d, div, fq, gcd, mul, nice, q, sub, val, type Q } from '../zadanie11/num';
import type { CalcLine, Etap, HintStep, Params, Vopros } from './types';

export { add, d, div, fq, gcd, mul, q, sub, val, vopros, type Q };

/* ── Параметры ──────────────────────────────────────────────────── */

export function num(p: Params, key: string): number {
  const v = p[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new Error(`параметр ${key}: ожидалось число, пришло ${String(v)}`);
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

/** Порядок слагаемых в записи ФИПИ: «3x−4» (xb) или «32−x» (bx). */
export type Poryadok = 'xb' | 'bx';

export function por(p: Params, key = 'por'): Poryadok {
  return str(p, key, ['xb', 'bx'] as const);
}

/* ── Запись чисел и выражений ───────────────────────────────────── */

/** Дробь в TeX: целое — числом, конечная десятичная — с запятой, иначе \dfrac. */
export function t(x: Q): string {
  return fq(x, true);
}

/** Дробь в TeX в скобках, если отрицательная: (−1,3). */
export function tk(x: Q): string {
  return x.n < 0 ? `(${t(x)})` : t(x);
}

/** Число в TeX в скобках, если отрицательное. */
export function sk(x: number): string {
  return x < 0 ? `(${d(x)})` : d(x);
}

/** Конечная десятичная дробь (не длиннее четырёх знаков). */
export function konechnaya(x: Q): boolean {
  return nice(val(x), 4);
}

/** Дробный коэффициент перед буквой: целый — как koef, иначе десятичной дробью. */
export function koefQ(k: Q, v: string): string {
  return k.m === 1 ? koef(k.n, v) : `${t(k)}${v}`;
}

/** Коэффициент перед буквой: 1 → «», −1 → «-», 3 → «3». */
export function koef(k: number, v: string): string {
  if (k === 1) {
    return v;
  }
  if (k === -1) {
    return `-${v}`;
  }
  return `${d(k)}${v}`;
}

/**
 * Линейное выражение kx + b в TeX: «3x-4», «-x+7», «32-x», «-2+3x», «x».
 * `por` — порядок слагаемых, как в условии.
 */
export function lin(k: number, b: number, x = 'x', poryadok: Poryadok = 'xb'): string {
  if (k === 0) {
    return d(b);
  }
  if (b === 0) {
    return koef(k, x);
  }
  if (poryadok === 'bx') {
    const kx = k < 0 ? `-${koef(-k, x)}` : `+${koef(k, x)}`;
    return `${d(b)}${kx}`;
  }
  return `${koef(k, x)}${b < 0 ? '-' : '+'}${d(Math.abs(b))}`;
}

/** Нужны ли скобки вокруг линейного выражения в показателе/аргументе: только если это не одно слагаемое. */
export function linSk(k: number, b: number, x = 'x', poryadok: Poryadok = 'xb'): string {
  const s = lin(k, b, x, poryadok);
  return k === 0 || b === 0 ? s : `(${s})`;
}

/**
 * Подстановка числа вместо x в kx + b: «3\cdot1{,}4-4», «32-5»,
 * «2+5» (вместо «2-(-5)»). Без «+ −» и «−(−».
 */
export function podst(k: number, b: number, x: Q, poryadok: Poryadok = 'xb'): string {
  const xs = t(x);
  const xAbs = t(q(Math.abs(x.n), x.m));
  /* Член kx со знаком; first — стоит ли первым. */
  const chlen = (first: boolean): string => {
    if (k === 1) {
      if (x.n < 0) {
        return first ? xs : `-${xAbs}`;
      }
      return first ? xs : `+${xs}`;
    }
    if (k === -1) {
      if (x.n < 0) {
        return first ? xAbs : `+${xAbs}`;
      }
      return `-${xs}`;
    }
    const body = `${d(Math.abs(k))}\\cdot${tk(x)}`;
    if (k < 0) {
      return `-${body}`;
    }
    return first ? body : `+${body}`;
  };
  if (b === 0) {
    return chlen(true);
  }
  if (poryadok === 'bx') {
    return `${d(b)}${chlen(false)}`;
  }
  return `${chlen(true)}${b < 0 ? '-' : '+'}${d(Math.abs(b))}`;
}

/** Значение kx + b. */
export function linVal(k: number, b: number, x: Q): Q {
  return add(mul(q(k), x), q(b));
}

/** Корень линейного уравнения kx + b = c: x = (c − b)/k. */
export function linKoren(k: number, b: number, c: Q): Q {
  return div(sub(c, q(b)), q(k));
}

/** Перенос: «kx + b = c → kx = c − b» строками разбора. */
export function linReshenie(k: number, b: number, c: Q, por: Poryadok = 'xb', x = 'x'): string[] {
  const kx = koef(k, x);
  const prav = sub(c, q(b));
  const out: string[] = [];
  if (b !== 0) {
    const perenos =
      b > 0
        ? `переносим $${d(b)}$ в правую часть с противоположным знаком`
        : `переносим $${d(b)}$ в правую часть с противоположным знаком — получится $+${d(-b)}$`;
    out.push(
      `Решаем линейное уравнение $${lin(k, b, x, por)}=${t(c)}$: ${perenos}: $${kx}=${t(c)}${b > 0 ? '-' : '+'}${d(Math.abs(b))}$, то есть $${kx}=${t(prav)}$.`,
    );
  }
  if (k !== 1) {
    const x0 = div(prav, q(k));
    out.push(
      k === -1
        ? `Меняем знаки обеих частей: $${x}=${t(x0)}$.`
        : `Делим обе части на $${d(k)}$: $${x}=${dr(prav, q(k))}=${t(x0)}$.`,
    );
  }
  return out;
}

/** Частное двух дробей в TeX: «\dfrac{4{,}2}{3}» или «\dfrac{-6{,}5}{5}». */
export function dr(a: Q, b: Q): string {
  return `\\dfrac{${t(a)}}{${t(b)}}`;
}

/* ── Этапы разбора ──────────────────────────────────────────────── */

export const ETAPY = {
  plan: 'Тип уравнения и план',
  odz: 'ОДЗ',
  preobr: 'Преобразования',
  korni: 'Корни',
  otbor: 'Отбор корней',
  proverka: 'Проверка подстановкой',
} as const;

export interface RazborInput {
  plan: string[];
  odz?: string[];
  preobr: string[];
  korni: string[];
  otbor?: string[];
  proverka: string[];
  answer: number;
}

/** Последняя строка разбора: «**Ответ:** $−1{,}3$.» */
export function otvet(x: number): string {
  return `**Ответ:** $${d(x)}$.`;
}

export function razbor(r: RazborInput): Etap[] {
  const items: Array<[string, string[]]> = [[ETAPY.plan, r.plan]];
  if (r.odz && r.odz.length > 0) {
    items.push([ETAPY.odz, r.odz]);
  }
  items.push([ETAPY.preobr, r.preobr], [ETAPY.korni, r.korni]);
  if (r.otbor && r.otbor.length > 0) {
    items.push([ETAPY.otbor, r.otbor]);
  }
  items.push([ETAPY.proverka, [...r.proverka, otvet(r.answer)]]);
  return items.map(([title, lines], i) => ({ title: `Шаг ${i + 1}. ${title}`, lines }));
}

/* ── Условия ────────────────────────────────────────────────────── */

export const VOPROSY: Record<Vopros, string> = {
  koren: '',
  menshiy: 'Если уравнение имеет более одного корня, в ответе запишите меньший из них.',
  bolshiy: 'Если уравнение имеет более одного корня, в ответе запишите больший из них.',
  minPol: 'В ответе запишите наименьший положительный корень.',
  maxOtr: 'В ответе запишите наибольший отрицательный корень.',
};

/** Текст условия: «Найдите корень уравнения $…$.» или «Решите уравнение $…$. Если …». */
export function uslovieTekst(uravnenie: string, v: Vopros): string {
  if (v === 'koren') {
    return `Найдите корень уравнения $${uravnenie}$.`;
  }
  return `Решите уравнение $${uravnenie}$. ${VOPROSY[v]}`;
}

/** Вопрос по параметру `v` (у прототипов, где спрашивают по-разному). */
export function voprosIz(p: Params, allowed: readonly Vopros[]): Vopros {
  return str(p, 'v', allowed);
}

/* ── Подсказки ──────────────────────────────────────────────────── */

export function hint(question: string, right: string, wrong: string[], comment?: string): HintStep {
  return vopros(question, right, wrong, comment);
}

/** Последняя подсказка «что записать в ответ», если спрашивают не просто корень. */
export function hintOtbor(v: Vopros, right: string, wrong: string[], comment?: string): HintStep {
  const q: Record<Vopros, string> = {
    koren: 'Какой корень записать в ответ?',
    menshiy: 'Корней два. Какой записать в ответ?',
    bolshiy: 'Корней два. Какой записать в ответ?',
    minPol: 'Какой корень — наименьший положительный?',
    maxOtr: 'Какой корень — наибольший отрицательный?',
  };
  return vopros(q[v], right, wrong, comment);
}

/* ── «Считаем с умом» ───────────────────────────────────────────── */

/**
 * Деление a : b с умным сокращением и признаками делимости: обе дроби
 * переводятся в целые, знак — отдельной строкой.
 */
export function vychDelenie(a: Q, b: Q, x = 'x'): CalcLine[] {
  const res = div(a, b);
  /* |a|/|b| = N/D в целых числах. */
  const N = Math.abs(a.n) * b.m;
  const D = a.m * Math.abs(b.n);
  if (res.n === 0 || D === 1 || N === D) {
    return [];
  }
  const out: CalcLine[] = [];
  if (res.n < 0) {
    out.push({
      tekst: 'Знаки делимого и делителя разные — ответ отрицательный; считаем без знака.',
    });
  }
  const aAbs = q(Math.abs(a.n), a.m);
  const bAbs = q(Math.abs(b.n), b.m);
  if (a.m !== 1 || b.m !== 1) {
    out.push({
      tekst:
        konechnaya(aAbs) && konechnaya(bAbs)
          ? 'Избавляемся от запятой: умножаем делимое и делитель на одно и то же число — частное не меняется.'
          : 'Делим дроби: умножаем на перевёрнутую, получаем дробь из целых чисел.',
      tex: `${t(aAbs)}:${t(bAbs)}=\\dfrac{${d(N)}}{${d(D)}}`,
    });
  }
  if (D <= 12 && N % D === 0) {
    const pr = N >= 10 ? priznak(N, D) : null;
    out.push({
      tekst: pr ? `Проверяем: ${pr}.` : `Делим: $${d(N)}:${d(D)}=${d(N / D)}$.`,
      tex: `${x}=${d(N / D)}`,
    });
  } else {
    out.push(...sokrashchenie([N], D, x));
  }
  if (res.n < 0) {
    out.push({ tekst: 'Ставим знак минус:', tex: `${x}=${t(res)}` });
  }
  return out;
}

/** НОД для подписи «делим на общий множитель». */
export { gcd as nod };

/* ── Степени ────────────────────────────────────────────────────── */

/** Целая степень рационального числа. */
export function powQ(x: Q, k: number): Q {
  let r = q(1);
  for (let i = 0; i < Math.abs(k); i += 1) {
    r = mul(r, x);
  }
  return k < 0 ? q(r.m, r.n) : r;
}

/** Точный целый корень n-й степени из целого (с учётом знака у нечётной степени) или null. */
export function korenN(a: number, n: number): number | null {
  if (a < 0) {
    if (n % 2 === 0) {
      return null;
    }
    const r = korenN(-a, n);
    return r === null ? null : -r;
  }
  const c = Math.round(a ** (1 / n));
  for (const s of [c - 1, c, c + 1]) {
    if (s >= 0 && s ** n === a) {
      return s;
    }
  }
  return null;
}

/** Показатель: a = b^k → k (b > 1), иначе null. */
export function pokazatel(a: number, b: number): number | null {
  if (a < 1 || b < 2) {
    return null;
  }
  let k = 0;
  let m = a;
  while (m > 1 && m % b === 0) {
    m /= b;
    k += 1;
  }
  return m === 1 ? k : null;
}

/** Степень в TeX: «2^5», «3», «(-2)^3». */
export function stepenTex(a: number, k: number): string {
  if (k === 1) {
    return d(a);
  }
  return `${a < 0 ? `(${d(a)})` : d(a)}^{${d(k)}}`.replace(/\^\{(\d)\}/, '^$1');
}

/** a^k как число: 2^5 = 32. */
export function stepenZnach(a: number, k: number): number {
  return a ** k;
}

/** Строка «$2^5=32$» для пояснения, что число — степень. */
export function kakStepen(n: number, a: number, k: number): string {
  return k === 1 ? `$${d(n)}=${d(a)}$` : `$${d(n)}=${stepenTex(a, k)}$`;
}

/** Близость чисел для численной проверки. */
export function blizko(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
}

/* ── Чистка знаков ──────────────────────────────────────────────── */

/** Число в TeX: цифры, запятая «{,}», тонкие пробелы «\,», дробь \dfrac{…}{…}. */
const CHISLO = String.raw`(?:\\dfrac\{\d+(?:\{,\}\d+)?\}\{\d+(?:\{,\}\d+)?\}|\d+(?:\\,\d{3})*(?:\{,\}\d+)?)`;

/**
 * Склейка знаков после подстановок: «+−» → «−», «−−» → «+», «−(−3)» → «+3»,
 * «+(−3)» → «−3» (кроме степени и умножения: «(−3)^2», «(−3)\cdot2» не трогаем).
 */
export function chistoTex(tex: string): string {
  let s = tex;
  for (let i = 0; i < 3; i += 1) {
    s = s
      .replace(/\+\s*-/g, '-')
      .replace(/-\s*-/g, '+')
      .replace(/-\s*\+/g, '-')
      .replace(new RegExp(String.raw`-\(-(${CHISLO})\)(?![\^\\]|\{)`, 'g'), '+$1')
      .replace(new RegExp(String.raw`\+\(-(${CHISLO})\)(?![\^\\]|\{)`, 'g'), '-$1')
      .replace(/([=(,{])\+/g, '$1')
      .replace(/^\+/, '');
  }
  return bezEdinic(s);
}

/** Пройтись по всем формулам строки. */
export function chistaya(s: string): string {
  return s.replace(/\$([^$]+)\$/g, (_m, f: string) => `$${chistoTex(f)}$`);
}

/* ── Углы через π ───────────────────────────────────────────────── */

/** Угол t·π в TeX: 1/6 → «\dfrac{\pi}{6}», −5/6 → «-\dfrac{5\pi}{6}», 2 → «2\pi». */
export function piTex(tq: Q): string {
  if (tq.n === 0) {
    return '0';
  }
  const sign = tq.n < 0 ? '-' : '';
  const n = Math.abs(tq.n);
  if (tq.m === 1) {
    return `${sign}${n === 1 ? '' : d(n)}\\pi`;
  }
  return `${sign}\\dfrac{${n === 1 ? '' : d(n)}\\pi}{${d(tq.m)}}`;
}

/* ── Линейное уравнение с x в обеих частях ─────────────────────── */

/** k1·x + b1 = k2·x + b2 строками разбора. */
export function linOboih(k1: number, b1: number, k2: number, b2: number): string[] {
  if (k2 === 0) {
    return linReshenie(k1, b1, q(b2));
  }
  const kx = k1 - k2;
  const pr = b2 - b1;
  if (kx === 0) {
    throw new Error('коэффициенты при x совпали');
  }
  const prav = b1 === 0 ? d(b2) : b2 === 0 ? `-${d(b1)}` : `${d(b2)}-${d(b1)}`;
  const out = [
    `Слагаемые с $x$ — влево, числа — вправо (при переносе знак меняется): $${koef(k1, 'x')}-${koef(k2, 'x')}=${prav}$, то есть $${koef(kx, 'x')}=${d(pr)}$.`,
  ];
  if (kx !== 1) {
    const x = q(pr, kx);
    out.push(
      kx === -1
        ? `Меняем знаки: $x=${t(x)}$.`
        : `Делим обе части на $${d(kx)}$: $x=${dr(q(pr), q(kx))}=${t(x)}$.`,
    );
  }
  return out;
}

/** Степень в TeX с любым показателем: «7^{x-2}», «6^x», «6» (показатель 1). */
export function pw(base: string, exp: string): string {
  if (exp === '1') {
    return base;
  }
  return exp.length === 1 ? `${base}^${exp}` : `${base}^{${exp}}`;
}

/** Множитель перед скобкой: 1 → «», −1 → «-», 2 → «2». */
export function mnozh(e: number, expr: string, odnoSlagaemoe: boolean): string {
  if (e === 1) {
    return expr;
  }
  if (odnoSlagaemoe) {
    return `${e === -1 ? '-' : d(e)}${expr}`;
  }
  return `${e === -1 ? '-' : d(e)}(${expr})`;
}
