/**
 * Все задачи раздела №14 в одном месте: блоки опорных задач и банк
 * тренажёра. Тренажёр берёт задачи из обоих: банк — задачи формата
 * ЕГЭ с пунктом б, опорные — по методу.
 */

import { BANK_14 } from './bank';
import { BLOKI_14 } from './opornye';
import type { Uravnenie14, Zadacha14 } from './tipy';

export { BANK_14, BLOKI_14 };

/** Все уравнения с пунктом б: банк и опорные (без разминки части 1). */
export function vseUravneniya14(): Uravnenie14[] {
  const out: Uravnenie14[] = [...BANK_14];
  for (const b of BLOKI_14) {
    for (const z of b.zadachi) {
      if (z.vid === 'uravnenie' && z.promezhutok !== undefined) out.push(z);
    }
  }
  return out;
}

export function zadachaPoId14(id: string): Zadacha14 | undefined {
  return (
    BANK_14.find((z) => z.id === id) ??
    BLOKI_14.flatMap((b) => b.zadachi).find((z) => z.id === id)
  );
}
