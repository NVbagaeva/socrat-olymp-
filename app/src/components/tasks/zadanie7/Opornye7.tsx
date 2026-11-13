'use client';

import type { ReactNode } from 'react';
import { VDzKnopka } from '@/components/dz/razdel/DzVRazdele';
import {
  OpornyeBanka,
  OpornyeSpisokBanka,
  type MikroZadachaBrauzera,
  type NavykKartochki,
} from '../opornye/OpornyeBanka';
import { OPORNYE7, TRENAZHER7 } from '@/content/uravneniya7';
import { opornye7 } from '@/lib/zadanie7/progress';
import { openText } from '@/lib/zadanie7/secret';
import { estPi, readSealed7 } from '@/lib/zadanie7/trening/otvet7';

export type Navyk7Kartochki = NavykKartochki;

/** Список опорных задач №7 на общих карточках (components/tasks/opornye). */
export function Opornye7Spisok({ navyki }: { navyki: Navyk7Kartochki[] }) {
  return <OpornyeSpisokBanka navyki={navyki} store={opornye7} labels={OPORNYE7.spisok} />;
}

function proverit7(vvod: string, seal: string) {
  return estPi(vvod) ? ({ kind: 'pi' } as const) : readSealed7(vvod, seal);
}

/** Экран блока опорных задач №7: общий экран блока с проверкой ответа №7. */
export function Opornye7({
  blok,
  slug,
  zapomni,
  zadachi,
}: {
  blok: string;
  /** Адрес блока: пункт ДЗ (lib/dz/sostav.ts). */
  slug: string;
  zapomni: ReactNode;
  zadachi: MikroZadachaBrauzera[];
}) {
  return (
    <OpornyeBanka
      blok={blok}
      zapomni={zapomni}
      zadachi={zadachi}
      store={opornye7}
      proverit={proverit7}
      raskryt={openText}
      piPodskazka={TRENAZHER7.ekran.piPodskazka}
      labels={OPORNYE7.zadacha}
      dop={(z) => (
        <VDzKnopka
          malaya
          punkt={{ ist: 'opornye', no: 7, blok: slug, zadachi: [z.id], kazhdomu: false }}
          chto={`опорная задача ${z.id}`}
          label="В ДЗ"
        />
      )}
    />
  );
}
