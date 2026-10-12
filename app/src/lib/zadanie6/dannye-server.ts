/**
 * Сборка файлов public/data/zadanie6/ из банка (серверная часть
 * lib/zadanie6/dannye.ts): ответ заменяется отпечатком.
 */

import type { IndeksZadachi, ZadachaLite } from './dannye';
import { sealAnswer } from './secret';
import type { BankItem } from './types';

export function lite(b: BankItem): ZadachaLite {
  const z: ZadachaLite = {
    id: b.id,
    prototypeId: b.prototypeId,
    source: b.source,
    stil: b.stil,
    text: b.text,
    params: b.params,
    seal: sealAnswer(b.answer),
  };
  if (b.no !== undefined) z.no = b.no;
  if (b.gde !== undefined) z.gde = b.gde;
  if (b.tema !== undefined) z.tema = b.tema;
  if (b.posle !== undefined) z.posle = b.posle;
  return z;
}

/** Содержимое файлов: имя без .json → текст. */
export function dannyeDlyaBrauzera(
  istochniki: BankItem[],
  analogi: Record<string, BankItem[]>,
): Record<string, string> {
  const vse = [...istochniki, ...Object.values(analogi).flat()];
  const indeks: IndeksZadachi[] = vse.map((b) => ({
    id: b.id,
    p: b.prototypeId,
    s: b.source === 'analog' ? 'a' : 'f',
    st: b.stil === 'syuzhet' ? 's' : 'f',
  }));
  const out: Record<string, string> = { indeks: JSON.stringify(indeks) + '\n' };
  for (const p of [...new Set(vse.map((b) => b.prototypeId))].sort()) {
    out[p] = JSON.stringify(vse.filter((b) => b.prototypeId === p).map(lite)) + '\n';
  }
  return out;
}
