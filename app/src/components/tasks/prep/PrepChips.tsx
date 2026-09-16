'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import { requestPrepScroll, usePrepNarrow } from '@/lib/prepScroll';

export interface PrepChip {
  id: string;
  title: string;
  href: string;
}

export interface PrepChipsProps {
  /** Первый чип — «Все навыки», он ведёт к списку. */
  allLabel: string;
  listHref: string;
  items: PrepChip[];
  /** Что открыто сейчас. */
  active: string;
}

/**
 * Ряд навыков. Чипы — ссылки на свои адреса, а не фильтр: поэтому
 * работают «назад» и открытие в новой вкладке.
 *
 * Клик помечает переход как сделанный изнутри — следующий экран
 * на телефоне подведёт себя к верху видимой области.
 */
export function PrepChips({ allLabel, listHref, items, active }: PrepChipsProps) {
  /* На узком экране прокруткой распоряжаемся сами: Next иначе увёл бы
     страницу к самому верху, на шапку темы, и наша подводка к делу
     оказалась бы затёрта. На широком всё остаётся как было. */
  const narrow = usePrepNarrow();

  return (
    <nav className="prep__chips" aria-label="Навыки">
      <Link
        className={clsx('chip', active === 'all' && 'is-active')}
        href={listHref}
        scroll={!narrow}
        aria-current={active === 'all' ? 'page' : undefined}
        onClick={() => requestPrepScroll('list')}
      >
        {allLabel}
      </Link>
      {items.map((item) => (
        <Link
          key={item.id}
          className={clsx('chip', active === item.id && 'is-active')}
          href={item.href}
          scroll={!narrow}
          aria-current={active === item.id ? 'page' : undefined}
          onClick={() => requestPrepScroll('skill')}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
