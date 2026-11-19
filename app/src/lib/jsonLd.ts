/**
 * Структурированные данные главной (schema.org, JSON-LD) для поисковиков:
 * кто делает сайт и как он называется. Стоят только на главной — на
 * остальных страницах они ничего не добавляют, а байты <head> считает
 * test:first-load.
 */

import { TELEGRAM_HREF } from '@/content/site';
import { SITE_NAME, SITE_URL } from '@/lib/og';

export function glavnayaJsonLd(description: string): string {
  const org = `${SITE_URL}/#org`;
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'EducationalOrganization',
        '@id': org,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/icon-512.png`,
        sameAs: [TELEGRAM_HREF],
      },
      {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        inLanguage: 'ru',
        description,
        publisher: { '@id': org },
      },
    ],
  };
  /* «<» внутри <script> экранируем: строка не закроет тег раньше времени. */
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
