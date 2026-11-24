'use client';

/**
 * Сколько опорных задач раздела решено — для кольца прогресса в шапке.
 *
 * Ключи задач приходят с сервера (lib/shapka/opornyeRazdela.ts) в
 * кодировке хранилища раздела. Решённой считается задача, которую
 * вкладка «Опорные задачи» раздела красит зелёным: исход 'right'
 * (у №4 и №5 — ещё и прежний счётчик верных, prepReshena), у №8 и
 * №9 — номер задачи в списке решённых блока.
 *
 * Хранилища — те же объекты, что у вкладок раздела: подписка одна,
 * на сервере и при гидратации — пустой снимок, то есть 0.
 */

import type { ProgressStore, StoreProgress } from '@/lib/progressStore';
import { opornye1 } from '@/lib/planimetriya/progress';
import { opornye2 } from '@/lib/vektory/progress';
import { opornye3 } from '@/lib/stereo/opornye3/progress';
import { prepReshena, prepStore } from '@/lib/veroyatnost/prepProgress';
import { opornye6 } from '@/lib/zadanie6/progress';
import { opornye7 } from '@/lib/zadanie7/progress';
import { usePrep8Progress } from '@/lib/vychisleniya/progress';
import { usePrep9Progress } from '@/lib/proizvodnaya/prepProgress';
import { opornye10 } from '@/lib/zadanie10/trening/opornye';
import { opornye11 } from '@/lib/zadanie11/progress';
import { opornye13 } from '@/lib/zadanie13/progress';
import { opornye14 } from '@/lib/zadanie14/progress';
import { opornye18 } from '@/lib/zadanie18/opornye/progress';
import { opornye21 } from '@/lib/zadanie21/progress';

/** Чтение хранилища раздела: один хук и проверка «решена ли задача». */
interface Chtenie<P> {
  useProgress(): P;
  reshena(progress: P, id: string): boolean;
}

function poIshodam(store: ProgressStore): Chtenie<StoreProgress> {
  return {
    useProgress: () => store.useProgress(),
    reshena: (progress, id) => progress.outcomes[id] === 'right',
  };
}

function poPodgotovke45(store: ProgressStore): Chtenie<StoreProgress> {
  return { useProgress: () => store.useProgress(), reshena: prepReshena };
}

/** Хранилище «блок → номера решённых»; ключ «блок:номер». */
function poNomeram(useProgress: () => Record<string, number[]>): Chtenie<Record<string, number[]>> {
  return {
    useProgress,
    reshena: (progress, id) => {
      const i = id.lastIndexOf(':');
      if (i < 0) return false;
      return (progress[id.slice(0, i)] ?? []).includes(Number(id.slice(i + 1)));
    },
  };
}

const PUSTO: Chtenie<unknown> = { useProgress: () => null, reshena: () => false };

const CHTENIE: Readonly<Record<number, Chtenie<unknown>>> = {
  1: poIshodam(opornye1),
  2: poIshodam(opornye2),
  3: poIshodam(opornye3),
  4: poPodgotovke45(prepStore(4)),
  5: poPodgotovke45(prepStore(5)),
  6: poIshodam(opornye6),
  7: poIshodam(opornye7),
  8: poNomeram(usePrep8Progress),
  9: poNomeram(usePrep9Progress),
  10: poIshodam(opornye10),
  11: poIshodam(opornye11),
  13: poIshodam(opornye13),
  14: poIshodam(opornye14),
  18: poIshodam(opornye18),
  21: poIshodam(opornye21),
};

/**
 * Сколько из `ids` решено. `hranenie` постоянен на время жизни
 * компонента — порядок хуков не меняется.
 */
export function useOpornyeResheno(hranenie: number, ids: readonly string[]): number {
  const chtenie = CHTENIE[hranenie] ?? PUSTO;
  const progress = chtenie.useProgress();
  let n = 0;
  for (const id of ids) {
    if (chtenie.reshena(progress, id)) n += 1;
  }
  return n;
}
