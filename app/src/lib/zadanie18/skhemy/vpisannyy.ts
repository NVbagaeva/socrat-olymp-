/**
 * Схема 9. Вписанный четырёхугольник.
 *
 * Четыре точки на неподвижной окружности в порядке A, B, C, D.
 * Тянутся все четыре — по окружности, порядок сохраняется.
 */

import { mnog, okr, otr, tch, ug } from '@/lib/skhemy/dsl';
import { angleAt, angleOf, polar, sub } from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

const O: T2 = [0, 0];
const R = 3;
const IMENA = ['A', 'B', 'C', 'D'] as const;
/** Наименьшая дуга между соседними вершинами, градусы. */
const MIN_DUGA = 22;

const norm = (x: number) => ((x % 360) + 360) % 360;

function postroit(t: Tochki): Kadr {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const D = t.D!;
  /* Продолжение стороны DC за C — для внешнего угла. */
  const E: T2 = [C[0] + (C[0] - D[0]) * 0.45, C[1] + (C[1] - D[1]) * 0.45];
  const el: Element[] = [
    mnog('f', [A, B, C, D], { gruppy: ['summa'], cvet: 'a' }),
    okr('o', O, R),
    otr('AB', A, B),
    otr('BC', B, C),
    otr('CD', C, D),
    otr('DA', D, A),
    otr('AC', A, C, { skrytyy: true, stil: 'punktir', gruppy: ['diagonal'], cvet: 'b' }),
    otr('BD', B, D, { skrytyy: true, stil: 'punktir', gruppy: ['diagonal'], cvet: 'b' }),
    otr('CE', C, E, { skrytyy: true, stil: 'prodolzhenie', gruppy: ['vneshniy'] }),
    ug('uA', D, A, B, { gruppy: ['summa', 'vneshniy'], cvet: 'a' }),
    ug('uC', B, C, D, { gruppy: ['summa'], cvet: 'b', dugi: 2 }),
    ug('uB', A, B, C, { skrytyy: true, gruppy: ['summa'], cvet: 'c', dugi: 3 }),
    ug('uD', C, D, A, { skrytyy: true, gruppy: ['summa'], cvet: 'c', dugi: 3 }),
    ug('uBCE', B, C, E, { skrytyy: true, gruppy: ['vneshniy'], cvet: 'a' }),
    ug('uBAC', B, A, C, { skrytyy: true, gruppy: ['diagonal'], cvet: 'b', dugi: 2 }),
    ug('uBDC', B, D, C, { skrytyy: true, gruppy: ['diagonal'], cvet: 'b', dugi: 2 }),
    ...IMENA.map((n) => tch(n, t[n]!)),
  ];
  const uA = angleAt(D, A, B);
  const uC = angleAt(B, C, D);
  return {
    elementy: el,
    zametka: null,
    znacheniya: [
      `$\\angle A + \\angle C = ${Math.round(uA)}^\\circ + ${Math.round(uC)}^\\circ = ${Math.round(uA + uC)}^\\circ$`,
      `$\\angle BAC = ${Math.round(angleAt(B, A, C))}^\\circ$`,
      `$\\angle BDC = ${Math.round(angleAt(B, D, C))}^\\circ$`,
    ],
  };
}

function goditsya(t: Tochki): boolean {
  const u = IMENA.map((n) => angleOf(sub(t[n]!, O)));
  /* Против часовой: A → B → C → D, каждая дуга не меньше MIN_DUGA. */
  let summa = 0;
  for (let i = 0; i < 4; i += 1) {
    const d = norm(u[(i + 1) % 4]! - u[i]!);
    if (d < MIN_DUGA) return false;
    summa += d;
  }
  return Math.abs(summa - 360) < 1e-6;
}

function ogranichit(imya: string, p: T2, t: Tochki): T2 | null {
  const q = polar(angleOf(sub(p, O)), R);
  return goditsya({ ...t, [imya]: q }) ? q : null;
}

function sluchaynaya(rnd: () => number): Tochki {
  for (let i = 0; i < 300; i += 1) {
    const start = rnd() * 360;
    const d = [0, 1, 2, 3].map(() => 0.6 + rnd());
    const s = d.reduce((x, y) => x + y, 0);
    let u = start;
    const t: Record<string, T2> = {};
    IMENA.forEach((n, k) => {
      t[n] = polar(u, R);
      u += (d[k]! / s) * 360;
    });
    if (goditsya(t)) return t;
  }
  return NACHALO;
}

const NACHALO: Tochki = { A: polar(205, R), B: polar(300, R), C: polar(20, R), D: polar(118, R) };

export const VPISANNYY: ZhivayaSkhema = {
  id: 'chetyrekhugolniki',
  nachalo: NACHALO,
  podvizhnye: [...IMENA],
  pole: [-6, -6, 6, 6],
  postroit,
  ogranichit,
  sluchaynaya,
  shagi: ['Четырёхугольник $ABCD$, вписанный в окружность'],
};
