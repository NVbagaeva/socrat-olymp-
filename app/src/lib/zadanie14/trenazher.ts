/**
 * План тренировки №14: задачи по выбранным методам. Источник — банк
 * формата ЕГЭ или банк вместе с опорными задачами (только уравнения
 * с пунктом б). Задачи берутся в случайном порядке без повторов.
 */

import { BANK_14, BLOKI_14, vseUravneniya14 } from './dannye';
import type { Metod14, Uravnenie14 } from './tipy';

export type Istochnik14 = 'bank' | 'vse';

export interface Nastroyki14 {
  metody: Metod14[];
  istochnik: Istochnik14;
  skolko: number;
}

export const METODY_14: { id: Metod14; title: string }[] = BLOKI_14.map((b) => ({
  id: b.id,
  title: b.nazvanie,
}));

export function kandidaty14(n: Pick<Nastroyki14, 'metody' | 'istochnik'>): Uravnenie14[] {
  const pul = n.istochnik === 'bank' ? BANK_14 : vseUravneniya14();
  return n.metody.length === 0 ? pul : pul.filter((z) => z.metody.some((m) => n.metody.includes(m)));
}

export function planTrenirovki14(
  n: Nastroyki14,
  random: () => number = Math.random,
  krome: ReadonlySet<string> = new Set(),
): string[] {
  const pul = kandidaty14(n).filter((z) => !krome.has(z.id));
  const ids = pul.map((z) => z.id);
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j] as string, ids[i] as string];
  }
  return ids.slice(0, n.skolko);
}
