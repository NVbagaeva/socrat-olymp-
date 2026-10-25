'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { KabinetError, type KabinetApi } from '@/lib/kabinet/api';
import { kabinetApi } from '@/lib/kabinet/client';

export type Load<T> =
  { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; message: string };

export function errorText(error: unknown): string {
  return error instanceof KabinetError ? error.message : 'Не получилось. Попробуйте ещё раз.';
}

/**
 * Данные кабинета: загрузить и перезагружать при каждом изменении базы
 * (своя вкладка или соседняя). `loader` должен быть стабильным —
 * через useCallback.
 */
export function useKabinet<T>(
  loader: (api: KabinetApi) => Promise<T>,
): Load<T> & { reload: () => void } {
  const [state, setState] = useState<Load<T>>({ status: 'loading' });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => kabinetApi().subscribe(reload), [reload]);

  useEffect(() => {
    let alive = true;
    loader(kabinetApi()).then(
      (data) => alive && setState({ status: 'ready', data }),
      (error: unknown) => alive && setState({ status: 'error', message: errorText(error) }),
    );
    return () => {
      alive = false;
    };
  }, [loader, tick]);

  return { ...state, reload };
}

/** Параметр адреса (?id=…): страницы статические, читаем в браузере. */
export function useQueryParam(name: string): string | null {
  return useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get(name),
    () => null,
  );
}

/** Дата и время по-русски: «15 окт., 14:30». */
export function formatDate(iso: string | null, withTime = true): string {
  if (iso === null) return '—';
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

/** «12 мин», «1 ч 05 мин». */
export function formatDuration(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} мин`;
  return `${Math.floor(min / 60)} ч ${String(min % 60).padStart(2, '0')} мин`;
}
