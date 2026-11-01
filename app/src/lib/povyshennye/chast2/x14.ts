/**
 * №14 (варианты 7–8): tg x + ctg x = s.
 *
 * tg x + ctg x = (sin²x + cos²x)/(sin x·cos x) = 2/sin 2x, поэтому
 * уравнение равносильно sin 2x = 2/s при sin x·cos x ≠ 0 (это условие
 * выполнено само: sin 2x ≠ 0). s = σ·w, w ∈ {2, 2√2, 4/√3, 4}:
 * sin 2x = σ·u, u = 1, √2/2, √3/2, 1/2.
 * Серии: 2x = θ + 2πn, 2x = π − θ + 2πn, θ = σ·arcsin u; при u = 1
 * серии совпадают: x = σπ/4 + πn.
 * б) Отрезок [lo·π/4; hi·π/4] — корни перебором серий.
 */

import { add, div, rat, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { piTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PX14 {
  /** sin 2x = σ·sin(π/u): u = 2 (1), 4 (√2/2), 3 (√3/2), 6 (1/2). */
  u: 2 | 3 | 4 | 6;
  sg: 1 | -1;
  /** Отрезок [lo·π/4; hi·π/4]. */
  lo: number;
  hi: number;
}

/** Правая часть s = 2/sin(π/u) в TeX. */
const S_TEX: Record<number, string> = {
  2: '2',
  4: '2\\sqrt{2}',
  3: '\\dfrac{4}{\\sqrt{3}}',
  6: '4',
};
const SIN_TEX: Record<number, string> = {
  2: '1',
  4: '\\dfrac{\\sqrt{2}}{2}',
  3: '\\dfrac{\\sqrt{3}}{2}',
  6: '\\dfrac{1}{2}',
};
const S_NUM: Record<number, number> = { 2: 2, 4: 2 * Math.SQRT2, 3: 4 / Math.sqrt(3), 6: 4 };

/** Остаток в долях π по модулю 1, в [0; 1). */
function ost1(x: Rat): Rat {
  return sub(x, rat(Math.floor(toNumber(x))));
}

export function chislaX14(p: PX14) {
  if (!(p.lo < p.hi)) throw new Error('x14: отрезок');
  const th = rat(p.sg, p.u);
  /* x = θ/2 + πn и x = (π − θ)/2 + πn, в долях π; при u = 2 — одна серия. */
  const a = ost1(div(th, rat(2)));
  const b = ost1(div(sub(rat(1), th), rat(2)));
  const serii: Rat[] = p.u === 2 ? [a] : [a, b];
  const L = rat(p.lo, 4);
  const H = rat(p.hi, 4);
  const vybor: Rat[] = [];
  for (const x0 of serii)
    for (let j = -12; j <= 12; j += 1) {
      const x = add(x0, rat(j));
      if (toNumber(x) >= toNumber(L) - 1e-12 && toNumber(x) <= toNumber(H) + 1e-12) vybor.push(x);
    }
  vybor.sort((u, v) => toNumber(u) - toNumber(v));
  return { th, serii, L, H, vybor, s: p.sg * S_NUM[p.u]! };
}

function seriya(x0: Rat): string {
  return x0.n === 0n ? '\\pi n' : `${piTex(x0)}+\\pi n`;
}

function sobrat(p: PX14): Chast2Zadacha {
  const ch = chislaX14(p);
  if (ch.vybor.length === 0) throw new Error('x14: на отрезке нет корней');
  const znak = p.sg < 0 ? '-' : '';
  const ur = `\\operatorname{tg}x+\\operatorname{ctg}x=${znak}${S_TEX[p.u]}`;
  const sinT = `${znak}${SIN_TEX[p.u]}`;
  const serii = ch.serii.map(seriya);
  const vTex = ch.vybor.map(piTex);
  const L = piTex(ch.L);
  const H = piTex(ch.H);
  return {
    no: 14,
    shablon: 'x14.tgCtg',
    uslovie: `а) Решите уравнение $${ur}$.\nб) Найдите все корни этого уравнения, принадлежащие отрезку $\\left[${L};\\ ${H}\\right]$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Серии решений', pole: { vid: 'serii', verno: serii } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vTex } },
    ],
    otvet: `а) $${serii.join(';\\ ')}$, $n\\in\\mathbb{Z}$; б) $${vTex.join(';\\ ')}$`,
    reshenie: [
      {
        title: 'а) Сводим к синусу двойного угла',
        lines: [
          'Область допустимых значений: $\\sin x\\ne0$ и $\\cos x\\ne0$, то есть $\\sin 2x\\ne0$.',
          '$\\operatorname{tg}x+\\operatorname{ctg}x=\\dfrac{\\sin x}{\\cos x}+\\dfrac{\\cos x}{\\sin x}=\\dfrac{\\sin^2x+\\cos^2x}{\\sin x\\cos x}=\\dfrac{2}{\\sin 2x}$.',
          `Уравнение принимает вид $\\dfrac{2}{\\sin 2x}=${znak}${S_TEX[p.u]}$, откуда $\\sin 2x=${sinT}$. Это значение не равно нулю, поэтому ограничение области допустимых значений выполнено.`,
        ],
      },
      {
        title: 'а) Решаем простейшее уравнение',
        lines:
          p.u === 2
            ? [
                `$2x=${piTex(rat(p.sg, 2))}+2\\pi n$, $x=${serii[0]}$, $n\\in\\mathbb{Z}$.`,
                `Ответ а): $${serii[0]}$.`,
              ]
            : [
                `$2x=${piTex(ch.th)}+2\\pi n$ или $2x=\\pi-\\left(${piTex(ch.th)}\\right)+2\\pi n$, $n\\in\\mathbb{Z}$.`,
                `Делим на $2$ и приводим начальные значения к отрезку $[0;\\ \\pi)$: $x=${serii[0]}$, $x=${serii[1]}$.`,
                `Ответ а): $${serii.join(';\\ ')}$.`,
              ],
      },
      {
        title: 'б) Отбор корней',
        lines: [
          `Подставляем в серии целые $n$ и оставляем значения из отрезка $\\left[${L};\\ ${H}\\right]$ (период каждой серии $\\pi$).`,
          `Подходят: $${vTex.join(';\\ ')}$.`,
          `Ответ б): $${vTex.join(';\\ ')}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Приводим к общему знаменателю',
        formula: '\\operatorname{tg}x+\\operatorname{ctg}x=\\dfrac{2}{\\sin 2x}',
      },
      { slovo: 'Простейшее уравнение', formula: `\\sin 2x=${sinT}` },
      { slovo: 'Делим серии на 2', formula: serii.join(';\\ ') },
      { slovo: 'Отбор на отрезке', formula: vTex.join(';\\ ') },
    ],
    kontrol: {
      s: ch.s,
      x0: ch.serii.map((x) => toNumber(x)),
      vybor: ch.vybor.map((x) => toNumber(x) * Math.PI),
    },
  };
}

export const X14_TG_CTG: Shablon2<PX14> = {
  no: 14,
  prototip:
    'Тригонометрическое уравнение: сумма тангенса и котангенса через синус двойного угла, отбор корней',
  sobrat,
};
