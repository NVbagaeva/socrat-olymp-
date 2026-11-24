'use client';

import dynamic from 'next/dynamic';

/**
 * «Конструктор корней» с отложенной загрузкой: KaTeX и интерактив
 * приходят отдельным куском, только на странице приёма Виета.
 */
export const KonstruktorKorneyLazy = dynamic(
  () => import('./KonstruktorKorney').then((m) => m.KonstruktorKorney),
  {
    ssr: false,
    loading: () => (
      <p className="lazy-loading" role="status">
        Загружаем конструктор…
      </p>
    ),
  },
);
