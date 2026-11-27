/**
 * Разобранные примеры вкладки «О задании» №4 и №5.
 *
 * У каждого типа на карте задания один пример — первый вариант
 * сборника (нет такого — первый). Его закрытый разбор раньше
 * приходил файлом разборов всего прототипа (dannye/razbory/), а там
 * все варианты: сотни килобайт почти несжимаемого шифра на одну
 * карточку. Здесь — только разборы примеров, одним маленьким файлом
 * раздела (dannye/primery.json), который карта грузит заранее.
 */

import { BANK_4, BANK_5 } from './index';
import { bank4Pool, bank5Pool } from './pool';

/** Задача-пример типа: первый вариант сборника, нет — первый. */
export function variantPrimera(zadanie: 4 | 5, id: string): number {
  const p = (zadanie === 4 ? BANK_4 : BANK_5).find((x) => x.id === id);
  return (p?.varianty.find((v) => v.source === 'sbornik') ?? p?.varianty[0])?.n ?? 1;
}

/** Закрытый разбор примера типа; у типа нет разбора — пустая строка. */
export function razborPrimera(zadanie: 4 | 5, kindId: string): string {
  const pool = zadanie === 4 ? bank4Pool() : bank5Pool();
  const kind = pool.kinds.find((k) => k.id === kindId);
  if (kind === undefined) {
    throw new Error(`Нет прототипа ${kindId}`);
  }
  const n = variantPrimera(zadanie, kindId);
  return kind.variants.find((x) => x.n === n)?.steps ?? '';
}
