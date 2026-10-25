/**
 * Данные задания №10 для «Собрать вариант» (серверная часть,
 * маршрут /variant/dannye/z10.json). Те же задачи, что в
 * public/data/zadanie10 (`lite` из lib/zadanie10/dannye-server.ts):
 * условие и параметры, **без ответа** — ответ и разбор браузер считает
 * решателем прототипа по параметрам, как лист учителя №10. Отпечаток
 * ответа генератору не нужен и не передаётся.
 */

import { ANALOGI, FIPI } from '@/lib/zadanie10/bank';
import { lite } from '@/lib/zadanie10/dannye-server';
import type { Params } from '@/lib/zadanie10/types';

export interface Zadacha10Variant {
  id: string;
  prototypeId: string;
  source: 'fipi' | 'analog';
  /** Номер в задачнике — только у ФИПИ. */
  no?: number;
  text: string;
  params: Params;
}

export function dannye(): Zadacha10Variant[] {
  return [...FIPI, ...ANALOGI].map((b) => {
    const z = lite(b);
    const out: Zadacha10Variant = {
      id: z.id,
      prototypeId: z.prototypeId,
      source: z.source,
      text: z.text,
      params: z.params,
    };
    if (z.no !== undefined) out.no = z.no;
    return out;
  });
}
