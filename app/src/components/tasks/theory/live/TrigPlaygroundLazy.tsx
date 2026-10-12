'use client';

import dynamic from 'next/dynamic';

/**
 * Живой график тригонометрических функций с отложенной загрузкой: рисует
 * движком graph/ и набирает формулу KaTeX в браузере. Нужен в одном
 * разделе теории, поэтому грузится, когда раздел открыт, а не вместе
 * со страницей темы (как ParabolaPlaygroundLazy).
 */
const Lazy = dynamic(() => import('./TrigPlayground').then((m) => m.TrigPlayground), {
  loading: () => (
    <p className="lazy-loading" role="status">
      Загружаем рисунок…
    </p>
  ),
});

export function TrigPlaygroundLazy() {
  return <Lazy />;
}
