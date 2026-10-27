'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Trenazher12Props } from './Trenazher12';
import { razzhatRefs, type RefSzhato } from './refsSzhato';

/**
 * Тренажёр подтемы №12 с отложенной загрузкой: вкладка лежит на
 * странице темы, а панель фильтров и экран тренировки нужны, только
 * когда она открыта, — в первую загрузку страницы они не идут
 * (test:first-load). Панель рисуется только в браузере, когда её код
 * уже загружен: кнопка «Начать тренировку» из разметки сборки до
 * загрузки кода не реагировала бы на нажатие.
 */
const Lazy = dynamic(() => import('./Trenazher12').then((m) => m.Trenazher12), {
  ssr: false,
  loading: () => (
    <p className="lazy-loading" role="status">
      Загружаем тренажёр…
    </p>
  ),
});

/** Список задач приходит сжатым (refsSzhato): так легче HTML страницы. */
export type Trenazher12LazyProps = Omit<Trenazher12Props, 'refs'> & { refs: RefSzhato[] };

export function Trenazher12Lazy({ refs, ...props }: Trenazher12LazyProps) {
  const spisok = useMemo(() => razzhatRefs(refs), [refs]);
  return <Lazy {...props} refs={spisok} />;
}
