/**
 * №16 (варианты 15–16): √(±(x − x₀)) / (B^{x² − e₁} − S·B^{0,5x² − e₂} + 1) ⋚ 0.
 *
 * t = B^{0,5x² − e₂} > 0, B^{x² − e₁} = A·t², A = B^{2e₂ − e₁}, S = A + 1:
 * знаменатель (At − 1)(t − 1) отрицателен при 1/A < t < 1, то есть
 * u₂ < x² < u₁ (u₁ = 2e₂, u₂ = 2e₂ − 2k, A = B^k), положителен вне этих
 * границ. Числитель ≥ 0 на луче, равен 0 в x₀ — точка входит в ответ,
 * если знаменатель там не ноль.
 */

import type { Kusok, Mnozhestvo } from '@/lib/chast2/sravnenie';
import { rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PH16 {
  B: number;
  /** Показатели: x² − e1 и 0,5x² − e2 (e2 — целое или с половиной). */
  e1: number;
  e2: number;
  /** Числитель √(x₀ − x) ('le': x ≤ x₀) или √(x − x₀) ('ge'). */
  x0: number;
  luch: 'le' | 'ge';
  znak: 'le' | 'ge';
}

interface Tch {
  v: number;
  tex: string;
}
interface Kus {
  lo: Tch | null;
  hi: Tch | null;
  loZ: boolean;
  hiZ: boolean;
}

function koren(u: number, znak: 1 | -1): Tch {
  const s = sqrtRat(rat(u));
  const t = surdTex(s);
  return { v: znak * Math.sqrt(u), tex: znak < 0 ? `-${t}` : t };
}

const dec = (x: number) => String(x).replace('.', '{,}');

function peresech(a: Kus, b: Kus): Kus | null {
  const lv = (t: Tch | null) => (t === null ? -Infinity : t.v);
  const hv = (t: Tch | null) => (t === null ? Infinity : t.v);
  let lo = a.lo;
  let loZ = a.loZ;
  if (lv(b.lo) > lv(a.lo) + 1e-12) {
    lo = b.lo;
    loZ = b.loZ;
  } else if (Math.abs(lv(b.lo) - lv(a.lo)) < 1e-12) loZ = a.loZ && b.loZ;
  let hi = a.hi;
  let hiZ = a.hiZ;
  if (hv(b.hi) < hv(a.hi) - 1e-12) {
    hi = b.hi;
    hiZ = b.hiZ;
  } else if (Math.abs(hv(b.hi) - hv(a.hi)) < 1e-12) hiZ = a.hiZ && b.hiZ;
  if (lv(lo) < hv(hi) - 1e-12) return { lo, hi, loZ, hiZ };
  if (lo !== null && hi !== null && Math.abs(lo.v - hi.v) < 1e-12 && loZ && hiZ)
    return { lo, hi, loZ, hiZ };
  return null;
}

export function chislaH16(p: PH16) {
  const k = 2 * p.e2 - p.e1;
  if (!Number.isInteger(k) || k < 1) throw new Error('h16: k');
  const A = p.B ** k;
  const u1 = 2 * p.e2;
  const u2 = 2 * p.e2 - 2 * k;
  if (!(u2 > 0 && Number.isInteger(u1) && Number.isInteger(u2))) throw new Error('h16: u');
  const r1 = koren(u1, 1);
  const r2 = koren(u2, 1);
  const m1 = koren(u1, -1);
  const m2 = koren(u2, -1);
  /* Знак знаменателя: < 0 на (−√u1; −√u2) ∪ (√u2; √u1). */
  const otric: Kus[] = [
    { lo: m1, hi: m2, loZ: false, hiZ: false },
    { lo: r2, hi: r1, loZ: false, hiZ: false },
  ];
  const polozh: Kus[] = [
    { lo: null, hi: m1, loZ: false, hiZ: false },
    { lo: m2, hi: r2, loZ: false, hiZ: false },
    { lo: r1, hi: null, loZ: false, hiZ: false },
  ];
  const X0: Tch = { v: p.x0, tex: `${p.x0}` };
  const luch: Kus =
    p.luch === 'le'
      ? { lo: null, hi: X0, loZ: false, hiZ: true }
      : { lo: X0, hi: null, loZ: true, hiZ: false };
  const nuzhno = p.znak === 'le' ? otric : polozh;
  let kuski = nuzhno.map((q) => peresech(q, luch)).filter((q): q is Kus => q !== null);
  /* Точка x₀: числитель 0, знаменатель ≠ 0? */
  const x2 = p.x0 * p.x0;
  const znamNol = Math.abs(x2 - u1) < 1e-12 || Math.abs(x2 - u2) < 1e-12;
  const vKuskah = kuski.some(
    (q) => (q.lo === null || q.lo.v <= p.x0 + 1e-12) && (q.hi === null || q.hi.v >= p.x0 - 1e-12),
  );
  if (!znamNol && !vKuskah) kuski.push({ lo: X0, hi: X0, loZ: true, hiZ: true });
  if (!znamNol) {
    /* Конец луча, примыкающий к x₀, делаем закрытым. */
    kuski = kuski.map((q) =>
      q.hi !== null && Math.abs(q.hi.v - p.x0) < 1e-12
        ? { ...q, hiZ: true }
        : q.lo !== null && Math.abs(q.lo.v - p.x0) < 1e-12
          ? { ...q, loZ: true }
          : q,
    );
  }
  kuski.sort((a, b) => (a.lo?.v ?? -Infinity) - (b.lo?.v ?? -Infinity));
  if (kuski.length === 0) throw new Error('h16: пусто');
  return { k, A, u1, u2, r1, r2, kuski, znamNol };
}

const tochka = (q: Kus) => q.lo !== null && q.hi !== null && Math.abs(q.lo.v - q.hi.v) < 1e-12;
const kusTex = (q: Kus) =>
  tochka(q)
    ? `\\left\\{${q.lo!.tex}\\right\\}`
    : `\\left${q.loZ ? '[' : '('}${q.lo?.tex ?? '-\\infty'};\\ ${q.hi?.tex ?? '+\\infty'}\\right${q.hiZ ? ']' : ')'}`;
const pl = (t: Tch | null, inf: string) => (t === null ? inf : t.tex.replace(/\\dfrac/g, '\\frac'));

function sobrat(p: PH16): Chast2Zadacha {
  const ch = chislaH16(p);
  const num =
    p.luch === 'le' ? `\\sqrt{${p.x0}-x}` : p.x0 < 0 ? `\\sqrt{x+${-p.x0}}` : `\\sqrt{x-${p.x0}}`;
  const e1 = `x^2-${dec(p.e1)}`;
  const e2 = `0{,}5x^2-${dec(p.e2)}`;
  const znam = `${p.B}^{${e1}}-${ch.A + 1}\\cdot${p.B}^{${e2}}+1`;
  const zn = p.znak === 'le' ? '\\le' : '\\ge';
  const uslovie = `Решите неравенство $\\dfrac{${num}}{${znam}}${zn}0$.`;
  const otv = ch.kuski.map(kusTex).join('\\cup');
  const vPole: Mnozhestvo = {
    kuski: ch.kuski.map((q): Kusok =>
      tochka(q)
        ? { t: 'tochka', x: pl(q.lo, '') }
        : {
            t: 'interval',
            lo: pl(q.lo, '-inf'),
            loZakr: q.loZ,
            hi: pl(q.hi, 'inf'),
            hiZakr: q.hiZ,
          },
    ),
  };
  const luchT = p.luch === 'le' ? `x\\le ${p.x0}` : `x\\ge ${p.x0}`;
  return {
    no: 16,
    shablon: 'h16.korenPokaz',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: null, podpis: 'Множество решений', pole: { vid: 'promezhutki', verno: vPole } },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Знаменатель',
        lines: [
          `Пусть $t=${p.B}^{${e2}}>0$. Тогда $${p.B}^{${e1}}=${p.B}^{2\\left(${e2}\\right)+${ch.k}}=${ch.A}t^2$, и знаменатель равен $${ch.A}t^2-${ch.A + 1}t+1=(${ch.A}t-1)(t-1)$.`,
          `Он отрицателен при $\\dfrac{1}{${ch.A}}<t<1$, то есть $-${ch.k}<0{,}5x^2-${dec(p.e2)}<0$ (функция $y=${p.B}^s$ возрастает), $${ch.u2}<x^2<${ch.u1}$; положителен при $x^2<${ch.u2}$ или $x^2>${ch.u1}$; равен нулю при $x=\\pm${ch.r2.tex}$ и $x=\\pm${ch.r1.tex}$.`,
        ],
      },
      {
        title: 'Числитель',
        lines: [
          `Корень определён при $${luchT}$, неотрицателен и равен нулю только при $x=${p.x0}$.`,
          ch.znamNol
            ? `При $x=${p.x0}$ знаменатель обращается в ноль — эта точка не входит в ответ.`
            : `При $x=${p.x0}$ знаменатель не равен нулю ($x^2=${p.x0 * p.x0}$), дробь равна $0$ — точка входит в ответ.`,
          `При остальных $x$ из области определения числитель положителен, и знак дроби — знак знаменателя: нужно, чтобы знаменатель был ${p.znak === 'le' ? 'отрицателен' : 'положителен'}.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [
          `${p.znak === 'le' ? `$${ch.u2}<x^2<${ch.u1}$` : `$x^2<${ch.u2}$ или $x^2>${ch.u1}$`} вместе с условием $${luchT}$ и точкой $x=${p.x0}$: $x\\in${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Замена в знаменателе', formula: `(${ch.A}t-1)(t-1),\\ t=${p.B}^{${e2}}` },
      { slovo: 'Знак знаменателя через $x^2$', formula: `${ch.u2}<x^2<${ch.u1}` },
      { slovo: 'Числитель: область и нуль', formula: luchT },
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

export const H16_KOREN_POKAZ: Shablon2<PH16> = {
  no: 16,
  prototip:
    'Корень над показательным знаменателем: замена t = B^{0,5x² − e}, знак через x², нуль числителя',
  sobrat,
};
