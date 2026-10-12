'use client';

import type { MouseEvent } from 'react';
import { SPRAVOCHNIK_1 } from '@/content/spravochnik1/tipy';

const PDF = SPRAVOCHNIK_1.pdf;

/**
 * «← Назад» и хлебные крошки печатной страницы справочника — у неё нет
 * оболочки сайта, и на телефоне иначе не уйти.
 *
 * Пришли с нашего сайта (referrer — наш адрес, и в истории есть куда
 * вернуться) — шаг назад по истории: человек вернётся туда, откуда
 * открыл печать, с той же прокруткой. Открыли по прямой ссылке, из
 * закладки или в новой вкладке — обычный переход по ссылке на вкладку
 * «Теория» задания №1. Без скрипта ссылка работает так же.
 * При печати блок скрыт (spravochnik1-pdf.css).
 */
export function Nazad1({ teoriya, zadanie }: { teoriya: string; zadanie: string }) {
  function nazad(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    let svoy = false;
    try {
      const otkuda = new URL(document.referrer);
      svoy =
        otkuda.origin === window.location.origin && otkuda.pathname !== window.location.pathname;
    } catch {
      svoy = false;
    }
    if (svoy && window.history.length > 1) {
      e.preventDefault();
      window.history.back();
    }
  }
  return (
    <div className="spr1p-verh" data-nazad>
      <a className="spr1p-nazad" href={teoriya} onClick={nazad} aria-label={PDF.nazadAria}>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
          className="spr1p-nazad__strelka"
        >
          <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
        </svg>
        {PDF.nazad}
      </a>
      <nav className="spr1p-kroshki" aria-label={PDF.kroshki.aria}>
        <ol>
          <li>
            <a href={zadanie}>{PDF.kroshki.zadanie}</a>
          </li>
          <li>
            <a href={teoriya}>{PDF.kroshki.teoriya}</a>
          </li>
          <li aria-current="page">{PDF.kroshki.spravochnik}</li>
        </ol>
      </nav>
    </div>
  );
}
