/**
 * Адреса заданий №4 и №5, которые собираются в коде: закладки, «Мои
 * ошибки», кнопки вкладки «О задании» и опорных задач. Хвосты — из
 * общих констант (CLAUDE.md), строкой адреса не пишутся.
 */

import { OPORNYE } from '@/content/opornye';
import { veroyatnostBySlug } from '@/content/veroyatnost';
import { ZADANIYA, href } from '@/lib/paths';

export type Zadanie45 = 4 | 5;

export function razdelHref45(z: Zadanie45): string {
  return href(ZADANIYA, z);
}

export function trenazherHref45(z: Zadanie45): string {
  return href(ZADANIYA, z, 'trenazher');
}

export function opornyeHref45(z: Zadanie45): string {
  return `${razdelHref45(z)}${OPORNYE.tail}`;
}

/** Блок опорных задач. */
export function blokHref45(z: Zadanie45, blok: string): string {
  return `${opornyeHref45(z)}${blok}/`;
}

/** Одна задача тренажёра по ключу «p4-07:3»: из закладки. */
export function zadachaHref45(z: Zadanie45, id: string): string {
  return `${trenazherHref45(z)}?zadacha=${encodeURIComponent(id)}`;
}

/** Тренажёр с одним типом: кнопка «Потренировать этот тип». */
export function tipTrenazherHref45(z: Zadanie45, prototip: string): string {
  return `${trenazherHref45(z)}?tip=${encodeURIComponent(prototip)}`;
}

/** Тип на вкладке «О задании»: карточка раскрывается по якорю «#tip-p4-07». */
export function tipHref45(z: Zadanie45, prototip: string): string {
  return `${razdelHref45(z)}#tip-${prototip}`;
}

/** Вкладка «Ключевые методы решения»: хвост — из ленты вкладок раздела. */
export function metodyHref45(z: Zadanie45): string {
  const tail = veroyatnostBySlug(String(z))?.tabs.find((t) => t.id === 'metody')?.tail ?? '';
  return `${razdelHref45(z)}${tail}`;
}
