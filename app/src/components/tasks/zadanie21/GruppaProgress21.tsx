'use client';

import { KartaGruppaProgress } from '../karta';
import { SHAPKA21 } from '@/content/naibolshee21';
import { kindStats } from '@/lib/progressLog';
import { log21 } from '@/lib/zadanie21/trening/progress';

/** Прогресс группы из журнала попыток: решено и верно по прототипам группы. */
export function GruppaProgress21({ prototypes }: { prototypes: string[] }) {
  const log = log21.use();
  const own = new Set(prototypes);
  const stats = kindStats(log, (kind) => (own.has(kind) ? 'gruppa' : kind)).get('gruppa');
  return (
    <KartaGruppaProgress
      progress={{
        resheno: stats?.done ?? 0,
        verno: stats?.right ?? 0,
        povtorit: stats?.repeat === true,
      }}
      labels={SHAPKA21}
    />
  );
}
