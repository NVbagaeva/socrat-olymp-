'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { KabinetRaskladka } from './KabinetRaskladka';
import { KartaUchenika } from './KartaUchenika';

function Vnutri() {
  const params = useSearchParams();
  return <KartaUchenika debug={params.get('debug') === '1'} />;
}

/** Страница карты: раскладка кабинета, внутри — карта ученика. ?debug=1 — контуры. */
export function KartaStranica() {
  return (
    <KabinetRaskladka>
      <Suspense fallback={<KartaUchenika />}>
        <Vnutri />
      </Suspense>
    </KabinetRaskladka>
  );
}
