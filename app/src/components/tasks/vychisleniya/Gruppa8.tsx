'use client';

import type { ReactNode } from 'react';
import { KartaGruppa } from '../karta';
import { SHAPKA8 } from '@/content/vychisleniya8';
import type { Ton } from '../steklo';
import { nedavnie8, progress8, stoitPovtorit8 } from '@/lib/vychisleniya/progress';

/**
 * Карточка группы №8 с прогрессом ученика из хранилища браузера:
 * решено и верно — по счётчикам прототипов группы, «Стоит повторить» —
 * по последним пяти попыткам. Типы внутри приходят детьми: они
 * собраны на сервере вместе с примерами.
 */
export function Gruppa8({
  id,
  nazvanie,
  znakHtml,
  ton,
  prototypes,
  open,
  children,
}: {
  id: string;
  nazvanie: string;
  znakHtml: string;
  ton: Ton;
  prototypes: string[];
  open?: boolean;
  children: ReactNode;
}) {
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
    <KartaGruppa
      id={id}
      nazvanie={nazvanie}
      znakHtml={znakHtml}
      ton={ton}
      tipov={prototypes.length}
      progress={{ resheno, verno, povtorit: stoitPovtorit8(nedavnie, prototypes) }}
      labels={SHAPKA8}
      open={open}
    >
      {children}
    </KartaGruppa>
  );
}
