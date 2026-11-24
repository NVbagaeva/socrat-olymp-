/** Адреса новой выдачи ДЗ — одним местом (CLAUDE.md). */

import { href, ZADANIYA } from '@/lib/paths';

export const DZ2_HREF = {
  spisok: '/kabinet/dz2/',
  vydat: '/kabinet/dz2/vydat/',
  itogi: '/kabinet/dz2/itogi/',
  moi: '/kabinet/domashki/',
  reshat: '/kabinet/domashki/reshat/',
} as const;

export const dz2VydatHref = (id?: string) =>
  id === undefined ? DZ2_HREF.vydat : `${DZ2_HREF.vydat}?id=${encodeURIComponent(id)}`;
export const dz2ItogiHref = (id: string) => `${DZ2_HREF.itogi}?id=${encodeURIComponent(id)}`;
export const dz2ReshatHref = (id: string) => `${DZ2_HREF.reshat}?id=${encodeURIComponent(id)}`;

/* Ученик идёт из ДЗ в раздел: карточки и глава теории (PR 2в). */
export const dz2KartochkiHref = (taskNo: number) => href(ZADANIYA, taskNo, 'kartochki');
export const dz2TeoriyaHref = (taskNo: number, glava: string) =>
  `${href(ZADANIYA, taskNo, 'teoriya')}#teoriya-${encodeURIComponent(glava)}`;
