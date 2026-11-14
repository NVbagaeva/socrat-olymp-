'use client';

import { useMemo } from 'react';
import type { GruppaVybora } from '../trening';
import { TrenazherBanka } from '../trening/bank/TrenazherBanka';
import type { KatalogBanka } from '@/lib/trening/bank';
import type { IllInfo } from './Kartinka10';
import { razdel10 } from './razdel10';

/**
 * Тренажёр задания №10: общий тренажёр по банку задач
 * (components/tasks/trening/bank) с настройками раздела (razdel10).
 */
export function Trenazher10({
  kartinki,
  ...props
}: {
  base: string;
  gruppy: GruppaVybora[];
  nazvaniyaTekst: Record<string, string>;
  katalog: KatalogBanka;
  /** Картинки сюжетов по прототипам — находит сервер при сборке. */
  kartinki: Record<string, IllInfo>;
}) {
  const razdel = useMemo(() => razdel10(kartinki), [kartinki]);
  return <TrenazherBanka razdel={razdel} {...props} />;
}
