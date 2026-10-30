'use client';

/**
 * Прогресс ключевых схем №18 — коробки Лейтнера.
 *
 * Одно хранилище на плитки схем, кнопки «Знаю / Не знаю» на странице
 * схемы, карточки и индикатор во вводной плашке: ответ в одном месте
 * сразу виден во всех. Устройство — как у lib/progressStore.ts:
 * localStorage под своим ключом, чтение через useSyncExternalStore,
 * на сервере — пустой снимок, любое обращение к хранилищу в try/catch.
 *
 * Коробки 1…5. «Знаю» переводит схему в следующую коробку (не ниже
 * второй), «Не знаю» возвращает в первую. Статус: коробки нет —
 * «Не начинал», первая — «Учу», вторая и выше — «Знаю».
 */

import { useSyncExternalStore } from 'react';
import type { Status18 } from '@/content/zadanie18';

export const KLYUCH_18 = 'budetege:planimetriya-18:skhemy:v1';
export const KOROBOK = 5;

export interface Zapis18 {
  korobka: number;
  /** Сколько раз отвечал по схеме. */
  otvetov: number;
  /** Когда отвечал последний раз, мс. */
  kogda: number;
}

export type Progress18 = Readonly<Record<string, Zapis18>>;

const PUSTO: Progress18 = {};

function razobrat(raw: string | null): Progress18 {
  if (raw === null) return PUSTO;
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== 'object' || v === null) return PUSTO;
    const out: Record<string, Zapis18> = {};
    for (const [id, z] of Object.entries(v as Record<string, unknown>)) {
      if (typeof z !== 'object' || z === null) continue;
      const k = (z as Record<string, unknown>).korobka;
      const n = (z as Record<string, unknown>).otvetov;
      const t = (z as Record<string, unknown>).kogda;
      if (typeof k !== 'number' || k < 1 || k > KOROBOK) continue;
      out[id] = {
        korobka: Math.round(k),
        otvetov: typeof n === 'number' && n > 0 ? n : 1,
        kogda: typeof t === 'number' ? t : 0,
      };
    }
    return out;
  } catch {
    return PUSTO;
  }
}

let cache: Progress18 | null = null;
const slushateli = new Set<() => void>();

function snimok(): Progress18 {
  if (cache === null) {
    try {
      cache = razobrat(window.localStorage.getItem(KLYUCH_18));
    } catch {
      cache = PUSTO;
    }
  }
  return cache;
}

function opovestit(): void {
  slushateli.forEach((fn) => fn());
}

function podpisatsya(fn: () => void): () => void {
  slushateli.add(fn);
  const sync = (e: StorageEvent) => {
    if (e.key === KLYUCH_18 || e.key === null) {
      cache = null;
      opovestit();
    }
  };
  window.addEventListener('storage', sync);
  return () => {
    slushateli.delete(fn);
    window.removeEventListener('storage', sync);
  };
}

function sohranit(next: Progress18): void {
  cache = next;
  try {
    window.localStorage.setItem(KLYUCH_18, JSON.stringify(next));
  } catch {
    /* Хранилище недоступно — прогресс живёт до перезагрузки. */
  }
  opovestit();
}

export function useProgress18(): Progress18 {
  return useSyncExternalStore(podpisatsya, snimok, () => PUSTO);
}

/** Следующая коробка по ответу: чистая функция, её проверяет тест. */
export function sleduyushchayaKorobka(korobka: number | undefined, znayu: boolean): number {
  if (!znayu) return 1;
  return Math.min(KOROBOK, Math.max(2, (korobka ?? 0) + 1));
}

export function otmetit18(id: string, znayu: boolean): void {
  const tek = snimok();
  const z = tek[id];
  sohranit({
    ...tek,
    [id]: {
      korobka: sleduyushchayaKorobka(z?.korobka, znayu),
      otvetov: (z?.otvetov ?? 0) + 1,
      kogda: Date.now(),
    },
  });
}

export function sbrosit18(): void {
  sohranit(PUSTO);
}

export function status18(z: Zapis18 | undefined): Status18 {
  if (z === undefined) return 'new';
  return z.korobka >= 2 ? 'known' : 'learning';
}

/**
 * Порядок колоды: сначала младшие коробки, внутри коробки — давно не
 * повторявшиеся. Новые схемы идут вместе с первой коробкой.
 */
export function poryadokKolody(ids: readonly string[], p: Progress18): string[] {
  return [...ids].sort((a, b) => {
    const za = p[a];
    const zb = p[b];
    const ka = za?.korobka ?? 1;
    const kb = zb?.korobka ?? 1;
    if (ka !== kb) return ka - kb;
    return (za?.kogda ?? 0) - (zb?.kogda ?? 0);
  });
}
