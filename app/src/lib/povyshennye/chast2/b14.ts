/**
 * №14 (варианты 3–4): показательное уравнение с x³ или x⁴ в показателе.
 *
 * B^{g−w+c₁} + B^{g+w+c₂} − K·B^g = 0 (вид «плюс», вариант 3) или
 * B^{g+w+c₂} − B^{g−w+c₁} + K·B^g = 0 (вид «минус», вариант 4), где
 * g = xⁿ, w = x² + px. Делим на B^g > 0, y = B^w > 0 — квадратное
 * уравнение; у «плюса» оба корня положительны (два квадратных уравнения
 * от x), у «минуса» один корень отрицательный и отбрасывается.
 *
 * Параметры задают корни: y = B^{wᵢ}; c₁ и K вычисляются, чтобы корни
 * были именно такими.
 */

import { add, mul, neg, rat, ratTex, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import {
  mnogochlen,
  ratDecTexStrict,
  sKornem,
  skTex,
  skToNumber,
  sravnit,
  stepen,
  type SKornem,
} from './chisla';
import type { Chast2Zadacha, Shablon2 } from './types';

type Dr = readonly [number, number];
const R = (d: Dr) => rat(d[0], d[1]);

export interface PB14 {
  /** Основание B (4, 9, 16, 25). */
  B: number;
  /** Основание третьего слагаемого r, B = r^s (2 для 4 и 16, 3 для 9). */
  r: number;
  /** Степень g = xⁿ. */
  n: 3 | 4;
  /** w = x² + p·x. */
  p: number;
  vid: 'plus' | 'minus';
  /** Значения w (y = B^w): у «плюса» два, у «минуса» одно. */
  w: readonly Dr[];
  /** Сдвиг c₂ во втором показателе. */
  c2: Dr;
  /** У «минуса» — сдвиг c₁ (у «плюса» c₁ = c₂ + w₁ + w₂). */
  c1?: Dr;
  /** Отрезок пункта б. */
  lo: number;
  hi: number;
}

export function chislaB14(p: PB14) {
  const c2 = R(p.c2);
  const ys = p.w.map((w) => stepen(p.B, R(w)));
  const Bc2 = stepen(p.B, c2);
  let c1: Rat;
  let K: Rat;
  let yNeg: Rat | null = null;
  if (p.vid === 'plus') {
    c1 = add(c2, add(R(p.w[0]!), R(p.w[1]!)));
    K = mul(Bc2, add(ys[0]!, ys[1]!));
  } else {
    c1 = R(p.c1!);
    /* Произведение корней −B^{c₁−c₂}: второй корень −B^{c₁−c₂}/y₁. */
    yNeg = mul(stepen(p.B, sub(c1, c2)), rat(ys[0]!.d, ys[0]!.n));
    K = mul(Bc2, sub(yNeg, ys[0]!));
  }
  const Bc1 = stepen(p.B, c1);
  /* Корни по x: x² + px − wᵢ = 0. */
  const korni: SKornem[] = [];
  for (const w of p.w) {
    const D = add(rat(p.p * p.p), mul(rat(4), R(w)));
    if (D.n < 0n) continue;
    const u = rat(-p.p, 2);
    const D4 = mul(D, rat(1, 4));
    if (D.n === 0n) korni.push(sKornem(u, D4, 1));
    else korni.push(sKornem(u, D4, -1), sKornem(u, D4, 1));
  }
  korni.sort((a, b) => skToNumber(a) - skToNumber(b));
  return { c1, c2, K, Bc1, Bc2, ys, yNeg, korni };
}

function sobrat(p: PB14): Chast2Zadacha {
  const { c1, c2, K, Bc1, Bc2, ys, yNeg, korni } = chislaB14(p);
  if (K.d !== 1n || K.n <= 0n) throw new Error('b14: K не натуральное');
  if ((p.vid === 'plus') !== (p.w.length === 2)) throw new Error('b14: число корней y');
  if (korni.length < 2) throw new Error('b14: мало корней');
  const s = Math.round(Math.log(p.B) / Math.log(p.r));
  if (p.r ** s !== p.B) throw new Error('b14: B ≠ r^s');

  const one = rat(1);
  const g = (c: Rat): [Rat, number] => [c, p.n];
  const e1 = mnogochlen([g(one), [rat(-1), 2], [rat(-p.p), 1], [c1, 0]]);
  const e2 = mnogochlen([g(one), [one, 2], [rat(p.p), 1], [c2, 0]]);
  const Kn = Number(K.n);
  const tretiy =
    Kn % p.r === 0
      ? `${Kn / p.r === 1 ? '' : `${Kn / p.r}\\cdot `}${p.r}^{${s}x^${p.n}+1}`
      : `${Kn}\\cdot ${p.B}^{x^${p.n}}`;
  const ur =
    p.vid === 'plus'
      ? `${p.B}^{${e1}}+${p.B}^{${e2}}-${tretiy}=0`
      : `${p.B}^{${e2}}-${p.B}^{${e1}}+${tretiy}=0`;
  const lo = rat(Math.round(p.lo * 10), 10);
  const hi = rat(Math.round(p.hi * 10), 10);
  const uslovie =
    `а) Решите уравнение $${ur}$.\n` +
    `б) Найдите все корни этого уравнения, принадлежащие отрезку $\\left[${ratDecTexStrict(lo)};\\ ${ratDecTexStrict(hi)}\\right]$.`;

  const w = mnogochlen([
    [one, 2],
    [rat(p.p), 1],
  ]);
  const mw = mnogochlen([
    [rat(-1), 2],
    [rat(-p.p), 1],
  ]);
  const BgTex = `${p.B}^{x^${p.n}}`;
  /* Квадратное от y: A y² ∓ K y ± C = 0 с целыми коэффициентами. */
  const L = lcmBig(Bc2.d, Bc1.d);
  const A = (Bc2.n * L) / Bc2.d;
  const Kc = K.n * L;
  const C = (Bc1.n * L) / Bc1.d;
  const gg = gcdBig(gcdBig(A, Kc), C);
  const [a2, a1, a0] = [A / gg, Kc / gg, C / gg];
  const kvY = p.vid === 'plus' ? `${a2}y^2-${a1}y+${a0}=0` : `${a2}y^2+${a1}y-${a0}=0`;
  const yKorni = p.vid === 'plus' ? ys.map(ratTex) : [ratTex(ys[0]!), ratTex(neg(yNeg!))];

  const em = mnogochlen([
    [rat(-1), 2],
    [rat(-p.p), 1],
    [c1, 0],
  ]);
  const ep = mnogochlen([
    [one, 2],
    [rat(p.p), 1],
    [c2, 0],
  ]);
  const delenie =
    p.vid === 'plus'
      ? `${p.B}^{${em}}+${p.B}^{${ep}}-${Kn}=0`
      : `${p.B}^{${ep}}-${p.B}^{${em}}+${Kn}=0`;
  const naY = `\\dfrac{${Bc1.n}}{${Bc1.d === 1n ? '' : Bc1.d}y}`;
  const koefY = Bc2.d === 1n ? `${Bc2.n}` : `\\dfrac{${Bc2.n}}{${Bc2.d}}`;
  const vY = p.vid === 'plus' ? `${naY}+${koefY}y-${Kn}=0` : `${koefY}y-${naY}+${Kn}=0`;

  const kvX = p.w.map((wv) => {
    const W = R(wv);
    const ur2 = `${mnogochlen([
      [one, 2],
      [rat(p.p), 1],
      [neg(W), 0],
    ])}=0`;
    const D = add(rat(p.p * p.p), mul(rat(4), W));
    const kor = korni.filter((x) => {
      const v = skToNumber(x);
      return Math.abs(v * v + p.p * v - toNumber(W)) < 1e-9;
    });
    return {
      W,
      ur2,
      D,
      tekst:
        D.n < 0n
          ? `$${ur2}$: дискриминант $${ratTex(D)}<0$, корней нет.`
          : `$${ur2}$: $D=${ratTex(D)}$, $x=${kor.map(skTex).join('$ или $x=')}$.`,
    };
  });

  /* б) Отбор: сравнение с концами. */
  const v: SKornem[] = [];
  const otbor = korni.map((x) => {
    const a = sravnit(x, lo);
    const b = sravnit(x, hi);
    const vnutri = a.znak >= 0 && b.znak <= 0;
    if (vnutri) v.push(x);
    const xt = skTex(x);
    let why: string;
    if (a.znak < 0)
      why = `$${xt}<${ratDecTexStrict(lo)}$${a.pochemu === null ? '' : `: ${a.pochemu}`}`;
    else if (b.znak > 0)
      why = `$${xt}>${ratDecTexStrict(hi)}$${b.pochemu === null ? '' : `: ${b.pochemu}`}`;
    else {
      const ob = [a.pochemu, b.pochemu].filter((q) => q !== null).join('; ');
      why = `$${ratDecTexStrict(lo)}\\le ${xt}\\le ${ratDecTexStrict(hi)}$${ob === '' ? '' : `: ${ob}`}`;
    }
    return `${why} — ${vnutri ? 'подходит' : 'не подходит'}.`;
  });
  if (v.length === 0) throw new Error('b14: на отрезке нет корней');

  const vseTex = korni.map(skTex);
  const vTex = v.map(skTex);
  return {
    no: 14,
    shablon: 'b14.pokazStepen',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Корни уравнения', pole: { vid: 'korni', verno: vseTex } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vTex } },
    ],
    otvet: `а) $${vseTex.join(';\\ ')}$; б) $${vTex.join(';\\ ')}$`,
    reshenie: [
      {
        title: 'а) Делим на степень с $x^{' + p.n + '}$',
        lines: [
          `$${tretiy}=${Kn}\\cdot ${BgTex}$. Разделим обе части на $${BgTex}>0$:`,
          `$${delenie}$.`,
        ],
      },
      {
        title: 'а) Замена',
        lines: [
          `Пусть $y=${p.B}^{${w}}$, $y>0$. Тогда $${p.B}^{${mw}}=\\dfrac{1}{y}$ и уравнение принимает вид $${vY}$.`,
          `Умножаем на $y\\ne0$: $${kvY}$, откуда $y=${yKorni.join('$ или $y=')}$.`,
          ...(p.vid === 'minus' ? [`Корень $y=${ratTex(neg(yNeg!))}$ не подходит: $y>0$.`] : []),
        ],
      },
      {
        title: 'а) Возвращаемся к $x$',
        lines: [
          ...p.w.map(
            (wv, i) =>
              `$${p.B}^{${w}}=${ratTex(ys[i]!)}=${p.B}^{${ratDecTexStrict(R(wv))}}$, то есть ${kvX[i]!.tekst}`,
          ),
          `Ответ а): $${vseTex.join(';\\ ')}$.`,
        ],
      },
      {
        title: 'б) Отбираем корни на отрезке',
        lines: [...otbor, `Ответ б): $${vTex.join(';\\ ')}$.`],
      },
    ],
    razbor: [
      { slovo: `Делим уравнение на $${BgTex}$`, formula: delenie },
      { slovo: `Замена $y=${p.B}^{${w}}>0$`, formula: kvY },
      {
        slovo:
          p.vid === 'plus' ? 'Оба корня $y$ положительны' : 'Отрицательный корень $y$ отбрасываем',
        formula: `y=${yKorni.join(',\\ y=')}`,
      },
      { slovo: 'Решаем квадратные уравнения относительно $x$', formula: vseTex.join(';\\ ') },
      { slovo: 'Сравниваем корни с концами отрезка', formula: vTex.join(';\\ ') },
    ],
    kontrol: {
      korni: korni.map(skToNumber),
      otbor: v.map(skToNumber),
      c1: toNumber(c1),
      c2: toNumber(c2),
      K: Kn,
      lo: p.lo,
      hi: p.hi,
    },
  };
}

function gcdBig(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}
const lcmBig = (a: bigint, b: bigint) => (a / gcdBig(a, b)) * b;

export const B14_POKAZ_STEPEN: Shablon2<PB14> = {
  no: 14,
  prototip: 'Показательное уравнение с xⁿ в показателе: деление, замена y = B^{x²+px}, квадратные',
  sobrat,
};
