/**
 * №16 (варианты 13–14): ±log_{1/q}((x−c)/(x+c)) + 2log_{q²}(x² − c²) ⋚ K.
 *
 * ОДЗ: (x−c)/(x+c) > 0 и x² − c² > 0, то есть |x| > c. На ОДЗ
 * 2log_{q²}(x² − c²) = log_q(x² − c²) и log_{1/q}u = −log_q u, поэтому
 * сумма равна log_q (x + c)² (знак «+» у log_{1/q}) или log_q (x − c)²
 * («−»). Неравенство: (x ± c)² ⋚ q^K ⇔ |x ± c| ⋚ d, d = q^{K/2}.
 * Ответ — пересечение с ОДЗ.
 */

import type { Kusok, Mnozhestvo } from '@/lib/chast2/sravnenie';
import { add, neg, rat, ratTex } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PG16 {
  q: number;
  c: number;
  /** +1: «+log_{1/q}», сумма = log_q (x + c)²; −1: «−log_{1/q}», (x − c)². */
  sg: 1 | -1;
  K: number;
  znak: 'ge' | 'le';
  /** Порядок слагаемых в условии. */
  pervym: 'drob' | 'kvadrat';
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

/** u ± d, d = √(q^K): TeX и число. */
function tochka(u: number, znak: 1 | -1, p: PG16): Tch {
  const d = sqrtRat(rat(p.q ** Math.max(p.K, 0), p.q ** Math.max(-p.K, 0)));
  const v = u + znak * Math.sqrt(p.q ** p.K);
  if (d.m === 1n) {
    const x = add(rat(u), znak > 0 ? d.k : neg(d.k));
    return { v, tex: ratTex(x) };
  }
  const dT = surdTex(d);
  if (u === 0) return { v, tex: `${znak < 0 ? '-' : ''}${dT}` };
  return { v, tex: `${u}${znak < 0 ? '-' : '+'}${dT}` };
}

export function chislaG16(p: PG16) {
  const c = p.c;
  const u = -p.sg * c; // (x − u)² ⋚ q^K, центр u
  const dv = Math.sqrt(p.q ** p.K);
  const L = tochka(u, -1, p);
  const R = tochka(u, 1, p);
  const mc: Tch = { v: -c, tex: `${-c}` };
  const pc: Tch = { v: c, tex: `${c}` };
  /* Решения без ОДЗ. */
  const bez: Kus[] =
    p.znak === 'ge'
      ? [
          { lo: null, hi: L, loZ: false, hiZ: true },
          { lo: R, hi: null, loZ: true, hiZ: false },
        ]
      : [{ lo: L, hi: R, loZ: true, hiZ: true }];
  /* ОДЗ: (−∞; −c) ∪ (c; +∞). */
  const odz: Kus[] = [
    { lo: null, hi: mc, loZ: false, hiZ: false },
    { lo: pc, hi: null, loZ: false, hiZ: false },
  ];
  const out: Kus[] = [];
  const lv = (t: Tch | null) => (t === null ? -Infinity : t.v);
  const hv = (t: Tch | null) => (t === null ? Infinity : t.v);
  for (const a of bez)
    for (const b of odz) {
      const loA = lv(a.lo);
      const loB = lv(b.lo);
      const hiA = hv(a.hi);
      const hiB = hv(b.hi);
      let lo: Tch | null;
      let loZ: boolean;
      if (loA > loB + 1e-12) {
        lo = a.lo;
        loZ = a.loZ;
      } else if (loB > loA + 1e-12) {
        lo = b.lo;
        loZ = b.loZ;
      } else {
        lo = a.lo;
        loZ = a.loZ && b.loZ;
      }
      let hi: Tch | null;
      let hiZ: boolean;
      if (hiA < hiB - 1e-12) {
        hi = a.hi;
        hiZ = a.hiZ;
      } else if (hiB < hiA - 1e-12) {
        hi = b.hi;
        hiZ = b.hiZ;
      } else {
        hi = a.hi;
        hiZ = a.hiZ && b.hiZ;
      }
      if (lv(lo) < hv(hi) - 1e-12) out.push({ lo, hi, loZ, hiZ });
    }
  out.sort((x, y) => lv(x.lo) - lv(y.lo));
  if (out.length === 0) throw new Error('g16: пусто');
  return { u, dv, L, R, kuski: out };
}

const kusTex = (k: Kus) =>
  `\\left${k.loZ ? '[' : '('}${k.lo?.tex ?? '-\\infty'};\\ ${k.hi?.tex ?? '+\\infty'}\\right${k.hiZ ? ']' : ')'}`;

const pole = (t: Tch | null, inf: string) =>
  t === null ? inf : t.tex.replace(/\\dfrac/g, '\\frac');

function sobrat(p: PG16): Chast2Zadacha {
  const ch = chislaG16(p);
  const c = p.c;
  const q = p.q;
  const drob = `\\log_{${dec(1 / q)}}\\dfrac{x-${c}}{x+${c}}`;
  const kvadr = `2\\log_{${q * q}}\\left(x^2-${c * c}\\right)`;
  const zn = p.znak === 'ge' ? '\\ge' : '\\le';
  const levo =
    p.pervym === 'drob'
      ? `${p.sg > 0 ? '' : '-'}${drob}+${kvadr}`
      : `${kvadr}${p.sg > 0 ? '+' : '-'}${drob}`;
  const ner = `${levo}${zn}${p.K}`;
  const xc = p.sg > 0 ? `x+${c}` : `x-${c}`;
  const otv = ch.kuski.map(kusTex).join('\\cup');
  const vPole: Mnozhestvo = {
    kuski: ch.kuski.map((k): Kusok => ({
      t: 'interval',
      lo: pole(k.lo, '-inf'),
      loZakr: k.loZ,
      hi: pole(k.hi, 'inf'),
      hiZakr: k.hiZ,
    })),
  };
  const qK = p.K >= 0 ? `${q ** p.K}` : `\\dfrac{1}{${q ** -p.K}}`;
  const dT = surdTex(sqrtRat(rat(q ** Math.max(p.K, 0), q ** Math.max(-p.K, 0))));
  const sravn = (t: Tch) => {
    const blizh = t.v > 0 ? c : -c;
    return `${t.tex}${t.v > blizh ? '>' : '<'}${blizh}`;
  };
  return {
    no: 16,
    shablon: 'g16.logDrob',
    uslovie: `Решите неравенство $${ner}$.`,
    risunok: null,
    punkty: [
      { bukva: null, podpis: 'Множество решений', pole: { vid: 'promezhutki', verno: vPole } },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'ОДЗ',
        lines: [
          `$\\dfrac{x-${c}}{x+${c}}>0$ и $x^2-${c * c}>0$: обе дроби положительны ровно при $|x|>${c}$, то есть $x\\in(-\\infty;\\ -${c})\\cup(${c};\\ +\\infty)$.`,
        ],
      },
      {
        title: 'Один логарифм',
        lines: [
          `На ОДЗ $2\\log_{${q * q}}\\left(x^2-${c * c}\\right)=\\log_{${q}}\\left(x^2-${c * c}\\right)$ и $\\log_{${dec(1 / q)}}u=-\\log_{${q}}u$.`,
          p.sg > 0
            ? `Левая часть равна $\\log_{${q}}\\left(x^2-${c * c}\\right)-\\log_{${q}}\\dfrac{x-${c}}{x+${c}}=\\log_{${q}}\\dfrac{(x-${c})(x+${c})(x+${c})}{x-${c}}=\\log_{${q}}(x+${c})^2$.`
            : `Левая часть равна $\\log_{${q}}\\left(x^2-${c * c}\\right)+\\log_{${q}}\\dfrac{x-${c}}{x+${c}}=\\log_{${q}}\\dfrac{(x-${c})(x+${c})(x-${c})}{x+${c}}=\\log_{${q}}(x-${c})^2$.`,
          `Основание $${q}>1$: $(${xc})^2${zn}${q}^{${p.K}}=${qK}$, то есть $|${xc}|${zn}${dT}$.`,
        ],
      },
      {
        title: 'Пересечение с ОДЗ',
        lines: [
          p.znak === 'ge'
            ? `$x\\le ${ch.L.tex}$ или $x\\ge ${ch.R.tex}$.`
            : `$${ch.L.tex}\\le x\\le ${ch.R.tex}$.`,
          `Сравниваем концы с $\\pm${c}$: $${sravn(ch.L)}$, $${sravn(ch.R)}$ (так как $${dT}${ch.dv > 2 * c ? '>' : '<'}${2 * c}$${ch.dv > c ? `, $${dT}>${c}$` : `, $${dT}<${c}$`}).`,
          `Ответ: $${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'ОДЗ', formula: `|x|>${c}` },
      { slovo: 'Сводим к одному логарифму', formula: `\\log_{${q}}(${xc})^2${zn}${p.K}` },
      { slovo: 'Модуль', formula: `|${xc}|${zn}${dT}` },
      { slovo: 'Ответ с учётом ОДЗ', formula: otv },
    ],
    kontrol: {
      kuski: ch.kuski.flatMap((k) => [
        k.lo?.v ?? -1e9,
        k.hi?.v ?? 1e9,
        k.loZ ? 1 : 0,
        k.hiZ ? 1 : 0,
      ]),
    },
  };
}

/** Основание 1/q: «0{,}5», «0{,}2», иначе дробь. */
function dec(x: number): string {
  const q = Math.round(1 / x);
  let m = q;
  while (m % 2 === 0) m /= 2;
  while (m % 5 === 0) m /= 5;
  return m === 1 ? String(Math.round(x * 1e6) / 1e6).replace('.', '{,}') : `\\frac{1}{${q}}`;
}

export const G16_LOG_DROB: Shablon2<PG16> = {
  no: 16,
  prototip: 'Логарифмы дроби (x−c)/(x+c) и x² − c²: сведение к log (x ± c)², модуль, ОДЗ',
  sobrat,
};
