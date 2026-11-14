/**
 * Перенесённая задача тренажёра №18: три набора чисел (varianty). Поле,
 * в котором есть числа набора, — функция набора; поле без чисел —
 * строка. В общий банк (content/zadanie18/trenazher.ts) задача попадает
 * типом TipZadachi18 — trenazherDop/index.ts.
 */

import type { Uroven } from '@/lib/trenazher/types';
import type { Parametry } from '@/lib/zadanie18/trenazher/sceny';
import type { SkhemaVZadache } from '../opornye/tipy';
import type { Podsvechennoe } from '../tipy';

/** Значение поля задачи: одно на все наборы или своё у каждого набора. */
export type PoNaboru<T> = T | ((p: Parametry) => T);

/** Значение поля для набора p. */
export function poNaboru<T>(v: PoNaboru<T>, p: Parametry): T {
  return typeof v === 'function' ? (v as (p: Parametry) => T)(p) : v;
}

export interface ZadachaDop18 {
  /** Тип задачи в банке и ключ чертежа (lib/zadanie18/trenazher/dop). */
  id: string;
  uroven: Uroven;
  /** Название — в генераторе и в отчёте проверки. */
  nazvanie: string;
  /** Наборы чисел; первый — исходный (его ответ курса проверен). */
  varianty: readonly Parametry[];
  uslovie: PoNaboru<string>;
  a: PoNaboru<string>;
  b: PoNaboru<string>;
  /**
   * Ключевые схемы задачи: первая — чип фильтра (тема — её группа), все
   * вместе — вопросы подсказки «какая схема здесь».
   */
  skhemy: readonly SkhemaVZadache[];
  /** Наводящая мысль: с чего начать, не раскрывая решения. */
  podskazka: string;
  /** Доказательство пункта а) по шагам. */
  dokazatelstvo: PoNaboru<readonly Podsvechennoe[]>;
  /** Решение пункта б) по шагам. */
  reshenieB: PoNaboru<readonly Podsvechennoe[]>;
  /** Ответ пункта б). */
  otvet: PoNaboru<number>;
}

/** Число в TeX: десятичная запятая. */
export const ch = (x: number): string => String(Math.round(x * 1e6) / 1e6).replace('.', '{,}');

/** Несократимая дробь a/b в TeX; целое — числом. */
export function drob(a: number, b: number): string {
  const nod = (x: number, y: number): number => (y === 0 ? x : nod(y, x % y));
  const d = nod(Math.abs(a), Math.abs(b));
  const [m, n] = [a / d, b / d];
  return n === 1 ? String(m) : `\\dfrac{${m}}{${n}}`;
}

/** Число на чертеже: десятичная запятая без TeX. */
export const chChertezh = (x: number): string =>
  String(Math.round(x * 1e6) / 1e6).replace('.', ',');
