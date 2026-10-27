/**
 * Косинус угла между векторами: пара векторов с целым произведением
 * длин и шаги разбора. Общие для прототипов группы C, опорных задач и
 * раздела «Варианты повышенной сложности» — без банка прототипов.
 */

import { isSquare, simpRoot } from '../../vychisleniya/numbers';
import { d, koren, modul, skalyarnoe, vec } from '../tex';
import { skalyar } from '../troyki';
import type { Shag, Tochka } from '../types';
import { shagOtvet, shagSkalyarnoe } from './common';

export interface Para {
  a: Tochka;
  b: Tochka;
  dot: number;
  /** Произведение длин: целое. */
  proizv: number;
  cos: number;
}

/** Длина в TeX: 10, или \sqrt{72} = 6\sqrt{2}. */
function dlinaTex(p: Tochka): { tex: string; cepochka: string } {
  const q = p[0] * p[0] + p[1] * p[1];
  const { k, m } = simpRoot(q);
  const tex = koren(k, m);
  /* √10 остаётся √10: цепочка «√10 = √10» не нужна. */
  const cepochka = k === 1 && m !== 1 ? tex : `\\sqrt{${q}} = ${tex}`;
  return { tex, cepochka };
}

function shagDlinyKosinus(a: Tochka, b: Tochka, proizv: number): Shag {
  const la = dlinaTex(a);
  const lb = dlinaTex(b);
  const sq = (p: Tochka) =>
    `${p[0] < 0 ? `(${p[0]})` : p[0]}^2 + ${p[1] < 0 ? `(${p[1]})` : p[1]}^2`;
  return {
    zagolovok: 'Длины векторов',
    stroki: [
      `$${modul(vec('a'))} = \\sqrt{${sq(a)}} = ${la.cepochka}$, $${modul(vec('b'))} = \\sqrt{${sq(b)}} = ${lb.cepochka}$.`,
      `$${modul(vec('a'))}\\cdot${modul(vec('b'))} = ${la.tex}\\cdot${lb.tex} = ${proizv}$.`,
    ],
  };
}

/** Пара по двум векторам, если произведение длин рационально; косинус — любой. */
export function paraIz(a: Tochka, b: Tochka): Para | null {
  const q = (a[0] * a[0] + a[1] * a[1]) * (b[0] * b[0] + b[1] * b[1]);
  if (!isSquare(q)) return null;
  const proizv = Math.round(Math.sqrt(q));
  const dot = skalyar(a, b);
  return { a, b, dot, proizv, cos: dot / proizv };
}

export function shagiKosinusa(p: Para, poRisunku: Shag | null): Shag[] {
  const la = dlinaTex(p.a).tex;
  const lb = dlinaTex(p.b).tex;
  const kos: Shag = {
    zagolovok: 'Косинус угла',
    stroki: [
      `$\\cos\\alpha = \\dfrac{${skalyarnoe(vec('a'), vec('b'))}}{${modul(vec('a'))}\\cdot${modul(vec('b'))}}$.`,
      `$\\cos\\alpha = \\dfrac{${d(p.dot)}}{${la}\\cdot${lb}} = \\dfrac{${d(p.dot)}}{${p.proizv}} = ${d(p.cos)}$.`,
    ],
  };
  return [
    ...(poRisunku === null ? [] : [poRisunku]),
    shagSkalyarnoe(['a', p.a], ['b', p.b]),
    shagDlinyKosinus(p.a, p.b, p.proizv),
    kos,
    shagOtvet(p.cos),
  ];
}

