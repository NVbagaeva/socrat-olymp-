/**
 * Разделы тренажёров и адреса — без каталога и без React: модуль берут
 * и страницы кабинета, и оболочка тренажёра на всех страницах сайта.
 */

/** Номер задания по разделу тренажёра: «12:linear» → 12. */
export function taskNoOfScope(scope: string): number | null {
  const no = Number(scope.split(':')[0]);
  return Number.isInteger(no) && no >= 1 && no <= 20 ? no : null;
}

/** Адрес тренажёра раздела: «12:linear» → /zadaniya/12/linear/trenazher/. */
export function trainerHref(scope: string): string {
  return `/zadaniya/${scope.split(':').join('/')}/trenazher/`;
}

/** Адрес задания в банке: /zadaniya/12/. */
export function taskHrefByNo(no: number): string {
  return `/zadaniya/${no}/`;
}
