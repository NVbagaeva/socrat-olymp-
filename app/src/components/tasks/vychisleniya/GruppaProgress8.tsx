'use client';

import { KartaGruppaProgress } from '../karta';
import { SHAPKA8 } from '@/content/vychisleniya8';
import { nedavnie8, progress8, stoitPovtorit8 } from '@/lib/vychisleniya/progress';

/**
 * Прогресс группы №8 из хранилища браузера: решено и верно — по
 * счётчикам прототипов группы, «Стоит повторить» — по последним пяти
 * попыткам. Маленький клиентский островок внутри серверной карточки
 * группы: типы с примерами в данные клиента не попадают.
 */
export function GruppaProgress8({ prototypes }: { prototypes: string[] }) {
  const progress = progress8.useProgress();
  const nedavnie = nedavnie8.use();
  let resheno = 0;
  let verno = 0;
  for (const prototype of prototypes) {
    const tally = progress.kinds[prototype];
    if (tally !== undefined) {
      resheno += tally.done;
      verno += tally.right;
    }
  }
  return (
    <KartaGruppaProgress
      progress={{ resheno, verno, povtorit: stoitPovtorit8(nedavnie, prototypes) }}
      labels={SHAPKA8}
    />
  );
}
