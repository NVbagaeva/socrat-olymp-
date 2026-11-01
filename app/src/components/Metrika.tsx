'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import { METRIKA_ID, prosmotr } from '@/lib/metrika';

/**
 * Счётчик Яндекс Метрики (lib/metrika.ts).
 *
 * Файл счётчика грузится стратегией lazyOnload — когда страница уже
 * загружена и браузер свободен: на первую отрисовку, LCP и блокировку
 * потока он не влияет. До его загрузки вызовы ym копятся в очереди
 * (стандартная заглушка Метрики, lib/metrika.ts) и уходят, как только
 * он загрузится.
 *
 * Сайт переходит между страницами без перезагрузки, поэтому счётчик
 * заведён с defer: true, а просмотр каждой страницы, и первой тоже,
 * отправляет компонент по смене адреса.
 */
function Prosmotry() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const prev = useRef<string | undefined>(undefined);
  useEffect(() => {
    const url = window.location.href;
    prosmotr(url, prev.current ?? (document.referrer === '' ? undefined : document.referrer));
    prev.current = url;
  }, [pathname, query]);
  return null;
}

export function Metrika() {
  if (!/^\d+$/.test(METRIKA_ID)) return null;
  return (
    <>
      <Script src="https://mc.yandex.ru/metrika/tag.js" strategy="lazyOnload" />
      <Suspense fallback={null}>
        <Prosmotry />
      </Suspense>
    </>
  );
}
