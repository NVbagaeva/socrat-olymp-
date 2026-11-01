/**
 * №14 (варианты 1–2): tg x + c·ctg x = d.
 *
 * Замена t = tg x (sin x ≠ 0, cos x ≠ 0): t² − d·t + c = 0, корни
 * t₁, t₂ — табличные тангенсы (±1, ±√3, ±√3/3), c = t₁t₂, d = t₁ + t₂.
 * Серии x = arctg tᵢ + πn, отбор на отрезке [lo·π; hi·π].
 */

import { add, rat, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { piTex } from './tex';
import { q3, q3Add, q3Mul, q3Neg, q3Num, q3Tex, type Q3 } from './uObshchee';
import type { Chast2Zadacha, Shablon2 } from './types';

export type Tg = '1' | '-1' | 'r3' | '-r3' | 'ir3' | '-ir3';

export interface PU14 {
  t1: Tg;
  t2: Tg;
  /** Отрезок [lo·π; hi·π], lo и hi — дроби вида «-3/2». */
  lo: string;
  hi: string;
}

const TG: Record<Tg, { v: Q3; ugol: Rat }> = {
  '1': { v: q3(rat(1)), ugol: rat(1, 4) },
  '-1': { v: q3(rat(-1)), ugol: rat(-1, 4) },
  r3: { v: q3(rat(0), rat(1)), ugol: rat(1, 3) },
  '-r3': { v: q3(rat(0), rat(-1)), ugol: rat(-1, 3) },
  ir3: { v: q3(rat(0), rat(1, 3)), ugol: rat(1, 6) },
  '-ir3': { v: q3(rat(0), rat(-1, 3)), ugol: rat(-1, 6) },
};

const drob = (s: string): Rat => {
  const [a, b] = s.split('/');
  return rat(Number(a), Number(b ?? 1));
};

export function chislaU14(p: PU14) {
  if (p.t1 === p.t2) throw new Error('u14: корни совпадают');
  const A = TG[p.t1];
  const B = TG[p.t2];
  const c = q3Mul(A.v, B.v);
  const d = q3Add(A.v, B.v);
  const lo = drob(p.lo);
  const hi = drob(p.hi);
  if (!(toNumber(hi) > toNumber(lo))) throw new Error('u14: отрезок');
  const korni: Rat[] = [];
  for (const u of [A.ugol, B.ugol]) {
    for (let n = -10; n <= 10; n++) {
      const x = add(u, rat(n));
      const v = toNumber(x);
      if (v >= toNumber(lo) - 1e-12 && v <= toNumber(hi) + 1e-12) korni.push(x);
    }
  }
  korni.sort((x, y) => toNumber(x) - toNumber(y));
  if (korni.length === 0) throw new Error('u14: на отрезке нет корней');
  return { A, B, c, d, lo, hi, korni };
}

const seriya = (u: Rat) => `${piTex(u)}+\\pi n`;

function chlen(k: Q3, posle: string, pervyy: boolean): string {
  const v = q3Num(k);
  if (Math.abs(v) < 1e-12) return '';
  const t = q3Tex(k);
  const prostoe = k.q.n === 0n;
  let s: string;
  if (prostoe && t === '1' && posle !== '') s = posle;
  else if (prostoe && t === '-1' && posle !== '') s = `-${posle}`;
  else s = prostoe || k.p.n === 0n ? `${t}${posle}` : `\\left(${t}\\right)${posle}`;
  if (!pervyy && !s.startsWith('-')) s = `+${s}`;
  return s;
}

function sobrat(p: PU14): Chast2Zadacha {
  const ch = chislaU14(p);
  const ur = `\\operatorname{tg}x${chlen(ch.c, '\\operatorname{ctg}x', false)}=${q3Num(ch.d) === 0 ? '0' : q3Tex(ch.d)}`;
  const serii = [seriya(ch.A.ugol), seriya(ch.B.ugol)];
  const vTex = ch.korni.map(piTex);
  const dT = q3Tex(ch.d);
  const kv = `t^2${chlen(q3Neg(ch.d), 't', false)}${chlen(ch.c, '', false) || ''}=0`;
  return {
    no: 14,
    shablon: 'u14.tgCtg',
    uslovie:
      `а) Решите уравнение $${ur}$.\n` +
      `б) Найдите все корни этого уравнения, принадлежащие отрезку $\\left[${piTex(ch.lo)};\\ ${piTex(ch.hi)}\\right]$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Серии решений', pole: { vid: 'serii', verno: serii } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vTex } },
    ],
    otvet: `а) $${serii.join(';\\ ')}$, $n\\in\\mathbb{Z}$; б) $${vTex.join(';\\ ')}$`,
    reshenie: [
      {
        title: 'а) Замена',
        lines: [
          `Уравнение имеет смысл при $\\sin x\\ne0$ и $\\cos x\\ne0$. Так как $\\operatorname{ctg}x=\\dfrac{1}{\\operatorname{tg}x}$, положим $t=\\operatorname{tg}x$, $t\\ne0$, и умножим на $t$: $${kv}$.`,
          `По теореме Виета корни $t_1=${q3Tex(ch.A.v)}$ и $t_2=${q3Tex(ch.B.v)}$: их произведение $${q3Tex(ch.c)}$, сумма $${q3Num(ch.d) === 0 ? '0' : dT}$. Оба отличны от нуля.`,
        ],
      },
      {
        title: 'а) Серии',
        lines: [
          `$\\operatorname{tg}x=${q3Tex(ch.A.v)}\\iff x=${seriya(ch.A.ugol)}$; $\\operatorname{tg}x=${q3Tex(ch.B.v)}\\iff x=${seriya(ch.B.ugol)}$, $n\\in\\mathbb{Z}$. При этих $x$ и синус, и косинус отличны от нуля.`,
        ],
      },
      {
        title: 'б) Отбор',
        lines: [
          `Перебираем $n$ в каждой серии и оставляем значения из отрезка $\\left[${piTex(ch.lo)};\\ ${piTex(ch.hi)}\\right]$: $${vTex.join(';\\ ')}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Замена $t=\\operatorname{tg}x$, $\\operatorname{ctg}x=\\frac1t$', formula: kv },
      { slovo: 'Корни', formula: `t_1=${q3Tex(ch.A.v)},\\ t_2=${q3Tex(ch.B.v)}` },
      { slovo: 'Серии', formula: serii.join(';\\ ') },
      { slovo: 'Корни на отрезке', formula: vTex.join(';\\ ') },
    ],
    kontrol: {
      c: q3Num(ch.c),
      d: q3Num(ch.d),
      lo: toNumber(ch.lo),
      hi: toNumber(ch.hi),
      korni: ch.korni.map((x) => toNumber(x)),
    },
  };
}

export const U14_TG_CTG: Shablon2<PU14> = {
  no: 14,
  prototip: 'Уравнение tg x + c·ctg x = d: замена t = tg x, квадратное уравнение, отбор на отрезке',
  sobrat,
};
