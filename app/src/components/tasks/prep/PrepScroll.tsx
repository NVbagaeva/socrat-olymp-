'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { requestPrepScroll, scrollPrepTo, takePrepScroll, usePrepNarrow } from '@/lib/prepScroll';

/**
 * Подводит экран вкладки к нужному месту после перехода изнутри.
 *
 * Прямой заход по адресу и перезагрузка страницы прокрутку не
 * вызывают: намерение живёт только между кликом и отрисовкой.
 */
export function PrepScrollOnMount() {
  /* Ключ — адрес: экран вкладки может остаться тем же компонентом,
     и тогда одного монтирования мало. */
  const pathname = usePathname();

  useEffect(() => {
    const target = takePrepScroll();
    if (target === null) {
      return undefined;
    }
    /* Следующим кадром: к этому времени экран уже отрисован и
       у заголовка есть настоящее положение на странице. */
    const frame = requestAnimationFrame(() => {
      scrollPrepTo(target === 'skill' ? '.ptask__head' : '.prep__title');
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}

export interface PrepCardLinkProps {
  href: string;
  className: string;
  children: ReactNode;
}

/** Карточка навыка: та же ссылка, но помечает переход как внутренний. */
export function PrepCardLink({ href, className, children }: PrepCardLinkProps) {
  const narrow = usePrepNarrow();

  return (
    <Link
      className={className}
      href={href}
      scroll={!narrow}
      onClick={() => requestPrepScroll('skill')}
    >
      {children}
    </Link>
  );
}
