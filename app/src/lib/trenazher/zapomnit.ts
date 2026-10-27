'use client';

/**
 * Фильтр тренажёра раздела: внешнее хранилище для useSyncExternalStore.
 *
 * На сервере адреса и localStorage нет — снимок сервера это фильтр по
 * умолчанию (или ярлыка). В браузере фильтр при первом чтении берётся
 * из ссылки, иначе из запомненного для раздела, иначе по умолчанию;
 * каждая правка пишется в адрес (ссылку можно отправить ученику) и в
 * память раздела.
 */

import { useCallback, useSyncExternalStore } from 'react';
import { estVSsylke, izSsylki, izZapisi, vSsylku } from './filtr';
import type { Filtr, TrenazherConfig } from './types';

const CACHE = new Map<string, Filtr>();
const LISTENERS = new Set<() => void>();

function klyuch(scope: string): string {
  return `budetege:trenazher:${scope}:filtr`;
}

function nachalnyy(config: TrenazherConfig, start: Filtr): Filtr {
  const q = new URLSearchParams(window.location.search);
  if (estVSsylke(q)) {
    return izSsylki(q, config);
  }
  try {
    const raw = window.localStorage.getItem(klyuch(config.scope));
    const saved = raw === null ? null : izZapisi(JSON.parse(raw), config);
    /* Ярлык прежнего адреса сильнее запомненного: он и есть выбор. */
    if (saved !== null && vSsylku(start) === '') return saved;
  } catch {
    /* Хранилища нет — по умолчанию. */
  }
  return start;
}

function subscribe(listener: () => void): () => void {
  LISTENERS.add(listener);
  return () => LISTENERS.delete(listener);
}

/** Фильтр раздела и его правка. start — фильтр по умолчанию или ярлыка. */
export function useFiltr(config: TrenazherConfig, start: Filtr): [Filtr, (next: Filtr) => void] {
  const scope = config.scope;
  const snapshot = useCallback(() => {
    let f = CACHE.get(scope);
    if (f === undefined) {
      f = nachalnyy(config, start);
      CACHE.set(scope, f);
    }
    return f;
  }, [config, scope, start]);
  const server = useCallback(() => start, [start]);
  const f = useSyncExternalStore(subscribe, snapshot, server);

  const set = useCallback(
    (next: Filtr) => {
      CACHE.set(scope, next);
      const q = vSsylku(next);
      try {
        window.localStorage.setItem(klyuch(scope), JSON.stringify({ s: q }));
      } catch {
        /* Хранилища нет — фильтр живёт до перезагрузки. */
      }
      const href = `${window.location.pathname}${q === '' ? '' : `?${q}`}${window.location.hash}`;
      window.history.replaceState(window.history.state, '', href);
      LISTENERS.forEach((fn) => fn());
    },
    [scope],
  );
  return [f, set];
}
