/**
 * Адреса раздела №2, которые собираются в коде: из закладок, «Моих
 * ошибок», кабинета, вкладки «О задании» и опорных задач. Хвосты — из
 * общих констант (CLAUDE.md).
 */

import { OPORNYE } from '@/content/opornye';
import { ZADANIYA, href } from '@/lib/paths';

export const RAZDEL2 = href(ZADANIYA, 2);
export const TRENAZHER2_HREF = href(ZADANIYA, 2, 'trenazher');
export const OPORNYE2_HREF = `${RAZDEL2}${OPORNYE.tail}`;

/** Одна задача тренажёра по ключу («A6|k07»): из закладки. */
export function zadachaHref2(id: string): string {
  return `${TRENAZHER2_HREF}?zadacha=${encodeURIComponent(id)}`;
}

/** Тренажёр с одним типом: кнопка «Потренировать этот тип» (тот же параметр, что был). */
export function tipTrenazherHref2(prototip: string): string {
  return `${TRENAZHER2_HREF}?tip=${encodeURIComponent(prototip)}`;
}

/** Тип на вкладке «О задании»: карточка раскрывается по якорю «#tip-A6». */
export function tipHref2(prototip: string): string {
  return `${RAZDEL2}#tip-${prototip}`;
}

/** Блок опорных задач. */
export function blokHref2(slug: string): string {
  return `${OPORNYE2_HREF}${slug}/`;
}

/**
 * Блок опорных задач каждого типа — как было на прежней вкладке «О
 * задании» (content/oZadanii2.ts: поле opornye у типов задач).
 */
export const OPORNYE_TIPA2: Record<string, string> = {
  A1: 'dlina',
  A2: 'deystviya',
  A3: 'deystviya',
  A4: 'deystviya',
  A5: 'deystviya',
  A6: 'deystviya',
  A7: 'deystviya',
  A8: 'deystviya',
  B1: 'skalyarnoe',
  B2: 'skalyarnoe',
  B3: 'skalyarnoe',
  B4: 'skalyarnoe',
  B5: 'skalyarnoe',
  B6: 'skalyarnoe',
  B7: 'skalyarnoe',
  B8: 'skalyarnoe',
  B9: 'skalyarnoe',
  C1: 'kosinus',
  C2: 'kosinus',
};

/** Блок опорных задач типа: кнопка «Опорные задачи» в карточке типа. */
export function opornyeTipaHref2(prototip: string): string {
  return blokHref2(OPORNYE_TIPA2[prototip] ?? 'koordinaty');
}

/** Координаты по рисунку — шаг во всех задачах с рисунком (прежняя вкладка: «A6–A8, B5–B9, C2»). */
const KOORDINATY_V_TIPAH = ['A6', 'A7', 'A8', 'B5', 'B6', 'B7', 'B8', 'B9', 'C2'];

/** Типы, где пригодится навык блока: «Где пригодится этот навык». */
export function tipyBloka2(slug: string): string[] {
  return slug === 'koordinaty'
    ? KOORDINATY_V_TIPAH
    : Object.keys(OPORNYE_TIPA2).filter((id) => OPORNYE_TIPA2[id] === slug);
}
