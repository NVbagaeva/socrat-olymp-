/**
 * Задача по ключу «прототип|зерно» («P01|k7»): тренажёр, закладки,
 * генератор листов и пример на вкладке «О задании» строят её одинаково
 * — генератором прототипа с источником случайных чисел от ключа.
 */

import { rngOf } from '@/lib/vychisleniya/rng';
import { prototype } from './prototypes';
import type { Params, Prototype, Solved } from './types';

/** Ключи задач: «P01|k7», «P15|s-…». */
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

/** Задача по ключу. Бросает ошибку, если прототипа нет. */
export function zadachaPoKlyuchu(id: string): Zadacha21Polnaya {
  const proto = prototype(prototipKlyucha(id));
  const params = proto.gen(rngOf(`z21|${id}`));
  return { id, proto, params, uslovie: proto.uslovie(params), solved: proto.solve(params) };
}

/** Сколько проверенных задач у каждого типа в каталоге тренажёра. */
export const ZADACH_NA_TIP = 20;

/** Ключи задач типа: «P01|k1» … «P01|k20». */
export function klyuchiTipa(proto: string): string[] {
  return Array.from({ length: ZADACH_NA_TIP }, (_, i) => `${proto}|k${i + 1}`);
}
