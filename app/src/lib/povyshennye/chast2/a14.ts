/**
 * №14 (варианты 11–12): cos 2x = k(cos x − sin x).
 *
 * cos 2x = (cos x − sin x)(cos x + sin x) ⇒
 * (cos x − sin x)(cos x + sin x − k) = 0.
 * 1) tg x = 1: x = π/4 + πn.
 * 2) cos x + sin x = k ⇔ √2·sin(x + π/4) = k ⇔ sin(x + π/4) = k/√2.
 *    k/√2 = σ·sin(π/u), u ∈ {6, 4, 3}: x = θ − π/4 + 2πn,
 *    x = π − θ − π/4 + 2πn, θ = σπ/u.
 * б) Отрезок [lo·π/4; hi·π/4] — перебор серий.
 */

import { add, rat, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { piTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PA14 {
  /** k/√2 = σ·sin(π/u). */
  u: 3 | 4 | 6;
  sg: 1 | -1;
  lo: number;
  hi: number;
}

/** k = σ·√2·sin(π/u) в TeX: u = 6 → √2/2, 4 → 1, 3 → √6/2. */
const K_TEX: Record<number, string> = {
  6: '\\dfrac{\\sqrt{2}}{2}',
  4: '1',
  3: '\\dfrac{\\sqrt{6}}{2}',
};
const K_NUM: Record<number, number> = { 6: Math.SQRT2 / 2, 4: 1, 3: Math.sqrt(6) / 2 };
const SIN_TEX: Record<number, string> = {
  6: '\\dfrac{1}{2}',
  4: '\\dfrac{\\sqrt{2}}{2}',
  3: '\\dfrac{\\sqrt{3}}{2}',
};

const ost = (x: Rat, m: number) => sub(x, rat(Math.floor(toNumber(x) / m) * m));

export function chislaA14(p: PA14) {
  if (!(p.lo < p.hi)) throw new Error('a14: отрезок');
  const th = rat(p.sg, p.u);
  const serii: { x0: Rat; T: number }[] = [
    { x0: rat(1, 4), T: 1 },
    { x0: ost(sub(th, rat(1, 4)), 2), T: 2 },
    { x0: ost(sub(sub(rat(1), th), rat(1, 4)), 2), T: 2 },
  ];
  /* Серия 2 или 3 может лежать в серии 1 (π/4 + πn) — тогда её не пишем. */
  const vSerii1 = (x0: Rat) => Math.abs((((toNumber(x0) - 0.25) % 1) + 1) % 1) < 1e-12;
  const itog = serii.filter((s, i) => i === 0 || !vSerii1(s.x0));
  const L = rat(p.lo, 4);
  const H = rat(p.hi, 4);
  const vybor: Rat[] = [];
  for (const s of itog)
    for (let j = -12; j <= 12; j += 1) {
      const x = add(s.x0, rat(j * s.T));
      if (toNumber(x) >= toNumber(L) - 1e-12 && toNumber(x) <= toNumber(H) + 1e-12)
        if (!vybor.some((y) => Math.abs(toNumber(y) - toNumber(x)) < 1e-12)) vybor.push(x);
    }
  vybor.sort((a, b) => toNumber(a) - toNumber(b));
  return { th, serii: itog, L, H, vybor, k: p.sg * K_NUM[p.u]! };
}

function seriya(x0: Rat, T: number, b: string): string {
  const per = T === 1 ? `\\pi ${b}` : `${T}\\pi ${b}`;
  return x0.n === 0n ? per : `${piTex(x0)}+${per}`;
}

function sobrat(p: PA14): Chast2Zadacha {
  const ch = chislaA14(p);
  if (ch.vybor.length === 0) throw new Error('a14: на отрезке нет корней');
  const znak = p.sg < 0 ? '-' : '';
  const kT = `${znak}${K_TEX[p.u]}`;
  const ur = `\\cos 2x=${kT === '1' ? '' : kT === '-1' ? '-' : kT}(\\cos x-\\sin x)`;
  const bukvy = ['n', 'k', 'm'];
  const serii = ch.serii.map((s, i) => seriya(s.x0, s.T, bukvy[i]!));
  const vT = ch.vybor.map(piTex);
  return {
    no: 14,
    shablon: 'a14.cosRazn',
    uslovie: `а) Решите уравнение $${ur}$.\nб) Найдите все корни этого уравнения, принадлежащие отрезку $\\left[${piTex(ch.L)};\\ ${piTex(ch.H)}\\right]$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Серии решений', pole: { vid: 'serii', verno: serii } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vT } },
    ],
    otvet: `а) $${serii.join(';\\ ')}$; б) $${vT.join(';\\ ')}$`,
    reshenie: [
      {
        title: 'а) Раскладываем на множители',
        lines: [
          '$\\cos 2x=\\cos^2x-\\sin^2x=(\\cos x-\\sin x)(\\cos x+\\sin x)$.',
          `Уравнение: $(\\cos x-\\sin x)(\\cos x+\\sin x-(${kT}))=0$.`,
        ],
      },
      {
        title: 'а) Два случая',
        lines: [
          `$\\cos x=\\sin x$: $\\cos x\\ne0$ (иначе и $\\sin x=0$), $\\operatorname{tg}x=1$, $x=${serii[0]}$.`,
          `$\\cos x+\\sin x=${kT}$. Так как $\\cos x+\\sin x=\\sqrt2\\sin\\left(x+\\dfrac{\\pi}{4}\\right)$, получаем $\\sin\\left(x+\\dfrac{\\pi}{4}\\right)=${znak}${SIN_TEX[p.u]}$: $x+\\dfrac{\\pi}{4}=${piTex(ch.th)}+2\\pi k$ или $x+\\dfrac{\\pi}{4}=\\pi-\\left(${piTex(ch.th)}\\right)+2\\pi k$.`,
          ch.serii.length === 3
            ? `Отсюда $x=${serii[1]}$ и $x=${serii[2]}$.`
            : `Одна из этих серий входит в серию $${serii[0]}$, вторая — $x=${serii[1]}$.`,
          `Ответ а): $${serii.join(';\\ ')}$.`,
        ],
      },
      {
        title: 'б) Отбор корней',
        lines: [
          `Подставляем целые значения параметров и оставляем значения из отрезка $\\left[${piTex(ch.L)};\\ ${piTex(ch.H)}\\right]$.`,
          `Ответ б): $${vT.join(';\\ ')}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Косинус двойного угла — разность квадратов',
        formula: '(\\cos x-\\sin x)(\\cos x+\\sin x)',
      },
      { slovo: 'Первый множитель', formula: '\\operatorname{tg}x=1' },
      {
        slovo: 'Второй множитель — вспомогательный угол',
        formula: `\\sin\\left(x+\\frac{\\pi}{4}\\right)=${znak}${SIN_TEX[p.u]}`,
      },
      { slovo: 'Отбор', formula: vT.join(';\\ ') },
    ],
    kontrol: { k: ch.k, vybor: ch.vybor.map((x) => toNumber(x) * Math.PI) },
  };
}

export const A14_COS_RAZN: Shablon2<PA14> = {
  no: 14,
  prototip:
    'Тригонометрическое уравнение cos 2x = k(cos x − sin x): разложение на множители, вспомогательный угол, отбор',
  sobrat,
};
