'use client';

import dynamic from 'next/dynamic';

/**
 * Площадка с параболой с отложенной загрузкой: рисует график движком
 * graph/ и набирает подписи KaTeX в браузере. Нужна только в одном
 * разделе теории, поэтому грузится, когда раздел открыт, а не вместе
 * со страницей темы (подробнее — MetodyKartochkiLazy).
 */
const Lazy = dynamic(() => import('./ParabolaPlayground').then((m) => m.ParabolaPlayground), {
  loading: () => (
    <p className="lazy-loading" role="status">
      Загружаем рисунок…
    </p>
  ),
});

export function ParabolaPlaygroundLazy() {
  return <Lazy />;
}
