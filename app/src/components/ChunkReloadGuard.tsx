'use client';

import { useEffect } from 'react';
import { reloadOnceForChunkError } from '@/lib/chunkReload';

/**
 * Ловит сбой загрузки кода там, где граница ошибок React бессильна:
 * когда не загрузился сам файл скрипта или отклонилось обещание
 * динамического импорта вне отрисовки. Перезагружает страницу один раз
 * (lib/chunkReload.ts), дальше решает error.tsx.
 *
 * Ничего не рисует. Стоит в корневом layout.
 */
export function ChunkReloadGuard() {
  useEffect(() => {
    const onRejection = (event: PromiseRejectionEvent) => {
      reloadOnceForChunkError(event.reason);
    };
    const onError = (event: ErrorEvent) => {
      reloadOnceForChunkError(event.error ?? event.message);
    };
    /* Не загрузившийся <script> событие error не всплывает, его видно
       только на стадии перехвата. Интересен лишь код самого сайта. */
    const onResource = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLScriptElement && target.src.includes('/_next/static/')) {
        reloadOnceForChunkError('ChunkLoadError');
      }
    };
    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener('error', onError);
    window.addEventListener('error', onResource, true);
    return () => {
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('error', onError);
      window.removeEventListener('error', onResource, true);
    };
  }, []);

  return null;
}
