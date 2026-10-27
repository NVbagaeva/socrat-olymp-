/**
 * №19 (варианты 7–8): система
 *   (k(px + qy) + m)² = D²,
 *   (x − x₀)² + (y − y₀)² = a^{λ(px + qy) + μ},  a > 0.
 *
 * Первое уравнение — пара параллельных прямых px + qy = s₁, s₂; на них
 * показатель равен 1 и −1, поэтому второе — окружность радиуса √a на
 * первой прямой и радиуса 1/√a на второй. Число решений — сумма
 * числа точек пересечения: n₁(a) = 0, 1, 2 при a <, =, > d₁²;
 * n₂(a) = 2, 1, 0 при a <, =, > 1/d₂².
 */

import type { Kusok, Mnozhestvo } from '@/lib/chast2/sravnenie';
import {
  add,
  cmp,
  div,
  mul,
  neg,
  rat,
  sub,
  toNumber,
  type Rat,
} from '@/lib/zadanie15/core/rational';
import { tochnoTex } from './chisla';
import { dec } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

type Dr = readonly [number, number];
const R = (d: Dr) => rat(d[0], d[1]);

export interface PD19 {
  p: number;
  q: number;
  k: number;
  m: number;
  /** D (дробь) — правая часть первого уравнения D². */
  D: Dr;
  x0: number;
  y0: number;
  /** Сколько решений нужно: {2, 3} как в образце или одно число. */
  nado: readonly number[];
}

export function chislaD19(p: PD19) {
  /* k(px+qy) + m = ±D ⇒ px + qy = (±D − m)/k. */
  const Dv = R(p.D);
  const sA = div(sub(Dv, rat(p.m)), rat(p.k));
  const sB = div(sub(neg(Dv), rat(p.m)), rat(p.k));
  /* Показатель 1 — на прямой с большим s (λ > 0). */
  const s1 = toNumber(sA) > toNumber(sB) ? sA : sB;
  const s2 = s1 === sA ? sB : sA;
  const lam = div(rat(2), sub(s1, s2));
  const mu = neg(div(add(s1, s2), sub(s1, s2)));
  const n2 = rat(p.p * p.p + p.q * p.q);
  const c = rat(p.p * p.x0 + p.q * p.y0);
  const d1 = div(mul(sub(c, s1), sub(c, s1)), n2);
  const d2 = div(mul(sub(c, s2), sub(c, s2)), n2);
  if (d1.n === 0n || d2.n === 0n) throw new Error('d19: центр на прямой');
  const T1 = d1;
  const T2 = div(rat(1), d2);
  return { s1, s2, lam, mu, d1, d2, T1, T2 };
}

/** Число решений при a > 0. */
export function chisloD19(p: PD19, a: number): number {
  const { T1, T2 } = chislaD19(p);
  const t1 = toNumber(T1);
  const t2 = toNumber(T2);
  const eps = 1e-12;
  const n1 = a < t1 - eps ? 0 : Math.abs(a - t1) <= eps ? 1 : 2;
  const n2 = a < t2 - eps ? 2 : Math.abs(a - t2) <= eps ? 1 : 0;
  return n1 + n2;
}

interface KusokA {
  lo: Rat | null;
  hi: Rat | null;
  loZ: boolean;
  hiZ: boolean;
}

export function otvetD19(p: PD19): KusokA[] {
  const { T1, T2 } = chislaD19(p);
  const tochki = [T1, T2].sort((x, y) => toNumber(x) - toNumber(y));
  if (cmp(T1, T2) === 0) throw new Error('d19: пороги совпали');
  const kandidaty: { lo: Rat | null; hi: Rat | null; tochka: boolean }[] = [
    { lo: rat(0), hi: tochki[0]!, tochka: false },
    { lo: tochki[0]!, hi: tochki[0]!, tochka: true },
    { lo: tochki[0]!, hi: tochki[1]!, tochka: false },
    { lo: tochki[1]!, hi: tochki[1]!, tochka: true },
    { lo: tochki[1]!, hi: null, tochka: false },
  ];
  const out: KusokA[] = [];
  for (const k of kandidaty) {
    const a = k.tochka
      ? toNumber(k.lo!)
      : k.hi === null
        ? toNumber(k.lo!) + 1
        : (toNumber(k.lo!) + toNumber(k.hi)) / 2;
    if (!p.nado.includes(chisloD19(p, a))) continue;
    const last = out[out.length - 1];
    if (k.tochka) {
      if (last && last.hi !== null && cmp(last.hi, k.lo!) === 0) last.hiZ = true;
      else out.push({ lo: k.lo, hi: k.lo, loZ: true, hiZ: true });
    } else if (last && last.hi !== null && cmp(last.hi, k.lo!) === 0 && last.hiZ) {
      last.hi = k.hi;
      last.hiZ = false;
    } else out.push({ lo: k.lo, hi: k.hi, loZ: false, hiZ: false });
  }
  return out;
}

