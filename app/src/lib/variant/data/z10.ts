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
import { kartinkiPrototipov } from '@/lib/zadanie10/illyustracii';
import { klyuchKartinki10 } from '@/lib/zadanie10/kartinkiSyuzhetov';

export interface Zadacha10Variant {
  id: string;
  prototypeId: string;
  source: 'fipi' | 'analog';
  /** Номер в задачнике — только у ФИПИ. */
  no?: number;
  text: string;
  params: Params;
  /** Картинка сюжета: аналога (kartinkiSyuzhetov.ts) или прототипа. */
  kartinka?: { src: string; alt: string; src280?: string };
}

export function dannye(): Zadacha10Variant[] {
  const kartinki = kartinkiPrototipov();
  return [...FIPI, ...ANALOGI].map((b) => {
    const z = lite(b);
    const ill = kartinki[klyuchKartinki10(z)];
    const out: Zadacha10Variant = {
      id: z.id,
      prototypeId: z.prototypeId,
      source: z.source,
      text: z.text,
      params: z.params,
    };
    if (z.no !== undefined) out.no = z.no;
    if (ill !== undefined) {
      out.kartinka = {
        src: ill.webp,
        alt: ill.alt,
        ...(ill.webp280 === undefined ? {} : { src280: ill.webp280 }),
      };
    }
    return out;
  });
}
