'use client';

import { useCallback, useEffect, useState } from 'react';
import { errorText, type Load } from '@/components/kabinet/useKabinet';
import type { RabotyApi } from '@/lib/raboty/api';
import { rabotyApi } from '@/lib/raboty/client';

/**
 * Данные работ: загрузить и перезагружать при каждом изменении (своя
 * вкладка или соседняя). `loader` — стабильный, через useCallback.
 */
export function useRaboty<T>(
  loader: (api: RabotyApi) => Promise<T>,
): Load<T> & { reload: () => void } {
  const [state, setState] = useState<Load<T>>({ status: 'loading' });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);
  useEffect(() => rabotyApi().subscribe(reload), [reload]);
  useEffect(() => {
    let alive = true;
    loader(rabotyApi()).then(
      (data) => alive && setState({ status: 'ready', data }),
      (error: unknown) => alive && setState({ status: 'error', message: errorText(error) }),
    );
    return () => {
      alive = false;
    };
  }, [loader, tick]);
  return { ...state, reload };
}

/** Дата и время по-русски коротко: «24 окт., 14:30». */
export function kogda(iso: string | null): string {
  if (iso === null) return '—';
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Скачать файл в браузере. */
export function skachat(name: string, data: Uint8Array | string, mime: string): void {
  const blob = new Blob([data as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
