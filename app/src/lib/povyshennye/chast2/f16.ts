/**
 * №16 (варианты 11–12):
 *   ((p²)^x − (r₁ + r₂)·p^x + r₁r₂) / (log²_{1/q}(c^x − d) ± log_{1/q}(c^x − d)² + 1) ⋚ 0.
 *
 * log_{1/q}(u)² = 2·log_{1/q}u при u > 0, знаменатель = (L ± 1)² ≥ 0 и
 * обращается в ноль при L = ∓1, то есть c^x = d + q^{±1}. Числитель —
 * (p^x − r₁)(p^x − r₂). Ответ — промежутки между логарифмами с
 * выколотой точкой; сравнения логарифмов — через целое число между ними.
 */

import type { Kusok, Mnozhestvo } from '@/lib/chast2/sravnenie';
import { add, rat, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { tochnoTex } from './chisla';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PF16 {
  p: number;
  r1: number;
  r2: number;
  q: number;
  c: number;
  d: number;
  /** Знак при log_{1/q}(c^x − d)²: + (знаменатель (L + 1)²) или −. */
  sg: 1 | -1;
  znak: 'le' | 'ge';
}

/** Логарифм log_b(arg) с точным представлением. */
interface Lg {
  b: number;
  arg: Rat;
  v: number;
  tex: string;
  pole: string;
}

function lg(b: number, arg: Rat): Lg {
  const v = Math.log(toNumber(arg)) / Math.log(b);
  if (arg.d === 1n) {
    for (let k = 0; k <= 30; k += 1)
      if (b ** k === Number(arg.n)) return { b, arg, v: k, tex: `${k}`, pole: `${k}` };
  }
  const aT = tochnoTex(arg);
  const aP = arg.d === 1n ? `${arg.n}` : `(${arg.n}/${arg.d})`;
  return { b, arg, v, tex: `\\log_{${b}}${aT}`, pole: `\\log_{${b}}${aP}` };
}

/** Почему A < B: целое m между ними или одинаковый аргумент. */
function pochemu(A: Lg, B: Lg): string {
  if (!(A.v < B.v)) throw new Error('f16: порядок');
  const isInt = (L: Lg) => Number.isInteger(L.v) && L.tex === `${L.v}`;
  if (isInt(A) && isInt(B)) return '';
  if (A.b === B.b && !isInt(A) && !isInt(B))
    return `$${A.tex}<${B.tex}$: основание $${A.b}>1$ и $${tochnoTex(A.arg)}<${tochnoTex(B.arg)}$`;
  for (let m = Math.ceil(A.v - 1e-12); m <= Math.floor(B.v + 1e-12); m += 1) {
    const okA = isInt(A) ? A.v <= m : A.v < m;
    const okB = isInt(B) ? m <= B.v : m < B.v;
    if (!okA || !okB) continue;
    const parts: string[] = [];
    if (!isInt(A))
      parts.push(`$${A.tex}<${m}$, так как $${tochnoTex(A.arg)}<${A.b}^{${m}}=${A.b ** m}$`);
    if (!isInt(B))
      parts.push(`$${m}<${B.tex}$, так как $${B.b}^{${m}}=${B.b ** m}<${tochnoTex(B.arg)}$`);
    return parts.join('; ');
  }
  if (A.arg.n === B.arg.n && A.arg.d === B.arg.d && toNumber(A.arg) > 1 && A.b > B.b)
    return `$${A.tex}<${B.tex}$: аргументы равны и больше $1$, а основание $${A.b}>${B.b}$`;
  throw new Error('f16: не умею сравнить');
}

interface Kus {
  lo: Lg | null;
  hi: Lg | null;
  loZ: boolean;
  hiZ: boolean;
}

export function chislaF16(p: PF16) {
  if (!(p.r1 < p.r2) || p.r1 < 1 || p.d < 1) throw new Error('f16: параметры');
  const x1 = lg(p.p, rat(p.r1));
  const x2 = lg(p.p, rat(p.r2));
  const xd = lg(p.c, rat(p.d));
  const u0 = p.sg > 0 ? add(rat(p.d), rat(p.q)) : add(rat(p.d), rat(1, p.q));
  const x0 = lg(p.c, u0);
  /* Числитель ⋚ 0, затем ОДЗ x > xd. */
  let kuski: Kus[] =
    p.znak === 'le'
      ? [{ lo: x1, hi: x2, loZ: true, hiZ: true }]
      : [
          { lo: null, hi: x1, loZ: false, hiZ: true },
          { lo: x2, hi: null, loZ: true, hiZ: false },
        ];
  kuski = kuski
    .filter((k) => k.hi === null || k.hi.v > xd.v)
    .map((k) => (k.lo === null || k.lo.v <= xd.v ? { ...k, lo: xd, loZ: false } : k));
  /* Выкалываем x0. */
  const out: Kus[] = [];
  for (const k of kuski) {
    const vnutri = (k.lo === null || x0.v > k.lo.v) && (k.hi === null || x0.v < k.hi.v);
    if (vnutri) {
      out.push({ lo: k.lo, hi: x0, loZ: k.loZ, hiZ: false });
      out.push({ lo: x0, hi: k.hi, loZ: false, hiZ: k.hiZ });
    } else if (k.hi !== null && Math.abs(x0.v - k.hi.v) < 1e-12) out.push({ ...k, hiZ: false });
    else out.push(k);
  }
  if (out.length === 0) throw new Error('f16: пусто');
  return { x1, x2, xd, x0, u0, kuski: out };
}

const kusTex = (k: Kus) =>
  `\\left${k.loZ ? '[' : '('}${k.lo?.tex ?? '-\\infty'};\\ ${k.hi?.tex ?? '+\\infty'}\\right${k.hiZ ? ']' : ')'}`;

function sumTex(p: number, s: number): string {
  let k = 0;
  let m = s;
  while (m % p === 0) {
    m /= p;
    k += 1;
  }
  const st = k === 0 ? `${p}^x` : `${p}^{x+${k}}`;
  return m === 1 ? st : `${m}\\cdot${st}`;
}

function sobrat(p: PF16): Chast2Zadacha {
  const c = chislaF16(p);
  const S = p.r1 + p.r2;
  const P = p.r1 * p.r2;
  const osn = `\\frac{1}{${p.q}}`;
  const arg = `${p.c}^x-${p.d}`;
  const chisl = `${p.p * p.p}^x-${sumTex(p.p, S)}+${P}`;
  const znam = `\\log^2_{${osn}}\\left(${arg}\\right)${p.sg > 0 ? '+' : '-'}\\log_{${osn}}\\left(${arg}\\right)^2+1`;
  const zn = p.znak === 'le' ? '\\le' : '\\ge';
  const ner = `\\dfrac{${chisl}}{${znam}}${zn}0`;
  const otv = c.kuski.map(kusTex).join('\\cup');
  const pole: Mnozhestvo = {
    kuski: c.kuski.map((k): Kusok => ({
      t: 'interval',
      lo: k.lo?.pole ?? '-inf',
      loZakr: k.loZ,
      hi: k.hi?.pole ?? 'inf',
      hiZakr: k.hiZ,
    })),
  };
  const Lz = p.sg > 0 ? '-1' : '1';
  const u0T = tochnoTex(c.u0);
  /* Сравнения концов. */
  const tochki = [c.xd, c.x1, c.x2, c.x0]
    .sort((a, b) => a.v - b.v)
    .filter((t, i, a) => i === 0 || Math.abs(t.v - a[i - 1]!.v) > 1e-12);
  const sravn = tochki
    .slice(0, -1)
    .map((a, i) => pochemu(a, tochki[i + 1]!))
    .filter((s) => s !== '');
  return {
    no: 16,
    shablon: 'f16.drobLog',
    uslovie: `Решите неравенство $${ner}$.`,
    risunok: null,
    punkty: [
      { bukva: null, podpis: 'Множество решений', pole: { vid: 'promezhutki', verno: pole } },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Знаменатель',
        lines: [
          `ОДЗ: $${arg}>0$, то есть $x>${c.xd.tex}$. Пусть $L=\\log_{${osn}}\\left(${arg}\\right)$; при $${arg}>0$ $\\log_{${osn}}\\left(${arg}\\right)^2=2L$.`,
          `Знаменатель равен $L^2${p.sg > 0 ? '+' : '-'}2L+1=\\left(L${p.sg > 0 ? '+' : '-'}1\\right)^2\\ge0$ и обращается в ноль при $L=${Lz}$: $${arg}=\\left(${osn}\\right)^{${Lz}}=${tochnoTex(p.sg > 0 ? rat(p.q) : rat(1, p.q))}$, $${p.c}^x=${u0T}$, $x=${c.x0.tex}$.`,
          `Значит, при $x\\ne${c.x0.tex}$ из ОДЗ знаменатель положителен, и неравенство равносильно $${chisl}${zn}0$.`,
        ],
      },
      {
        title: 'Числитель',
        lines: [
          `Пусть $t=${p.p}^x>0$: $t^2-${S}t+${P}=(t-${p.r1})(t-${p.r2})${zn}0$, ${p.znak === 'le' ? `$${p.r1}\\le t\\le${p.r2}$` : `$t\\le${p.r1}$ или $t\\ge${p.r2}$`}.`,
          `Функция $y=${p.p}^x$ возрастает: ${p.znak === 'le' ? `$${c.x1.tex}\\le x\\le${c.x2.tex}$` : `$x\\le${c.x1.tex}$ или $x\\ge${c.x2.tex}$`}.`,
        ],
      },
      {
        title: 'Сравнение и ответ',
        lines: [
          `Расположим точки на числовой прямой: $${tochki.map((t) => t.tex).join('<')}$${sravn.length ? ` (${sravn.join('; ')})` : ''}.`,
          `Учитываем ОДЗ $x>${c.xd.tex}$ и $x\\ne${c.x0.tex}$: $x\\in${otv}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Знаменатель — полный квадрат',
        formula: `\\left(L${p.sg > 0 ? '+' : '-'}1\\right)^2`,
      },
      { slovo: 'Числитель раскладываем на множители', formula: `(t-${p.r1})(t-${p.r2})${zn}0` },
      { slovo: 'ОДЗ и выколотая точка', formula: `x>${c.xd.tex},\\ x\\ne${c.x0.tex}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: {
      kuski: c.kuski.flatMap((k) => [
        k.lo?.v ?? -1e9,
        k.hi?.v ?? 1e9,
        k.loZ ? 1 : 0,
        k.hiZ ? 1 : 0,
      ]),
    },
  };
}

export const F16_DROB_LOG: Shablon2<PF16> = {
  no: 16,
  prototip:
    'Дробное неравенство: числитель — квадратный относительно p^x, знаменатель — полный квадрат логарифма',
  sobrat,
};
