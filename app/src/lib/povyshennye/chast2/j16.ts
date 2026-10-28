/**
 * №16 (варианты 17–18): √(x² − c) ⋚ p + q/(r − √(x² − c)), q = (p − r)²/4.
 *
 * t = √(x² − c) ≥ 0: t − p − q/(r − t) = [(t − p)(r − t) − q]/(r − t) =
 * −(t − t₀)²/(r − t), t₀ = (p + r)/2 — числитель — полный квадрат.
 * «<»: (t − t₀)²/(r − t) > 0 ⇔ t < r, t ≠ t₀; «>»: t > r, t ≠ t₀.
 * Переход к x: x² = c + t².
 */

import type { Kusok, Mnozhestvo } from '@/lib/chast2/sravnenie';
import { add, div, mul, rat, ratTex, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PJ16 {
  c: number;
  p: number;
  r: number;
  znak: 'lt' | 'gt';
}

interface Tch {
  v: number;
  tex: string;
}

const kor = (u: Rat, z: 1 | -1): Tch => {
  const t = surdTex(sqrtRat(u));
  return { v: z * Math.sqrt(toNumber(u)), tex: z < 0 ? `-${t}` : t };
};

export function chislaJ16(p: PJ16) {
  const q = div(mul(sub(rat(p.p), rat(p.r)), sub(rat(p.p), rat(p.r))), rat(4));
  const t0 = div(add(rat(p.p), rat(p.r)), rat(2));
  if (p.znak === 'lt' ? !(p.p < p.r) : !(p.p > p.r)) throw new Error('j16: t0 вне области');
  if (!(toNumber(t0) > 0)) throw new Error('j16: t0');
  const c = rat(p.c);
  const u0 = c;
  const ut = add(c, mul(t0, t0));
  const ur = add(c, mul(rat(p.r), rat(p.r)));
  type K = { lo: Tch | null; hi: Tch | null; loZ: boolean; hiZ: boolean };
  let kuski: K[];
  if (p.znak === 'lt') {
    kuski = [
      { lo: kor(ur, -1), hi: kor(ut, -1), loZ: false, hiZ: false },
      { lo: kor(ut, -1), hi: kor(u0, -1), loZ: false, hiZ: true },
      { lo: kor(u0, 1), hi: kor(ut, 1), loZ: true, hiZ: false },
      { lo: kor(ut, 1), hi: kor(ur, 1), loZ: false, hiZ: false },
    ];
  } else {
    kuski = [
      { lo: null, hi: kor(ut, -1), loZ: false, hiZ: false },
      { lo: kor(ut, -1), hi: kor(ur, -1), loZ: false, hiZ: false },
      { lo: kor(ur, 1), hi: kor(ut, 1), loZ: false, hiZ: false },
      { lo: kor(ut, 1), hi: null, loZ: false, hiZ: false },
    ];
  }
  return { q, t0, u0, ut, ur, kuski };
}

function sobrat(p: PJ16): Chast2Zadacha {
  const ch = chislaJ16(p);
  const kT = `\\sqrt{x^2-${p.c}}`;
  const qT = ratTex(ch.q);
  const zn = p.znak === 'lt' ? '<' : '>';
  const uslovie = `Решите неравенство $${kT}${zn}${p.p}+\\dfrac{${qT}}{${p.r}-${kT}}$.`;
  const kusTex = (q: (typeof ch.kuski)[number]) =>
    `\\left${q.loZ ? '[' : '('}${q.lo?.tex ?? '-\\infty'};\\ ${q.hi?.tex ?? '+\\infty'}\\right${q.hiZ ? ']' : ')'}`;
  const otv = ch.kuski.map(kusTex).join('\\cup');
  const pl = (t: Tch | null, inf: string) =>
    t === null ? inf : t.tex.replace(/\\dfrac/g, '\\frac');
  const vPole: Mnozhestvo = {
    kuski: ch.kuski.map((q): Kusok => ({
      t: 'interval',
      lo: pl(q.lo, '-inf'),
      loZakr: q.loZ,
      hi: pl(q.hi, 'inf'),
      hiZakr: q.hiZ,
    })),
  };
  const t0T = ratTex(ch.t0);
  const S = p.p + p.r;
  const Pp = p.p * p.r;
  const lt = p.znak === 'lt';
  return {
    no: 16,
    shablon: 'j16.korenDrob',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: null, podpis: 'Множество решений', pole: { vid: 'promezhutki', verno: vPole } },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Замена',
        lines: [
          `Пусть $t=${kT}$, $t\\ge0$, $t\\ne${p.r}$. Переносим всё влево: $t-${p.p}-\\dfrac{${qT}}{${p.r}-t}${zn}0$, $\\dfrac{(t-${p.p})(${p.r}-t)-${qT}}{${p.r}-t}${zn}0$.`,
          `Числитель: $-t^2+${S}t-${ratTex(add(rat(Pp), ch.q))}=-\\left(t-${t0T}\\right)^2$. Неравенство: $-\\dfrac{\\left(t-${t0T}\\right)^2}{${p.r}-t}${zn}0$, то есть $\\dfrac{\\left(t-${t0T}\\right)^2}{${lt ? `${p.r}-t` : `t-${p.r}`}}>0$.`,
        ],
      },
      {
        title: 'Решение относительно $t$',
        lines: [
          `Дробь положительна, когда числитель не ноль и ${lt ? `$${p.r}-t>0$` : `$t-${p.r}>0$`}: ${lt ? `$0\\le t<${p.r}$` : `$t>${p.r}$`}, $t\\ne${t0T}$.`,
        ],
      },
      {
        title: 'Возвращаемся к $x$',
        lines: [
          lt
            ? `$0\\le${kT}<${p.r}$: $${ratTex(ch.u0)}\\le x^2<${ratTex(ch.ur)}$; $${kT}\\ne${t0T}$: $x^2\\ne${ratTex(ch.ut)}$.`
            : `$${kT}>${p.r}$: $x^2>${ratTex(ch.ur)}$; $${kT}\\ne${t0T}$: $x^2\\ne${ratTex(ch.ut)}$.`,
          `Ответ: $${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Замена корня', formula: `t=${kT}\\ge0` },
      { slovo: 'Числитель — полный квадрат', formula: `-\\left(t-${t0T}\\right)^2` },
      { slovo: 'Знак дроби', formula: lt ? `t<${p.r},\\ t\\ne${t0T}` : `t>${p.r},\\ t\\ne${t0T}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: {
      kuski: ch.kuski.flatMap((q) => [
        q.lo?.v ?? -1e9,
        q.hi?.v ?? 1e9,
        q.loZ ? 1 : 0,
        q.hiZ ? 1 : 0,
      ]),
    },
  };
}

export const J16_KOREN_DROB: Shablon2<PJ16> = {
  no: 16,
  prototip: 'Неравенство с корнем и дробью: замена, полный квадрат в числителе, переход к x²',
  sobrat,
};
