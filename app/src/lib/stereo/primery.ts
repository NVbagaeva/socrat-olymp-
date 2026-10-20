/**
 * Живые чертежи с шагами для каркаса теории (этап 1в плана,
 * docs/stereometry-plan.md): по одному в главе «Как читать чертёж» №3
 * и «Построение сечений» №15. Главы наполняются на этапе 3, и эти
 * примеры переходят в их текст.
 *
 * Модель — тот же lib/solid, что у банка: тела в пространстве, а
 * шаги — поле shag у линий, сечений, углов и точек.
 */

import { box, dir, vertex } from '../solid/figures';
import type { Model } from '../solid/model';
import { lerp } from '../solid/vec';

export interface PrimerChertezha {
  model: Model;
  uslovie: string;
  shagi: readonly string[];
}

/** Диагональ куба: «Пифагор в пространстве» в два шага. */
export function diagonalKuba(): PrimerChertezha {
  const cube = box(4, 4, 4);
  const A = vertex(cube, 'A');
  const C = vertex(cube, 'C');
  const C1 = vertex(cube, 'C1');
  return {
    uslovie: 'Куб $ABCDA_1B_1C_1D_1$ с ребром $a$. Найдём диагональ $AC_1$.',
    shagi: [
      'Диагональ основания $AC$ — гипотенуза прямоугольного треугольника $ABC$: $AC^2 = a^2 + a^2 = 2a^2$.',
      'Ребро $CC_1$ перпендикулярно основанию, поэтому $\\angle ACC_1 = 90^\\circ$ — смотрим на треугольник $ACC_1$.',
      'По теореме Пифагора $AC_1^2 = AC^2 + CC_1^2 = 2a^2 + a^2 = 3a^2$, значит $AC_1 = a\\sqrt3$.',
    ],
    model: {
      alt: 'Куб ABCDA₁B₁C₁D₁: диагональ основания AC и диагональ куба AC₁',
      bodies: [cube],
      lines: [
        { a: A, b: C, shag: 1 },
        { a: A, b: C1, label: 'd', shag: 3 },
      ],
      sections: [{ points: [A, C, C1], shag: 2 }],
      angles: [{ at: C, u: dir(C, A), v: dir(C, C1), shag: 2 }],
    },
  };
}

/** Сечение куба плоскостью через середины трёх рёбер при вершине B₁. */
export function sechenieKuba(): PrimerChertezha {
  const cube = box(4, 4, 4);
  const B1 = vertex(cube, 'B1');
  const K = lerp(B1, vertex(cube, 'A1'), 0.5);
  const L = lerp(B1, vertex(cube, 'C1'), 0.5);
  const M = lerp(B1, vertex(cube, 'B'), 0.5);
  return {
    uslovie:
      'Куб $ABCDA_1B_1C_1D_1$. Точки $K$, $L$, $M$ — середины рёбер $A_1B_1$, $B_1C_1$ и $BB_1$. Построим сечение плоскостью $KLM$.',
    shagi: [
      'Точки $K$ и $L$ лежат в одной грани $A_1B_1C_1D_1$ — соединяем их: $KL$ — след секущей плоскости на верхней грани.',
      'Точки $L$ и $M$ лежат в грани $BB_1C_1C$, точки $K$ и $M$ — в грани $AA_1B_1B$: проводим $LM$ и $KM$.',
      'Сечение — треугольник $KLM$. Он равносторонний: каждая его сторона — гипотенуза равнобедренного прямоугольного треугольника с катетами $\\tfrac a2$.',
    ],
    model: {
      alt: 'Куб ABCDA₁B₁C₁D₁ и сечение KLM через середины рёбер при вершине B₁',
      bodies: [cube],
      marks: [
        { p: K, label: 'K' },
        { p: L, label: 'L' },
        { p: M, label: 'M' },
      ],
      lines: [
        { a: K, b: L, shag: 1 },
        { a: L, b: M, shag: 2 },
        { a: K, b: M, shag: 2 },
      ],
      sections: [{ points: [K, L, M], shag: 3 }],
    },
  };
}
