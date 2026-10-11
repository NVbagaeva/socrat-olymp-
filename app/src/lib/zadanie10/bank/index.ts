/**
 * Банк задания №10: задачи ФИПИ и аналоги (по 20 на прототип).
 *
 * Модуль серверный: в данных лежат ответы. В браузер задачи уходят
 * без ответов (тренажёр и генератор получают отпечатки).
 */

import analogiJson from '../../../data/zadanie10/analogi.json';
import type { BankItem } from '../types';
import { FIPI } from './fipi';

export { FIPI };

export const ANALOGI_PO_PROTOTIPAM = analogiJson as unknown as Record<string, BankItem[]>;

export const ANALOGI: BankItem[] = Object.values(ANALOGI_PO_PROTOTIPAM).flat();

export const BANK: BankItem[] = [...FIPI, ...ANALOGI];

export function zadachiPrototipa(id: string): { fipi: BankItem[]; analogi: BankItem[] } {
  return {
    fipi: FIPI.filter((f) => f.prototypeId === id),
    analogi: ANALOGI_PO_PROTOTIPAM[id] ?? [],
  };
}
