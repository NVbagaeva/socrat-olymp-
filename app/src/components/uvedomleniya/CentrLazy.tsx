'use client';

/**
 * Страница уведомлений — отдельным куском: её код и тексты грузятся,
 * только когда страницу открыли, и не попадают в общие куски первой
 * загрузки остальных страниц (scripts/check-first-load.mjs).
 */

import dynamic from 'next/dynamic';

export const CentrLazy = dynamic(() => import('./Centr').then((m) => m.Centr), {
  ssr: false,
  loading: () => <p className="auth-form__muted">…</p>,
});
