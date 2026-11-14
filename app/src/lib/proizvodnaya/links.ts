/**
 * Адреса раздела №9, которые собираются в коде: из закладок, «Моих
 * ошибок», вкладки «О задании» и опорных задач. Хвосты — из общих
 * констант (CLAUDE.md).
 */

import { OPORNYE } from '@/content/opornye';
import { ZADANIYA, href } from '@/lib/paths';

export const RAZDEL9 = href(ZADANIYA, 9);
export const TRENAZHER9_HREF = href(ZADANIYA, 9, 'trenazher');
export const OPORNYE9_HREF = `${RAZDEL9}${OPORNYE.tail}`;

/** Одна задача тренажёра по ключу: из закладки. */
export function zadachaHref9(id: string): string {
  return `${TRENAZHER9_HREF}?zadacha=${encodeURIComponent(id)}`;
}

/** Тренажёр с одним типом: кнопка «Потренировать этот тип». */
export function tipTrenazherHref9(prototip: string): string {
  return `${TRENAZHER9_HREF}?tip=${encodeURIComponent(prototip)}`;
}

/** Якорь типа: «9.2.1» → «9-2-1» (точка в якоре мешает селекторам). */
export function tipYakor9(prototip: string): string {
  return prototip.replace(/\./g, '-');
}

/** Тип на вкладке «О задании»: карточка раскрывается по якорю «#tip-9-2-1». */
export function tipHref9(prototip: string): string {
  return `${RAZDEL9}#tip-${tipYakor9(prototip)}`;
}

/** Блок опорных задач. */
export function blokHref9(slug: string): string {
  return `${OPORNYE9_HREF}${slug}/`;
}
