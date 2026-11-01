'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useSyncExternalStore } from 'react';
import { hasAnalyticsConsent, subscribeCookieChoice } from '@/lib/legal/cookies';
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
 *
 * Без согласия посетителя (баннер о cookie, lib/legal/cookies.ts)
 * файл счётчика не грузится вовсе. Согласие дали — счётчик подключается
 * сразу, без перезагрузки; отказались — не подключается.
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
  /* Счётчик — только после «Разрешить Метрику» в баннере о cookie. */
  const soglasie = useSyncExternalStore(subscribeCookieChoice, hasAnalyticsConsent, () => false);
  if (!/^\d+$/.test(METRIKA_ID) || !soglasie) return null;
  return (
    <>
      <Script src="https://mc.yandex.ru/metrika/tag.js" strategy="lazyOnload" />
      <Suspense fallback={null}>
        <Prosmotry />
      </Suspense>
    </>
  );
}
