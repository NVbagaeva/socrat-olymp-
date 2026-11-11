'use client';

import { clsx } from 'clsx';
import {
  bookmarks,
  bookmarkId,
  isBookmarked,
  toggleBookmark,
  type BookmarkPlace,
} from '@/lib/zakladki';
import './zakladki.css';

export interface BookmarkButtonProps {
  /** Раздел: «8». */
  section: string;
  place: BookmarkPlace;
  /** Что открыть: идентификатор задачи или «блок#номер». */
  refId: string;
  /** Подпись в списке «Отложенные». */
  title: string;
  /** Адрес, по которому задача откроется из списка. */
  href: string;
  className?: string;
}

/**
 * «Отложить на потом»: закладка на задачу. Нажали ещё раз — снята.
 * Список отложенных — в кабинете ученика; гостю — в этом браузере.
 */
export function BookmarkButton({
  section,
  place,
  refId,
  title,
  href,
  className,
}: BookmarkButtonProps) {
  const list = bookmarks.use();
  const id = bookmarkId(section, place, refId);
  const on = isBookmarked(list, id);
  return (
    <button
      type="button"
      className={clsx('zakladka', on && 'is-on', className)}
      aria-pressed={on}
      onClick={() =>
        bookmarks.update((current) =>
          toggleBookmark(current, { id, section, place, ref: refId, title, href }),
        )
      }
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="zakladka__ico">
        <path d="M7 4.5h10a.5.5 0 0 1 .5.5v14.5L12 16l-5.5 3.5V5a.5.5 0 0 1 .5-.5z" />
      </svg>
      <span>{on ? 'Отложено' : 'Отложить на потом'}</span>
    </button>
  );
}
