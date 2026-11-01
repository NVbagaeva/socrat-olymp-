/**
 * №14 (варианты 23–24): произведение квадратов синуса и косинуса.
 *
 * k·sin²x·cos²x = m·cos²2x. sin x cos x = ½ sin 2x: (k/4)·sin²2x = m·cos²2x.
 * cos 2x = 0 не подходит (тогда sin²2x = 1 и k/4 = 0), делим на cos²2x:
 * tg²2x = 4m/k = T ∈ {1/3, 1, 3}: 2x = ±θ + πn, x = ±θ/2 + πn/2,
 * θ = π/6, π/4, π/3.
 * б) Отрезок [lo·π/4; hi·π/4].
 */

import { add, rat, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { piTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PM14 {
  k: number;
  m: number;
  lo: number;
  hi: number;
}

function seriyaTex(x0: Rat): string {
  return `${piTex(x0)}+\\dfrac{\\pi n}{2}`;
}

export function chislaM14(p: PM14) {
  const T = (4 * p.m) / p.k;
  const th: Record<string, Rat> = {
    '0.333333': rat(1, 6),
    '1.000000': rat(1, 4),
    '3.000000': rat(1, 3),
  };
  const t = th[T.toFixed(6)];
  if (t === undefined) throw new Error('m14: tg² 2x не 1/3, 1 или 3');
  const pol = rat(Number(t.n), Number(t.d) * 2);
  const ss = [pol, sub(rat(0), pol)];
  const L = rat(p.lo, 4);
  const H = rat(p.hi, 4);
  if (!(p.lo < p.hi)) throw new Error('m14: отрезок');
  const vybor: Rat[] = [];
  for (const x0 of ss) {
    for (let j = -60; j <= 60; j += 1) {
      const x = add(x0, rat(j, 2));
      const v = toNumber(x);
      if (v >= toNumber(L) - 1e-12 && v <= toNumber(H) + 1e-12) vybor.push(x);
    }
  }
  vybor.sort((a, b) => toNumber(a) - toNumber(b));
  const uniq = vybor.filter((x, i) => i === 0 || toNumber(x) !== toNumber(vybor[i - 1]!));
  return { T, theta: t, pol, ss, L, H, vybor: uniq };
}

const T_TEX: Record<string, string> = {
  '0.333333': '\\dfrac{1}{3}',
  '1.000000': '1',
  '3.000000': '3',
};
const TG_TEX: Record<string, string> = {
  '0.333333': '\\dfrac{\\sqrt{3}}{3}',
  '1.000000': '1',
  '3.000000': '\\sqrt{3}',
};

function sobrat(p: PM14): Chast2Zadacha {
  const ch = chislaM14(p);
  if (ch.vybor.length === 0) throw new Error('m14: нет корней на отрезке');
  const key = ch.T.toFixed(6);
  const sT = ch.ss.map(seriyaTex);
  const vTex = ch.vybor.map(piTex);
  const k4 = p.k % 4 === 0 ? String(p.k / 4) : `\\dfrac{${p.k}}{4}`;
  return {
    no: 14,
    shablon: 'm14.kvadraty',
    uslovie: `а) Решите уравнение $${p.k}\\sin^2x\\cos^2x=${p.m === 1 ? '' : p.m}\\cos^22x$.\nб) Найдите все корни этого уравнения, принадлежащие отрезку $\\left[${piTex(ch.L)};\\ ${piTex(ch.H)}\\right]$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Серии решений', pole: { vid: 'serii', verno: sT } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vTex } },
    ],
    otvet: `а) $${sT.join(';\\ ')}$, $n\\in\\mathbb{Z}$; б) $${vTex.join(';\\ ')}$`,
    reshenie: [
      {
        title: 'а) Синус двойного угла',
        lines: [
          `$\\sin x\\cos x=\\dfrac12\\sin2x$, поэтому $${p.k}\\sin^2x\\cos^2x=${k4}\\sin^22x$, и уравнение принимает вид $${k4}\\sin^22x=${p.m === 1 ? '' : p.m}\\cos^22x$.`,
          `Если $\\cos2x=0$, то $\\sin^22x=1$ и левая часть равна $${k4}\\ne0$ — таких корней нет. Делим на $\\cos^22x$: $\\operatorname{tg}^22x=${T_TEX[key]}$.`,
        ],
      },
      {
        title: 'а) Серии',
        lines: [
          `$\\operatorname{tg}2x=\\pm${TG_TEX[key]}$, $2x=\\pm${piTex(ch.theta)}+\\pi n$, $x=\\pm${piTex(ch.pol)}+\\dfrac{\\pi n}{2}$, $n\\in\\mathbb{Z}$.`,
          `Ответ а): $${sT.join(';\\ ')}$.`,
        ],
      },
      {
        title: 'б) Отбор корней',
        lines: [
          `Перебираем $n$: значения из отрезка $\\left[${piTex(ch.L)};\\ ${piTex(ch.H)}\\right]$ (его длина $${piTex(sub(ch.H, ch.L))}$).`,
          `Ответ б): $${vTex.join(';\\ ')}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Произведение $\\sin x\\cos x$ — половина синуса двойного угла',
        formula: `${k4}\\sin^22x`,
      },
      { slovo: 'Делим на $\\cos^22x\\ne0$', formula: `\\operatorname{tg}^22x=${T_TEX[key]}` },
      { slovo: 'Серии', formula: `x=\\pm${piTex(ch.pol)}+\\frac{\\pi n}{2}` },
      { slovo: 'Отбор на отрезке', formula: vTex.join(';\\ ') },
    ],
    kontrol: { vybor: ch.vybor.map((x) => toNumber(x) * Math.PI), T: ch.T },
  };
}

export const M14_KVADRATY: Shablon2<PM14> = {
  no: 14,
  prototip:
    'Тригонометрическое уравнение: произведение квадратов синуса и косинуса и квадрат косинуса двойного угла, тангенс',
  sobrat,
};
