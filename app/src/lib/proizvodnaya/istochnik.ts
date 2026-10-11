'use client';

/**
 * Источник заданий тренажёра №9: открытый банк или сгенерированные.
 * Выбор запоминается между визитами (localStorage). Саму тренировку
 * хранит общая оболочка сессии (components/tasks/session).
 */

import { useSyncExternalStore } from 'react';
import { persistent } from '../storage';
import type { Istochnik } from './types';

export const ISTOCHNIK_OTKRYTYJ: Istochnik = 'otkrytyj-bank';
export const ISTOCHNIK_SVOI: Istochnik = 'ne-iz-otkrytogo-banka';

const istochnikStore = persistent<Istochnik>('proizvodnaya-9:istochnik', ISTOCHNIK_SVOI);

export function useIstochnik(): [Istochnik, (value: Istochnik) => void] {
  const value = useSyncExternalStore(
    istochnikStore.subscribe,
    istochnikStore.read,
    istochnikStore.initial,
  );
  const safe: Istochnik = value === ISTOCHNIK_OTKRYTYJ ? ISTOCHNIK_OTKRYTYJ : ISTOCHNIK_SVOI;
  return [safe, (next) => istochnikStore.write(next)];
}
