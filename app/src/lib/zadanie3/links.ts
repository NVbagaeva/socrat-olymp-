/**
 * Адреса раздела №3, которые собираются в коде: из закладок, «Моих
 * ошибок», кабинета и вкладки «О задании». Хвосты — из общих констант
 * (CLAUDE.md).
 */

import { OPORNYE } from '@/content/opornye';
import { ZADANIYA, href } from '@/lib/paths';

export const RAZDEL3 = href(ZADANIYA, 3);
export const TRENAZHER3_HREF = href(ZADANIYA, 3, 'trenazher');
export const OPORNYE3_HREF = `${RAZDEL3}${OPORNYE.tail}`;

/** Одна задача тренажёра по ключу: из закладки. */
export function zadachaHref3(id: string): string {
  return `${TRENAZHER3_HREF}?zadacha=${encodeURIComponent(id)}`;
}

/** Тренажёр с выбранной «Работой над ошибками». */
export const OSHIBKI3_HREF = `${TRENAZHER3_HREF}?rezhim=oshibki`;

/** Тренажёр с одним типом: кнопка «Потренировать этот тип». */
export function tipTrenazherHref3(tip: string): string {
  return `${TRENAZHER3_HREF}?tip=${encodeURIComponent(tip)}`;
}

/** Тип на вкладке «О задании»: карточка раскрывается по якорю. */
export function tipHref3(tip: string): string {
  return `${RAZDEL3}#tip-${tip}`;
}

/** Блок опорных задач. */
export function blokHref3(slug: string): string {
  return `${OPORNYE3_HREF}${slug}/`;
}
