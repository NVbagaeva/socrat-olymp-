'use client';

import { useState } from 'react';
import type { GruppaVybora } from '../trening';
import { TrenazherBanka } from '../trening/bank/TrenazherBanka';
import type { KatalogBanka } from '@/lib/trening/bank';
import { perenestiSessiyu9 } from '@/lib/proizvodnaya/trening/perenos';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import { RAZDEL9 } from './razdel9';

/**
 * Тренажёр задания №9: общий тренажёр по банку задач
 * (components/tasks/trening/bank) с настройками раздела (razdel9).
 * До первой отрисовки тренажёра незаконченная тренировка прежнего
 * тренажёра (sessionStorage) переносится в общую запись.
 */
export function Trenazher9(props: {
  base: string;
  gruppy: GruppaVybora[];
  nazvaniyaTekst: Record<string, string>;
  katalog: KatalogBanka;
}) {
  useState(() => perenestiSessiyu9(scopeOfPath(props.base) ?? RAZDEL9.razdel));
  return <TrenazherBanka razdel={RAZDEL9} {...props} />;
}
