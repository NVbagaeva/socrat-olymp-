'use client';

import { TRENAZHER7 } from '@/content/uravneniya7';
import { readSealed7, estPi } from '@/lib/zadanie7/trening/otvet7';
import { log7, vybor7 } from '@/lib/zadanie7/trening/progress';
import { KLYUCH7 } from '@/lib/zadanie7/trening/session';
import { ZAGRUZKA7 } from '@/lib/zadanie7/trening/zagruzka';
import { zadachaHref7 } from '@/lib/zadanie7/links';
import type { ZadachaLite } from '@/lib/zadanie7/dannye';
import type { Solved } from '@/lib/zadanie7/types';
import type { RazdelBanka } from '../trening/bank/types';
import { schitaemSUmom, shagiIzResheniya, voprosyIzResheniya } from './shagi7';

/** Метка источника под условием: открытый банк ФИПИ или нет. */
function istochnikZadachi(z: ZadachaLite): string {
  return z.source === 'fipi' && z.no !== undefined
    ? TRENAZHER7.ekran.fipi(z.no)
    : TRENAZHER7.ekran.neIzBanka;
}

/**
 * №7 для общего тренажёра по банку (components/tasks/trening/bank):
 * ключи задач, хранилища, загрузчик файлов прототипов, проверка ответа,
 * разбор шагами и подсказки-вопросы.
 */
export const RAZDEL7: RazdelBanka<ZadachaLite, Solved> = {
  razdel: '7',
  klyuch: KLYUCH7,
  log: log7,
  vybor: vybor7,
  zagruzka: ZAGRUZKA7,
  T: TRENAZHER7,
  proverit: (vvod, seal) => (estPi(vvod) ? { kind: 'pi' } : readSealed7(vvod, seal)),
  pod: (z) => <p className="trn-istochnik">{istochnikZadachi(z)}</p>,
  shagi: shagiIzResheniya,
  posle: schitaemSUmom,
  voprosy: voprosyIzResheniya,
  zadachaHref: zadachaHref7,
};
