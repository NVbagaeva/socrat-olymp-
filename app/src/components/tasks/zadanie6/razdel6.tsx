'use client';

import { Tex } from '@/components/ui/Tex';
import { TRENAZHER6 } from '@/content/sluchainye6';
import type { ZadachaLite } from '@/lib/zadanie6/dannye';
import { zadachaHref6 } from '@/lib/zadanie6/links';
import { estPi } from '@/lib/zadanie7/otvet';
import { readSealed6 } from '@/lib/zadanie6/trening/otvet6';
import { log6, vybor6 } from '@/lib/zadanie6/trening/progress';
import { KLYUCH6 } from '@/lib/zadanie6/trening/session';
import { ZAGRUZKA6 } from '@/lib/zadanie6/trening/zagruzka';
import type { Solved } from '@/lib/zadanie6/types';
import type { RazdelBanka } from '../trening/bank/types';
import { Ris6 } from './Ris6';
import { schitaemSUmom6, shagiIzResheniya6, voprosyIzResheniya6 } from './shagi6';

/** Откуда задача: демоверсия ФИПИ, образец стороннего банка или аналог. */
function istochnikZadachi(z: ZadachaLite): string {
  if (z.source === 'demo') return TRENAZHER6.ekran.demo;
  if (z.source === 'obrazec' && z.gde !== undefined) return TRENAZHER6.ekran.obrazec(z.gde);
  return TRENAZHER6.ekran.neIzBanka;
}

/**
 * Под условием задачи №6: рисунок (диаграмма Эйлера, дерево, таблица,
 * запись распределения) — его строит прототип по параметрам, — вопрос
 * после рисунка и откуда задача.
 */
function Pod6({ z }: { z: ZadachaLite }) {
  const ris = ZAGRUZKA6.prototip(z.prototypeId)?.ris(z.params);
  return (
    <>
      {ris === undefined ? null : (
        <div className="trn-risunok trn-risunok--shirokiy">
          <Ris6 ris={ris} />
        </div>
      )}
      {z.posle === undefined ? null : (
        <div className="trn-uslovie trn-uslovie--tekst">
          <Tex text={z.posle} />
        </div>
      )}
      <p className="trn-istochnik">{istochnikZadachi(z)}</p>
    </>
  );
}

/**
 * №6 для общего тренажёра по банку (components/tasks/trening/bank):
 * ключи задач, хранилища, загрузчик файлов прототипов, проверка ответа,
 * рисунок условия, разбор шагами и подсказки-вопросы. У №6 есть
 * переключатель формулировки: сюжетные и стандартные задачи.
 */
export const RAZDEL6: RazdelBanka<ZadachaLite, Solved> = {
  razdel: '6',
  klyuch: KLYUCH6,
  log: log6,
  vybor: vybor6,
  zagruzka: ZAGRUZKA6,
  T: TRENAZHER6,
  proverit: (vvod, seal) => (estPi(vvod) ? { kind: 'pi' } : readSealed6(vvod, seal)),
  pod: (z) => <Pod6 z={z} />,
  shagi: shagiIzResheniya6,
  posle: schitaemSUmom6,
  voprosy: voprosyIzResheniya6,
  zadachaHref: zadachaHref6,
  stil: true,
};
