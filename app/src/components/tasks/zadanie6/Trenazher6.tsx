'use client';

import type { GruppaVybora } from '../trening';
import { TrenazherBanka } from '../trening/bank/TrenazherBanka';
import type { KatalogBanka } from '@/lib/trening/bank';
import { RAZDEL6 } from './razdel6';

/**
 * Тренажёр задания №6: общий тренажёр по банку задач
 * (components/tasks/trening/bank) с настройками раздела (razdel6).
 */
export function Trenazher6(props: {
  base: string;
  gruppy: GruppaVybora[];
  nazvaniyaTekst: Record<string, string>;
  katalog: KatalogBanka;
}) {
  return <TrenazherBanka razdel={RAZDEL6} {...props} />;
}