const rT = tochnoTex;
const skob = (x: Rat) => (x.n < 0n ? `\\left(${rT(x)}\\right)` : rT(x));
const endT = (x: Rat | null) => (x === null ? '+\\infty' : rT(x));
const pole = (x: Rat | null) => (x === null ? 'inf' : rT(x).replace('{,}', ','));

export function mnozhD19(ks: readonly KusokA[]): string {
  return ks
    .map((k) =>
      k.lo !== null && k.hi !== null && cmp(k.lo, k.hi) === 0
        ? `\\left\\{${rT(k.lo)}\\right\\}`
        : `\\left${k.loZ ? '[' : '('}${endT(k.lo)};\\ ${endT(k.hi)}\\right${k.hiZ ? ']' : ')'}`,
    )
    .join('\\cup');
}

function lin(a: number, b: number, c?: Rat): string {
  const t = (v: number, s: string, first: boolean) =>
    v === 0 ? '' : `${v < 0 ? '-' : first ? '' : '+'}${Math.abs(v) === 1 ? '' : Math.abs(v)}${s}`;
  let s = t(a, 'x', true) + t(b, 'y', a === 0);
  if (c !== undefined && c.n !== 0n) s += `${c.n < 0n ? '-' : '+'}${rT(c.n < 0n ? neg(c) : c)}`;
  return s;
}

function linR(a: Rat, b: Rat, c: Rat): string {
  const f = (v: Rat, s: string, first: boolean) => {
    if (v.n === 0n) return '';
    const ab = v.n < 0n ? neg(v) : v;
    const one = ab.n === 1n && ab.d === 1n;
    return `${v.n < 0n ? '-' : first ? '' : '+'}${one ? '' : rT(ab)}${s}`;
  };
  let s = f(a, 'x', true) + f(b, 'y', a.n === 0n);
  if (c.n !== 0n) s += `${c.n < 0n ? '-' : '+'}${rT(c.n < 0n ? neg(c) : c)}`;
  return s;
}

const SLOVA: Record<string, string> = {
  '2,3': 'два или три решения',
  '2': 'ровно два решения',
  '3': 'ровно три решения',
  '4': 'ровно четыре решения',
};

