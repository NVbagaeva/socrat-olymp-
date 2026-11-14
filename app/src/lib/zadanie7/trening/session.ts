/**
 * Тренировка №7: ключи задач банка и имена, которыми пользуются
 * проверки. Сама логика — общая (lib/trening/bank.ts): у №7 своё только
 * то, какие у задач ключи — «F012» (открытый банк ФИПИ) или «P18-a03»
 * (аналог).
 */

import type { Mistake } from '@/lib/progressLog';
import {
  analogOf,
  buildByTipy,
  buildMistakes,
  isPayloadBanka,
  prototipyZadach,
  prototipZadachi,
  razobratZapis,
  similarBanka,
  skolkoZadach,
  taskAt,
  ZAMENY,
  type IstochnikBanka,
  type KatalogBanka,
  type PayloadBanka,
  type TaskBanka,
} from '@/lib/trening/bank';

export type Katalog7 = KatalogBanka;
export type Istochnik7 = IstochnikBanka;
export type Task7 = TaskBanka;
export type Trenazher7Payload = PayloadBanka;

/** Ключи задач №7. */
export const KLYUCH7 = /^(F\d{3}|P\d\d-a\d\d)$/;

export function etoKlyuch7(id: string): boolean {
  return KLYUCH7.test(id);
}

export { prototipyZadach, ZAMENY as ZAMENY7 };

export function prototipZadachi7(id: string, poKatalogu: ReadonlyMap<string, string>): string {
  return prototipZadachi(id, poKatalogu);
}

export function skolkoZadach7(katalog: Katalog7, tipy: string[], istochnik: Istochnik7): number {
  return skolkoZadach(katalog, tipy, istochnik);
}

export function buildByTipy7(
  katalog: Katalog7,
  tipy: string[],
  count: number,
  closed: ReadonlySet<string>,
  istochnik: Istochnik7 = 'vse',
  random: () => number = Math.random,
): Task7[] {
  return buildByTipy(katalog, tipy, count, closed, istochnik, random);
}

export function analogOf7(
  katalog: Katalog7,
  p: string,
  id: string,
  avoid: ReadonlySet<string> = new Set(),
  random: () => number = Math.random,
): string | null {
  return analogOf(katalog, p, id, avoid, random);
}

export function buildMistakes7(
  katalog: Katalog7,
  mistakes: Mistake[],
  count: number,
  random: () => number = Math.random,
): Task7[] {
  return buildMistakes(katalog, mistakes, count, random);
}

export function isTrenazher7Payload(value: unknown): value is Trenazher7Payload {
  return isPayloadBanka(value, KLYUCH7);
}

export function razobratZapis7(packed: unknown): Trenazher7Payload | null {
  return razobratZapis(packed, KLYUCH7);
}

export function similarTrenazher7(
  katalog: Katalog7,
  payload: Trenazher7Payload,
  indexes: number[],
): Trenazher7Payload | null {
  return similarBanka(katalog, payload, indexes);
}

export function taskAt7(payload: Trenazher7Payload, at: number): Task7 | undefined {
  return taskAt(payload, at);
}
