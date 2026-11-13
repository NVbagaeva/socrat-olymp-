/**
 * Тренировка №1 на общем тренажёре по банку (lib/trening/bank.ts): какие
 * у задач ключи и как читается запись прежнего тренажёра.
 *
 * Ключи — те же, что писал прежний тренажёр на панели фильтров
 * (trenazher/sessiya.ts: klyuchZadachi), поэтому журнал попыток,
 * решённые задачи и «Мои ошибки» переходят без переноса:
 * «p05|b12» — задача 12 открытого банка, «p05|a1500» — аналог,
 * «p05|nСИД» — новая задача генератора (была в прежних тренировках,
 * открывается и сейчас). Прототип — «p05».
 *
 * Модуль лёгкий: им пользуются и сервер (каталог), и браузер.
 */

import { isRecord } from '../../trainerSession/restore';
import type { PayloadBanka, TaskBanka } from '../../trening/bank';

/** Ключи задач №1. */
export const KLYUCH1 = /^p\d\d\|(?:[ba]\d+|n[^|]+)$/;

/** Прототип по ключу задачи: «p05|b12» → «p05». */
export function prototipKlyucha1(id: string): string {
  return id.split('|')[0] ?? id;
}

/**
 * Запись незаконченной тренировки прежнего тренажёра №1 (общая панель
 * фильтров, lib/trenazher/sessiya.ts): { v: 1, rezhim, seed, items:
 * [{ k: 'p05|b12' } | { k: 'p05|n', seed? }] }. Задания — те же ключи;
 * новая задача без своего seed брала seed тренировки и место — так же
 * собирается и теперь. Режим «Без подсказок» → «Без подсказок и
 * решений», «На время» и остальные — с таймером. Чужая запись — null.
 */
export function prezhnyayaZapis1(packed: unknown): PayloadBanka | null {
  if (
    !isRecord(packed) ||
    packed['v'] !== 1 ||
    typeof packed['seed'] !== 'string' ||
    !Array.isArray(packed['items']) ||
    packed['items'].length === 0
  ) {
    return null;
  }
  const seed = packed['seed'];
  const tasks: TaskBanka[] = [];
  for (const [at, item] of (packed['items'] as unknown[]).entries()) {
    if (!isRecord(item) || typeof item['k'] !== 'string') return null;
    const own = item['seed'];
    if (own !== undefined && typeof own !== 'string') return null;
    const k = item['k'];
    const id = /^p\d\d\|n$/.test(k) ? `${k}${own ?? `${seed}:${at}`}` : k;
    if (!KLYUCH1.test(id)) return null;
    tasks.push({ id, p: prototipKlyucha1(id) });
  }
  return { tasks, control: packed['rezhim'] === 'bez', timer: true };
}
