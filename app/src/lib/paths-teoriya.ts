/**
 * Адреса и якоря вкладки «Теория» — отдельно от lib/paths.ts: paths.ts
 * входит в первую загрузку каждой страницы, а эти помощники нужны
 * только страницам теории и ссылкам на них.
 */

/**
 * Вкладка «Теория» раздела задания — хвост адреса без «/»:
 * href(ZADANIYA, 4, TEORIYA_TAIL) → /zadaniya/4/teoriya/.
 */
export const TEORIYA_TAIL = 'teoriya';

/**
 * Якорь раздела теории на странице (id блока): раздел «metod-kubiki» →
 * «teoriya-metod-kubiki». По нему прокручивает содержание
 * (TeoriyaShell) и на него ведут ссылки снаружи.
 */
export function teoriyaYakor(razdel: string): string {
  return `teoriya-${razdel}`;
}

/**
 * Раздел теории с главой метода: метод «kubiki» → раздел «metod-kubiki».
 * Префикс отделяет главы методов от прежних разделов («klassicheskaya»
 * у №4 есть и раздел, и метод).
 */
export function glavaMetoda(metod: string): string {
  return `metod-${metod}`;
}
