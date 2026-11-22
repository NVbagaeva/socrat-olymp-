/**
 * Адреса раздела №11, которые собираются в коде: из закладок, «Моих
 * ошибок», кабинета, вкладки «О задании», тренажёра и опорных задач.
 * Хвосты — из общих констант (CLAUDE.md).
 */

import { OPORNYE } from '@/content/opornye';
import { ZADANIYA, href } from '@/lib/paths';

export const RAZDEL11 = href(ZADANIYA, 11);
export const TRENAZHER11_HREF = href(ZADANIYA, 11, 'trenazher');
export const TEORIYA11_HREF = href(ZADANIYA, 11, 'teoriya');
export const OPORNYE11_HREF = `${RAZDEL11}${OPORNYE.tail}`;

/** Одна задача тренажёра по ключу: из закладки. */
export function zadachaHref11(id: string): string {
  return `${TRENAZHER11_HREF}?zadacha=${encodeURIComponent(id)}`;
}

/** Тренажёр с одним типом: кнопка «Потренировать этот тип». */
export function tipTrenazherHref11(podtip: string): string {
  return `${TRENAZHER11_HREF}?tip=${encodeURIComponent(podtip)}`;
}

/** Тип на вкладке «О задании»: карточка раскрывается по якорю («#tip-DP-07»). */
export function tipHref11(podtip: string): string {
  return `${RAZDEL11}#tip-${podtip}`;
}

/** Блок опорных задач. */
export function blokHref11(slug: string): string {
  return `${OPORNYE11_HREF}${slug}/`;
}

/** Место на вкладке «Теория» по якорю (lib/zadanie11/teoriya-yakorya.ts). */
export function teoriyaHref11(yakor: string): string {
  return `${TEORIYA11_HREF}#${yakor}`;
}

/** Группа (раздел задачи) на вкладке «О задании»: раскрывается по якорю («#gruppa-DP»). */
export function gruppaHref11(razdel: string): string {
  return `${RAZDEL11}#gruppa-${razdel}`;
}
