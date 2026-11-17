/**
 * Адреса сборника на сборке: какие главы и типы выгружаются страницами.
 */

import { notFound } from 'next/navigation';
import { GLAVY, TIPY, glavaPoNomeru } from '@/content/sbornik';
import { glavaSlug, tipSlug } from '@/lib/paths';

/** Главы, открытые на сайте: { glava: 'glava-1' }. */
export function staticGlavy(): { glava: string }[] {
  return GLAVY.filter((g) => g.gotova).map((g) => ({ glava: glavaSlug(g.nomer) }));
}

/** Номер главы по части адреса; неоткрытая глава — 404. */
export function nomerGlavy(slug: string): number {
  const n = Number(/^glava-(\d+)$/.exec(slug)?.[1]);
  const g = glavaPoNomeru(n);
  if (g === undefined || !g.gotova) notFound();
  return n;
}

/** Типы открытых глав: { glava, tip: 'tip-1-2' }. */
export function staticTipy(): { glava: string; tip: string }[] {
  return GLAVY.filter((g) => g.gotova).flatMap((g) =>
    (TIPY[g.nomer] ?? []).map((t) => ({ glava: glavaSlug(g.nomer), tip: tipSlug(t.id) })),
  );
}

/** Тип по части адреса: «tip-1-12» → «1.12»; чужой — 404. */
export function tipPoSlug(glava: number, slug: string): string {
  const t = (TIPY[glava] ?? []).find((item) => tipSlug(item.id) === slug);
  if (t === undefined) notFound();
  return t.id;
}
