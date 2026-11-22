'use client';

import { KartaGruppaProgress } from '../karta';
import { SHAPKA13 } from '@/content/ekonomicheskie13';
import { kindStats } from '@/lib/progressLog';
import { log13 } from '@/lib/zadanie13/trening/progress';

/**
 * Прогресс схемы №13 из журнала попыток: решено и верно — по прототипам
 * схемы, «Стоит повторить» — в последних задачах схемы две ошибки и
 * больше. Маленький клиентский островок внутри серверной карточки группы.
 */
export function GruppaProgress13({ prototypes }: { prototypes: string[] }) {
  const log = log13.use();
  const own = new Set(prototypes);
  const stats = kindStats(log, (kind) => (own.has(kind) ? 'gruppa' : kind)).get('gruppa');
  return (
    <KartaGruppaProgress
      progress={{
        resheno: stats?.done ?? 0,
        verno: stats?.right ?? 0,
        povtorit: stats?.repeat === true,
      }}
      labels={SHAPKA13}
    />
  );
}