function sobrat(p: PD19): Chast2Zadacha {
  const c = chislaD19(p);
  const ks = otvetD19(p);
  if (ks.length === 0) throw new Error('d19: пустой ответ');
  const Dv = R(p.D);
  const vnutr = lin(p.k * p.p, p.k * p.q, rat(p.m));
  const eks = linR(mul(c.lam, rat(p.p)), mul(c.lam, rat(p.q)), c.mu);
  const kr = `\\left(x${p.x0 === 0 ? '' : p.x0 > 0 ? `-${p.x0}` : `+${-p.x0}`}\\right)^2+\\left(y${p.y0 === 0 ? '' : p.y0 > 0 ? `-${p.y0}` : `+${-p.y0}`}\\right)^2`;
  const sist = `\\begin{cases}\\left(${vnutr}\\right)^2=${rT(mul(Dv, Dv))},\\\\ ${kr}=a^{${eks}}\\end{cases}`;
  const slovo = SLOVA[p.nado.join(',')] ?? `${p.nado.join(' или ')} решений`;
  const otv = mnozhD19(ks);
  const L = lin(p.p, p.q);
  const n2 = p.p * p.p + p.q * p.q;
  const cc = p.p * p.x0 + p.q * p.y0;
  const tabl: string[] = [];
  const t1 = toNumber(c.T1);
  const t2 = toNumber(c.T2);
  const lo = Math.min(t1, t2);
  const hi = Math.max(t1, t2);
  const opis = (a: number) => {
    const n1 = a < t1 ? 0 : a === t1 ? 1 : 2;
    const n2v = a < t2 ? 2 : a === t2 ? 1 : 0;
    return `${n1}+${n2v}=${n1 + n2v}`;
  };
  const loT = rT(lo === t1 ? c.T1 : c.T2);
  const hiT = rT(hi === t1 ? c.T1 : c.T2);
  tabl.push(`$0<a<${loT}$: решений $${opis(lo / 2)}$;`);
  tabl.push(`$a=${loT}$: $${opis(lo)}$;`);
  tabl.push(`$${loT}<a<${hiT}$: $${opis((lo + hi) / 2)}$;`);
  tabl.push(`$a=${hiT}$: $${opis(hi)}$;`);
  tabl.push(`$a>${hiT}$: $${opis(hi + 1)}$.`);

  return {
    no: 19,
    shablon: 'd19.paraPryamyh',
    uslovie: `Найдите все положительные значения $a$, при каждом из которых система уравнений\n$${sist}$\nимеет ${slovo}.`,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество значений $a$',
        pole: {
          vid: 'promezhutki',
          verno: {
            kuski: ks.map((k): Kusok =>
              k.lo !== null && k.hi !== null && cmp(k.lo, k.hi) === 0
                ? { t: 'tochka', x: pole(k.lo) }
                : { t: 'interval', lo: pole(k.lo), loZakr: k.loZ, hi: pole(k.hi), hiZakr: k.hiZ },
            ),
          } satisfies Mnozhestvo,
        },
      },
    ],
    otvet: `$a\\in${otv}$`,
    reshenie: [
      {
        title: 'Первое уравнение — две прямые',
        lines: [
          `$${vnutr}=\\pm${rT(Dv)}$, то есть $${L}=${rT(c.s1)}$ (прямая $\\ell_1$) или $${L}=${rT(c.s2)}$ (прямая $\\ell_2$); прямые параллельны.`,
          `Показатель второго уравнения: $${eks}=${toNumber(c.lam) === 1 ? '' : dec(toNumber(c.lam))}\\left(${L}\\right)${toNumber(c.mu) >= 0 ? '+' : ''}${dec(toNumber(c.mu))}$; на $\\ell_1$ он равен $1$, на $\\ell_2$ — $-1$.`,
        ],
      },
      {
        title: 'Второе уравнение на каждой прямой',
        lines: [
          `На $\\ell_1$: $${kr}=a$ — окружность с центром $Q(${p.x0};\\,${p.y0})$ радиуса $\\sqrt a$; на $\\ell_2$: $${kr}=\\dfrac1a$ — окружность радиуса $\\dfrac{1}{\\sqrt a}$.`,
          `Расстояния от $Q$ до прямых: $d_1^2=\\dfrac{(${cc}-${skob(c.s1)})^2}{${n2}}=${rT(c.d1)}$, $d_2^2=\\dfrac{(${cc}-${skob(c.s2)})^2}{${n2}}=${rT(c.d2)}$.`,
        ],
      },
      {
        title: 'Число точек на каждой прямой',
        lines: [
          `На $\\ell_1$: две точки при $a>${rT(c.T1)}$, одна при $a=${rT(c.T1)}$, ни одной при $a<${rT(c.T1)}$.`,
          `На $\\ell_2$: две точки при $\\dfrac1a>${rT(c.d2)}$, то есть $a<${rT(c.T2)}$; одна при $a=${rT(c.T2)}$; ни одной при $a>${rT(c.T2)}$.`,
          'Прямые параллельны, общих точек у них нет, поэтому решения на $\\ell_1$ и $\\ell_2$ разные.',
        ],
      },
      {
        title: 'Считаем решения',
        lines: [...tabl, `Нужно ${slovo}: $a\\in${otv}$.`],
      },
    ],
    razbor: [
      {
        slovo: 'Первое уравнение — пара параллельных прямых',
        formula: `${L}=${rT(c.s1)},\\ ${L}=${rT(c.s2)}`,
      },
      {
        slovo: 'На прямых показатель равен $\\pm1$: окружности радиусов $\\sqrt a$ и $1/\\sqrt a$',
        formula: `d_1^2=${rT(c.d1)},\\ d_2^2=${rT(c.d2)}`,
      },
      { slovo: 'Складываем числа точек пересечения', formula: otv },
    ],
    utochnenie: {
      u: 'включением или исключением граничных точек',
      u2: 'один из промежутков множества значений $a$, возможно, с включением или исключением граничных точек',
      u3: 'исследованию взаимного расположения окружностей и двух параллельных прямых',
    },
    kontrol: {
      T1: toNumber(c.T1),
      T2: toNumber(c.T2),
      kuski: ks.flatMap((k) => [
        k.lo === null ? 1e9 : toNumber(k.lo),
        k.hi === null ? 1e9 : toNumber(k.hi),
        k.loZ ? 1 : 0,
        k.hiZ ? 1 : 0,
      ]),
    },
  };
}

export const D19_PARA_PRYAMYH: Shablon2<PD19> = {
  no: 19,
  prototip: 'Пара параллельных прямых и окружности радиусов √a и 1/√a: число решений',
  sobrat,
};
