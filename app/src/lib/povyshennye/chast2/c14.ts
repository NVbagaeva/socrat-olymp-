/**
 * №14: a·sin 2x + b·cos 2x = c. Правая часть c = c(sin²x + cos²x),
 * синус и косинус двойного угла — через sin x и cos x: однородное
 * уравнение второй степени, после деления на cos²x — квадратное
 * относительно t = tg x:
 *
 *   (c + b)t² − 2a·t + (c − b) = 0,  D/4 = a² + b² − c² = d².
 *
 * Корни t = (a ± d)/(c + b) рациональные: a² + b² и c² + d² — суммы
 * квадратов с одной гипотенузой, как в образцах (24, 7 / 15, 20 и
 * 20, 15 / 7, 24). Ответ а) — две серии arctg t + πn; б) — по корню
 * каждой серии на отрезке длины π с концами, кратными π/2.
 */

import { neg, rat, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { piTex, ratTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PC14 {
  /** Коэффициент при sin 2x. */
  a: number;
  /** Коэффициент при cos 2x. */
  b: number;
  /** Правая часть. */
  c: number;
  /** cos 2x записан первым (как в варианте 6). */
  cosFirst?: boolean;
  /** Отрезок [lo·π/2; (lo + 2)·π/2]. */
  lo: number;
}

/** t = tg x — корни квадратного уравнения, по возрастанию. */
export function korniC14(p: Pick<PC14, 'a' | 'b' | 'c'>): { d: number; t: Rat[] } | null {
  const d2 = p.a * p.a + p.b * p.b - p.c * p.c;
  const d = Math.round(Math.sqrt(Math.max(0, d2)));
  if (d2 <= 0 || d * d !== d2 || p.c + p.b === 0 || p.c === p.b) return null;
  const t = [rat(p.a - d, p.c + p.b), rat(p.a + d, p.c + p.b)].sort(
    (x, y) => toNumber(x) - toNumber(y),
  );
  return { d, t };
}

/** t = ±1: arctg t = ±π/4 — корни записываются кратными π. */
const edinica = (t: Rat) => t.d === 1n && (t.n === 1n || t.n === -1n);

/** «arctg t» в TeX: t > 0 — «\operatorname{arctg}2», t < 0 — «-\operatorname{arctg}\dfrac{2}{11}», t = ±1 — «±π/4». */
export function arctgTex(t: Rat): string {
  if (edinica(t)) return piTex(rat(Number(t.n), 4));
  const m = t.n < 0n ? neg(t) : t;
  return `${t.n < 0n ? '-' : ''}\\operatorname{arctg}${ratTex(m)}`;
}

/** arctg t + Nπ: «\operatorname{arctg}2+\pi», «3\pi-\operatorname{arctg}\dfrac{1}{5}», «\dfrac{5\pi}{4}». */
function koren(t: Rat, N: number): string {
  if (edinica(t)) return piTex(rat(Number(t.n) + 4 * N, 4));
  if (N === 0) return arctgTex(t);
  const pi = piTex(rat(Math.abs(N)));
  if (t.n < 0n && N > 0) return `${pi}${arctgTex(t)}`;
  return `${arctgTex(t)}${N > 0 ? '+' : '-'}${pi}`;
}

/** Член «k·f» со знаком: первый без «+», единица не пишется. */
function chlen(k: number, f: string, first: boolean): string {
  const z = k < 0 ? '-' : first ? '' : '+';
  const m = Math.abs(k);
  return `${z}${m === 1 ? '' : m}${f}`;
}

/** Ax² + Bx + C с переменной v. */
function kvTex(A: number, B: number, C: number, v: string): string {
  return (
    chlen(A, `${v}^2`, true) +
    (B === 0 ? '' : chlen(B, v, false)) +
    (C === 0 ? '' : `${C < 0 ? '-' : '+'}${Math.abs(C)}`)
  );
}

function nod(x: number, y: number): number {
  return y === 0 ? Math.abs(x) : nod(y, x % y);
}

function sobrat(p: PC14): Chast2Zadacha {
  const k = korniC14(p);
  if (k === null) throw new Error('c14: корни tg x не рациональные или t = 0');
  const { d, t } = k;
  /* Номер N для каждой серии: arctg t + Nπ на отрезке (концы — не корни). */
  const lo = (p.lo * Math.PI) / 2;
  const hi = ((p.lo + 2) * Math.PI) / 2;
  const NN = t.map((q) => {
    const x0 = Math.atan(toNumber(q));
    const ns = [-8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8].filter((n) => {
      const x = x0 + Math.PI * n;
      return x > lo && x < hi;
    });
    if (ns.length !== 1) throw new Error('c14: на отрезке не один корень серии');
    return ns[0]!;
  });

  const sinT = chlen(p.a, '\\sin2x', !p.cosFirst);
  const cosT = chlen(p.b, '\\cos2x', !!p.cosFirst);
  const lev = p.cosFirst ? `${cosT}${sinT}` : `${sinT}${cosT}`;
  const otr = `\\left[${piTex(rat(p.lo, 2))};\\ ${piTex(rat(p.lo + 2, 2))}\\right]`;
  const uslovie =
    `а) Решите уравнение $${lev}=${p.c}.$\n` +
    `б) Найдите все корни этого уравнения, принадлежащие отрезку $${otr}.$`;

  /* Однородное уравнение: (c + b)sin²x − 2a sin x cos x + (c − b)cos²x = 0. */
  const A = p.c + p.b;
  const B = -2 * p.a;
  const C = p.c - p.b;
  const g = nod(nod(A, B), C) * (A < 0 ? -1 : 1);
  const [A1, B1, C1] = [A / g, B / g, C / g];
  const odnor =
    chlen(A, '\\sin^2x', true) +
    chlen(B, '\\sin x\\cos x', false) +
    (C === 0 ? '' : chlen(C, '\\cos^2x', false));
  const kvadr = kvTex(A1, B1, C1, 't');
  const serii = t.map((q) => `${arctgTex(q)}+\\pi n`);
  const korniB = t.map((q, i) => koren(q, NN[i]!));
  /* Пары по возрастанию значения. */
  const poryadok = t
    .map((q, i) => ({ s: korniB[i]!, v: Math.atan(toNumber(q)) + Math.PI * NN[i]! }))
    .sort((x, y) => x.v - y.v)
    .map((x) => x.s);
  const tList = t.map((q) => `t=${ratTex(q)}`).join(',\\ ');
  const skob = (x: number) => (x < 0 ? `(${x})` : String(x));

  const otbor = t.map((q, i) => {
    const pol = q.n > 0n;
    const N = NN[i]!;
    return (
      `Серия $x=${serii[i]}$: так как $${pol ? '0<' : '-\\dfrac{\\pi}{2}<'}${arctgTex(q)}${pol ? '<\\dfrac{\\pi}{2}' : '<0'}$, ` +
      `корни этой серии при соседних $n$ отличаются на $\\pi$, и отрезку длины $\\pi$ (его концы — не корни) принадлежит ровно один из них — при $n=${N}$: $x=${korniB[i]}$.`
    );
  });

  return {
    no: 14,
    shablon: 'c14.tgPodstanovka',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Серии решений', pole: { vid: 'serii', verno: serii } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: poryadok } },
    ],
    otvet: `а) ${serii.map((s) => `$x=${s},\\ n\\in\\mathbb Z$`).join('; ')}; б) $${poryadok.join(';\\ ')}$`,
    reshenie: [
      {
        title: 'а) Переходим к однородному уравнению',
        lines: [
          `По формулам двойного угла $\\sin2x=2\\sin x\\cos x$, $\\cos2x=\\cos^2x-\\sin^2x$, а правую часть запишем как $${p.c}=${p.c}\\left(\\sin^2x+\\cos^2x\\right)$:`,
          `$${chlen(2 * p.a, '\\sin x\\cos x', true)}${chlen(p.b, '\\left(\\cos^2x-\\sin^2x\\right)', false)}=${p.c}\\left(\\sin^2x+\\cos^2x\\right)$.`,
          `Переносим всё в одну часть: $${odnor}=0$.`,
        ],
      },
      {
        title: 'а) Делим на $\\cos^2x$',
        lines: [
          `Если $\\cos x=0$, то $\\sin^2x=1$, и уравнение даёт $${A}=0$ — неверно. Значит, $\\cos x\\ne0$, и можно разделить на $\\cos^2x$.`,
          `Обозначим $t=\\operatorname{tg}x$: $${kvTex(A, B, C, 't')}=0$${g === 1 ? '' : `, то есть $${kvadr}=0$`}.`,
        ],
      },
      {
        title: 'а) Решаем квадратное уравнение',
        lines: [
          `$\\dfrac D4=${skob(p.a)}^2-${skob(A)}\\cdot${skob(C)}=${d * d}=${d}^2$, $t=\\dfrac{${p.a}\\pm${d}}{${A}}$, то есть $${tList}$.`,
          `$\\operatorname{tg}x=${ratTex(t[0]!)}$ или $\\operatorname{tg}x=${ratTex(t[1]!)}$, откуда $x=${serii[0]}$ или $x=${serii[1]}$, $n\\in\\mathbb Z$.`,
        ],
      },
      { title: 'б) Отбираем корни на отрезке', lines: otbor },
      {
        title: 'Ответ',
        lines: [
          `а) $x=${serii.join(',\\ x=')}$, $n\\in\\mathbb Z$; б) $${poryadok.join(';\\ ')}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo:
          'Двойные углы — через $\\sin x$ и $\\cos x$, правую часть умножаем на $\\sin^2x+\\cos^2x$',
        formula: `${odnor}=0`,
      },
      {
        slovo: '$\\cos x\\ne0$: делим на $\\cos^2x$, $t=\\operatorname{tg}x$',
        formula: `${kvadr}=0`,
      },
      { slovo: 'Корни квадратного уравнения', formula: tList },
      { slovo: 'Две серии через арктангенс', formula: `x=${serii.join(',\\quad x=')}` },
      {
        slovo: 'На отрезке длины $\\pi$ — по одному корню каждой серии',
        formula: poryadok.join(';\\ '),
      },
    ],
    kontrol: {
      t: t.map(toNumber),
      korni: t.map((q, i) => Math.atan(toNumber(q)) + Math.PI * NN[i]!).sort((x, y) => x - y),
      lo,
      hi,
    },
  };
}

export const C14_TG_PODSTANOVKA: Shablon2<PC14> = {
  no: 14,
  prototip:
    'a·sin 2x + b·cos 2x = c: однородное уравнение, tg x, серии с арктангенсом, отбор на отрезке длины π',
  sobrat,
};
