import type { ReactNode } from 'react';
import { SHAPKA6 } from '@/content/sluchainye6';
import type { Solved } from '@/lib/zadanie6/types';
import type { Shag } from '../steklo';
import type { VoprosPodskazki } from '../trening';
import {
  otvetTekstom,
  schitaemSUmomPanel,
  shagiIzEtapov,
  voprosyIzRazbora,
} from '../trening/bank/shagi';
import { Ris6 } from './Ris6';
import { Tablica6 } from './Tablica6';

/**
 * Решение задачи №6 шагами «Стеклянной сцены» — общий перевод разбора
 * (components/tasks/trening/bank/shagi). Своё у №6 — таблица решения и
 * рисунок с выделением (точки, исходы $A\cap B$) прямо в шаге, как в
 * прежнем разборе. Содержание разбора — дословно из банка.
 */

export { otvetTekstom };

export function shagiIzResheniya6(s: Solved): Shag[] {
  return shagiIzEtapov(s.etapy, {
    risunok: (e) =>
      e.tablica === undefined && e.ris === undefined ? undefined : (
        <>
          {e.tablica === undefined ? null : <Tablica6 t={e.tablica} />}
          {e.ris === undefined ? null : <Ris6 ris={e.ris} />}
        </>
      ),
  });
}

/** Панель «Считаем с умом» под шагами. */
export function schitaemSUmom6(s: Solved): ReactNode {
  return schitaemSUmomPanel(s.vychisleniya, SHAPKA6.schitaem);
}

/** Подсказки-вопросы разбора — в общем виде. */
export function voprosyIzResheniya6(s: Solved): VoprosPodskazki[] {
  return voprosyIzRazbora(s.hints);
}
