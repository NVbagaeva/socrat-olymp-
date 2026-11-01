'use client';

import { trebuetsyaScenaOpornoy18 } from '@/lib/zadanie18/opornye';
import { MiniChertezh18 } from './MiniChertezh18';

/** Мини-чертёж опорной задачи на плитке: данные пункта б), без букв. */
export function OpornayaMini18({ id, nazvanie }: { id: string; nazvanie: string }) {
  return <MiniChertezh18 id={id} nazvanie={nazvanie} skhema={trebuetsyaScenaOpornoy18(id)} />;
}
