/**
 * Задача по ключу «прототип|зерно» («P01|k7»): тренажёр, закладки,
 * генератор листов и пример на вкладке «О задании» строят её одинаково
 * — генератором прототипа с источником случайных чисел от ключа.
 */

import { rngOf } from '@/lib/vychisleniya/rng';
import { prototype } from './prototypes';
import { SBORNIK21 } from './sbornik';
import type { Params, Prototype, Solved } from './types';

/** Ключи задач: «P01|k7» (генератор), «P22|s3-1», «P22|s3-g2» (фиксированные, sbornik.ts). */
export const KLYUCH21 = /^P\d{2}\|[0-9a-z.#:_-]+$/i;

export function prototipKlyucha(id: string): string {
  return id.split('|')[0] ?? id;
}

export interface Zadacha21Polnaya {
  id: string;
  proto: Prototype;
  params: Params;
  uslovie: string;
  solved: Solved;
}

/** Фиксированная задача: ключ, прототип, параметры, независимо найденный ответ. */
export interface Fiksirovannaya21 {
  klyuch: string;
  p: string;
  params: Params;
  otvet: number;
  /** Подобранная генератором (g), а не задача с заданными числами (z). */
  podobrannaya: boolean;
}

/** Все фиксированные задачи по порядку заданий. */
export const FIKSIROVANNYE21: readonly Fiksirovannaya21[] = SBORNIK21.flatMap((zad) => [
  ...zad.z.map((x, i) => ({ ...x, klyuch: `${x.p}|s${zad.n}-${i + 1}`, podobrannaya: false })),
  ...zad.g.map((x, i) => ({ ...x, klyuch: `${x.p}|s${zad.n}-g${i + 1}`, podobrannaya: true })),
]);

const PO_KLYUCHU = new Map(FIKSIROVANNYE21.map((z) => [z.klyuch, z]));

/** Задача по ключу. Бросает ошибку, если прототипа нет. */
export function zadachaPoKlyuchu(id: string): Zadacha21Polnaya {
  const proto = prototype(prototipKlyucha(id));
  const params = PO_KLYUCHU.get(id)?.params ?? proto.gen(rngOf(`z21|${id}`));
  return { id, proto, params, uslovie: proto.uslovie(params), solved: proto.solve(params) };
}

/** Сколько проверенных задач у каждого типа в каталоге тренажёра. */
export const ZADACH_NA_TIP = 20;

/** Ключи задач типа: «P01|k1» … «P01|k20». */
export function klyuchiTipa(proto: string): string[] {
  return Array.from({ length: ZADACH_NA_TIP }, (_, i) => `${proto}|k${i + 1}`);
}
