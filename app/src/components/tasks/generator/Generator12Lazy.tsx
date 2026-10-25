'use client';

import dynamic from 'next/dynamic';
import type { Generator12Props } from './Generator12';

/**
 * Генератор подтемы №12 с отложенной загрузкой: вкладка лежит на
 * странице темы, а общий генератор и KaTeX нужны, только когда она
 * открыта, — в первую загрузку страницы они не идут (test:first-load).
 */
const Lazy = dynamic(() => import('./Generator12').then((m) => m.Generator12), {
  loading: () => (
    <p className="lazy-loading" role="status">
      Загружаем генератор…
    </p>
  ),
});

export function Generator12Lazy(props: Generator12Props) {
  return <Lazy {...props} />;
}
