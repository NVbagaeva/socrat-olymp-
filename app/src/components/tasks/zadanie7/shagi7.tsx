import type { ReactNode } from 'react';
import { SHAPKA7 } from '@/content/uravneniya7';
import { typeset } from '@/lib/tex';
import type { Solved } from '@/lib/zadanie7/types';
import type { Shag } from '../steklo';
import type { VoprosPodskazki } from '../trening';
import {
  otvetTekstom,
  schitaemSUmomPanel,
  shagiIzEtapov,
  voprosyIzRazbora,
} from '../trening/bank/shagi';

/**
 * Решение уравнения №7 шагами «Стеклянной сцены» — общий перевод разбора
 * (components/tasks/trening/bank/shagi) и своё у №7: ОДЗ и отбор корней
 * выделены цветом, а шаг «ОДЗ» есть всегда.
 */

export { otvetTekstom };

/**
 * ОДЗ записываем всегда. У уравнений без ограничений (линейные,
 * показательные, синус и косинус) в разборе банка этапа «ОДЗ» нет —
 * тогда вторым шагом идёт эта строка. Содержания разбора она не
 * меняет: говорит только, что ограничений нет.
 */
export const ODZ_BEZ_OGRANICHENIY = 'Ограничений нет: $x$ — любое число.';

export function shagiIzResheniya(s: Solved): Shag[] {
  const shagi = shagiIzEtapov(s.etapy, {
    ton: (zag) => (zag === 'ОДЗ' ? 'odz' : zag === 'Отбор корней' ? 'otbor' : undefined),
  });
  if (!shagi.some((shag) => shag.zagolovok === 'ОДЗ')) {
    shagi.splice(Math.min(1, shagi.length), 0, {
      zagolovok: 'ОДЗ',
      chtoHtml: `<p>${typeset(ODZ_BEZ_OGRANICHENIY)}</p>`,
      formulaHtml: '',
      ton: 'odz',
    });
  }
  return shagi;
}

/** Панель «Считаем с умом» под шагами: приёмы счёта из разбора банка. */
export function schitaemSUmom(s: Solved): ReactNode {
  return schitaemSUmomPanel(s.vychisleniya, SHAPKA7.schitaem);
}

/** Подсказки-вопросы разбора — в общем виде (готовый HTML). */
export function voprosyIzResheniya(s: Solved): VoprosPodskazki[] {
  return voprosyIzRazbora(s.hints);
}
