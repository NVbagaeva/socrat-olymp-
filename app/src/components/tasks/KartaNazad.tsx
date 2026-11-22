'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { metkaDlyaKnopki, prochitatMetku, stranicaZadaniy } from '@/lib/kartaNazad';
import { sPerehodom } from './useVkladkaPerehod';
import './karta-nazad.css';

const bezPodpiski = () => () => {};

const TEKST = { knopka: 'К карте', strelka: '←' } as const;

const sModifikatorom = (e: {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}) => e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

/**
 * «← К карте» в строке вкладок раздела (TabsRow рисует её в обеих
 * копиях — в плитках и в липкой панели, поэтому кнопка видна всегда).
 * Есть только у пришедших с «Карты ЕГЭ»: метка — lib/kartaNazad.ts.
 *
 * slushat — копия, которая заодно переводит переходы между страницами
 * заданий в замену записи истории (одна на страницу): «назад» в
 * браузере с любой вкладки и любого задания ведёт сразу на карту.
 */
export function KartaNazad({ slushat }: { slushat: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  /* Адрес карты из метки; null — кнопки нет. Перечитывается при каждой
     отрисовке (смена страницы), на сборке страницы кнопки нет. */
  const kartaHref = useSyncExternalStore(
    bezPodpiski,
    () => metkaDlyaKnopki(pathname)?.href ?? null,
    () => null,
  );

  const est = kartaHref !== null;
  useEffect(() => {
    if (!slushat || !est) return undefined;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || sModifikatorom(e)) return;
      const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
      if (!(a instanceof HTMLAnchorElement) || a.closest('.karta-nazad') !== null) return;
      if ((a.target !== '' && a.target !== '_self') || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || !stranicaZadaniy(url.pathname)) return;
      /* Якорь и строка запроса на той же странице, файл — как обычно. */
      if (url.pathname === window.location.pathname) return;
      if (/\.[a-z0-9]{1,5}$/i.test(url.pathname.slice(url.pathname.lastIndexOf('/') + 1))) return;
      if (metkaDlyaKnopki(window.location.pathname) === null) return;
      e.preventDefault();
      const kuda = url.pathname + url.search + url.hash;
      const go = () => router.replace(kuda);
      if (a.getAttribute('role') !== 'tab' || !sPerehodom(kuda, pathname, go)) go();
    };
    window.addEventListener('click', onClick, true);
    return () => window.removeEventListener('click', onClick, true);
  }, [slushat, est, router, pathname]);

  if (kartaHref === null) return null;

  const nazad = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    if (sModifikatorom(e)) return;
    e.preventDefault();
    const m = prochitatMetku();
    /* Между картой и этой страницей в истории ничего не добавилось —
       шаг назад и есть карта. */
    if (m !== null && m.dlina !== null && window.history.length === m.dlina) window.history.back();
    else router.push(m?.href ?? kartaHref);
  };

  return (
    <a className="karta-nazad" href={kartaHref} onClick={nazad} data-karta-nazad="">
      <span className="karta-nazad__strelka" aria-hidden="true">
        {TEKST.strelka}
      </span>
      <span>{TEKST.knopka}</span>
    </a>
  );
}
