'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { scrollTabTo, takeTabScroll } from '@/lib/tabScroll';

/**
 * Подводит экран вкладки к нужному месту после перехода изнутри.
 *
 * Куда именно — решает та ссылка, по которой перешли: она оставляет
 * селектор заголовка. Прямой заход по адресу и перезагрузка прокрутку
 * не вызывают: намерение живёт только между кликом и отрисовкой.
 */
export function TabScrollOnMount() {
  /* Ключ — адрес: экран вкладки может остаться тем же компонентом,
     и тогда одного монтирования мало. */
  const pathname = usePathname();

  useEffect(() => {
    const target = takeTabScroll();
    if (target === null) {
      return undefined;
    }
    /* Эффект выполняется после того, как разметка уже в документе,
       поэтому положение заголовка настоящее и ждать кадра незачем. */
    scrollTabTo(target);
    return undefined;
  }, [pathname]);

  return null;
}
