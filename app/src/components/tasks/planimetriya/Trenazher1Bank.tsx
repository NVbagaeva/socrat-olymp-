'use client';

import { useState } from 'react';
import { perenestiPauzu1 } from '@/lib/planimetriya/trenazher/pauza';
import type { GruppaVybora } from '../trening';
import { TrenazherBanka } from '../trening/bank/TrenazherBanka';
import type { KatalogBanka } from '@/lib/trening/bank';
import type { SsylkiTipa1 } from '@/lib/planimetriya/trening/ssylki';
import { RAZDEL1, Ssylki1 } from './razdel1';

/**
 * Тренажёр задания №1: общий тренажёр по банку задач
 * (components/tasks/trening/bank) с настройками раздела (razdel1).
 */
export function Trenazher1Bank(props: {
  base: string;
  gruppy: GruppaVybora[];
  nazvaniyaTekst: Record<string, string>;
  katalog: KatalogBanka;
  /** Ссылки под условием по типу: теория, факт, опорный блок, разбор. */
  ssylki: Record<string, SsylkiTipa1>;
}) {
  const { ssylki, ...rest } = props;
  /* До первой отрисовки: пауза самого первого тренажёра №1 → запись
     сессии (её читает razdel1: prezhnyayaZapis1). Прежний ключ паузы
     убирается — так было и раньше. */
  useState(() => {
    if (typeof window !== 'undefined') perenestiPauzu1();
    return null;
  });
  return (
    <Ssylki1.Provider value={ssylki}>
      <TrenazherBanka razdel={RAZDEL1} {...rest} />
    </Ssylki1.Provider>
  );
}
