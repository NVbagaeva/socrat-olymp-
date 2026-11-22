/**
 * Адреса раздела №1, которые собираются в коде: закладки, «О задании»,
 * опорные задачи, теория. Хвосты — из общих констант (CLAUDE.md).
 */

import { OPORNYE } from '@/content/opornye';
import { ZADANIYA, href } from '@/lib/paths';

export const RAZDEL1 = href(ZADANIYA, 1);
export const TRENAZHER1_HREF = href(ZADANIYA, 1, 'trenazher');
export const OPORNYE1_HREF = `${RAZDEL1}${OPORNYE.tail}`;

/** Одна задача тренажёра по ключу: из закладки. */
export function zadachaHref1(id: string): string {
  return `${TRENAZHER1_HREF}?zadacha=${encodeURIComponent(id)}`;
}

/** Тренажёр с одним типом: «Потренировать этот тип». Тип — «p05». */
export function tipTrenazherHref1(prototip: string): string {
  return `${TRENAZHER1_HREF}?tip=${encodeURIComponent(prototip)}`;
}

/**
 * Тип на вкладке «О задании»: карточка раскрывается по якорю
 * «#tip-p05». Прежние страницы разборов (…/razbor/{группа}/) ведут на
 * группу — «#gruppa-I» (public/.htaccess).
 */
export function tipHref1(prototip: string): string {
  return `${RAZDEL1}#tip-${prototip}`;
}

export function gruppaHref1(blok: string): string {
  return `${RAZDEL1}#gruppa-${blok}`;
}

/** Блок опорных задач. */
export function blokHref1(slug: string): string {
  return `${OPORNYE1_HREF}${slug}/`;
}
