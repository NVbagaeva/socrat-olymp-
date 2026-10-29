/**
 * Стиль планиметрических чертежей — все размеры и цвета в одном месте.
 *
 * Размеры — в px системы координат SVG. Чертёж показывается в своём
 * размере (width/height = viewBox), поэтому px здесь — экранные px
 * при обычной ширине чертежа 220–320 px. Цвета — токены дизайн-системы
 * (те же, что у чертежей №12): линии — --graph-axis, искомое и
 * выделенное — --color-primary (синий активной вкладки и кнопок «›»),
 * подсказки и построения учителя — --graph-accent. В ч/б теме печати
 * все три чернеют и различаются толщиной, штрихом и заливкой.
 */

import { THEME } from '@/lib/graph/renderer.js';
import { BUKVY, CHISLA } from '@/lib/risunki/shrifty.js';

export const PL = {
  ink: THEME.colors.axis,
  iskomoe: THEME.colors.lineA,
  podskazka: THEME.colors.accent,
  bg: THEME.colors.bg,
  /* Толщины: основные линии и окружность < выделенный элемент. */
  width: {
    line: 1.75,
    iskomoe: 2.25,
    novoe: 2.25,
    /* Дуга угла и значок прямого угла; искомого угла — markIskomoe. */
    mark: 1.25,
    markIskomoe: 1.75,
    tick: 1.4,
    /* Выделенная дуга окружности (дуга AB условия). */
    duga: 3,
    vynoska: 0.8,
    /* Белая обводка под буквами — линии под подписью не видны. */
    halo: 3,
  },
  dash: { punktir: '4 4', prodolzhenie: '5 4' },
  /* Подписи точек — курсив KaTeX_Math, как буквы в формулах сайта. */
  font: {
    bukva: BUKVY,
    chislo: CHISLA,
    slovo: THEME.font.family,
    razmer: 16,
    razmerZnach: 13.5,
  },
  /* Зазор подписи до линий и других подписей, px. */
  gap: 2.5,
  /* Ступени отступа подписи от точки, px (от точки до края буквы). */
  otstupy: [4, 7, 11, 16, 22, 29],
  /**
   * Отметки углов. r — радиус дуги, не зависит от длины сторон, кроме
   * короткой стороны: r ≤ korotkaya · (короткая сторона), но не меньше
   * min. shag — шаг двойной и тройной дуги. Дуга, задевшая чужую линию
   * или окружность, уменьшается до min, а если чужая линия совсем рядом
   * с вершиной — до minKrayniy. rPryamoy — сторона квадратика прямого
   * угла, sektor — прозрачность заливки искомого угла.
   */
  ugol: { r: 13, shag: 4, min: 9, minKrayniy: 7, korotkaya: 0.35, rPryamoy: 9, sektor: 0.14 },
  /* Засечки равных отрезков: длина 2·half, шаг между засечками. */
  tick: { half: 3.5, shag: 3 },
  tochkaR: 2.5,
  /* Наименьшие размеры на экране: короче — фигура вырождена. */
  minOtrezok: 12,
  minMezhduTochkami: 10,
  minUgolMnogougolnika: 7,
  /* Размер фигуры по умолчанию и миниатюры плашки «О задании». */
  razmer: { shirina: 280, vysota: 220 },
  mini: { shirina: 190, vysota: 128 },
  pole: 4,
} as const;
