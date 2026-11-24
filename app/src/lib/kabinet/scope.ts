/**
 * Разделы тренажёров и адреса — без каталога и без React: модуль берут
 * и страницы кабинета, и оболочка тренажёра на всех страницах сайта.
 * Раздел тренажёра — по номеру хранения («12:linear»), адрес — по коду
 * раздела (lib/paths.ts, href).
 */

import { href, ZADANIYA } from '@/lib/paths';

/** Номер задания по разделу тренажёра: «12:linear» → 12. */
export function taskNoOfScope(scope: string): number | null {
  const no = Number(scope.split(':')[0]);
  return Number.isInteger(no) && no >= 1 && no <= 20 ? no : null;
}

/** Адрес тренажёра раздела: «12:linear» → /zadaniya/grafiki-funkciy/linear/trenazher/. */
export function trainerHref(scope: string): string {
  return href(ZADANIYA, ...scope.split(':'), 'trenazher');
}

/** Адрес задания в банке по номеру хранения: 12 → /zadaniya/grafiki-funkciy/. */
export function taskHrefByNo(no: number): string {
  return href(ZADANIYA, no);
}
