'use client';

import { useMemo } from 'react';
import type { GruppaVybora } from '../trening';
import { TrenazherBanka } from '../trening/bank/TrenazherBanka';
import type { KatalogBanka } from '@/lib/trening/bank';
import { razdel11, type SsylkiTipa11 } from './razdel11';

/**
 * Тренажёр задания №11: общий тренажёр по банку задач
 * (components/tasks/trening/bank) с настройками раздела (razdel11).
 */
export function Trenazher11({
  ssylki,
  ...props
}: {
  base: string;
  gruppy: GruppaVybora[];
  nazvaniyaTekst: Record<string, string>;
  katalog: KatalogBanka;
  ssylki: Record<string, SsylkiTipa11>;
}) {
  const razdel = useMemo(() => razdel11(ssylki), [ssylki]);
  return <TrenazherBanka razdel={razdel} {...props} />;
}
