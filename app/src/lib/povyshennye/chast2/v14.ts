/**
 * №14 (варианты 3–4): (2cos x − k)·√(s·sin x) = 0, s = ±1.
 *
 * Область: s·sin x ≥ 0. Корни: sin x = 0 (x = πn) и cos x = k/2 с
 * нужным знаком синуса — из пары ±α остаётся одна серия.
 */

import { add, rat, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { piTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export type Kos = '1' | 'r2' | 'r3' | '-1' | '-r2' | '-r3';

export interface PV14 {
  k: Kos;
  s: 1 | -1;
  lo: string;
  hi: string;
}

const KOS: Record<Kos, { tex: string; alfa: Rat; znak: string }> = {
  '1': { tex: '1', alfa: rat(1, 3), znak: '\\dfrac12' },
  r2: { tex: '\\sqrt2', alfa: rat(1, 4), znak: '\\dfrac{\\sqrt2}{2}' },
  r3: { tex: '\\sqrt3', alfa: rat(1, 6), znak: '\\dfrac{\\sqrt3}{2}' },
  '-1': { tex: '-1', alfa: rat(2, 3), znak: '-\\dfrac12' },
  '-r2': { tex: '-\\sqrt2', alfa: rat(3, 4), znak: '-\\dfrac{\\sqrt2}{2}' },
  '-r3': { tex: '-\\sqrt3', alfa: rat(5, 6), znak: '-\\dfrac{\\sqrt3}{2}' },
};

const drob = (s: string): Rat => {
  const [a, b] = s.split('/');
  return rat(Number(a), Number(b ?? 1));
};

export function chislaV14(p: PV14) {
  const K = KOS[p.k];
  const x0 = p.s === 1 ? K.alfa : rat(-Number(K.alfa.n), Number(K.alfa.d));
  const lo = drob(p.lo);
  const hi = drob(p.hi);
  const korni: Rat[] = [];
  for (let n = -12; n <= 12; n++) {
    for (const x of [rat(n), add(x0, rat(2 * n))]) {
      const v = toNumber(x);
      if (
        v >= toNumber(lo) - 1e-12 &&
        v <= toNumber(hi) + 1e-12 &&
        !korni.some((y) => toNumber(y) === v)
      )
        korni.push(x);
    }
  }
  korni.sort((a, b) => toNumber(a) - toNumber(b));
  if (korni.length < 2) throw new Error('v14: мало корней на отрезке');
  return { K, x0, lo, hi, korni };
}

function sobrat(p: PV14): Chast2Zadacha {
  const ch = chislaV14(p);
  const sinT = p.s === 1 ? '\\sin x' : '-\\sin x';
  const kT = ch.K.tex.startsWith('-') ? `+${ch.K.tex.slice(1)}` : `-${ch.K.tex}`;
  const ur = `\\left(2\\cos x${kT}\\right)\\sqrt{${sinT}}=0`;
  const s1 = `${piTex(ch.x0)}+2\\pi n`;
  const serii = [s1, '\\pi n'];
  const vTex = ch.korni.map(piTex);
  const ne = `${piTex(p.s === 1 ? rat(-Number(ch.K.alfa.n), Number(ch.K.alfa.d)) : ch.K.alfa)}+2\\pi n`;
  return {
    no: 14,
    shablon: 'v14.kosKoren',
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
        title: 'а) Область и распад',
        lines: [
          `Уравнение определено при $${sinT}\\ge0$. Произведение равно нулю, если один из множителей равен нулю, а другой при этом имеет смысл.`,
          `Корень равен нулю при $\\sin x=0$: $x=\\pi n$ — все эти $x$ входят в область.`,
          `Первый множитель: $\\cos x=${ch.K.znak}$, $x=\\pm${piTex(ch.K.alfa)}+2\\pi n$. Условию $${sinT}\\ge0$ удовлетворяет только серия $x=${s1}$; серия $x=${ne}$ не входит в область.`,
        ],
      },
      {
        title: 'б) Отбор',
        lines: [
          `Перебираем $n$: на отрезке $\\left[${piTex(ch.lo)};\\ ${piTex(ch.hi)}\\right]$ лежат $${vTex.join(';\\ ')}$.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [`а) $${serii.join(';\\ ')}$, $n\\in\\mathbb{Z}$; б) $${vTex.join(';\\ ')}$.`],
      },
    ],
    razbor: [
      { slovo: 'Область определения', formula: `${sinT}\\ge0` },
      { slovo: 'Корень равен нулю', formula: 'x=\\pi n' },
      { slovo: 'Скобка равна нулю, отбор по знаку синуса', formula: `x=${s1}` },
      { slovo: 'Корни на отрезке', formula: vTex.join(';\\ ') },
    ],
    kontrol: {
      korni: ch.korni.map((x) => toNumber(x)),
      c: Math.cos(Math.PI * toNumber(ch.K.alfa)) * 2,
      s: p.s,
      lo: toNumber(ch.lo),
      hi: toNumber(ch.hi),
    },
  };
}

export const V14_KOS_KOREN: Shablon2<PV14> = {
  no: 14,
  prototip:
    'Произведение тригонометрического множителя и корня: область определения, отбор серии по знаку синуса',
  sobrat,
};
