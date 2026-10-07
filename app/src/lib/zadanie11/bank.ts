/**
 * Открытый банк задания №11 и разминка: задачи в JSON.
 *
 * Формат строки: { "id": "DP-07", "params": {…}, "answer": 12 }.
 * Условие строится из параметров функцией подтипа, ответ в JSON —
 * контрольный: самотест сверяет его с `solve(params).answer`.
 * Новую задачу банка дописывают строкой в bank.json.
 */

import bankJson from '../../data/zadanie11/bank.json';
import razminkaJson from '../../data/zadanie11/razminka.json';
import type { BankItem } from './types';

export const BANK: BankItem[] = bankJson as unknown as BankItem[];

/** Разминка (РЗ): не открытый банк, свои задачи. */
export const RAZMINKA: BankItem[] = razminkaJson as unknown as BankItem[];
