/**
 * Строительные блоки разборов задания №10.
 *
 * Разбор любого прототипа — одни и те же подписанные этапы (алгоритм
 * из теории «Как решать прикладную задачу»):
 *   1) что дано — величины с единицами;
 *   2) что ищем и что подставляем;
 *   3) решаем уравнение или неравенство;
 *   4) выбираем корень по смыслу;
 *   5) переводим единицы;
 *   6) проверка здравым смыслом.
 * Этапы 4 и 5 бывают не у всех задач — тогда номера сдвигаются сами.
 *
 * Числа и дроби — из модуля задания №11 (точный счёт обыкновенными
 * дробями, запись с запятой), вопрос-подсказка с кнопками — оттуда же.
 */

import { poly, vopros } from '../zadanie11/kit';
import { d, fq, gcd, isqrt, lcm, mul, q, val, type Q } from '../zadanie11/num';
import { sokratit } from '../zadanie11/proporciya/sokrashchenie';
import type { CalcLine, DanoRow, Etap, HintStep, Params } from './types';

export { d, fq, poly, q, val, vopros, type Q };

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

/** Десятичное число как точная дробь: 0,0043 → 43/10000. */
export function dq(x: number): Q {
  return q(x);
}

/* ── «Дано» ─────────────────────────────────────────────────────── */

export function dano(oboz: string, znach: number | string, ed: string, smysl: string): DanoRow {
  return { oboz, znach: typeof znach === 'number' ? d(znach) : znach, ed, smysl };
}

/**
 * Знак между буквой и значением: «=», а у условия-неравенства
 * («не менее 16,2 с» → значение `\ge16{,}2`) — сам знак неравенства,
 * без лишнего «=»: $t\ge16{,}2$, а не $t=\ge16{,}2$.
 */
export function oboznachenie(r: DanoRow): string {
  return /^(\\(ge|le|geq|leq|geqslant|leqslant)(?![a-zA-Z])|[<>])/.test(r.znach)
    ? `${r.oboz}${r.znach}`
    : `${r.oboz}=${r.znach}`;
}

/** Строка «Дано» для этапа 1: «$v_0=24$ м/с — начальная скорость». */
export function danoLine(r: DanoRow): string {
  return `$${oboznachenie(r)}$${r.ed ? ` ${r.ed}` : ''} — ${r.smysl}`;
}

/* ── Этапы ──────────────────────────────────────────────────────── */

export const ETAPY = {
  dano: 'Что дано',
  ishchem: 'Что ищем и что подставляем',
  uravnenie: 'Решаем уравнение',
  neravenstvo: 'Решаем неравенство',
  vychislyaem: 'Считаем',
  koren: 'Выбираем корень по смыслу',
  edinicy: 'Переводим единицы',
  proverka: 'Проверка здравым смыслом',
} as const;

export interface RazborInput {
  dano: DanoRow[];
  ishchem: string[];
  /** Заголовок этапа 3: уравнение, неравенство или просто счёт. */
  vid: 'uravnenie' | 'neravenstvo' | 'vychislyaem';
  reshaem: string[];
  koren?: string[];
  edinicy?: string[];
  proverka: string[];
  answer: number;
  /** Единицы ответа для последней строки: «с». */
  ed: string;
}

/** Последняя строка разбора: «**Ответ:** $6$.» */
export function otvet(x: number): string {
  return `**Ответ:** $${d(x)}$.`;
}

export function razbor(r: RazborInput): Etap[] {
  const items: Array<[string, string[]]> = [
    [ETAPY.dano, r.dano.map(danoLine)],
    [ETAPY.ishchem, r.ishchem],
    [ETAPY[r.vid], r.reshaem],
  ];
  if (r.koren && r.koren.length > 0) {
    items.push([ETAPY.koren, r.koren]);
  }
  if (r.edinicy && r.edinicy.length > 0) {
    items.push([ETAPY.edinicy, r.edinicy]);
  }
  items.push([ETAPY.proverka, [...r.proverka, otvet(r.answer)]]);
  return items.map(([title, lines], i) => ({ title: `Шаг ${i + 1}. ${title}`, lines }));
}

