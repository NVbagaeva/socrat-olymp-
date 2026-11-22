'use client';

import type { ReactNode } from 'react';
import {
  OpornyeBanka,
  OpornyeSpisokBanka,
  type MikroZadachaBrauzera,
  type NavykKartochki,
} from '@/components/tasks/opornye/OpornyeBanka';
import { tekstyOpornyh, tekstyTrenazheraBanka } from '@/content/treningBanka';
import { brauzerRazdela } from '@/lib/baza/dannye';
import { openText, prochitat } from '@/lib/baza/secret';

/* Подписи опорных задач — общие (content/treningBanka.ts), лид свой. */
export const OPORNYE_BAZY = tekstyOpornyh(
  'Короткие задачи на один шаг: из этих шагов складывается любая задача номера. У каждой — подсказка и разбор.',
);
const PI = tekstyTrenazheraBanka({
  nomer: 0,
  grupp: '',
  istochniki: { vse: '', fipi: '', new: '' },
}).ekran.piPodskazka;

/** Список блоков опорных задач с прогрессом из хранилища базы. */
export function OpornyeBazySpisok({ slug, navyki }: { slug: string; navyki: NavykKartochki[] }) {
  return (
    <OpornyeSpisokBanka
      navyki={navyki}
      store={brauzerRazdela(slug).opornye}
      labels={OPORNYE_BAZY.spisok}
    />
  );
}

/** Экран блока: задачи по одной, подсказка, закрытые разбор и ответ. */
export function OpornyeBazyBlok({
  slug,
  blok,
  zapomni,
  zadachi,
}: {
  slug: string;
  blok: string;
  zapomni: ReactNode;
  zadachi: MikroZadachaBrauzera[];
}) {
  return (
    <OpornyeBanka
      blok={blok}
      zapomni={zapomni}
      zadachi={zadachi}
      store={brauzerRazdela(slug).opornye}
      proverit={prochitat}
      raskryt={openText}
      piPodskazka={PI}
      labels={OPORNYE_BAZY.zadacha}
    />
  );
}
