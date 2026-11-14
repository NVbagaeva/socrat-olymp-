import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { prichinaSkrytiya, skryt, type RazdelKod } from '@/content/struktura';
import { SkrytyyRazdel } from './SkrytyyRazdel';

/**
 * Обёртка страниц раздела: ставится в верхний layout.tsx раздела.
 * Раздел в экзамене — страницы выводятся как есть, обёртки в разметке
 * нет. Раздел скрыт (content/struktura.js, skryt) — страницы видит
 * только администратор, с плашкой причины.
 */
export function StrazhRazdela({ kod, children }: { kod: RazdelKod; children: ReactNode }) {
  if (!skryt(kod)) {
    return <>{children}</>;
  }
  return <SkrytyyRazdel prichina={prichinaSkrytiya(kod) ?? ''}>{children}</SkrytyyRazdel>;
}

/**
 * Метаданные верхнего layout.tsx раздела: скрытый раздел поисковикам
 * не показывается. У раздела в экзамене метаданных отсюда нет.
 */
export function metadataRazdela(kod: RazdelKod): Metadata {
  return skryt(kod) ? { robots: { index: false, follow: false } } : {};
}
