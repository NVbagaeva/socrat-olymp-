'use client';

import type { GruppaVybora } from '../trening';
import { TrenazherBanka } from '../trening/bank/TrenazherBanka';
import type { KatalogBanka } from '@/lib/trening/bank';
import { RAZDEL13 } from './razdel13';

/**
 * Тренажёр задания №13: общий тренажёр по банку задач
 * (components/tasks/trening/bank) с настройками раздела (razdel13).
 */
export function Trenazher13(props: {
  base: string;
  gruppy: GruppaVybora[];
  nazvaniyaTekst: Record<string, string>;
  katalog: KatalogBanka;
}) {
  return <TrenazherBanka razdel={RAZDEL13} {...props} />;
}
