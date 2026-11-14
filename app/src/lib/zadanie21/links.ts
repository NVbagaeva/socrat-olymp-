/**
 * Адреса раздела «Наибольшее и наименьшее значение функции», которые
 * собираются в коде. Папка раздела — по номеру хранения (21); хвосты
 * вкладок — из общих констант (CLAUDE.md).
 */

import { OPORNYE } from '@/content/opornye';
import { ZADANIYA, href } from '@/lib/paths';

export const RAZDEL21 = href(ZADANIYA, 21);
export const TRENAZHER21_HREF = href(ZADANIYA, 21, 'trenazher');
export const OPORNYE21_HREF = `${RAZDEL21}${OPORNYE.tail}`;

/** Одна задача тренажёра по ключу: из закладки. */
export function zadachaHref21(id: string): string {
  return `${TRENAZHER21_HREF}?zadacha=${encodeURIComponent(id)}`;
}

/** Тренажёр с одним типом: кнопка «Потренировать этот тип». */
export function tipTrenazherHref21(prototip: string): string {
  return `${TRENAZHER21_HREF}?tip=${encodeURIComponent(prototip)}`;
}

/** Тип на вкладке «О задании»: карточка раскрывается по якорю «#tip-P01». */
export function tipHref21(prototip: string): string {
  return `${RAZDEL21}#tip-${prototip}`;
}

/** Блок опорных задач. */
export function blokHref21(slug: string): string {
  return `${OPORNYE21_HREF}${slug}/`;
}
