'use client';

import { KartaGruppaProgress } from '../karta';
import { SHAPKA12 } from '@/content/zadanie12';
import { kindStats } from '@/lib/progressLog';
import { log12 } from '@/lib/ves12/trening/progress';

/**
 * Прогресс вида функции на карте №12 из журнала попыток: решено и верно
 * — по наборам вида (тренажёр узла и тренажёры видов пишут в один
 * журнал), «Стоит повторить» — в последних пяти задачах две ошибки и
 * больше. Маленький клиентский островок внутри серверной карточки.
 */
export function GruppaProgress12({ nabory }: { nabory: string[] }) {
  const log = log12.use();
  const own = new Set(nabory);
  const stats = kindStats(log, (kind) => (own.has(kind) ? 'gruppa' : kind)).get('gruppa');
  return (
    <KartaGruppaProgress
      progress={{
        resheno: stats?.done ?? 0,
        verno: stats?.right ?? 0,
        povtorit: stats?.repeat === true,
      }}
      labels={SHAPKA12}
    />
  );
}
