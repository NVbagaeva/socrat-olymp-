/**
 * Банк задания №6: исходные задачи и аналоги (по 50 на прототип).
 *
 * Модуль серверный: в данных лежат ответы. В браузер задачи уходят
 * без ответов (тренажёр и генератор получают отпечатки).
 */

import analogiJson from '../../../data/zadanie6/analogi.json';
import type { BankItem } from '../types';
import { ISTOCHNIKI, podpisIstochnika } from './istochniki';

export { ISTOCHNIKI, podpisIstochnika };

export const ANALOGI_PO_PROTOTIPAM = analogiJson as unknown as Record<string, BankItem[]>;

export const ANALOGI: BankItem[] = Object.values(ANALOGI_PO_PROTOTIPAM).flat();

export const BANK: BankItem[] = [...ISTOCHNIKI, ...ANALOGI];

export function zadachiPrototipa(id: string): { istochniki: BankItem[]; analogi: BankItem[] } {
  return {
    istochniki: ISTOCHNIKI.filter((f) => f.prototypeId === id),
    analogi: ANALOGI_PO_PROTOTIPAM[id] ?? [],
  };
}
