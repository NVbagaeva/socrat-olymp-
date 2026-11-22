'use client';

import type { ReactNode } from 'react';
import {
  OpornyeBanka,
  OpornyeSpisokBanka,
  type MikroZadachaBrauzera,
  type NavykKartochki,
} from '../opornye/OpornyeBanka';
import { OPORNYE6, TRENAZHER6 } from '@/content/sluchainye6';
import { opornye6 } from '@/lib/zadanie6/progress';
import { openText } from '@/lib/zadanie6/secret';
import { readSealed6 } from '@/lib/zadanie6/trening/otvet6';
import { estPi } from '@/lib/zadanie7/otvet';

/** Список опорных задач №6 на общих карточках (components/tasks/opornye). */
export function Opornye6Spisok({ navyki }: { navyki: NavykKartochki[] }) {
  return <OpornyeSpisokBanka navyki={navyki} store={opornye6} labels={OPORNYE6.spisok} />;
}

function proverit6(vvod: string, seal: string) {
  return estPi(vvod) ? ({ kind: 'pi' } as const) : readSealed6(vvod, seal);
}

/** Экран блока опорных задач №6: общий экран блока с проверкой ответа №6. */
export function Opornye6({
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
      store={opornye6}
      proverit={proverit6}
      raskryt={openText}
      piPodskazka={TRENAZHER6.ekran.piPodskazka}
      labels={OPORNYE6.zadacha}
    />
  );
}
