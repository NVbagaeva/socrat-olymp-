/**
 * Сессия тренажёра задания №10: выбор, план задач, ответы.
 *
 * Хранится в sessionStorage и читается через useSyncExternalStore:
 * при переходе на другую вкладку раздела (страница тренажёра
 * размонтируется) и обратно тренировка продолжается с той же задачи.
 * Ответов здесь нет — только введённое и «верно / неверно».
 */

import { useSyncExternalStore } from 'react';
import type { Istochnik } from './sborka';

export interface Sessiya10 {
  ekran: 'vybor' | 'reshenie' | 'itog';
  tipy: string[];
  istochnik: Istochnik;
  skolko: number;
  plan: string[];
  tekushchaya: number;
  otvety: Record<string, { vvod: string; verno: boolean }>;
}

const KLYUCH = 'budetege:zadanie-10:trenazher:v1';

export const SESSIYA_PO_UMOLCHANIYU: Sessiya10 = {
  ekran: 'vybor',
  tipy: [],
  istochnik: 'fipi',
  skolko: 10,
  plan: [],
  tekushchaya: 0,
  otvety: {},
};

const slushateli = new Set<() => void>();
let kesh: { raw: string | null; s: Sessiya10 } | null = null;

function prochitat(): Sessiya10 {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(KLYUCH);
  } catch {
    raw = null;
  }
  if (kesh && kesh.raw === raw) {
    return kesh.s;
  }
  let s = SESSIYA_PO_UMOLCHANIYU;
  if (raw) {
    try {
      s = { ...SESSIYA_PO_UMOLCHANIYU, ...(JSON.parse(raw) as Partial<Sessiya10>) };
    } catch {
      s = SESSIYA_PO_UMOLCHANIYU;
    }
  }
  kesh = { raw, s };
  return s;
}

export function zapisatSessiyu(s: Sessiya10): void {
  try {
    window.sessionStorage.setItem(KLYUCH, JSON.stringify(s));
  } catch {
    /* приватный режим — тренировка живёт до перезагрузки */
    kesh = { raw: JSON.stringify(s), s };
  }
  slushateli.forEach((f) => f());
}

export function useSessiya10(): Sessiya10 {
  return useSyncExternalStore(
    (f) => {
      slushateli.add(f);
      return () => slushateli.delete(f);
    },
    prochitat,
    () => SESSIYA_PO_UMOLCHANIYU,
  );
}
