'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { requestTabScroll } from '@/lib/tabScroll';

export interface PrepCardLinkProps {
  href: string;
  className: string;
  children: ReactNode;
}

/** Карточка навыка: та же ссылка, но помечает переход как внутренний. */
export function PrepCardLink({ href, className, children }: PrepCardLinkProps) {
  return (
    <Link
      className={className}
      href={href}
      scroll={false}
      onClick={() => requestTabScroll('.ptask__head')}
    >
      {children}
    </Link>
  );
}
