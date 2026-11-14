'use client';

/**
 * Хранилища тренажёра заданий №4 и №5 в «Стеклянной сцене».
 *
 * Журнал попыток — тот же ключ, в который после PR #340 пишет и прежний
 * тренажёр: budetege:veroyatnost-N:log:v1. Тип попытки (kind) — метод
 * (блок банка), задача — «прототип:номер варианта», как и раньше:
 * прежние записи читаются без перевода. Счётчики старого формата
 * (budetege:veroyatnost-N:v2) сворачиваются в журнал при первом чтении
 * (LEGACY_LOGS) и сами остаются на месте.
 *
 * «Узнай метод» — по-прежнему своё хранилище (budetege:veroyatnost-N-
 * uznay:v2): это не попытки решить задачу, в журнал они не идут.
 *
 * Последний выбор тренировки — новый ключ budetege:zadanie-N:vybor:v1
 * (как у №6, №7). Ответов нигде нет.
 */

import { createLogStore, type LogStore } from '@/lib/progressLog';
import { createProgressStore, type ProgressStore } from '@/lib/progressStore';
import { createVyborBanka } from '@/lib/trening/vybor';
import type { SyncedStore } from '@/lib/syncedStore';
import type { VyborBanka } from '@/lib/trening/vybor';
import type { Zadanie45 } from './links';

export const LOG45_KEY: Record<Zadanie45, string> = {
  4: 'budetege:veroyatnost-4:log:v1',
  5: 'budetege:veroyatnost-5:log:v1',
};

export const UZNAY45_KEY: Record<Zadanie45, string> = {
  4: 'budetege:veroyatnost-4-uznay:v2',
  5: 'budetege:veroyatnost-5-uznay:v2',
};

export const VYBOR45_KEY: Record<Zadanie45, string> = {
  4: 'budetege:zadanie-4:vybor:v1',
  5: 'budetege:zadanie-5:vybor:v1',
};

/* Хранилища заводятся лениво и по одному на ключ: два хранилища на
   одном ключе разошлись бы в кеше страницы. */
const LOGI = new Map<Zadanie45, LogStore>();
const UZNAY = new Map<Zadanie45, ProgressStore>();
const VYBOR = new Map<Zadanie45, SyncedStore<VyborBanka>>();

export function log45(z: Zadanie45): LogStore {
  let s = LOGI.get(z);
  if (s === undefined) {
    s = createLogStore(LOG45_KEY[z]);
    LOGI.set(z, s);
  }
  return s;
}

export function uznay45(z: Zadanie45): ProgressStore {
  let s = UZNAY.get(z);
  if (s === undefined) {
    s = createProgressStore(UZNAY45_KEY[z]);
    UZNAY.set(z, s);
  }
  return s;
}

export function vybor45(z: Zadanie45): SyncedStore<VyborBanka> {
  let s = VYBOR.get(z);
  if (s === undefined) {
    s = createVyborBanka(VYBOR45_KEY[z]);
    VYBOR.set(z, s);
  }
  return s;
}

/**
 * Раздел записи незаконченной тренировки: budetege:trainer:N:session
 * (lib/trainerSession/store.ts). Ключ тот же, что у прежнего тренажёра.
 */
export const SESSIYA45: Record<Zadanie45, { scope: string }> = {
  4: { scope: '4' },
  5: { scope: '5' },
};