/* ── Подсказки ──────────────────────────────────────────────────── */

export function chtoNayti(right: string, wrong: string[]): HintStep {
  return vopros('Что нужно найти?', right, wrong);
}

export function vKakihEdinicah(right: string, wrong: string[], comment?: string): HintStep {
  return vopros('В каких единицах нужно записать ответ?', right, wrong, comment);
}

/* ── Числа ──────────────────────────────────────────────────────── */

/** Число в TeX в скобках, если оно отрицательное: (−0,74). */
export function sk(x: number): string {
  return x < 0 ? `(${d(x)})` : d(x);
}

/** Дробь в TeX в скобках, если отрицательная. */
export function skq(x: Q): string {
  return x.n < 0 ? `(${fq(x, true)})` : fq(x, true);
}

/** Целый корень степени k из рационального числа или null. */
export function korenQ(x: Q, k: number): Q | null {
  const r = (n: number): number | null => {
    if (n < 0) {
      return null;
    }
    const c = Math.round(n ** (1 / k));
    for (const t of [c - 1, c, c + 1]) {
      if (t >= 0 && t ** k === n) {
        return t;
      }
    }
    return null;
  };
  const top = r(x.n);
  const bottom = r(x.m);
  return top === null || bottom === null ? null : q(top, bottom);
}

/** Степень двойки: 8 → 3, 1/4 → −2; не степень — null. */
export function log2Q(x: Q): number | null {
  const e = (n: number): number | null => {
    let k = 0;
    let m = n;
    while (m > 1 && m % 2 === 0) {
      m /= 2;
      k += 1;
    }
    return m === 1 ? k : null;
  };
  if (x.n <= 0) {
    return null;
  }
  const a = e(x.n);
  const b = e(x.m);
  return a === null || b === null ? null : a - b;
}

export function powQ(x: Q, k: number): Q {
  let r = q(1);
  for (let i = 0; i < Math.abs(k); i += 1) {
    r = mul(r, x);
  }
  return k < 0 ? q(r.m, r.n) : r;
}

/* ── Квадратное уравнение с дробными коэффициентами ──────────────── */

export interface KvadratQ {
  lines: string[];
  roots: [Q, Q];
  /** Уравнение с целыми коэффициентами (TeX без $). */
  tex: string;
}

/** Коэффициент перед буквой: 1 → «», −1 → «-», 2,5 → «2{,}5». */
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
 * Решить A·x² + B·x + C = 0 с рациональными коэффициентами: умножаем
 * на общий знаменатель (если нужно), делаем старший коэффициент
 * положительным, делим на общий множитель, дальше — дискриминант.
 */
