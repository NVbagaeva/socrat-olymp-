/**
 * Превью ссылки в мессенджерах и соцсетях (Open Graph). Общая картинка —
 * public/og/og-budetege.jpg (scripts/build-og.mjs), 1200×630.
 *
 * Next.js не сливает openGraph страницы с openGraph корневого макета, а
 * заменяет целиком: страница, которая задаёт свой заголовок превью,
 * берёт объект отсюда, иначе картинка пропадёт.
 */

import type { Metadata } from 'next';

export const SITE_URL = 'https://budetege.ru';
export const SITE_NAME = 'Будет на ЕГЭ';

export const OG_KARTINKA = {
  url: '/og/og-budetege.jpg',
  width: 1200,
  height: 630,
  alt: 'Будет на ЕГЭ — подготовка к ЕГЭ по профильной математике',
} as const;

type Og = NonNullable<Metadata['openGraph']>;

/** openGraph для страницы: свой заголовок и описание, общая картинка. */
export function ogStranicy(title?: string, description?: string): Og {
  return {
    type: 'website',
    locale: 'ru_RU',
    siteName: SITE_NAME,
    images: [OG_KARTINKA],
    ...(title === undefined ? {} : { title }),
    ...(description === undefined ? {} : { description }),
  };
}
