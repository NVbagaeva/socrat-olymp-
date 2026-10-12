'use client';

import Link from 'next/link';
import { RAZDELY_OPEN_EVENT } from './types';

export interface VseRazdelyKnopkaProps {
  no: string;
  /**
   * Страница задания со списком разделов: туда ведёт кнопка, пока код
   * страницы не загрузился, и при открытии в новой вкладке браузера.
   */
  href: string;
}

/**
 * «‹ Все разделы №12» над заголовком: открывает то же меню, что
 * плашка над вкладками. Само меню живёт при плашке (RazdelyNav),
 * кнопка только зовёт его событием.
 */
export function VseRazdelyKnopka({ no, href }: VseRazdelyKnopkaProps) {
  return (
    <Link
      className="razdely-vse"
      href={href}
      aria-haspopup="dialog"
      onClick={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        window.dispatchEvent(
          new CustomEvent<HTMLElement>(RAZDELY_OPEN_EVENT, { detail: event.currentTarget }),
        );
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m15 6-6 6 6 6" />
      </svg>
      Все разделы №{no}
    </Link>
  );
}
