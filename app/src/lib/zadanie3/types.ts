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
import { type Zadacha } from './zadacha';

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

/** Шаг разбора: текст с числами варианта и значение, если шаг считает. */
export interface Step {
  text: string;
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
  /**
   * Структура варианта: один источник истины для текста, чертежа и
   * разбора. Пока есть не у всех прототипов — перевод идёт по
   * разделам; у кого нет, чертёж по-прежнему пишется руками.
   */
  zadacha?(p: Params): Zadacha;
  /** Чертёж условия: выделено ровно то, что спрашивают. */
  chertezh(p: Params): Model;
  /**
   * Чертёж разбора: то же плюс дополнительные построения. Не задан —
   * разбор обходится чертежом условия.
   */
  chertezhRazbora?(p: Params): Model;
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
