'use client';

import { useEffect } from 'react';
import { useOpornyeResheno } from '@/lib/shapka/useOpornyeResheno';

/**
 * Счёт решённых опорных задач раздела — отдельным куском: хранилища
 * опорных задач всех разделов в первую загрузку страницы не входят.
 * Кольцо прогресса (KoltsoProgressa) подгружает его после отрисовки и
 * получает число через soobshchit.
 */
export default function OpornyeSchyot({
  hranenie,
  ids,
  soobshchit,
}: {
  hranenie: number;
  ids: readonly string[];
  soobshchit: (n: number) => void;
}) {
  const n = useOpornyeResheno(hranenie, ids);
  useEffect(() => {
    soobshchit(n);
  }, [n, soobshchit]);
  return null;
}
