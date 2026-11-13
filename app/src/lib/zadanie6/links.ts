/**
 * Адреса раздела №6, которые собираются в коде: из закладок, «Моих
 * ошибок», кабинета, вкладки «О задании» и опорных задач. Хвосты — из
 * общих констант (CLAUDE.md).
 */

import { OPORNYE } from '@/content/opornye';
import { ZADANIYA, href } from '@/lib/paths';

export const RAZDEL6 = href(ZADANIYA, 6);
export const TRENAZHER6_HREF = href(ZADANIYA, 6, 'trenazher');
export const OPORNYE6_HREF = `${RAZDEL6}${OPORNYE.tail}`;

/** Одна задача тренажёра по ключу: из закладки. */
export function zadachaHref6(id: string): string {
  return `${TRENAZHER6_HREF}?zadacha=${encodeURIComponent(id)}`;
}

/** Тренажёр с одним типом: кнопка «Потренировать этот тип». */
export function tipTrenazherHref6(prototip: string): string {
  return `${TRENAZHER6_HREF}?tip=${encodeURIComponent(prototip)}`;
}

/**
 * Тип на вкладке «О задании»: карточка раскрывается по якорю. Якорь —
 * код прототипа как есть («#tip-P04»): так же его подставляет сервер в
 * переадресации с прежней страницы разбора (public/.htaccess).
 */
export function tipHref6(prototip: string): string {
  return `${RAZDEL6}#tip-${prototip}`;
}

/** Блок опорных задач. */
export function blokHref6(slug: string): string {
  return `${OPORNYE6_HREF}${slug}/`;
}
