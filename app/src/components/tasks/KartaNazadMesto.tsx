'use client';

import dynamic from 'next/dynamic';
import { useSyncExternalStore } from 'react';
import { estMetka } from '@/lib/kartaNazadKlyuch';

const KartaNazad = dynamic(() => import('./KartaNazad').then((m) => m.KartaNazad), {
  ssr: false,
});

const bezPodpiski = () => () => {};

/**
 * Место кнопки «← К карте» в строке вкладок (TabsRow). Сама кнопка —
 * отдельным куском: грузится, только если в этой вкладке браузера есть
 * метка карты, и в первую загрузку страниц заданий не входит.
 */
export function KartaNazadMesto({ slushat }: { slushat: boolean }) {
  const est = useSyncExternalStore(bezPodpiski, estMetka, () => false);
  return est ? <KartaNazad slushat={slushat} /> : null;
}
