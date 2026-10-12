'use client';

import dynamic from 'next/dynamic';

/**
 * Живой график показательной функции с отложенной загрузкой: рисует
 * движком graph/ и набирает формулу KaTeX в браузере. Нужен в одном
 * разделе теории, поэтому грузится, когда раздел открыт, а не вместе
 * со страницей темы (как ParabolaPlaygroundLazy).
 */
const Lazy = dynamic(() => import('./ExpPlayground').then((m) => m.ExpPlayground), {
  loading: () => (
    <p className="lazy-loading" role="status">
      Загружаем рисунок…
    </p>
  ),
});

export function ExpPlaygroundLazy() {
  return <Lazy />;
}
