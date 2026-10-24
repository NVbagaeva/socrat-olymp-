/**
 * Данные задания №6 для «Собрать вариант» (серверная часть, маршрут
 * /variant/dannye/z06.json). Те же задачи, что в public/data/zadanie6
 * (`lite` из lib/zadanie6/dannye-server.ts): условие и параметры,
 * **без ответа** — ответ, рисунок и разбор браузер считает решателем
 * прототипа по параметрам, как лист учителя №6 (List6). Отпечаток
 * ответа генератору не нужен и не передаётся.
 */

import { BANK } from '@/lib/zadanie6/bank';
import { lite } from '@/lib/zadanie6/dannye-server';
import type { Istochnik, Params } from '@/lib/zadanie6/types';

export interface Zadacha6Variant {
  /** «S01» — исходная задача, «P01-a07» — аналог. */
  id: string;
  prototypeId: string;
  source: Istochnik;
  /** Где в источнике: «Математическое ожидание, №3» — у исходных задач. */
  gde?: string;
  text: string;
  posle?: string;
  params: Params;
}

export function dannye(): Zadacha6Variant[] {
  return BANK.map((b) => {
    const z = lite(b);
    const out: Zadacha6Variant = {
      id: z.id,
      prototypeId: z.prototypeId,
      source: z.source,
      text: z.text,
      params: z.params,
    };
    if (z.gde !== undefined) out.gde = z.gde;
    if (z.posle !== undefined) out.posle = z.posle;
    return out;
  });
}
