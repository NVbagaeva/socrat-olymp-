'use client';

import type { ReactNode } from 'react';
import {
  OpornyeBanka,
  OpornyeSpisokBanka,
  type MikroZadachaBrauzera,
  type NavykKartochki,
} from '../opornye/OpornyeBanka';
import { OPORNYE10, TRENAZHER10 } from '@/content/prikladnye10';
import { openText } from '@/lib/zadanie10/secret';
import { opornye10 } from '@/lib/zadanie10/trening/opornye';
import { proverit10 } from '@/lib/zadanie10/trening/otvet10';

/** Список опорных задач №10 на общих карточках (components/tasks/opornye). */
export function Opornye10Spisok({ navyki }: { navyki: NavykKartochki[] }) {
  return <OpornyeSpisokBanka navyki={navyki} store={opornye10} labels={OPORNYE10.spisok} />;
}

/**
 * Экран блока опорных задач №10: общий экран блока с проверкой ответа
 * №10. У задач с сюжетом под условием — картинка сюжета и ссылка на тип,
 * где встречается эта формула (рисует сервер).
 */
export function Opornye10({
  blok,
  zapomni,
  zadachi,
  risunki,
}: {
  blok: string;
  zapomni: ReactNode;
  zadachi: MikroZadachaBrauzera[];
  risunki: Record<string, ReactNode>;
}) {
  return (
    <OpornyeBanka
      blok={blok}
      zapomni={zapomni}
      zadachi={zadachi}
      store={opornye10}
      proverit={proverit10}
      raskryt={openText}
      piPodskazka={TRENAZHER10.ekran.piPodskazka}
      labels={OPORNYE10.zadacha}
      risunki={risunki}
    />
  );
}
