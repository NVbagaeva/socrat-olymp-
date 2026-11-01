/**
 * №14 (варианты 27–28): (A − cos 2x + B·sin x) / (2cos x ∓ √3) = 0.
 *
 * 1 − cos 2x = 2sin²x, поэтому числитель = 2sin²x + B sin x + (A − 1) =
 * 2(sin x − s₁)(sin x − s₂), s₁ = ±1/2, |s₂| > 1 (целое). Серии sin x = s₁:
 * две, знаменатель зануляется на одной из них (cos x = ±√3/2) — остаётся
 * серия x₀ + 2πn. б) Отбор на отрезке [lo·π; hi·π].
 */

import { add, cmp, mul, rat, ratTex, sub, type Rat } from '@/lib/zadanie15/core/rational';
import { piTex, seriyaTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PP14 {
  /** s₁ = sg/2. */
  sg: 1 | -1;
  /** Второй корень по sin x: целое, |s₂| ≥ 2. */
  s2: number;
  /** Какая серия выколота: cos x = +√3/2 («plus») или −√3/2 («minus»). */
  ubrat: 'plus' | 'minus';
  /** Отрезок [lo·π; hi·π]: числитель и знаменатель. */
  lo: [number, number];
  hi: [number, number];
}

export function chislaP14(p: PP14) {
  const s1 = rat(p.sg, 2);
  const A = 1 + p.sg * p.s2; // 1 + 2s₁s₂
  const B = -(p.sg + 2 * p.s2); // −2(s₁ + s₂)
  /* Серии: при cos > 0 — ±π/6, при cos < 0 — ±5π/6. */
  const plus = rat(p.sg, 6);
  const minus = rat(5 * p.sg, 6);
  const ostalos = p.ubrat === 'plus' ? minus : plus;
  const vybito = p.ubrat === 'plus' ? plus : minus;
  const lo = rat(p.lo[0], p.lo[1]);
  const hi = rat(p.hi[0], p.hi[1]);
  const vybor: Rat[] = [];
  for (let n = -6; n <= 6; n += 1) {
    const x = add(ostalos, rat(2 * n));
    if (cmp(x, lo) >= 0 && cmp(x, hi) <= 0) vybor.push(x);
  }
  return { s1, A, B, ostalos, vybito, lo, hi, vybor };
}

const v = (x: Rat) => Number(x.n) / Number(x.d);

function sobrat(p: PP14): Chast2Zadacha {
  if (Math.abs(p.s2) < 2 || !Number.isInteger(p.s2)) throw new Error('p14: s₂');
  const ch = chislaP14(p);
  const znam = `2\\cos x${p.ubrat === 'plus' ? '-' : '+'}\\sqrt3`;
  const bT =
    ch.B === 0 ? '' : `${ch.B < 0 ? '-' : '+'}${Math.abs(ch.B) === 1 ? '' : Math.abs(ch.B)}\\sin x`;
  const chisl = `${ch.A}-\\cos2x${bT}`;
  const ser = seriyaTex(ch.ostalos);
  const vT = ch.vybor.map(piTex);
  const pole = (s: string) => s.replace(/\\dfrac/g, '\\frac');
  const s1T = p.sg > 0 ? '\\dfrac12' : '-\\dfrac12';
  const otrezok = `\\left[${piTex(ch.lo)};\\ ${piTex(ch.hi)}\\right]`;
  const kv = `2\\sin^2x${bT}${ch.A - 1 === 0 ? '' : `${ch.A - 1 < 0 ? '-' : '+'}${Math.abs(ch.A - 1)}`}=0`;
  return {
    no: 14,
    shablon: 'p14.trigDrobSin',
    uslovie: `а) Решите уравнение $\\dfrac{${chisl}}{${znam}}=0$.\nб) Найдите все корни этого уравнения, принадлежащие отрезку $${otrezok}$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Серии решений', pole: { vid: 'serii', verno: [pole(ser)] } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vT.map(pole) } },
    ],
    otvet: `а) $${ser}$, $n\\in\\mathbb Z$; б) ${vT.length === 0 ? 'корней нет' : `$${vT.join(';\\ ')}$`}`,
    reshenie: [
      {
        title: 'Числитель',
        lines: [
          `$1-\\cos2x=2\\sin^2x$, поэтому числитель равен $${kv.replace('=0', '')}$. Уравнение «числитель $=0$»: $${kv}$, квадратное относительно $\\sin x$.`,
          `Корни: $\\sin x=${s1T}$ и $\\sin x=${p.s2}$; второе невозможно, так как $|\\sin x|\\le1$.`,
        ],
      },
      {
        title: 'Знаменатель',
        lines: [
          `$\\sin x=${s1T}$: $x=${piTex(ch.vybito)}+2\\pi n$ или $x=${piTex(ch.ostalos)}+2\\pi n$.`,
          `Знаменатель $${znam}$ обращается в нуль при $\\cos x=${p.ubrat === 'plus' ? '' : '-'}\\dfrac{\\sqrt3}{2}$, то есть на серии $${seriyaTex(ch.vybito)}$ — её отбрасываем. На второй серии $\\cos x=${p.ubrat === 'plus' ? '-' : ''}\\dfrac{\\sqrt3}{2}$ и знаменатель не равен нулю.`,
          `Ответ а): $x=${ser}$, $n\\in\\mathbb Z$.`,
        ],
      },
      {
        title: 'б) Отбор',
        lines: [
          `$${piTex(ch.lo)}\\le ${piTex(ch.ostalos)}+2\\pi n\\le ${piTex(ch.hi)}$ $\\iff$ $${ratTex(sub(ch.lo, ch.ostalos))}\\le 2n\\le ${ratTex(sub(ch.hi, ch.ostalos))}$ (делим на $\\pi$).`,
          vT.length === 0
            ? `Целых $n$ нет — корней на отрезке нет.`
            : `Подходят $n=${ch.vybor.map((x) => Math.round(v(sub(x, ch.ostalos)) / 2)).join(',\\ ')}$: $x=${vT.join(';\\ ')}$.`,
          `Ответ: а) $${ser}$, $n\\in\\mathbb Z$; б) ${vT.length === 0 ? 'корней нет' : `$${vT.join(';\\ ')}$`}.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Формула косинуса двойного угла', formula: '1-\\cos2x=2\\sin^2x' },
      { slovo: 'Квадратное уравнение по $\\sin x$', formula: kv },
      { slovo: 'Знаменатель не равен нулю', formula: `${znam}\\ne0` },
      { slovo: 'Отбор на отрезке', formula: vT.length === 0 ? '\\varnothing' : vT.join(';\\ ') },
    ],
    kontrol: {
      x0: v(ch.ostalos) * Math.PI,
      vybor: ch.vybor.map((x) => v(x) * Math.PI),
      A: ch.A,
      B: ch.B,
      _m: v(mul(ch.s1, rat(2))),
    },
  };
}

export const P14_TRIG_DROB_SIN: Shablon2<PP14> = {
  no: 14,
  prototip:
    'Дробь с cos 2x и sin x в числителе и 2cos x ∓ √3 в знаменателе: квадратное по sin x, выколотая серия, отбор',
  sobrat,
};
