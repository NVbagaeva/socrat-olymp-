'use client';

import { ChertezhSkhemy } from '@/components/skhemy/ChertezhSkhemy';
import type { Sostoyanie } from '@/lib/skhemy/ekran';
import { VID_ISHODNYY, type ZhivayaSkhema } from '@/lib/skhemy/tipy';
import { trebuetsyaSkhema18 } from '@/lib/zadanie18/skhemy';

const SOST_MINI: Sostoyanie = { lit: new Set(), shag: null, podpisi: false };

/**
 * Мини-превью схемы на плитке: исходное положение, без букв и ручек.
 * skhema — своя сцена (опорная задача) вместо схемы из реестра.
 */
export function MiniChertezh18({
  id,
  nazvanie,
  skhema: svoya,
}: {
  id: string;
  nazvanie: string;
  skhema?: ZhivayaSkhema;
}) {
  const skhema = svoya ?? trebuetsyaSkhema18(id);
  return (
    <ChertezhSkhemy
      skhema={skhema}
      t={skhema.nachalo}
      vid={VID_ISHODNYY}
      sost={SOST_MINI}
      opisanie={nazvanie}
      dolyaVysoty={0.56}
      maxVysota={170}
      className="z18-mini"
    />
  );
}
