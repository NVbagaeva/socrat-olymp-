/**
 * Адреса раздела №13, которые собираются в коде: закладки, «Мои ошибки»,
 * кабинет, вкладка «О задании», опорные задачи. Хвосты — из общих
 * констант (CLAUDE.md).
 */

import { OPORNYE } from '@/content/opornye';
import { ZADANIYA, href } from '@/lib/paths';

export const RAZDEL13 = href(ZADANIYA, 13);
export const TRENAZHER13_HREF = href(ZADANIYA, 13, 'trenazher');
export const TEORIYA13_HREF = href(ZADANIYA, 13, 'teoriya');
export const OPORNYE13_HREF = `${RAZDEL13}${OPORNYE.tail}`;

/** Одна задача тренажёра по ключу: из закладки. */
export function zadachaHref13(id: string): string {
  return `${TRENAZHER13_HREF}?zadacha=${encodeURIComponent(id)}`;
}

/** Тренажёр с одним типом: кнопка «Потренировать этот тип». */
export function tipTrenazherHref13(prototip: string): string {
  return `${TRENAZHER13_HREF}?tip=${encodeURIComponent(prototip)}`;
}

/** Блок опорных задач. */
export function blokHref13(slug: string): string {
  return `${OPORNYE13_HREF}${slug}/`;
}
