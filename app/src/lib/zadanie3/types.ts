/**
 * Формат прототипа задания №3 и его вариантов.
 *
 * Прототип — это группа задач задачника с одной формулировкой и одним
 * способом решения; различаются только числа или пары прямых. Здесь
 * описано, из чего состоит такой прототип: шаблон условия, параметры,
 * формула ответа, вторая независимая проверка по трёхмерной модели,
 * чертёж, шаги разбора и ровно десять зафиксированных вариантов.
 *
 * Варианты не случайные: они лежат в данных и не меняются между
 * заходами. Откуда взят каждый — записано в самом варианте, чтобы
 * потом было видно, что придумано, а что взято из источника.
 */

import { type Model } from '../solid/model';

/** Формат ответа, как его ждёт ЕГЭ. */
export type AnswerFormat = 'целое' | 'десятичная' | 'на-пи';

/** Откуда взят вариант. */
export type Source = 'задачник' | 'домашка' | 'новый';

/** Значения параметров варианта: числа условия и буквы прямых. */
export type Params = Record<string, number | string | readonly string[]>;

export interface Variant {
  /** Номер варианта от 1 до 10. */
  n: number;
  /** Откуда он взят. */
  source: Source;
  /** Ссылка на источник: «задачник 42», «домашка 9, вариант 2». */
  ref: string;
  /**
   * Ответ, указанный в источнике. У задачника ответов нет, у домашки
   * есть — тогда сверяется и он.
   */
  sourceAnswer?: number;
  params: Params;
}

/**
 * Шаг разбора: пояснение словами, выкладка отдельной строкой и
 * значение, если шаг считает.
 *
 * Соглашение то же, что у разборов №4 и №5: все выкладки — в
 * `formula`, записью TeX; она набирается KaTeX на сборке и приходит в
 * тренажёр настоящими корнями, степенями и дробями. Дроби настоящие
 * (`\dfrac{a}{b}`), десятичная запятая `2{,}5` (format.ts, `tex`),
 * умножение `\cdot`, градусы `^\circ`. В `text` выкладок нет: текст
 * остаётся текстом. `value` — число, которое шаг считает; у
 * последнего шага оно равно ответу.
 */
export interface Step {
  text: string;
  formula?: string;
  value?: number;
}

export interface Prototype {
  id: string;
  razdel: string;
  nazvanie: string;
  /** Тип задания: что именно ищут. */
  tip: string;
  /** Диапазон номеров задачника, откуда прототип собран. */
  zadachnik: readonly [number, number];
  status: 'есть' | 'добавить';
  format: AnswerFormat;
  /** Условие варианта: формулировка задачника, числа — из параметров. */
  uslovie(p: Params): string;
  /** Ограничения на параметры: автотест проверяет их до всего прочего. */
  dopustimo(p: Params): boolean;
  /** Ответ по формуле прототипа. */
  otvet(p: Params): number;
  /** Ответ независимо: по координатам трёхмерной модели. */
  poModeli(p: Params): number;
  /** Чертёж варианта. */
  chertezh(p: Params): Model;
  /** Шаги разбора; значение последнего шага равно ответу. */
  shagi(p: Params): Step[];
  varianty: readonly Variant[];
}

/* ── Чтение параметров ───────────────────────────────────────────── */

export function num(p: Params, key: string): number {
  const value = p[key];
  if (typeof value !== 'number') {
    throw new Error(`Параметр ${key} — не число`);
  }
  return value;
}

export function text(p: Params, key: string): string {
  const value = p[key];
  if (typeof value !== 'string') {
    throw new Error(`Параметр ${key} — не строка`);
  }
  return value;
}

/** Пара вершин: прямая или диагональ, записанная двумя именами. */
export function pair(p: Params, key: string): readonly [string, string] {
  const value = p[key];
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error(`Параметр ${key} — не пара вершин`);
  }
  const [a, b] = value as readonly string[];
  if (typeof a !== 'string' || typeof b !== 'string') {
    throw new Error(`Параметр ${key} — не пара вершин`);
  }
  return [a, b];
}
