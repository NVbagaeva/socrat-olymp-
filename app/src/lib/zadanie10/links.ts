/**
 * Адреса раздела №10, которые собираются в коде: из закладок, «Моих
 * ошибок», кабинета, вкладки «О задании», теории и опорных задач.
 * Хвосты — из общих констант (CLAUDE.md).
 */

import { OPORNYE } from '@/content/opornye';
import { ZADANIYA, href } from '@/lib/paths';

export const RAZDEL10 = href(ZADANIYA, 10);
export const TRENAZHER10_HREF = href(ZADANIYA, 10, 'trenazher');
export const TEORIYA10_HREF = href(ZADANIYA, 10, 'teoriya');
export const OPORNYE10_HREF = `${RAZDEL10}${OPORNYE.tail}`;

/** Одна задача тренажёра по ключу: из закладки. */
export function zadachaHref10(id: string): string {
  return `${TRENAZHER10_HREF}?zadacha=${encodeURIComponent(id)}`;
}

/** Тренажёр с одним типом: кнопка «Потренировать этот тип». */
export function tipTrenazherHref10(prototip: string): string {
  return `${TRENAZHER10_HREF}?tip=${encodeURIComponent(prototip)}`;
}

/**
 * Тип на вкладке «О задании»: карточка раскрывается по якорю. Якорь —
 * код прототипа как есть («#tip-P11»): так же его подставляет сервер в
 * переадресации с прежней страницы разбора (public/.htaccess).
 */
export function tipHref10(prototip: string): string {
  return `${RAZDEL10}#tip-${prototip}`;
}

/** Блок опорных задач. */
export function blokHref10(slug: string): string {
  return `${OPORNYE10_HREF}${slug}/`;
}
