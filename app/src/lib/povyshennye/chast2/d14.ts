/**
 * №14 (варианты 7–8): показательное уравнение с f = sin²(kx) или
 * cos²(kx) в показателе:
 *
 *   A^{f} ± A^{p+f} = B^{f} ± B^{q+f}  ⇔  A^f(A^p ± 1) = B^f(B^q ± 1)
 *   ⇔  (A/B)^f = K,  K = (B^q ± 1)/(A^p ± 1).
 *
 * Числа подобраны так, что K = (A/B)^t, t ∈ {0, ½, 1}; функция
 * y = (A/B)^f монотонна, поэтому f = t, дальше — простейшее
 * тригонометрическое уравнение и отбор корней серии x = π(a + bn).
 */

import { add, cmp, div, mul, rat, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { piTex, ratTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

type Dr = readonly [number, number];
const R = (d: Dr) => rat(d[0], d[1]);

export interface PD14 {
  A: number;
  B: number;
  p: number;
  q: number;
  /** Знак при A^{p+f} (у образца «+», в «минус»-виде — A^{p+f} − A^{f}). */
  sA: 1 | -1;
  sB: 1 | -1;
  f: 'sin' | 'cos';
  k: number;
  /** Отрезок пункта б: [lo·π; hi·π]. */
  lo: Dr;
  hi: Dr;
}

/** t: K = (A/B)^t, t ∈ {0, ½, 1}; null — не подходит. */
export function tD14(p: PD14): Rat | null {
  const K = rat(p.B ** p.q + p.sB, p.A ** p.p + p.sA);
  const ab = rat(p.A, p.B);
  if (cmp(K, rat(1)) === 0) return rat(0);
  if (cmp(K, ab) === 0) return rat(1);
  if (cmp(mul(K, K), ab) === 0) return rat(1, 2);
  return null;
}

/** Серия x = π(a + b·n): a, b — дроби. */
export interface Seriya {
  a: Rat;
  b: Rat;
}

/** Серия корней f = t: sin²(kx) = 1 ⇔ cos²(kx) = 0 и т. д. */
export function seriyaD14(p: PD14, t: Rat): Seriya {
  const half = cmp(t, rat(1, 2)) === 0;
  /* «Синус в квадрате = 1» ⇔ kx = π/2 + πn; «= 0» ⇔ kx = πn. */
  const sinKv = p.f === 'sin' ? t : sub(rat(1), t);
  if (half) return { a: rat(1, 4 * p.k), b: rat(1, 2 * p.k) };
  if (cmp(sinKv, rat(1)) === 0) return { a: rat(1, 2 * p.k), b: rat(1, p.k) };
  return { a: rat(0), b: rat(1, p.k) };
}

/** «\dfrac{\pi}{6}+\dfrac{\pi n}{3}», «\dfrac{2\pi n}{3}», «\pi n». */
export function seriyaTex(s: Seriya, bukva = 'n'): string {
  const b = s.b;
  const nb = b.n === 1n ? `\\pi ${bukva}` : `${b.n}\\pi ${bukva}`;
  const per = b.d === 1n ? nb : `\\dfrac{${nb}}{${b.d}}`;
  return s.a.n === 0n ? per : `${piTex(s.a)}+${per}`;
}

/** Корни серии на отрезке [lo; hi] (в долях π): номера n и значения. */
export function otborD14(s: Seriya, lo: Rat, hi: Rat): { n: number; x: Rat }[] {
  const out: { n: number; x: Rat }[] = [];
  const nLo = Math.ceil(toNumber(div(sub(lo, s.a), s.b)) - 1e-12);
  const nHi = Math.floor(toNumber(div(sub(hi, s.a), s.b)) + 1e-12);
  for (let n = nLo; n <= nHi; n += 1) out.push({ n, x: add(s.a, mul(s.b, rat(n))) });
  return out;
}

const stepTex = (osn: number, sdvig: number, f: string) =>
  `${osn}^{${sdvig === 0 ? f : `${sdvig}+${f}`}}`;

function storona(osn: number, sdvig: number, s: 1 | -1, f: string): string {
  return s > 0
    ? `${stepTex(osn, 0, f)}+${stepTex(osn, sdvig, f)}`
    : `${stepTex(osn, sdvig, f)}-${stepTex(osn, 0, f)}`;
}

function sobrat(p: PD14): Chast2Zadacha {
  const t = tD14(p);
  if (t === null || p.A === p.B) throw new Error('d14: K не степень A/B');
  const fTex = `\\${p.f}^2${p.k === 1 ? 'x' : `${p.k}x`}`;
  const ur = `${storona(p.A, p.p, p.sA, fTex)}=${storona(p.B, p.q, p.sB, fTex)}`;
  const lo = R(p.lo);
  const hi = R(p.hi);
  const uslovie =
    `а) Решите уравнение $${ur}$.\n` +
    `б) Найдите все корни этого уравнения, принадлежащие отрезку $\\left[${piTex(lo)};\\ ${piTex(hi)}\\right]$.`;
  const s = seriyaD14(p, t);
  const ser = seriyaTex(s);
  const otb = otborD14(s, lo, hi);
  if (otb.length === 0) throw new Error('d14: на отрезке нет корней');
  const vTex = otb.map((o) => piTex(o.x));
  const cA = p.A ** p.p + p.sA;
  const cB = p.B ** p.q + p.sB;
  const K = rat(cB, cA);
  const tTex = t.n === 0n ? '0' : t.d === 1n ? '1' : '\\frac{1}{2}';
  const fArg = p.k === 1 ? 'x' : `${p.k}x`;
  const half = cmp(t, rat(1, 2)) === 0;
  const trig = half
    ? `$\\${p.f}^2${fArg}=\\dfrac{1}{2}$ $\\Leftrightarrow$ $\\cos ${2 * p.k}x=0$ (формула понижения степени), $${2 * p.k}x=\\dfrac{\\pi}{2}+\\pi n$`
    : `$\\${p.f}^2${fArg}=${tTex}$ $\\Leftrightarrow$ ${
        (p.f === 'sin') === (t.n === 1n)
          ? `$\\cos ${fArg}=0$, $${fArg}=\\dfrac{\\pi}{2}+\\pi n$`
          : `$\\sin ${fArg}=0$, $${fArg}=\\pi n$`
      }`;
  const ab = rat(p.A, p.B);
  const nLo = div(sub(lo, s.a), s.b);
  const nHi = div(sub(hi, s.a), s.b);

  return {
    no: 14,
    shablon: 'd14.pokazTrig',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Серии решений', pole: { vid: 'serii', verno: [ser] } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vTex } },
    ],
    otvet: `а) $x=${ser},\\ n\\in\\mathbb Z$; б) $${vTex.join(';\\ ')}$`,
    reshenie: [
      {
        title: 'а) Выносим общие множители',
        lines: [
          `Пусть $f=\\${p.f}^2${fArg}$. Слева выносим $${p.A}^f$, справа — $${p.B}^f$: $${p.A}^f\\left(${p.A}^{${p.p}}${p.sA > 0 ? '+' : '-'}1\\right)=${p.B}^f\\left(${p.B}^{${p.q}}${p.sB > 0 ? '+' : '-'}1\\right)$, то есть $${cA}\\cdot${p.A}^f=${cB}\\cdot${p.B}^f$.`,
        ],
      },
      {
        title: 'а) Показательное уравнение',
        lines: [
          `Делим на $${cA}\\cdot${p.B}^f>0$: $\\left(${ratTex(ab)}\\right)^f=${ratTex(K)}=\\left(${ratTex(ab)}\\right)^{${tTex}}$.`,
          `Функция $y=\\left(${ratTex(ab)}\\right)^f$ ${toNumber(ab) > 1 ? 'возрастает' : 'убывает'}, поэтому каждое значение принимает один раз: $f=${tTex}$.`,
        ],
      },
      {
        title: 'а) Тригонометрическое уравнение',
        lines: [`${trig}, откуда $x=${ser}$, $n\\in\\mathbb Z$.`],
      },
      {
        title: 'б) Отбор корней',
        lines: [
          `$${piTex(lo)}\\le ${ser}\\le ${piTex(hi)}$ $\\Leftrightarrow$ $${ratTex(nLo)}\\le n\\le ${ratTex(nHi)}$, то есть $n=${otb.map((o) => o.n).join(';\\ ')}$.`,
          `Корни на отрезке: $${vTex.join(';\\ ')}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Выносим общий множитель в каждой части',
        formula: `${cA}\\cdot${p.A}^f=${cB}\\cdot${p.B}^f`,
      },
      {
        slovo: 'Сводим к одной степени',
        formula: `\\left(${ratTex(ab)}\\right)^f=\\left(${ratTex(ab)}\\right)^{${tTex}}`,
      },
      { slovo: 'Решаем тригонометрическое уравнение', formula: `x=${ser}` },
      { slovo: 'Отбираем корни двойным неравенством', formula: vTex.join(';\\ ') },
    ],
    kontrol: {
      t: toNumber(t),
      a: toNumber(s.a) * Math.PI,
      b: toNumber(s.b) * Math.PI,
      korni: otb.map((o) => toNumber(o.x) * Math.PI),
      lo: toNumber(lo) * Math.PI,
      hi: toNumber(hi) * Math.PI,
    },
  };
}

export const D14_POKAZ_TRIG: Shablon2<PD14> = {
  no: 14,
  prototip: 'Показательное уравнение с sin²kx или cos²kx в показателе: вынесение общего множителя',
  sobrat,
};
