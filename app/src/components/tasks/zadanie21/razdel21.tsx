'use client';

import type { RazdelBanka } from '../trening/bank/types';
import { TRENAZHER21 } from '@/content/naibolshee21';
import { zadachaHref21 } from '@/lib/zadanie21/links';
import { readSealed21 } from '@/lib/zadanie21/trening/otvet21';
import { log21, vybor21 } from '@/lib/zadanie21/trening/progress';
import { KLYUCH21 } from '@/lib/zadanie21/trening/session';
import { ZAGRUZKA21, type Reshenie21, type Zadacha21 } from '@/lib/zadanie21/trening/zagruzka';
import { shagi21, voprosy21 } from './shagi21';

/**
 * Раздел для общего тренажёра по банку (components/tasks/trening/bank):
 * ключи задач, хранилища, генератор в браузере вместо файлов задач,
 * проверка ответа по отпечатку, решение шагами и подсказка-вопросы.
 * Источника задач нет — все задачи строит генератор.
 */
export const RAZDEL21: RazdelBanka<Zadacha21, Reshenie21> = {
  razdel: '21',
  klyuch: KLYUCH21,
  log: log21,
  vybor: vybor21,
  zagruzka: ZAGRUZKA21,
  T: TRENAZHER21,
  proverit: readSealed21,
  pod: () => null,
  shagi: (s) => shagi21(s),
  voprosy: (s) => voprosy21(s),
  zadachaHref: zadachaHref21,
  bezIstochnika: true,
};
