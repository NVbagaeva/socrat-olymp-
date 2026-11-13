'use client';

/**
 * Журналы всех разделов для карты — одним снимком. Каждый ключ читается
 * через createLogStore (с переносом прежнего формата), подписка общая:
 * запись в любом тренажёре или синхронизация перерисовывает карту.
 */

import { useMemo, useSyncExternalStore } from 'react';
import { createLogStore, type LogStore } from '@/lib/progressLog';
import { LOCAL_CHANGE_EVENT, SYNC_APPLIED_EVENT } from '@/lib/syncedStore';
import { KARTA_ZHURNALY } from './katalog';
import type { Zhurnaly } from './model';

let stores: Map<number, LogStore> | null = null;

function vse(): Map<number, LogStore> {
  if (stores === null) {
    stores = new Map(
      Object.entries(KARTA_ZHURNALY).map(([no, key]) => [Number(no), createLogStore(key)]),
    );
  }
  return stores;
}

const PUSTO: Zhurnaly = {};
let snimok: Zhurnaly = PUSTO;
let versiya = -1;

function sobrat(): Zhurnaly {
  const out: Record<number, ReturnType<LogStore['get']>> = {};
  for (const [no, store] of vse()) out[no] = store.get();
  return out;
}

/** Снимок меняется, только если изменился хоть один журнал. */
function snapshot(): Zhurnaly {
  const svezhiy = sobrat();
  const tot = snimok as Record<number, unknown>;
  const izmenilsya = Object.keys(svezhiy).some(
    (no) => tot[Number(no)] !== (svezhiy as Record<number, unknown>)[Number(no)],
  );
  if (izmenilsya || versiya < 0) {
    snimok = svezhiy;
    versiya += 1;
  }
  return snimok;
}

function subscribe(listener: () => void): () => void {
  const keys = new Set(Object.values(KARTA_ZHURNALY));
  const fromTab = (event: StorageEvent) => {
    if (event.key === null || keys.has(event.key)) {
      for (const store of vse().values()) store.reload();
      listener();
    }
  };
  const fromSync = (event: Event) => {
    const list = (event as CustomEvent<{ keys?: string[] }>).detail?.keys;
    if (!Array.isArray(list) || list.some((key) => keys.has(key))) {
      for (const store of vse().values()) store.reload();
      listener();
    }
  };
  const fromLocal = () => listener();
  window.addEventListener('storage', fromTab);
  window.addEventListener(SYNC_APPLIED_EVENT, fromSync);
  window.addEventListener(LOCAL_CHANGE_EVENT, fromLocal);
  window.addEventListener('focus', fromLocal);
  return () => {
    window.removeEventListener('storage', fromTab);
    window.removeEventListener(SYNC_APPLIED_EVENT, fromSync);
    window.removeEventListener(LOCAL_CHANGE_EVENT, fromLocal);
    window.removeEventListener('focus', fromLocal);
  };
}

/** Журналы всех разделов; на сервере и при гидратации — пусто. */
export function useZhurnaly(): Zhurnaly {
  const z = useSyncExternalStore(subscribe, snapshot, () => PUSTO);
  return useMemo(() => z, [z]);
}

/* ── Что ученик уже видел освоенным: для анимации нового освоения ── */

const VIDEL_KEY = 'budetege:karta:videl:v1';

export function prochitatVidel(): Set<number> | null {
  try {
    const raw = window.localStorage.getItem(VIDEL_KEY);
    if (raw === null) return null;
    const list: unknown = JSON.parse(raw);
    return new Set(
      Array.isArray(list) ? list.filter((n): n is number => typeof n === 'number') : [],
    );
  } catch {
    return null;
  }
}

export function zapomnitVidel(osvoeno: readonly number[]): void {
  try {
    window.localStorage.setItem(VIDEL_KEY, JSON.stringify([...osvoeno].sort((a, b) => a - b)));
  } catch {
    /* Хранилище недоступно — анимация покажется ещё раз. */
  }
}
