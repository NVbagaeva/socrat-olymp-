/**
 * Данные «Собрать вариант» для задания №1 — собираются на сборке,
 * как у генератора №1 (app/zadaniya/1/(razdel)/generator/page.tsx):
 * числа задач открытого банка и аналогов без ответов и уровень
 * прототипа. Ответ, решение и чертежи считает движок раздела в
 * браузере (trenazher/zadacha.ts).
 *
 * Запись банка сжата в кортеж [номер, прототип, числа]: аналог — номер
 * от 1000 (nomerAnaloga), как в тренажёре.
 */

import { dannyeTrenazhera1 } from '@/lib/planimetriya/trenazher/dannye';
import type { Nabor } from '@/lib/planimetriya/stseny/dsl';

export interface Dannye01 {
  /** Уровень прототипа 1–3 по ключу «p05». */
  urovni: Record<string, number>;
  /** [номер задачи, прототип, числа условия]. */
  bank: [number, number, Nabor][];
}

export function dannye(): Dannye01 {
  const d = dannyeTrenazhera1();
  const urovni: Record<string, number> = {};
  for (const r of d.razdely) for (const p of r.podtipy) urovni[p.id] = p.level;
  return {
    urovni,
    bank: d.bank.map((b) => [b.no, Number(b.id.slice(1)), b.params]),
  };
}
