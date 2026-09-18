/**
 * Генератор вариантов прототипа.
 *
 * У каждого прототипа есть исходные варианты — из задачника или из
 * конспекта — и правило `generator`, которое из случайных чисел
 * собирает ещё один набор параметров. Отсюда `prototip()` достраивает
 * прототип: к исходным вариантам добавляются `SKOLKO` сгенерированных.
 *
 * Случайность здесь воспроизводимая: зерно считается из идентификатора
 * прототипа, поэтому на каждой сборке получаются одни и те же варианты,
 * а автотест проверяет ровно то, что увидит ученик. Ответ ни одного
 * варианта не вписан руками: он считается формулой прототипа.
 *
 * Правило одно на все прототипы: кандидат принимается, только если
 * проходит `dopustimo` прототипа и не совпадает ни с одним уже взятым
 * набором параметров. Не набралось за много попыток — сборка падает:
 * значит, ограничения или генератор написаны с ошибкой.
 */

import { seeded } from '../zadanie3/podhod';
import type { Params, Prototype, Variant } from './types';

/** Сколько вариантов добавляет генератор к исходным. */
export const SKOLKO = 10;

/** Сколько раз можно промахнуться мимо ограничений, прежде чем сдаться. */
const POPYTOK = 20000;

/** Источник случайных чисел генератора: только то, что нужно банкам. */
export interface Rng {
  /** Целое от a до b включительно. */
  int(a: number, b: number): number;
  /** Десятичная дробь с заданным числом знаков от a до b включительно. */
  dec(a: number, b: number, znakov: number): number;
  /** Случайный элемент списка. */
  pick<T>(items: readonly T[]): T;
  /** Несколько разных элементов списка, в случайном порядке. */
  sample<T>(items: readonly T[], n: number): T[];
  /** Случайная дробь [0; 1). */
  next(): number;
}

/** Число из строки: тот же FNV-1a, что у отпечатков, без соли. */
function zerno(id: string): number {
  let hash = 0x811c9dc5;
  for (const ch of id) {
    hash ^= ch.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

export function rng(seed: number): Rng {
  const next = seeded(seed);
  const int = (a: number, b: number): number => a + Math.floor(next() * (b - a + 1));
  return {
    next,
    int,
    dec(a, b, znakov) {
      const k = 10 ** znakov;
      return int(Math.round(a * k), Math.round(b * k)) / k;
    },
    pick(items) {
      const item = items[int(0, items.length - 1)];
      if (item === undefined) {
        throw new Error('pick из пустого списка');
      }
      return item;
    },
    sample(items, n) {
      const rest = [...items];
      const out: (typeof items)[number][] = [];
      while (out.length < n && rest.length > 0) {
        const i = int(0, rest.length - 1);
        out.push(rest[i] as (typeof items)[number]);
        rest.splice(i, 1);
      }
      return out;
    },
  };
}

/** Прототип с правилом генерации: то, что пишут в банке. */
export type PrototipSGeneratorom = Prototype & {
  /** Один случайный набор параметров; допустимость проверяется снаружи. */
  generator(r: Rng): Params;
};

/**
 * Сгенерированные варианты прототипа: `SKOLKO` штук, воспроизводимо.
 * Исходные варианты уже входят в `prototype.varianty`.
 */
export function sgenerirovat(prototype: PrototipSGeneratorom, skolko = SKOLKO): Variant[] {
  const r = rng(zerno(prototype.id));
  const bylo = new Set(prototype.varianty.map((v) => JSON.stringify(v.params)));
  const out: Variant[] = [];
  let n = prototype.varianty.reduce((max, v) => Math.max(max, v.n), 0);
  for (let popytka = 0; popytka < POPYTOK && out.length < skolko; popytka += 1) {
    const params = prototype.generator(r);
    const klyuch = JSON.stringify(params);
    if (bylo.has(klyuch) || !prototype.dopustimo(params)) {
      continue;
    }
    bylo.add(klyuch);
    n += 1;
    out.push({ n, source: 'новый', ref: 'генератор', params });
  }
  if (out.length < skolko) {
    throw new Error(
      `Генератор ${prototype.id} набрал только ${out.length} из ${skolko} вариантов за ${POPYTOK} попыток`,
    );
  }
  return out;
}

/** Прототип целиком: исходные варианты плюс сгенерированные. */
export function prototip(opisanie: PrototipSGeneratorom): Prototype {
  const { generator, ...rest } = opisanie;
  void generator;
  return { ...rest, varianty: [...opisanie.varianty, ...sgenerirovat(opisanie)] };
}
