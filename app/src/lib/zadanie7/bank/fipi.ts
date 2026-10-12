/**
 * Открытый банк ФИПИ задания №7 — задачи из источников раздела
 * (сторонний задачник, «Задание 06», блоки 1 и 2; подборка
 * «Простейшие уравнения»). Условия — как в источнике, с формулами в
 * $…$; ответ в JSON пересчитан численно, без решателя прототипа
 * (lib/zadanie7/proverka.ts), и самотест сверяет его с
 * `solve(params).answer`. Повторы между источниками взяты один раз.
 */

import fipiJson from '../../../data/zadanie7/fipi.json';
import type { BankItem } from '../types';

export const FIPI: BankItem[] = (fipiJson as unknown as Omit<BankItem, 'source'>[]).map((f) => ({
  ...f,
  source: 'fipi',
}));
