/**
 * Разбор «угловой коэффициент по двум узлам»: общий для касательной
 * (9.2.1) и для опорных задач на наклон прямой.
 *
 * Наклон считается не по разности координат «в уме», а через
 * прямоугольный треугольник: катеты — клетки по горизонтали и по
 * вертикали. У убывающей прямой tg α отрицателен: α тупой, считаем
 * через смежный острый угол, tg α = −tg(180° − α). В вычислении
 * показано сокращение: что на что делится.
 */

import { d } from '../tex';
import type { Shag, Tochka } from '../types';
import { shag } from './common';

export function nod(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : nod(b, a % b);
}

/** Дробь Δy/Δx с сокращением в TeX и десятичной записью. */
export function drobSSokrascheniem(dy: number, dx: number): string[] {
  const g = nod(dy, dx);
  const n = dy / g;
  const m = dx / g;
  const val = dy / dx;
  const rows: string[] = [];
  if (g > 1) {
    rows.push(`$\\dfrac{${dy}}{${dx}}=\\dfrac{${dy}:${g}}{${dx}:${g}}=\\dfrac{${n}}{${m}}$ — числитель и знаменатель делятся на $${g}$.`);
  }
  if (m !== 1) {
    rows.push(`$\\dfrac{${n}}{${m}}=${d(val)}$`);
  }
  return rows;
}

/** Три этапа разбора для двух узлов A и B (порядок любой). */
export function shagiNaklon(A: Tochka, B: Tochka): Shag[] {
  const [P, Q] = A[0] <= B[0] ? [A, B] : [B, A];
  const dx = Q[0] - P[0];
  const rawDy = Q[1] - P[1];
  const dy = Math.abs(rawDy);
  const vozr = rawDy > 0;
  const k = rawDy / dx;
  const kText = d(k);
  return [
    shag(
      'Выбираем два узла касательной',
      `Берём два узла сетки на прямой: $A(${P[0]};\\ ${P[1]})$ и $B(${Q[0]};\\ ${Q[1]})$ — чем дальше они друг от друга, тем меньше ошибка.`,
    ),
    shag(
      'Строим прямоугольный треугольник',
      `Катет по горизонтали: $\\Delta x=${dx}$ клеток. Катет по вертикали: $\\Delta y=${dy}$ клеток.`,
      vozr
        ? 'Прямая идёт вверх слева направо: угол $\\alpha$ острый, $\\operatorname{tg}\\alpha>0$.'
        : 'Прямая идёт вниз слева направо: угол $\\alpha$ тупой. Острый угол треугольника $180^\\circ-\\alpha$ смежный с ним, и $\\operatorname{tg}\\alpha=-\\operatorname{tg}(180^\\circ-\\alpha)$.',
    ),
    shag(
      'Считаем тангенс',
      vozr
        ? `$\\operatorname{tg}\\alpha=\\dfrac{\\Delta y}{\\Delta x}=\\dfrac{${dy}}{${dx}}$`
        : `$\\operatorname{tg}\\alpha=-\\operatorname{tg}(180^\\circ-\\alpha)=-\\dfrac{\\Delta y}{\\Delta x}=-\\dfrac{${dy}}{${dx}}$`,
      ...drobSSokrascheniem(dy, dx),
      `$k=${kText}$`,
    ),
  ];
}
