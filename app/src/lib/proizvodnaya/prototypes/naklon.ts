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

/** Сокращение отношения катетов и перевод в десятичную: отдельные строки, без повторения дроби. */
export function drobSSokrascheniem(dy: number, dx: number, minus = false): string[] {
  const g = nod(dy, dx);
  const n = dy / g;
  const m = dx / g;
  const val = dy / dx;
  const rows: string[] = [];
  const sg = minus ? '-' : '';
  if (g > 1) {
    const result = m === 1 ? String(n) : `\\dfrac{${n}}{${m}}`;
    rows.push(
      `Числитель и знаменатель делятся на $${g}$: $${sg}\\dfrac{${dy}}{${dx}}=${sg}\\dfrac{${dy}:${g}}{${dx}:${g}}=${sg}${result}$.`,
    );
  } else if (m !== 1) {
    rows.push(`Дробь $${sg}\\dfrac{${n}}{${m}}$ несократима.`);
  }
  if (m !== 1) {
    rows.push(`В десятичной записи $${sg}\\dfrac{${n}}{${m}}=${d(minus ? -val : val)}$.`);
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
      `Треугольник строим под прямой, катеты идут по линиям сетки. Подписываем катеты длинами — числом клеток, без знаков: вертикальный катет ${dy}, горизонтальный ${dx}.`,
      vozr
        ? 'Прямая возрастает — $k > 0$: вертикальный катет делим на горизонтальный.'
        : 'Прямая убывает — $k < 0$: катеты делим так же, а перед дробью ставим минус. Острый угол треугольника $180^\\circ-\\alpha$ смежный с $\\alpha$, и $\\operatorname{tg}\\alpha=-\\operatorname{tg}(180^\\circ-\\alpha)$.',
    ),
    shag(
      'Считаем тангенс',
      vozr
        ? `$\\operatorname{tg}\\alpha=\\dfrac{\\text{противолежащий катет}}{\\text{прилежащий катет}}=\\dfrac{${dy}}{${dx}}$`
        : `$\\operatorname{tg}\\alpha=-\\operatorname{tg}(180^\\circ-\\alpha)=-\\dfrac{${dy}}{${dx}}$`,
      ...drobSSokrascheniem(dy, dx, !vozr),
      `$k=${kText}$`,
    ),
  ];
}
