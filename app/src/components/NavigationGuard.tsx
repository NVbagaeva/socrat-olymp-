'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { href } from '@/lib/paths';

/** Сколько ждём перехода внутри сайта, прежде чем открыть страницу целиком. */
export const NAVIGATION_STUCK_MS = 12_000;

/* Хвостовая косая для сравнения адресов значения не имеет. */
function samePath(a: string, b: string): boolean {
  const strip = (p: string) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p);
  return strip(a) === strip(b);
}

/**
 * Переход внутри сайта не оставляет белый экран.
 *
 * Next.js открывает страницу без перезагрузки: берёт её данные
 * (…/index.txt) и дорисовывает экран. Если это не вышло, он сам уходит
 * в обычный переход браузера — но если тот заблокирован (Safari не
 * пускает редирект с https на http) или повис, ученик остаётся перед
 * пустой страницей. Здесь две страховки:
 *
 * 1. Ссылка на страницу без «/» на конце (/zadaniya): на хостинге такой
 *    адрес уводит на http, поэтому переходим сразу на /zadaniya/ —
 *    обычным переходом, мимо роутера. Ссылок таких на сайте нет
 *    (проверка scripts/check-trailing-slash.mjs), это на всякий случай.
 * 2. Нажали ссылку внутри сайта, а адрес за NAVIGATION_STUCK_MS так и не
 *    сменился — открываем целевую страницу целиком (location.assign).
 *    Сменился адрес или страница ушла — ожидание снимается.
 *
 * Ничего не рисует. Стоит в корневом layout.
 */
export function NavigationGuard() {
  const pathname = usePathname();
  const timer = useRef<number | null>(null);

  /* Адрес сменился — переход удался, ждать нечего. */
  useEffect(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    const stop = () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
    };

    /* Стадия перехвата на window: раньше, чем ссылка Next.js получит клик. */
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement)) {
        return;
      }
      if ((link.target !== '' && link.target !== '_self') || link.hasAttribute('download')) {
        return;
      }
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) {
        return;
      }
      /* Файл (.pdf, .png) — не страница, его открывает браузер. */
      if (/\.[a-z0-9]{1,5}$/i.test(url.pathname.slice(url.pathname.lastIndexOf('/') + 1))) {
        return;
      }
      if (!url.pathname.endsWith('/')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.location.assign(href(url.pathname) + url.search + url.hash);
        return;
      }
      /* Та же страница (якорь, ?tab=…) — переходить некуда. */
      if (samePath(url.pathname, window.location.pathname)) {
        return;
      }
      stop();
      timer.current = window.setTimeout(() => {
        timer.current = null;
        if (!samePath(window.location.pathname, url.pathname)) {
          window.location.assign(url.href);
        }
      }, NAVIGATION_STUCK_MS);
    };

    window.addEventListener('click', onClick, true);
    window.addEventListener('pagehide', stop);
    return () => {
      stop();
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('pagehide', stop);
    };
  }, []);

  return null;
}
