/**
 * Адреса раздела №8, которые собираются в коде: из закладок, «Моих
 * ошибок» и кабинета. Хвосты — из общих констант (CLAUDE.md).
 */

import { OPORNYE } from '@/content/opornye';
import { ZADANIYA, href } from '@/lib/paths';

export const RAZDEL8 = href(ZADANIYA, 8);
export const TRENAZHER8 = href(ZADANIYA, 8, 'trenazher');
export const OPORNYE8 = `${RAZDEL8}${OPORNYE.tail}`;

/** Одна задача тренажёра по идентификатору: из закладки. */
export function zadachaHref(id: string): string {
  return `${TRENAZHER8}?zadacha=${encodeURIComponent(id)}`;
}

/** Тренажёр с выбранной «Работой над ошибками». */
export const OSHIBKI8 = `${TRENAZHER8}?rezhim=oshibki`;

/** Опорная задача блока по номеру: из закладки. */
export function opornayaHref(slug: string, no: number): string {
  return `${OPORNYE8}${slug}/?zadacha=${no}`;
}
