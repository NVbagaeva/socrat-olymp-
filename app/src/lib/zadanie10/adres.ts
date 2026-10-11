/**
 * Адресная строка как хранилище состояния клиентских вкладок №10
 * («Для репетиторов», печатный лист): код комплекта и номер урока живут
 * в ?kod=…&u=…, поэтому ссылку можно открыть на другом устройстве.
 * Читается через useSyncExternalStore, на сервере — пустая строка.
 */

import { useSyncExternalStore } from 'react';

const SOBYTIE = 'z10-adres';

function podpisatsya(f: () => void): () => void {
  window.addEventListener('popstate', f);
  window.addEventListener(SOBYTIE, f);
  return () => {
    window.removeEventListener('popstate', f);
    window.removeEventListener(SOBYTIE, f);
  };
}

export function useAdres(): string {
  return useSyncExternalStore(
    podpisatsya,
    () => window.location.search,
    () => '',
  );
}

export function zamenitAdres(q: URLSearchParams): void {
  window.history.replaceState(null, '', `${window.location.pathname}?${q.toString()}`);
  window.dispatchEvent(new Event(SOBYTIE));
}
