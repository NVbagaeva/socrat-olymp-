'use client';

import type { GruppaVybora } from '../trening';
import { TrenazherBanka } from '../trening/bank/TrenazherBanka';
import type { KatalogBanka } from '@/lib/trening/bank';
import { zapomnitKatalog12 } from '@/lib/ves12/trening/zagruzka';
import { RAZDEL12 } from './razdel12';

/**
 * Тренажёр задания №12: общий тренажёр по банку задач
 * (components/tasks/trening/bank) с настройками раздела (razdel12).
 * Каталог передаётся загрузчику: по нему наборы тренировки собираются
 * заранее, до показа задачи.
 */
export function Trenazher12Banka(props: {
  base: string;
  gruppy: GruppaVybora[];
  nazvaniyaTekst: Record<string, string>;
  katalog: KatalogBanka;
}) {
  zapomnitKatalog12(props.katalog);
  return <TrenazherBanka razdel={RAZDEL12} {...props} />;
}
