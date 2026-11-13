'use client';

import { KartaGruppaProgress } from '../karta';
import { SHAPKA6 } from '@/content/sluchainye6';
import { kindStats } from '@/lib/progressLog';
import { log6 } from '@/lib/zadanie6/trening/progress';

/**
 * Прогресс группы №6 из журнала попыток: решено и верно — по
 * прототипам группы, «Стоит повторить» — в последних пяти задачах
 * группы две ошибки и больше. Маленький клиентский островок внутри
 * серверной карточки группы.
 */
export function GruppaProgress6({ prototypes }: { prototypes: string[] }) {
  const log = log6.use();
  const own = new Set(prototypes);
  const stats = kindStats(log, (kind) => (own.has(kind) ? 'gruppa' : kind)).get('gruppa');
  return (
    <KartaGruppaProgress
      progress={{
        resheno: stats?.done ?? 0,
        verno: stats?.right ?? 0,
        povtorit: stats?.repeat === true,
      }}
      labels={SHAPKA6}
    />
  );
}
