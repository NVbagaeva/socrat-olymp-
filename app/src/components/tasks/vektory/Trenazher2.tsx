'use client';

import type { GruppaVybora } from '../trening';
import { TrenazherBanka } from '../trening/bank/TrenazherBanka';
import type { KatalogBanka } from '@/lib/trening/bank';
import { RAZDEL2 } from './razdel2';

/**
 * Тренажёр задания №2: общий тренажёр по банку задач
 * (components/tasks/trening/bank) с настройками раздела (razdel2).
 */
export function Trenazher2(props: {
  base: string;
  gruppy: GruppaVybora[];
  nazvaniyaTekst: Record<string, string>;
  katalog: KatalogBanka;
}) {
  return <TrenazherBanka razdel={RAZDEL2} {...props} />;
}
