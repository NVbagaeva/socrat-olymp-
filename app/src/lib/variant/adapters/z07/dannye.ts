/**
 * Формат данных №7 для генератора вариантов: задача без ответа.
 * Собирает их lib/variant/data/z07.ts на сервере.
 */

import type { Params } from '@/lib/zadanie7/types';

export interface Zadacha7 {
  /** «F001» — задача ФИПИ, «P01-a07» — аналог. */
  id: string;
  /** Прототип: «P01». */
  p: string;
  /** Номер ФИПИ по порядку раздела — только у задач ФИПИ. */
  no?: number;
  /** Условие ФИПИ как в источнике; у аналога нет — его собирает прототип. */
  t?: string;
  params: Params;
}

export interface Dannye7 {
  z: Zadacha7[];
}
