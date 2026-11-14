/**
 * Разобранный пример типа №8, собранный в браузере по требованию.
 *
 * Тот же генератор и те же тексты, что у серверного примера в
 * VychisleniyaAbout (seed постоянный, пример у всех один), но модуль
 * грузится отдельным куском только когда ученик раскрывает тип: так
 * страница «О задании» не несёт 25 примеров с формулами в разметке.
 */

import type { Shag } from '../steklo';
import { TIPY8 } from '@/content/vychisleniya8';
import { generate } from '@/lib/vychisleniya/generate';
import { ru } from '@/lib/vychisleniya/numbers';
import { typeset } from '@/lib/tex';

export interface Primer8 {
  uslovieHtml: string;
  shagi: Shag[];
  otvet: string;
  opasnoHtml: string | undefined;
}

/** Seed примера: тот же, что на сервере (VychisleniyaAbout.primer). */
export function primer8(prototype: string): Primer8 | null {
  for (let i = 1; i <= 5; i += 1) {
    try {
      const ex = generate(prototype, `o-zadanii#${i}`, 'base');
      const opasno = TIPY8[prototype]?.opasno;
      return {
        uslovieHtml: typeset(ex.uslovie),
        shagi: ex.razbor.map((step) => ({
          chtoHtml: typeset(step.chto),
          formulaHtml: typeset(`$${step.tex}$`),
        })),
        otvet: ru(ex.otvet),
        opasnoHtml: opasno === undefined ? undefined : typeset(opasno),
      };
    } catch {
      /* Параметры не подобрались — следующий seed. */
    }
  }
  return null;
}
