/**
 * Модель задания №2: рисунок, прототип, сгенерированная задача.
 *
 * Первая половина — то, что нужно движку рисунков (render.ts):
 * векторы, окно, режимы. Вторая — прототип и задача генератора:
 * условие с формулами, рисунок или null, ответ, независимый
 * пересчёт и разбор по шагам с заголовками.
 */

import type { Rng } from '../veroyatnost/generator';

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
  /** Оси в пикселях: строка оси x, столбец оси y, острия стрелок, длина наконечника. */
  axes: { x: number; y: number; tipX: number; tipY: number; arrowLen: number };
  /** Наконечник вектора: длина, половина ширины основания, толщина стержня, заход. */
  head: { len: number; half: number; shaftWidth: number; overlap: number };
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

/* ── Прототипы и задачи ─────────────────────────────────────────── */

export type Gruppa = 'A' | 'B' | 'C';

/** Как задано условие: координатами, рисунком на сетке, без сетки, словами (длины и угол). */
export type Format = 'coords' | 'grid' | 'nogrid' | 'text';

/** Параметры задачи: по ним задача узнаётся и исключается повтор. */
export type Params = Record<string, number | string>;

/** Шаг разбора: заголовок и строки с формулами в $…$. */
export interface Shag {
  zagolovok: string;
  stroki: string[];
}

/** Что даёт генератор прототипа. */
export interface Draft {
  /** Условие: текст с формулами в $…$. */
  uslovie: string;
  /** Рисунок без катетов; null у задач по координатам и по словам. */
  risunok: Risunok | null;
  /** Ответ числом: целое или конечная десятичная дробь. */
  otvet: number;
  /**
   * Второй, независимый счёт ответа другим путём (через плавающую
   * арифметику или другую формулу). Расхождение ловит самотест.
   */
  proverka: number;
  /** Разбор по шагам; последний шаг — «Ответ». */
  shagi: Shag[];
  params: Params;
  /** Подпись набора векторов: банк не берёт два варианта с одной. */
  signature: string;
  /**
   * Вид условия: набор коэффициентов или форма выражения. Банк берёт
   * не больше трёх вариантов одного вида, чтобы десять вариантов не
   * сошлись на самом «удачливом» наборе чисел.
   */
  vid?: string;
}

export interface Prototype {
  /** Код каталога: A1 … C2. */
  id: string;
  gruppa: Gruppa;
  /** Название на сайте. */
  nazvanie: string;
  format: Format;
  /** Формула-подпись для карточек, TeX без долларов. */
  formula: string;
  generate(r: Rng): Draft | null;
  /** Ключи параметров задач исходника: такие варианты генератор не отдаёт. */
  isklyucheniya?: string[];
}

/** Сгенерированная задача: черновик плюс откуда она. */
export interface Generated extends Draft {
  prototype: string;
  seed: string;
}
