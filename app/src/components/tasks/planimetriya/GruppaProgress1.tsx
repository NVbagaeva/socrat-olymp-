'use client';

import { KartaGruppaProgress } from '../karta';
import { SHAPKA1 } from '@/content/planimetriya1';
import { kindStats } from '@/lib/progressLog';
import { log1 } from '@/lib/planimetriya/trening/progress';

/**
 * Прогресс группы №1 из журнала попыток: решено и верно — по прототипам
 * группы, «Стоит повторить» — в последних задачах группы две ошибки и
 * больше. Маленький клиентский островок внутри серверной карточки.
 */
export function GruppaProgress1({ prototypes }: { prototypes: string[] }) {
  const log = log1.use();
  const own = new Set(prototypes);
  const stats = kindStats(log, (kind) => (own.has(kind) ? 'gruppa' : kind)).get('gruppa');
  return (
    <KartaGruppaProgress
      progress={{
        resheno: stats?.done ?? 0,
        verno: stats?.right ?? 0,
        povtorit: stats?.repeat === true,
      }}
      labels={SHAPKA1}
    />
  );
}