export function kvadratQ(A: Q, B: Q, C: Q, x = 't'): KvadratQ {
  const lines: string[] = [];
  const den = lcm(lcm(A.m, B.m), C.m);
  let a = (A.n * den) / A.m;
  let b = (B.n * den) / B.m;
  let c = (C.n * den) / C.m;
  if (den > 1) {
    lines.push(
      `Избавимся от дробных коэффициентов — умножим обе части на $${d(den)}$: $${poly(a, b, c, x)}=0$.`,
    );
  }
  if (a < 0) {
    a = -a;
    b = -b;
    c = -c;
    lines.push(
      `Умножим на $-1$, чтобы старший коэффициент был положительным: $${poly(a, b, c, x)}=0$.`,
    );
  }
  const g = gcd(gcd(a, b), c);
  if (g > 1) {
    a /= g;
    b /= g;
    c /= g;
    lines.push(`Делим обе части на $${d(g)}$: $${poly(a, b, c, x)}=0$.`);
  }
  const tex = `${poly(a, b, c, x)}=0`;
  const D = b * b - 4 * a * c;
  const sqrtD = isqrt(D);
  if (sqrtD === null) {
    throw new Error(`дискриминант не квадрат: ${tex}, D=${D}`);
  }
  const b2 = b < 0 ? `(${d(b)})^2` : `${d(b)}^2`;
  const ac =
    a === 1
      ? c < 0
        ? `(${d(c)})`
        : d(c)
      : c === 1
        ? d(a)
        : `${d(a)}\\cdot${c < 0 ? `(${d(c)})` : d(c)}`;
  lines.push(`$D=${b2}-4\\cdot${ac}=${d(D)}$${sqrtD > 0 ? `, $\\sqrt{D}=${d(sqrtD)}$` : ''}.`);
  const r1 = q(-b - sqrtD, 2 * a);
  const r2 = q(-b + sqrtD, 2 * a);
  if (sqrtD === 0) {
    lines.push(`Корень один: $${x}=\\dfrac{${d(-b)}}{${d(2 * a)}}=${fq(r1, true)}$.`);
  } else {
    lines.push(
      `$${x}_1=\\dfrac{${d(-b)}-${d(sqrtD)}}{${d(2 * a)}}=${fq(r1, true)}$, $${x}_2=\\dfrac{${d(-b)}+${d(sqrtD)}}{${d(2 * a)}}=${fq(r2, true)}$.`,
    );
  }
  return { lines, roots: [r1, r2], tex };
}

/** Проверка, что квадратное уравнение решается в рациональных числах. */
export function kvadratRacionalno(A: Q, B: Q, C: Q): boolean {
  const den = lcm(lcm(A.m, B.m), C.m);
  const a = (A.n * den) / A.m;
  const b = (B.n * den) / B.m;
  const c = (C.n * den) / C.m;
  const D = b * b - 4 * a * c;
  return D >= 0 && isqrt(D) !== null;
}

/* ── Панель «Считаем с умом» ────────────────────────────────────── */

/**
 * Значение дроби (n₁·n₂·…)/m с умным сокращением и признаками
 * делимости — шаги решателя пропорций №11.
 */
export function sokrashchenie(ch: number[], zn: number, x: string): CalcLine[] {
  const s = sokratit(ch, zn, x);
  return s.shagi.map((sh) => {
    const tekst = sh.tekst.replace(/\$([^$]+)\$/g, (_m, f: string) => `$${bezEdinic(f)}$`);
    return sh.tex ? { tekst, tex: bezEdinic(sh.tex) } : { tekst };
  });
}

/** Десятичную дробь превратить в целое умножением на 10ᵏ: 0,0043 → [43, 10000]. */
export function celoe(x: number): [number, number] {
  const r = q(x);
  return [r.n, r.m];
}

/** НОД для подписи «делим на общий множитель». */
export { gcd };

/**
 * Убрать множители 1 после сокращения: «1\cdot54» → «54»,
 * «\dfrac{1\cdot\cancel{12}^{\,4}}{…}» → «\dfrac{\cancel{12}^{\,4}}{…}»,
 * и склеить повторы «=4=4».
 */
export function bezEdinic(tex: string): string {
  let t = tex
    .replace(/\{1\\cdot/g, '{')
    .replace(/(?<![\d}^_{,.])1\\cdot/g, '')
    .replace(/\\cdot1(?![\d{,.])/g, '')
    .replace(/(?<![\d}^_{,.\\a-zA-Z])1(?=[a-zA-Z]|\\(?:sin|cos|sqrt|pi|alpha|varphi|mathit))/g, '');
  /* «a=b=b» → «a=b». */
  const parts = t.split('=');
  const uniq = parts.filter((p, i) => i === 0 || p !== parts[i - 1]);
  t = uniq.join('=');
  return t;
}

/** Пройтись по всем формулам строки и убрать множители 1. */
export function chistaya(s: string): string {
  return s.replace(/\$([^$]+)\$/g, (_m, f: string) => `$${bezEdinic(f)}$`);
}
