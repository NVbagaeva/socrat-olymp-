/**
 * Модель рисунка задания №2: векторы на координатной плоскости.
 *
 * Здесь только то, что нужно движку рисунков (render.ts): векторы,
 * окно, режимы. Типы прототипов и задач появляются вместе с
 * генераторами и живут отдельно — движок про задачи не знает.
 */

/** Точка с целыми координатами в клетках. */
export type Tochka = readonly [number, number];

export interface Vektor {
  /** Имя: одна латинская буква, на рисунке — со стрелкой сверху. */
  name: string;
  from: Tochka;
  to: Tochka;
}

export interface Okno {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

/**
 * Конфигурация рисунка — аргумент renderVectorPlane.
 *
 * Окно: по умолчанию DEFAULT_WINDOW; если векторы в него не
 * помещаются, оно расширяется так, чтобы до края оставалась одна
 * клетка. 'tight' — окно подбирается только по векторам и началу
 * координат, тоже с запасом в клетку: для телефона и миниатюр.
 */
export interface Risunok {
  vectors: Vektor[];
  window?: Okno | 'tight';
  /** false — режим «без сетки»: только оси, проекции концов на оси и их числа. */
  grid?: boolean;
  /**
   * Катеты смещений Δx и Δy пунктиром с подписями «+3», «−2».
   * Только для подсказок, опорных задач и листа учителя: на листе
   * ученика и в задачах для отработки движок вызывается без него.
   */
  hints?: boolean;
  /** Пикселей на клетку; по умолчанию — как у чертежей №12. */
  cell?: number;
  /** Описание для скринридера. Без него рисунок считается декором. */
  alt?: string;
}

/** Прямоугольник в пикселях: центр и половины сторон. */
export interface Box {
  kind: string;
  id: string;
  x: number;
  y: number;
  halfW: number;
  halfH: number;
}

/** Отчёт о размещении: по нему движок проверяется в тестах. */
export interface Report {
  window: Okno;
  cell: number;
  width: number;
  height: number;
  grid: boolean;
  hints: boolean;
  vectors: ReportVector[];
  /** Все подписи рисунка: осей, чисел, векторов, катетов. */
  boxes: Box[];
  /** Числа на осях в режиме без сетки. */
  ticks: { axis: 'x' | 'y'; at: number }[];
  /** Нарушения: пустой список — рисунок чистый. */
  problems: string[];
}

export interface ReportVector {
  name: string;
  from: Tochka;
  to: Tochka;
  /** Остриё: должно совпадать с узлом сетки конца вектора. */
  tip: { x: number; y: number };
  /** Конец стержня под наконечником. */
  shaftEnd: { x: number; y: number };
  label: Box | null;
}

export const DEFAULT_WINDOW: Okno = { xmin: -1, xmax: 13, ymin: -2, ymax: 11 };
