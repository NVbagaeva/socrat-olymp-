'use client';

import type { GruppaVybora } from '../trening';
import { TrenazherBanka } from '../trening/bank/TrenazherBanka';
import type { Katalog7 } from '@/lib/zadanie7/trening/session';
import { RAZDEL7 } from './razdel7';

/**
 * Тренажёр задания №7: общий тренажёр по банку задач
 * (components/tasks/trening/bank) с настройками раздела (razdel7).
 */
export function Trenazher7(props: {
  base: string;
  gruppy: GruppaVybora[];
  nazvaniyaTekst: Record<string, string>;
  katalog: Katalog7;
}) {
  return <TrenazherBanka razdel={RAZDEL7} {...props} />;
}
