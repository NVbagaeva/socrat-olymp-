'use client';

import type { GruppaVybora } from '../trening';
import { TrenazherBanka } from '../trening/bank/TrenazherBanka';
import type { KatalogBanka } from '@/lib/trening/bank';
import { RAZDEL21 } from './razdel21';

/** Тренажёр раздела: общий тренажёр по банку задач с настройками раздела (razdel21). */
export function Trenazher21(props: {
  base: string;
  gruppy: GruppaVybora[];
  nazvaniyaTekst: Record<string, string>;
  katalog: KatalogBanka;
}) {
  return <TrenazherBanka razdel={RAZDEL21} {...props} />;
}
