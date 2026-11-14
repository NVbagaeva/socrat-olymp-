/**
 * Адреса раздела №7, которые собираются в коде: из закладок, «Моих
 * ошибок», кабинета, вкладки «О задании» и опорных задач. Хвосты — из
 * общих констант (CLAUDE.md).
 */

import { OPORNYE } from '@/content/opornye';
import { ZADANIYA, href } from '@/lib/paths';

export const RAZDEL7 = href(ZADANIYA, 7);
export const TRENAZHER7_HREF = href(ZADANIYA, 7, 'trenazher');
export const OPORNYE7_HREF = `${RAZDEL7}${OPORNYE.tail}`;

/** Одна задача тренажёра по ключу: из закладки. */
export function zadachaHref7(id: string): string {
  return `${TRENAZHER7_HREF}?zadacha=${encodeURIComponent(id)}`;
}

/** Тренажёр с одним типом: кнопка «Потренировать этот тип». */
export function tipTrenazherHref7(prototip: string): string {
  return `${TRENAZHER7_HREF}?tip=${encodeURIComponent(prototip)}`;
}

/**
 * Тип на вкладке «О задании»: карточка раскрывается по якорю. Якорь —
 * код прототипа как есть («#tip-P11»): так же его подставляет сервер в
 * переадресации с прежней страницы разбора (public/.htaccess).
 */
export function tipHref7(prototip: string): string {
  return `${RAZDEL7}#tip-${prototip}`;
}

/** Блок опорных задач. */
export function blokHref7(slug: string): string {
  return `${OPORNYE7_HREF}${slug}/`;
}
