'use client';

import { KartaGruppaProgress } from '../karta';
import { SHAPKA2 } from '@/content/vektory2';
import { kindStats } from '@/lib/progressLog';
import { log2 } from '@/lib/vektory/trening/progress';

/**
 * Прогресс группы №2 из журнала попыток: решено и верно — по
 * прототипам группы, «Стоит повторить» — в последних пяти задачах
 * группы две ошибки и больше. Маленький клиентский островок внутри
 * серверной карточки группы.
 */
export function GruppaProgress2({ prototypes }: { prototypes: string[] }) {
  const log = log2.use();
  const own = new Set(prototypes);
  const stats = kindStats(log, (kind) => (own.has(kind) ? 'gruppa' : kind)).get('gruppa');
  return (
    <KartaGruppaProgress
      progress={{
        resheno: stats?.done ?? 0,
        verno: stats?.right ?? 0,
        povtorit: stats?.repeat === true,
      }}
      labels={SHAPKA2}
    />
  );
}
