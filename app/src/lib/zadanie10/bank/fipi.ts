/**
 * Открытый банк ФИПИ задания №10 (в стороннем задачнике — «Задание 09»,
 * Блок 1, задачи 1–160). Условия — как в банке, с формулами в $…$;
 * ответ в JSON пересчитан программой независимо от решателей и
 * сверяется самотестом с `solve(params).answer`.
 */

import fipiJson from '../../../data/zadanie10/fipi.json';
import type { BankItem } from '../types';

export const FIPI: BankItem[] = (fipiJson as unknown as Omit<BankItem, 'source'>[]).map((f) => ({
  ...f,
  source: 'fipi',
}));
