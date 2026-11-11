'use client';

import { KartaGruppaProgress } from '../karta';
import { SHAPKA3 } from '@/content/zadanie3/spravka';
import { gruppaTipa, tipZadachi } from '@/content/zadanie3/gruppy';
import { kindStats } from '@/lib/progressLog';
import { log3 } from '@/lib/zadanie3/trening/progress';

/**
 * Прогресс группы №3 из журнала попыток тренажёра: решено и верно — по
 * прототипам группы, «Стоит повторить» — в последних пяти задачах
 * группы две ошибки и больше. Маленький клиентский островок внутри
 * серверной карточки группы.
 */
export function GruppaProgress3({ gruppa }: { gruppa: string }) {
  const log = log3.use();
  const stats = kindStats(log, (kind) => gruppaTipa(tipZadachi(kind))?.id ?? kind).get(gruppa);
  return (
    <KartaGruppaProgress
      progress={{
        resheno: stats?.done ?? 0,
        verno: stats?.right ?? 0,
        povtorit: stats?.repeat === true,
      }}
      labels={SHAPKA3}
    />
  );
}
