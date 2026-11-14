'use client';

import type { ReactNode } from 'react';
import {
  OpornyeBanka,
  OpornyeSpisokBanka,
  type MikroZadachaBrauzera,
  type NavykKartochki,
} from '../opornye/OpornyeBanka';
import { OPORNYE21, TRENAZHER21 } from '@/content/naibolshee21';
import { opornye21 } from '@/lib/zadanie21/progress';
import { openText } from '@/lib/zadanie21/secret';
import { readSealed21 } from '@/lib/zadanie21/trening/otvet21';

/** Список опорных задач на общих карточках (components/tasks/opornye). */
export function Opornye21Spisok({ navyki }: { navyki: NavykKartochki[] }) {
  return <OpornyeSpisokBanka navyki={navyki} store={opornye21} labels={OPORNYE21.spisok} />;
}

/** Экран блока опорных задач: общий экран блока с проверкой ответа раздела. */
export function Opornye21({
  blok,
  zapomni,
  zadachi,
}: {
  blok: string;
  zapomni: ReactNode;
  zadachi: MikroZadachaBrauzera[];
}) {
  return (
    <OpornyeBanka
      blok={blok}
      zapomni={zapomni}
      zadachi={zadachi}
      store={opornye21}
      proverit={readSealed21}
      raskryt={openText}
      piPodskazka={TRENAZHER21.ekran.piPodskazka}
      labels={OPORNYE21.zadacha}
    />
  );
}
