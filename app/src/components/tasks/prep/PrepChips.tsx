'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import { requestPrepScroll } from '@/lib/prepScroll';

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
 * подведёт себя к верху видимой области. Прокрутку у роутера
 * забираем (scroll={false}): иначе он увёл бы страницу к самому
 * верху, на шапку темы, и подводка оказалась бы затёрта.
 */
export function PrepChips({ allLabel, listHref, items, active }: PrepChipsProps) {
  return (
    <nav className="prep__chips" aria-label="Навыки">
      <Link
        className={clsx('chip', active === 'all' && 'is-active')}
        href={listHref}
        scroll={false}
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
          scroll={false}
          aria-current={active === item.id ? 'page' : undefined}
          onClick={() => requestPrepScroll('skill')}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
