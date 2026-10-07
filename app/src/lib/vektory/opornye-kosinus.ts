/**
 * Опорные задачи повышенной сложности: косинус с тремя знаками
 * после запятой.
 *
 * На ЕГЭ ответ обычно не длиннее двух знаков, и тренажёр, генератор
 * и банк отдают только такие косинусы (±0,28; ±0,6; ±0,8; ±0,96 —
 * углы треугольников 3–4–5 и 7–24–25). Здесь — три задачи для
 * тренировки вычислений с ответами ±0,936 и ±0,352: это тройка
 * 44–117–125, её углы — суммы и разности углов тех двух троек.
 * Задачи зафиксированы, в генераторы не попадают; самотест
 * проверяет и их самих, и то, что генераторы таких значений не дают.
 */

import { OKNO_TRI } from './razmeshchenie';
import { paraIz, shagiKosinusa, VOPROS } from './prototypes/kosinus';
import { dany, izobrazheny, shagPoRisunku, signatureOf } from './prototypes/common';
import type { Generated, Tochka, Vektor } from './types';

/** Косинусы, которые дают тренажёр, генератор и банк. */
export const KOSINUSY_DVA_ZNAKA: readonly number[] = [
  0.28, 0.6, 0.8, 0.96, -0.28, -0.6, -0.8, -0.96,
];

/** Косинусы задач повышенной сложности: только здесь. */
export const KOSINUSY_TRI_ZNAKA: readonly number[] = [0.936, 0.352, -0.936, -0.352];

/** Пояснение для ученика перед блоком; формулы в $…$. */
export const POYASNENIE_TRI_ZNAKA: readonly string[] = [
  'На ЕГЭ ответ обычно не длиннее двух знаков после запятой: при целых координатах косинус с двумя знаками бывает только одним из восьми значений — $\\pm 0{,}6$ и $\\pm 0{,}8$ (треугольник $3$–$4$–$5$), $\\pm 0{,}28$ и $\\pm 0{,}96$ (треугольник $7$–$24$–$25$).',
  'Задачи ниже — для тренировки вычислений. Здесь появляется тройка $44$–$117$–$125$: её углы — суммы и разности углов треугольников $3$–$4$–$5$ и $7$–$24$–$25$, поэтому косинус получается с тремя знаками: $\\dfrac{117}{125} = 0{,}936$ и $\\dfrac{44}{125} = 0{,}352$.',
];

function poKoordinatam(n: number, a: Tochka, b: Tochka, vopros: 0 | 1): Generated {
  const p = paraIz(a, b);
  if (p === null) {
    throw new Error(`опорная задача ${n}: произведение длин не рационально`);
  }
  return {
    prototype: 'C-tri-znaka',
    seed: `opornaya-${n}`,
    uslovie: `${dany([
      ['a', a],
      ['b', b],
    ])} ${VOPROS[vopros]}`,
    risunok: null,
    otvet: p.cos,
    proverka: p.dot / (Math.hypot(a[0], a[1]) * Math.hypot(b[0], b[1])),
    shagi: shagiKosinusa(p, null),
    params: { ax: a[0], ay: a[1], bx: b[0], by: b[1] },
    signature: signatureOf([a, b]),
  };
}

function poRisunku(n: number, vectors: Vektor[], vopros: 0 | 1): Generated {
  const [va, vb] = vectors as [Vektor, Vektor];
  const a: Tochka = [va.to[0] - va.from[0], va.to[1] - va.from[1]];
  const b: Tochka = [vb.to[0] - vb.from[0], vb.to[1] - vb.from[1]];
  const p = paraIz(a, b);
  if (p === null) {
    throw new Error(`опорная задача ${n}: произведение длин не рационально`);
  }
  return {
    prototype: 'C-tri-znaka',
    seed: `opornaya-${n}`,
    uslovie: `${izobrazheny(['a', 'b'])} ${VOPROS[vopros]}`,
    risunok: {
      vectors,
      window: { ...OKNO_TRI, ymax: 10 },
      alt: 'Векторы a, b на координатной плоскости',
    },
    otvet: p.cos,
    proverka: p.dot / (Math.hypot(a[0], a[1]) * Math.hypot(b[0], b[1])),
    shagi: shagiKosinusa(p, shagPoRisunku(vectors)),
    params: { ax: a[0], ay: a[1], bx: b[0], by: b[1] },
    signature: signatureOf([a, b]),
  };
}

/**
 * Три задачи: по координатам с ответами 0,352 и −0,936, по рисунку
 * с ответом 0,936. Векторы длины 25 на рисунок не помещаются, поэтому
 * на рисунке — пара (11; 2) и (11; −2): произведение длин 125.
 */
export const OPORNYE_KOSINUS_TRI_ZNAKA: readonly Generated[] = [
  poKoordinatam(1, [3, 4], [24, -7], 0),
  poKoordinatam(2, [-3, -4], [7, 24], 1),
  poRisunku(
    3,
    [
      { name: 'a', from: [1, 1], to: [12, 3] },
      { name: 'b', from: [1, 8], to: [12, 6] },
    ],
    0,
  ),
];
