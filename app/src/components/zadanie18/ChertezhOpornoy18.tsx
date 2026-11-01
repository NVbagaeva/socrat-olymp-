'use client';

import { useMemo } from 'react';
import { ChertezhSkhemy } from '@/components/skhemy/ChertezhSkhemy';
import type { Sostoyanie } from '@/lib/skhemy/ekran';
import { VID_ISHODNYY } from '@/lib/skhemy/tipy';
import { chertezhOpornoy18 } from '@/lib/zadanie18/opornye';

/**
 * Чертёж опорной задачи: фигура по числам условия, без ручек.
 * lit — группы текущего шага решения; podpisi: false — превью на плитке.
 */
export function ChertezhOpornoy18({
  id,
  opisanie,
  lit = [],
  mini = false,
}: {
  id: string;
  opisanie: string;
  lit?: readonly string[];
  mini?: boolean;
}) {
  const skhema = chertezhOpornoy18(id);
  const sost: Sostoyanie = useMemo(
    () => ({ lit: new Set(lit), shag: null, podpisi: !mini }),
    [lit, mini],
  );
  return (
    <ChertezhSkhemy
      skhema={skhema}
      t={skhema.nachalo}
      vid={VID_ISHODNYY}
      sost={sost}
      opisanie={opisanie}
      dolyaVysoty={mini ? 0.56 : 0.72}
      maxVysota={mini ? 170 : 460}
      className={mini ? 'z18-mini' : undefined}
    />
  );
}
