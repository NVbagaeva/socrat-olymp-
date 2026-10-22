'use client';

import dynamic from 'next/dynamic';

/**
 * Живой график логарифмической функции с отложенной загрузкой: рисует
 * движком graph/ и набирает формулу KaTeX в браузере. Нужен в одном
 * разделе теории, поэтому грузится, когда раздел открыт, а не вместе
 * со страницей темы (как ParabolaPlaygroundLazy).
 */
const Lazy = dynamic(() => import('./LogPlayground').then((m) => m.LogPlayground), {
  loading: () => (
    <p className="lazy-loading" role="status">
      Загружаем рисунок…
    </p>
  ),
});

export function LogPlaygroundLazy() {
  return <Lazy />;
}
