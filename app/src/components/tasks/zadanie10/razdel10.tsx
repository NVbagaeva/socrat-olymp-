'use client';

import { TRENAZHER10 } from '@/content/prikladnye10';
import type { ZadachaLite } from '@/lib/zadanie10/dannye';
import { zadachaHref10 } from '@/lib/zadanie10/links';
import { proverit10 } from '@/lib/zadanie10/trening/otvet10';
import { log10, vybor10 } from '@/lib/zadanie10/trening/progress';
import { KLYUCH10 } from '@/lib/zadanie10/trening/session';
import { ZAGRUZKA10 } from '@/lib/zadanie10/trening/zagruzka';
import type { Solved } from '@/lib/zadanie10/types';
import type { RazdelBanka } from '../trening/bank/types';
import { Kartinka10, type IllInfo } from './Kartinka10';
import { Most10 } from './Most10';
import { schitaemSUmom10, shagiIzResheniya10, voprosyIzResheniya10 } from './shagi10';

/** Откуда задача: открытый банк ФИПИ или аналог; современный сюжет — пометкой. */
function istochnikZadachi(z: ZadachaLite): string {
  const gde = z.source === 'fipi' ? TRENAZHER10.ekran.fipi(z.no) : TRENAZHER10.ekran.neIzBanka;
  return z.modern === true ? `${gde} · ${TRENAZHER10.ekran.sovremennyy}` : gde;
}

/**
 * Под условием задачи №10: картинка сюжета (крупно, как есть), чертёж
 * моста у задач про мост (движок lib/zadanie10/chertezh) и откуда
 * задача. Картинка больше не прячется в сворачиваемую строку.
 */
function Pod10({ z, ill }: { z: ZadachaLite; ill: IllInfo | undefined }) {
  return (
    <>
      {ill === undefined ? null : (
        <div className="trn-risunok z10-trn-kartinka">
          <Kartinka10 ill={ill} />
        </div>
      )}
      {z.prototypeId === 'P01' ? (
        <div className="trn-risunok trn-risunok--shirokiy">
          <Most10 params={z.params} rezhim="uchenik" />
        </div>
      ) : null}
      <p className="trn-istochnik">{istochnikZadachi(z)}</p>
    </>
  );
}

/**
 * №10 для общего тренажёра по банку (components/tasks/trening/bank):
 * ключи задач, хранилища, загрузчик файлов прототипов, проверка ответа,
 * картинка сюжета под условием, разбор шагами (первый шаг — таблица
 * «Дано») и подсказки-вопросы. Картинки находит сервер при сборке —
 * поэтому настройки собираются функцией от них.
 */
export function razdel10(kartinki: Record<string, IllInfo>): RazdelBanka<ZadachaLite, Solved> {
  return {
    razdel: '10',
    klyuch: KLYUCH10,
    log: log10,
    vybor: vybor10,
    zagruzka: ZAGRUZKA10,
    T: TRENAZHER10,
    proverit: proverit10,
    pod: (z) => <Pod10 z={z} ill={kartinki[z.prototypeId]} />,
    shagi: shagiIzResheniya10,
    posle: schitaemSUmom10,
    voprosy: voprosyIzResheniya10,
    zadachaHref: zadachaHref10,
  };
}
