'use client';

import { KartaGruppaProgress } from '../karta';
import { SHAPKA8 } from '@/content/vychisleniya8';
import { kindStats } from '@/lib/progressLog';
import { log8 } from '@/lib/vychisleniya/progress';

/**
 * Прогресс группы №8 из журнала попыток: решено и верно — по
 * прототипам группы, «Стоит повторить» — в последних пяти задачах
 * группы две ошибки и больше. Маленький клиентский островок внутри
 * серверной карточки группы: типы с примерами в данные клиента не
 * попадают.
 */
export function GruppaProgress8({ prototypes }: { prototypes: string[] }) {
  const log = log8.use();
  const own = new Set(prototypes);
  const stats = kindStats(log, (kind) => (own.has(kind) ? 'gruppa' : kind)).get('gruppa');
  return (
    <KartaGruppaProgress
      progress={{
        resheno: stats?.done ?? 0,
        verno: stats?.right ?? 0,
        povtorit: stats?.repeat === true,
      }}
      labels={SHAPKA8}
    />
  );
}
