'use client';

/**
 * Прогресс сборника для вузов: один журнал попыток на все главы
 * (lib/progressLog). Задача — её номер «1.2.017», тип — «1.2».
 * Из журнала считаются «решено / верно» по типам и главам и «Работа над
 * ошибками». Журнал synced: со входом живёт в аккаунте.
 */

import { createLogStore } from '../progressLog';
import { isMistake, type LogOutcome, type ProgressLog } from '../progressLog/model';

export const SBORNIK_LOG_KEY = 'budetege:sbornik:log:v1';
export const logSbornika = createLogStore(SBORNIK_LOG_KEY);

/** Итог задачи по журналу: последняя попытка решает. */
export type IshodZadachi = 'verno' | 'podskazka' | 'oshibka';

export function ishodyZadach(log: ProgressLog): Map<string, IshodZadachi> {
  const out = new Map<string, IshodZadachi>();
  for (const item of log.attempts) {
    if (!/^\d+\.\d+\.\d+$/.test(item.task)) continue;
    out.set(item.task, ishod(item.outcome));
  }
  return out;
}

function ishod(outcome: LogOutcome): IshodZadachi {
  if (isMistake(outcome)) return 'oshibka';
  return outcome === 'hinted' ? 'podskazka' : 'verno';
}

export interface Schyot {
  /** Сколько задач закрыто (хоть раз). */
  resheno: number;
  /** Сколько закрыто верно последней попыткой (с подсказкой — тоже верно). */
  verno: number;
}

/** Счёт по задачам, id которых проходит отбор (тип, глава). */
export function schyot(ishody: Map<string, IshodZadachi>, otbor: (id: string) => boolean): Schyot {
  let resheno = 0;
  let verno = 0;
  for (const [id, item] of ishody) {
    if (!otbor(id)) continue;
    resheno += 1;
    if (item !== 'oshibka') verno += 1;
  }
  return { resheno, verno };
}

export const vTipe = (tip: string) => (id: string) => id.startsWith(`${tip}.`) && id.split('.').length === 3;
export const vGlave = (glava: number) => (id: string) => id.startsWith(`${glava}.`);
