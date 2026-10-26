/**
 * №16 (варианты 3–4): биквадратное неравенство относительно логарифма.
 *
 * C₄·log⁴_{q^α}(M − x²) ∓ C₂·log²_{q^β}(M − x²) ± C₀ ⋚ 0. Через
 * t = log_q(M − x²) оно сводится к (t² − r₁)(t² − r₂) ⋚ 0, корни r₁ < r₂
 * у t² — квадраты (или r₁ < 0). Решение по t → по y = M − x² ∈ (0; M] →
 * по x: симметричные промежутки с концами ±√(M − y).
 */

import { add, mul, rat, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber, type Surd } from '@/lib/zadanie15/core/surd';
import type { Mnozhestvo } from '@/lib/chast2/sravnenie';
import { stepen } from './chisla';
import { ratTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

type Dr = readonly [number, number];

export interface PB16 {
  /** Основание q (2, 3, 5). */
  q: number;
  /** Аргумент M − x². */
  M: number;
  /** Основание четвёртой степени логарифма — q^α (α = 1/2 → √q). */
  al: Dr;
  /** Основание квадрата логарифма — q^β. */
  be: Dr;
  /** Корни трёхчлена от T = t²: r₁ < r₂, r₂ и неотрицательный r₁ — квадраты. */
  r1: number;
  r2: number;
  znak: 'ge' | 'le';
  /** Общий множитель λ: C₄ = λα⁴, C₂ = λ(r₁ + r₂)β², C₀ = λr₁r₂. */
  lam: number;
  /** Свободный член перенесён вправо (как «≥ 64»). */
  vpravo?: boolean;
}

/** Кусок по y (или x): концы — дроби, null — бесконечность. */
interface KusokY {
  lo: Rat;
  hi: Rat;
  loZ: boolean;
  hiZ: boolean;
}

export interface KusokX {
  lo: Surd | null;
  hi: Surd | null;
  loZ: boolean;
  hiZ: boolean;
}

const isqrt = (n: number) => {
  const k = Math.round(Math.sqrt(n));
  if (k * k !== n) throw new Error(`b16: ${n} не квадрат`);
  return k;
};

/** Основание логарифма q^e в TeX: √2, 4, ∛3. */
function osnTex(q: number, e: Dr): string {
  if (e[0] === 1 && e[1] === 2) return `\\sqrt{${q}}`;
  if (e[0] === 1 && e[1] === 3) return `\\sqrt[3]{${q}}`;
  if (e[1] === 1) return `${q ** e[0]}`;
  throw new Error('b16: основание');
}

export function chislaB16(p: PB16) {
  const al = rat(p.al[0], p.al[1]);
  const be = rat(p.be[0], p.be[1]);
  const al4 = mul(mul(al, al), mul(al, al));
  const be2 = mul(be, be);
  const s = p.r1 + p.r2;
  const P = p.r1 * p.r2;
  const C4 = mul(rat(p.lam), al4);
  const C2 = mul(rat(p.lam * s), be2);
  const C0 = p.lam * P;
  return { al, be, C4, C2, C0, s, P };
}

/** Множество t-значений → куски по y = q^t (с учётом y > 0). */
function poY(p: PB16): { kuskiT: string; kuskiY: KusokY[] } {
  const ge = p.znak === 'ge';
  const k2 = isqrt(p.r2);
  const k1 = p.r1 >= 0 ? isqrt(p.r1) : null;
  const y = (k: number) => stepen(p.q, rat(k));
  const Z = rat(0);
  const out: KusokY[] = [];
  let kuskiT: string;
  const BIG = rat(10n ** 30n);
  if (ge) {
    /* |t| ≥ k₂ и (если r₁ ≥ 0) |t| ≤ k₁. */
    out.push({ lo: Z, hi: y(-k2), loZ: false, hiZ: true });
    if (k1 !== null) out.push({ lo: y(-k1), hi: y(k1), loZ: true, hiZ: true });
    out.push({ lo: y(k2), hi: BIG, loZ: true, hiZ: false });
    kuskiT =
      k1 === null
        ? `t\\le-${k2}\\ \\text{или}\\ t\\ge${k2}`
        : `t\\le-${k2},\\ ${k1 === 0 ? 't=0' : `-${k1}\\le t\\le${k1}`},\\ t\\ge${k2}`;
  } else if (k1 === null || k1 === 0) {
    out.push({ lo: y(-k2), hi: y(k2), loZ: true, hiZ: true });
    kuskiT = `-${k2}\\le t\\le${k2}`;
  } else {
    out.push({ lo: y(-k2), hi: y(-k1), loZ: true, hiZ: true });
    out.push({ lo: y(k1), hi: y(k2), loZ: true, hiZ: true });
    kuskiT = `-${k2}\\le t\\le-${k1}\\ \\text{или}\\ ${k1}\\le t\\le${k2}`;
  }
  return { kuskiT, kuskiY: out };
}

/** Пересечение с 0 < y ≤ M и переход к x: x² = M − y. */
function poX(p: PB16, kuskiY: KusokY[]): { kuski: KusokX[]; kuskiX2: KusokY[] } {
  const M = rat(p.M);
  const x2: KusokY[] = [];
  for (const k of kuskiY) {
    const hi = toNumber(k.hi) >= p.M ? M : k.hi;
    const hiZ = toNumber(k.hi) >= p.M ? true : k.hiZ;
    if (toNumber(k.lo) > p.M || (toNumber(k.lo) === p.M && !k.loZ)) continue;
    /* y ∈ [lo; hi] ⇔ x² ∈ [M − hi; M − lo]. */
    x2.push({ lo: sub(M, hi), hi: sub(M, k.lo), loZ: hiZ, hiZ: k.loZ });
  }
  x2.sort((a, b) => toNumber(a.lo) - toNumber(b.lo));
  const kuski: KusokX[] = [];
  const pravye: KusokX[] = [];
  for (const k of x2) {
    const a = sqrtRat(k.lo);
    const b = sqrtRat(k.hi);
    if (k.lo.n === 0n) {
      /* x² от 0: один симметричный промежуток. */
      kuski.push({ lo: neg(b), hi: b, loZ: k.hiZ, hiZ: k.hiZ });
    } else {
      kuski.push({ lo: neg(b), hi: neg(a), loZ: k.hiZ, hiZ: k.loZ });
      pravye.push({ lo: a, hi: b, loZ: k.loZ, hiZ: k.hiZ });
    }
  }
  const vse = [...kuski, ...pravye].sort((a, b) => surdToNumber(a.lo!) - surdToNumber(b.lo!));
  return { kuski: vse, kuskiX2: x2 };
}

const neg = (s: Surd): Surd => ({ k: mul(s.k, rat(-1)), m: s.m });

export function mnozhTex(kuski: readonly KusokX[]): string {
  return kuski
    .map((k) =>
      surdToNumber(k.lo!) === surdToNumber(k.hi!)
        ? `\\left\\{${surdTex(k.lo!)}\\right\\}`
        : `\\left${k.loZ ? '[' : '('}${surdTex(k.lo!)};\\ ${surdTex(k.hi!)}\\right${k.hiZ ? ']' : ')'}`,
    )
    .join('\\cup');
}

function vPole(kuski: readonly KusokX[]): Mnozhestvo {
  return {
    kuski: kuski.map((k) =>
      surdToNumber(k.lo!) === surdToNumber(k.hi!)
        ? { t: 'tochka' as const, x: surdTex(k.lo!) }
        : {
            t: 'interval' as const,
            lo: surdTex(k.lo!),
            loZakr: k.loZ,
            hi: surdTex(k.hi!),
            hiZakr: k.hiZ,
          },
    ),
  };
}

function yTex(k: KusokY, M: number): string {
  const lo = ratTex(k.lo);
  const hiInf = toNumber(k.hi) > 1e20;
  const hi = ratTex(k.hi);
  if (k.lo.n === 0n) return `0<y\\le${hi}`;
  if (hiInf) return `y\\ge${lo}`;
  void M;
  return `${lo}\\le y\\le${hi}`;
}

function sobrat(p: PB16): Chast2Zadacha {
  const { C4, C2, C0, s } = chislaB16(p);
  if (C4.d !== 1n || C2.d !== 1n || p.r1 >= p.r2 || p.r2 <= 0)
    throw new Error('b16: коэффициенты не целые');
  const ge = p.znak === 'ge';
  const arg = `${p.M}-x^2`;
  const L4 = `\\log^4_{${osnTex(p.q, p.al)}}\\left(${arg}\\right)`;
  const L2 = `\\log^2_{${osnTex(p.q, p.be)}}\\left(${arg}\\right)`;
  const c4 = C4.n === 1n ? '' : `${C4.n}`;
  const c2 = Number(C2.n);
  const sredn =
    c2 === 0 ? '' : `${c2 > 0 ? '-' : '+'}${Math.abs(c2) === 1 ? '' : Math.abs(c2)}${L2}`;
  const zn = ge ? '\\ge' : '\\le';
  const lev = `${c4}${L4}${sredn}`;
  const ner = p.vpravo
    ? `${lev}${zn}${-C0}`
    : `${lev}${C0 === 0 ? '' : C0 > 0 ? `+${C0}` : `${C0}`}${zn}0`;

  const { kuskiT, kuskiY } = poY(p);
  const { kuski, kuskiX2 } = poX(p, kuskiY);
  if (kuski.length < 2) throw new Error('b16: ответ из одного куска');
  const otvet = mnozhTex(kuski);

  const al = rat(p.al[0], p.al[1]);
  const be = rat(p.be[0], p.be[1]);
  const delT = (e: Rat) =>
    e.n === 1n && e.d === 1n ? 't' : e.d === 1n ? `\\dfrac{t}{${e.n}}` : `${e.d}t`;
  const tr = `t^4${s === 0 ? '' : s > 0 ? `-${s === 1 ? '' : s}t^2` : `+${-s === 1 ? '' : -s}t^2`}${p.r1 * p.r2 === 0 ? '' : p.r1 * p.r2 > 0 ? `+${p.r1 * p.r2}` : `${p.r1 * p.r2}`}`;
  const mn = `\\left(t^2${p.r1 === 0 ? '' : p.r1 > 0 ? `-${p.r1}` : `+${-p.r1}`}\\right)\\left(t^2-${p.r2}\\right)`;

  const x2Tex = kuskiX2.map((k) =>
    k.lo.n === 0n
      ? `0\\le x^2${k.hiZ ? '\\le' : '<'}${ratTex(k.hi)}`
      : `${ratTex(k.lo)}${k.loZ ? '\\le ' : '<'}x^2${k.hiZ ? '\\le' : '<'}${ratTex(k.hi)}`,
  );

  return {
    no: 16,
    shablon: 'b16.logBikvadrat',
    uslovie: `Решите неравенство $${ner}$.`,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество решений',
        pole: { vid: 'promezhutki', verno: vPole(kuski) },
      },
    ],
    otvet: `$${otvet}$`,
    reshenie: [
      {
        title: 'Область определения',
        lines: [`$${arg}>0$, то есть $x^2<${p.M}$.`],
      },
      {
        title: 'Переходим к одному логарифму',
        lines: [
          `Пусть $t=\\log_{${p.q}}\\left(${arg}\\right)$. По свойству логарифма $\\log_{${osnTex(p.q, p.al)}}\\left(${arg}\\right)=${delT(al)}$, $\\log_{${osnTex(p.q, p.be)}}\\left(${arg}\\right)=${delT(be)}$.`,
          `Неравенство принимает вид $${p.lam}\\left(${tr}\\right)${zn}0$, то есть $${mn}${zn}0$.`,
        ],
      },
      {
        title: 'Решаем относительно $t$',
        lines: [
          p.r1 < 0
            ? `Множитель $t^2+${-p.r1}$ положителен, поэтому $t^2${ge ? '\\ge' : '\\le'}${p.r2}$: ${kuskiT.includes('или') || !ge ? `$${kuskiT}$` : `$${kuskiT}$`}.`
            : `Метод интервалов по $T=t^2\\ge0$: $T${ge ? `\\le${p.r1}` : `\\ge${p.r1}`}$ ${ge ? 'или' : 'и'} $T${ge ? `\\ge${p.r2}` : `\\le${p.r2}`}$, то есть $${kuskiT}$.`,
        ],
      },
      {
        title: 'Возвращаемся к $y=' + arg + '$',
        lines: [
          `Функция $y=${p.q}^t$ возрастает, поэтому ${kuskiY.map((k) => `$${yTex(k, p.M)}$`).join(' или ')}.`,
          `Кроме того, $0<y\\le${p.M}$ (так как $x^2\\ge0$). Отсюда ${x2Tex.map((t) => `$${t}$`).join(' или ')}.`,
        ],
      },
      { title: 'Ответ', lines: [`$x\\in${otvet}$.`] },
    ],
    razbor: [
      { slovo: 'Область определения', formula: `x^2<${p.M}` },
      {
        slovo: `Замена $t=\\log_{${p.q}}(${arg})$, логарифмы по другим основаниям выражаем через $t$`,
        formula: `${mn}${zn}0`,
      },
      { slovo: 'Решаем относительно $t$', formula: kuskiT },
      { slovo: 'Переходим к $x^2$ с учётом области определения', formula: x2Tex.join(';\\ ') },
      { slovo: 'Записываем ответ', formula: otvet },
    ],
    utochnenie: { u: 'граничных точек' },
    kontrol: {
      kuski: kuski.flatMap((k) => [
        surdToNumber(k.lo!),
        surdToNumber(k.hi!),
        k.loZ ? 1 : 0,
        k.hiZ ? 1 : 0,
      ]),
      M: p.M,
    },
  };
}

void add;

export const B16_LOG_BIKVADRAT: Shablon2<PB16> = {
  no: 16,
  prototip: 'Биквадратное неравенство относительно логарифма: замена, t², переход к x²',
  sobrat,
};
