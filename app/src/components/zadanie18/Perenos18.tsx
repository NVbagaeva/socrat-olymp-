'use client';

import { useEffect } from 'react';
import { perenestiStaryyProgress } from '@/lib/zadanie18/progress';

/**
 * Один раз на любой странице №18: прогресс схем из прежнего своего
 * хранилища переезжает в общий прогресс карточек (lib/zadanie18/progress).
 * Ничего не рисует.
 */
export function Perenos18() {
  useEffect(() => {
    perenestiStaryyProgress();
  }, []);
  return null;
}
