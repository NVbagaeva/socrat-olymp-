import type { ReactNode } from 'react';
import { SHAPKA10 } from '@/content/prikladnye10';
import type { Solved } from '@/lib/zadanie10/types';
import type { Shag } from '../steklo';
import type { VoprosPodskazki } from '../trening';
import {
  otvetTekstom,
  schitaemSUmomPanel,
  shagiIzEtapov,
  voprosyIzRazbora,
} from '../trening/bank/shagi';
import { Dano10 } from './Dano10';

/**
 * Решение задачи №10 шагами «Стеклянной сцены» — общий перевод разбора
 * (components/tasks/trening/bank/shagi). Своё у №10 — первый этап «Что
 * дано»: как и в прежнем разборе (Razbor10), он показан таблицей «Дано»
 * (обозначение, значение, что это), а не строками — строки этапа и
 * таблица говорят одно и то же. Остальные этапы — дословно из банка.
 */

export { otvetTekstom };

export function shagiIzResheniya10(s: Solved): Shag[] {
  const [pervyy, ...ostalnye] = s.etapy;
  if (pervyy === undefined) {
    return [];
  }
  return [
    ...shagiIzEtapov([{ title: pervyy.title, lines: [] }], {
      risunok: () => <Dano10 dano={s.dano} />,
    }),
    ...shagiIzEtapov(ostalnye),
  ];
}

/** Панель «Считаем с умом» под шагами. */
export function schitaemSUmom10(s: Solved): ReactNode {
  return schitaemSUmomPanel(s.vychisleniya, SHAPKA10.schitaem);
}

/** Подсказки-вопросы разбора — в общем виде. */
export function voprosyIzResheniya10(s: Solved): VoprosPodskazki[] {
  return voprosyIzRazbora(s.hints);
}
