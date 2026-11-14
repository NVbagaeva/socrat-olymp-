'use client';

import { KartaGruppaProgress } from '../karta';
import { SHAPKA11 } from '@/content/tekstovye11';
import { kindStats } from '@/lib/progressLog';
import { log11 } from '@/lib/zadanie11/trening/progress';

/**
 * Прогресс группы №11 из журнала попыток: решено и верно — по подтипам
 * группы, «Стоит повторить» — в последних пяти задачах группы две
 * ошибки и больше. Маленький клиентский островок в серверной карточке.
 */
export function GruppaProgress11({ podtipy }: { podtipy: string[] }) {
  const log = log11.use();
  const own = new Set(podtipy);
  const stats = kindStats(log, (kind) => (own.has(kind) ? 'gruppa' : kind)).get('gruppa');
  return (
    <KartaGruppaProgress
      progress={{
        resheno: stats?.done ?? 0,
        verno: stats?.right ?? 0,
        povtorit: stats?.repeat === true,
      }}
      labels={SHAPKA11}
    />
  );
}
