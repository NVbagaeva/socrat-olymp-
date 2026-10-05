/**
 * Группа C — косинус угла между векторами: C1, C2.
 *
 * Косинус — конечная десятичная дробь не длиннее двух знаков, а
 * произведение длин рационально: либо обе длины целые (пифагоровы
 * векторы), либо корни сокращаются, как у (6; 6) и (1; 7):
 * 6√2 · 5√2 = 60. Пары перебираются заранее по ограничению и
 * кэшируются; cos = 0 и cos = ±1 исключены, отрицательных —
 * примерно треть.
 */

import { isSquare, nice, simpRoot } from '../../vychisleniya/numbers';
import { OKNO_DVA, razmestit } from '../razmeshchenie';
import { d, koren, modul, skalyarnoe, vec } from '../tex';
import { kosoy, skalyar } from '../troyki';
import type { Prototype, Risunok, Shag, Tochka, Vektor } from '../types';
import {
  dany,
  izobrazheny,
  keys,
  shagOtvet,
  shagPoRisunku,
  shagSkalyarnoe,
  signatureOf,
} from './common';

interface Para {
  a: Tochka;
  b: Tochka;
  dot: number;
  /** Произведение длин: целое. */
  proizv: number;
  cos: number;
}

const cache = new Map<number, Para[]>();

/** Все пары с |x|, |y| ≤ bound, рациональным произведением длин и «хорошим» косинусом. */
function pary(bound: number): Para[] {
  const got = cache.get(bound);
  if (got !== undefined) {
    return got;
  }
  const out: Para[] = [];
  const vectors: Tochka[] = [];
  for (let x = -bound; x <= bound; x += 1) {
    for (let y = -bound; y <= bound; y += 1) {
      if (x * x + y * y >= 4) vectors.push([x, y]);
    }
  }
  for (const a of vectors) {
    for (const b of vectors) {
      /* Большинство косые; прямой допускается только один из двух. */
      if (!kosoy(a) && !kosoy(b)) continue;
      const q = (a[0] * a[0] + a[1] * a[1]) * (b[0] * b[0] + b[1] * b[1]);
      if (!isSquare(q)) continue;
      const proizv = Math.round(Math.sqrt(q));
      const dot = skalyar(a, b);
      if (dot === 0 || Math.abs(dot) === proizv) continue;
      const cos = dot / proizv;
      if (!nice(cos, 2)) continue;
      out.push({ a, b, dot, proizv, cos });
    }
  }
  cache.set(bound, out);
  return out;
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

function shagiKosinusa(p: Para, poRisunku: Shag | null): Shag[] {
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

/** Пара с нужным знаком косинуса (треть отрицательных); прямой вектор — изредка. */
function vybratParu(
  r: { pick<T>(items: readonly T[]): T; next(): number },
  bound: number,
): Para | null {
  const all = pary(bound);
  const otritsatelnyy = r.next() < 1 / 3;
  const pryamoy = r.next() < 1 / 8;
  const fit = all.filter(
    (p) => p.cos < 0 === otritsatelnyy && (kosoy(p.a) && kosoy(p.b)) !== pryamoy,
  );
  if (fit.length === 0) return null;
  return r.pick(fit);
}

const VOPROS = [
  'Найдите косинус угла между ними.',
  `Найдите $\\cos\\alpha$, где $\\alpha$ — угол между векторами $${vec('a')}$ и $${vec('b')}$.`,
] as const;

export const C1: Prototype = {
  id: 'C1',
  gruppa: 'C',
  nazvanie: 'Косинус по координатам',
  format: 'coords',
  formula: '\\cos\\alpha',
  isklyucheniya: keys([
    { ax: 9, ay: 3, bx: 2, by: 6 },
    { ax: 6, ay: 6, bx: 1, by: 7 },
    { ax: 4, ay: -8, bx: 2, by: 4 },
    { ax: -7, ay: 1, bx: 5, by: -5 },
  ]),
  generate(r) {
    const p = vybratParu(r, 12);
    if (p === null) return null;
    const vopros = r.pick(VOPROS);
    return {
      uslovie: `${dany([
        ['a', p.a],
        ['b', p.b],
      ])} ${vopros}`,
      risunok: null,
      otvet: p.cos,
      proverka: p.dot / (Math.hypot(p.a[0], p.a[1]) * Math.hypot(p.b[0], p.b[1])),
      shagi: shagiKosinusa(p, null),
      params: { ax: p.a[0], ay: p.a[1], bx: p.b[0], by: p.b[1] },
      signature: signatureOf([p.a, p.b]),
    };
  },
};

function risunok(vectors: Vektor[]): Risunok {
  return { vectors, window: OKNO_DVA, alt: 'Векторы a, b на координатной плоскости' };
}

export const C2: Prototype = {
  id: 'C2',
  gruppa: 'C',
  nazvanie: 'Косинус по рисунку',
  format: 'grid',
  formula: '\\cos\\alpha',
  generate(r) {
    const p = vybratParu(r, 6);
    if (p === null) return null;
    const vectors = razmestit(r, [p.a, p.b], OKNO_DVA);
    if (vectors === null) return null;
    const vopros = r.pick(VOPROS);
    return {
      uslovie: `${izobrazheny(['a', 'b'])} ${vopros}`,
      risunok: risunok(vectors),
      otvet: p.cos,
      proverka: p.dot / (Math.hypot(p.a[0], p.a[1]) * Math.hypot(p.b[0], p.b[1])),
      shagi: shagiKosinusa(p, shagPoRisunku(vectors)),
      params: { ax: p.a[0], ay: p.a[1], bx: p.b[0], by: p.b[1] },
      signature: signatureOf([p.a, p.b]),
    };
  },
};

export const KOSINUS: Prototype[] = [C1, C2];
