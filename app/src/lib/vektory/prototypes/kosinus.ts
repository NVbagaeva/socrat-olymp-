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

import { isSquare, nice } from '../../vychisleniya/numbers';
import { OKNO_DVA, razmestit } from '../razmeshchenie';
import { vec } from '../tex';
import { kosoy, skalyar } from '../troyki';
import type { Prototype, Risunok, Tochka, Vektor } from '../types';
import { dany, izobrazheny, keys, shagPoRisunku, signatureOf } from './common';
import { type Para, shagiKosinusa } from './kosinus-shagi';

export { type Para, paraIz, shagiKosinusa } from './kosinus-shagi';

const cache = new Map<number, Para[]>();

/** Все пары с |x|, |y| ≤ bound, рациональным произведением длин и «хорошим» косинусом. */
export function pary(bound: number): Para[] {
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

/** Пара с нужным знаком косинуса (треть отрицательных); прямой вектор — изредка. */
export function vybratParu(
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

export const VOPROS = [
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
