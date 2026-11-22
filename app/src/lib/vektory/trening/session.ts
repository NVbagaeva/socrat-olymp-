/**
 * Тренировка №2: ключи задач. Сама логика — общая (lib/trening/bank.ts).
 *
 * Задачи №2 не лежат в банке: их строит генератор по прототипу и seed.
 * Ключ задачи — «прототип|seed» («A6|k07»), как и прежде: по нему задача
 * воспроизводится. Каталог тренажёра — по 50 проверенных seed на тип
 * (lib/vektory/trening/katalog.ts); ключи прежнего тренажёра со
 * случайным seed («A6|lx2…-9fk3») тоже читаются — так открываются
 * прежние ошибки и закладки.
 */

import { isPayloadBanka, razobratZapis, type PayloadBanka } from '@/lib/trening/bank';

/** Ключи задач №2. */
export const KLYUCH2 = /^[ABC]\d\|[0-9a-z-]+$/i;

export function etoKlyuch2(id: string): boolean {
  return KLYUCH2.test(id);
}

/** Прототип задачи по ключу. */
export function prototipKlyucha2(id: string): string {
  return id.split('|')[0] ?? id;
}

export function isTrenazher2Payload(value: unknown): value is PayloadBanka {
  return isPayloadBanka(value, KLYUCH2);
}

/**
 * Запись тренировки. Понимает и прежнюю запись тренажёра №2
 * ({ control, tasks: [[ключ, подпись], …] }): незаконченная тренировка
 * открывается на той же задаче, «Контроль» — «Без подсказок и решений».
 */
export function razobratZapis2(packed: unknown): PayloadBanka | null {
  if (
    typeof packed === 'object' &&
    packed !== null &&
    Array.isArray((packed as { tasks?: unknown }).tasks) &&
    (packed as { tasks: unknown[] }).tasks.every(
      (t) => Array.isArray(t) && typeof t[0] === 'string' && KLYUCH2.test(t[0]),
    ) &&
    (packed as { tasks: unknown[] }).tasks.length > 0
  ) {
    const prezhnyaya = packed as { tasks: [string, unknown][]; control?: unknown };
    return {
      tasks: prezhnyaya.tasks.map(([id]) => ({ id, p: prototipKlyucha2(id) })),
      control: prezhnyaya.control === true,
      timer: true,
    };
  }
  return razobratZapis(packed, KLYUCH2);
}
