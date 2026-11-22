'use client';

import { KartaGruppaProgress, type KartaGruppaLabels } from '../../karta';
import { tekstyKarty45 } from '@/content/veroyatnost45';
import { kindStats } from '@/lib/progressLog';
import type { Zadanie45 } from '@/lib/veroyatnost/trening/links';
import { log45 } from '@/lib/veroyatnost/trening/progress';

const LABELS: KartaGruppaLabels = tekstyKarty45;

/**
 * Прогресс группы (метода) №4 и №5 из журнала попыток: тип попытки —
 * метод, поэтому строка группы — его счётчики; «Стоит повторить» — в
 * последних пяти задачах метода две ошибки и больше. Маленький
 * клиентский островок внутри серверной карточки группы.
 */
export function GruppaProgress45({ zadanie, metod }: { zadanie: Zadanie45; metod: string }) {
  const log = log45(zadanie).use();
  const stats = kindStats(log).get(metod);
  return (
    <KartaGruppaProgress
      progress={{
        resheno: stats?.done ?? 0,
        verno: stats?.right ?? 0,
        povtorit: stats?.repeat === true,
      }}
      labels={LABELS}
    />
  );
}
