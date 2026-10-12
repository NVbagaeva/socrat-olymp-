/**
 * Сборка файлов public/data/zadanie7/ из банка (серверная часть
 * lib/zadanie7/dannye.ts): ответ заменяется отпечатком.
 */

import type { IndeksZadachi, ZadachaLite } from './dannye';
import { sealAnswer } from './secret';
import type { BankItem } from './types';

export function lite(b: BankItem): ZadachaLite {
  const z: ZadachaLite = {
    id: b.id,
    prototypeId: b.prototypeId,
    source: b.source,
    text: b.text,
    params: b.params,
    seal: sealAnswer(b.answer),
  };
  if (b.no !== undefined) {
    z.no = b.no;
  }
  return z;
}

/** Содержимое файлов: имя без .json → текст. */
export function dannyeDlyaBrauzera(
  fipi: BankItem[],
  analogi: Record<string, BankItem[]>,
): Record<string, string> {
  const vse = [...fipi, ...Object.values(analogi).flat()];
  const indeks: IndeksZadachi[] = vse.map((b) => ({
    id: b.id,
    p: b.prototypeId,
    s: b.source === 'fipi' ? 'f' : 'a',
  }));
  const out: Record<string, string> = { indeks: JSON.stringify(indeks) + '\n' };
  for (const p of [...new Set(vse.map((b) => b.prototypeId))].sort()) {
    out[p] = JSON.stringify(vse.filter((b) => b.prototypeId === p).map(lite)) + '\n';
  }
  return out;
}
