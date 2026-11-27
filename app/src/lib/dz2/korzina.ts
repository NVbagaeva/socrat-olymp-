'use client';

/**
 * Корзина «В домашку» в браузере учителя: localStorage, своя у каждого
 * учителя этого браузера. Экраны подписываются на изменения (и из других
 * вкладок).
 */

import { useSyncExternalStore } from 'react';
import { currentUser } from '@/lib/auth/session';
import { browserStorage } from '@/lib/storage';
import {
  PUSTAYA_KORZINA,
  dobavit,
  izmenit,
  otmetit,
  otmetitVse,
  razobrat,
  sdvinut,
  ubrat,
  type ElementKorziny,
  type Korzina,
} from './model';

const KLYUCH = 'budetege:dz2:korzina:v1:';
const SOBYTIE = 'budetege:dz2:korzina';

function klyuch(): string | null {
  const u = currentUser();
  return u === null || u.role !== 'tutor' ? null : KLYUCH + u.id;
}

let kesh: { raw: string | null; k: Korzina } = { raw: null, k: PUSTAYA_KORZINA };

export function prochest(): Korzina {
  const key = klyuch();
  const s = browserStorage();
  if (key === null || s === null) return PUSTAYA_KORZINA;
  let raw: string | null = null;
  try {
    raw = s.getItem(key);
  } catch {
    return PUSTAYA_KORZINA;
  }
  if (raw === kesh.raw) return kesh.k;
  let k = PUSTAYA_KORZINA;
  try {
    k = raw === null ? PUSTAYA_KORZINA : razobrat(JSON.parse(raw));
  } catch {
    k = PUSTAYA_KORZINA;
  }
  kesh = { raw, k };
  return k;
}

function zapisat(k: Korzina): void {
  const key = klyuch();
  const s = browserStorage();
  if (key === null || s === null) return;
  try {
    if (k.elementy.length === 0) s.removeItem(key);
    else s.setItem(key, JSON.stringify(k));
  } catch {
    /* Хранилище переполнено или закрыто: корзина не сохранится. */
  }
  window.dispatchEvent(new Event(SOBYTIE));
}

export const korzina = {
  dobavit: (e: ElementKorziny) => zapisat(dobavit(prochest(), e)),
  ubrat: (key: string) => zapisat(ubrat(prochest(), key)),
  sdvinut: (key: string, na: -1 | 1) => zapisat(sdvinut(prochest(), key, na)),
  izmenit: (key: string, patch: Partial<ElementKorziny>) => zapisat(izmenit(prochest(), key, patch)),
  otmetit: (key: string, taskRef: string, vkl: boolean) => zapisat(otmetit(prochest(), key, taskRef, vkl)),
  otmetitVse: (key: string, vkl: boolean) => zapisat(otmetitVse(prochest(), key, vkl)),
  zamenit: (k: Korzina) => zapisat(k),
  ochistit: () => zapisat(PUSTAYA_KORZINA),
};

function podpiska(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key.startsWith(KLYUCH)) cb();
  };
  window.addEventListener(SOBYTIE, cb);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(SOBYTIE, cb);
    window.removeEventListener('storage', onStorage);
  };
}

export function useKorzina(): Korzina {
  return useSyncExternalStore(podpiska, prochest, () => PUSTAYA_KORZINA);
}
