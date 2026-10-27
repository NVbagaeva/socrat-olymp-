import type { Istochnik, Uroven, ZadachaRef } from '@/lib/trenazher/types';

/**
 * Список задач тренажёра в коротком виде для разметки страницы:
 * кортеж вместо объекта с именами полей. Список целиком лежит в HTML
 * страницы темы, а у каждой задачи имена полей повторяются, — так
 * страница легче (test:first-load). Распаковка — в браузере, перед
 * тренажёром.
 */
export type RefSzhato =
  | [key: string, podtip: string, uroven: Uroven | 0, istochnik: Istochnik]
  | [key: string, podtip: string, uroven: Uroven | 0, istochnik: Istochnik, pravilo: string];

export function szhatRefs(refs: ZadachaRef[]): RefSzhato[] {
  return refs.map((r) =>
    r.pravilo === undefined
      ? [r.key, r.podtip, r.uroven ?? 0, r.istochnik]
      : [r.key, r.podtip, r.uroven ?? 0, r.istochnik, r.pravilo],
  );
}

export function razzhatRefs(szhato: RefSzhato[]): ZadachaRef[] {
  return szhato.map(([key, podtip, uroven, istochnik, pravilo]) => ({
    key,
    podtip,
    uroven: uroven === 0 ? null : uroven,
    istochnik,
    ...(pravilo === undefined ? {} : { pravilo }),
  }));
}
