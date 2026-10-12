/**
 * Пересчёт примеров блока «Иррациональные уравнения» (content/teoriya7-irr.ts)
 * для автотеста: исходное уравнение — функциями, уравнение после
 * возведения в степень — невязкой. Тест находит корни исходного
 * уравнения численно (korniChislenno), сверяет их и ответ с текстом
 * примера, а посторонние корни — отдельно: они решают уравнение после
 * возведения, но не исходное.
 */

import type { Chisla } from './types';

export interface ProverkaIrr7 {
  /** Исходное уравнение: lhs = rhs на области определения odz. */
  chisla: Chisla;
  /** Невязка уравнения после возведения в степень (без условий). */
  posle: (x: number) => number;
  /** Корни исходного уравнения. */
  korni: number[];
  /** Посторонние: корни уравнения после возведения, не корни исходного. */
  postoronnie: number[];
  /** Ответ примера; null — «корней нет». */
  otvet: number | null;
}

const kv = (x: number) => x * x;

function sqrtUr(f: (x: number) => number, g: (x: number) => number): Chisla {
  return { lhs: (x) => Math.sqrt(f(x)), rhs: g, odz: (x) => f(x) >= 0 };
}

export const PROVERKA_IRR_7: Record<string, ProverkaIrr7> = {
  'irr-v1-bank': {
    chisla: sqrtUr(
      (x) => 64 - 3 * x,
      () => 7,
    ),
    posle: (x) => 64 - 3 * x - 49,
    korni: [5],
    postoronnie: [],
    otvet: 5,
  },
  'irr-v1-lovushka': {
    chisla: sqrtUr(
      (x) => 2 * x + 1,
      () => -3,
    ),
    posle: (x) => 2 * x + 1 - 9,
    korni: [],
    postoronnie: [4],
    otvet: null,
  },
  'irr-v2-bank': {
    chisla: sqrtUr(
      (x) => 40 + 3 * x,
      (x) => x,
    ),
    posle: (x) => 40 + 3 * x - kv(x),
    korni: [8],
    postoronnie: [-5],
    otvet: 8,
  },
  'irr-v2-dva': {
    chisla: sqrtUr(
      (x) => 17 * x - 72,
      (x) => x,
    ),
    posle: (x) => 17 * x - 72 - kv(x),
    korni: [8, 9],
    postoronnie: [],
    otvet: 8,
  },
  'irr-v3': {
    chisla: {
      lhs: (x) => Math.sqrt(2 * x - 3),
      rhs: (x) => Math.sqrt(x + 1),
      odz: (x) => 2 * x - 3 >= 0 && x + 1 >= 0,
    },
    posle: (x) => 2 * x - 3 - (x + 1),
    korni: [4],
    postoronnie: [],
    otvet: 4,
  },
  'irr-v3-lovushka': {
    chisla: {
      lhs: (x) => Math.sqrt(x - 5),
      rhs: (x) => Math.sqrt(2 * x - 8),
      odz: (x) => x - 5 >= 0 && 2 * x - 8 >= 0,
    },
    posle: (x) => x - 5 - (2 * x - 8),
    korni: [],
    postoronnie: [3],
    otvet: null,
  },
  'irr-kub-bank': {
    chisla: { lhs: (x) => Math.cbrt(x - 6), rhs: () => 2, odz: () => true },
    posle: (x) => x - 6 - 8,
    korni: [14],
    postoronnie: [],
    otvet: 14,
  },
  'irr-kub-minus': {
    chisla: { lhs: (x) => Math.cbrt(x + 3), rhs: () => -2, odz: () => true },
    posle: (x) => x + 3 + 8,
    korni: [-11],
    postoronnie: [],
    otvet: -11,
  },
  /* Живой рисунок: √(x + 2) = x, после квадрата x + 2 = x². */
  grafik: {
    chisla: sqrtUr(
      (x) => x + 2,
      (x) => x,
    ),
    posle: (x) => x + 2 - kv(x),
    korni: [2],
    postoronnie: [-1],
    otvet: 2,
  },
};
