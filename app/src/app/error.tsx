'use client';

import { useEffect } from 'react';
import { ErrorFallback } from '@/components/ErrorFallback';
import { reloadOnceForChunkError } from '@/lib/chunkReload';

/**
 * Ошибка в любой странице сайта: вместо белого экрана — сообщение
 * по-русски с кнопками «Обновить страницу» и «На главную».
 *
 * Если это сбой загрузки кода (после выкладки новой версии у ученика
 * открыта старая), страница один раз перезагружается сама.
 */
export default function SiteError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    if (!reloadOnceForChunkError(error)) {
      console.error('Страница не отрисовалась', error);
    }
  }, [error]);

  return (
    <main className="app-main">
      <ErrorFallback error={error} />
    </main>
  );
}
