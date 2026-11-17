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

/* Только адрес: размеры и подпись мессенджеры берут из самого файла,
   а каждый мета-тег <head> идёт в первую загрузку всех страниц дважды
   (в HTML и в данных RSC) — test:first-load. */
export const OG_KARTINKA = { url: '/og/og-budetege.jpg' } as const;

type Og = NonNullable<Metadata['openGraph']>;

/** openGraph для страницы: свой заголовок и описание, общая картинка. */
export function ogStranicy(title?: string, description?: string): Og {
  /* Без og:type и og:locale: «website» — значение по умолчанию, язык
     мессенджеры берут из страницы; байты <head> — test:first-load. */
  return {
    siteName: SITE_NAME,
    images: [OG_KARTINKA],
    ...(title === undefined ? {} : { title }),
    ...(description === undefined ? {} : { description }),
  };
}
