/**
 * Задача прежнего №17 из варианта — для раздела экономической задачи
 * (в ЕГЭ-2027 задачи прежнего №17 идут внутри неё: экономические и на
 * оптимизацию). Условие, ответ и решение собирает шаблон варианта, без
 * правок.
 *
 * Шаблоны тяжёлые (движки чертежей, точная арифметика): модуль
 * подтягивает их отдельным куском, только когда задачу открыли.
 * Работает и на сборке (теория), и в браузере (карточки задач).
 */

import type { Chast2Zadacha } from '@/lib/povyshennye/chast2/types';

/** Номер хранения прежнего №17 в данных вариантов. */
export const NO_17 = 17;

/** Где задача: вариант повышенной сложности k.v или ежемесячный вариант k (v = null). */
export interface MestoVarianta {
  k: number;
  v: number | null;
}

/**
 * Запись прежнего №17 среди записей части 2: шаблон «u17.kredit2» или
 * «ev3.17» (номер хранения в имени шаблона).
 */
export function zapis17<T extends { s: string }>(zapisi: readonly T[]): T | undefined {
  return zapisi.find((x) => /^[a-z]+17\.|\.17$/.test(x.s));
}

/** Задача прежнего №17 варианта k.v (у ежемесячного — варианта k). */
export async function zadachaVarianta17({ k, v }: MestoVarianta): Promise<Chast2Zadacha> {
  let z: Chast2Zadacha | undefined;
  if (v === null) {
    const [dannye, chast2] = await Promise.all([
      import('@/lib/ezhemesyachnye/dannye'),
      import('@/lib/ezhemesyachnye/chast2'),
    ]);
    const zp = zapis17((await dannye.zagruzitVariant(k))?.chast2?.[0] ?? []);
    z = zp === undefined ? undefined : chast2.zadacha2EV(zp);
  } else {
    const [dannye, chast2] = await Promise.all([
      import('@/lib/povyshennye/dannye'),
      import('@/lib/povyshennye/chast2'),
    ]);
    const zp = zapis17((await dannye.zagruzitVariant(k))?.chast2?.[v - 1] ?? []);
    z = zp === undefined ? undefined : chast2.zadacha2(zp);
  }
  if (z === undefined || z.no !== NO_17) {
    throw new Error(`Нет задачи №${NO_17} в варианте ${k}${v === null ? '' : `.${v}`}`);
  }
  return z;
}

/** Ключ задачи для якоря: «pv27-5», «ev3». */
export function klyuchVarianta({ k, v }: MestoVarianta): string {
  return v === null ? `ev${k}` : `pv${k}-${v}`;
}
