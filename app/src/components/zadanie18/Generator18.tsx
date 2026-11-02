'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import {
  config18,
  engine18,
  type Tema18Info,
  type Tip18Info,
} from '@/lib/zadanie18/gen/generator18';
import type { Zadacha18 } from '@/lib/zadanie18/trenazher/bank';
/* Чертежи предпросмотра — SVG движка схем: им нужны его стили. */
import '@/components/skhemy/skhemy.css';

/**
 * Вкладка «Генератор» задания №18: общий генератор (components/generator/)
 * с конфигом и движком №18 (lib/zadanie18/gen/generator18.ts). Банк задач —
 * со страницы, собран на сервере: условия в KaTeX, ответы и решения закрыты.
 */
export function Generator18({
  temy,
  tipy,
  bank,
  base,
}: {
  temy: Tema18Info[];
  tipy: Tip18Info[];
  bank: Zadacha18[];
  base: string;
}) {
  const config = useMemo(() => config18(temy, tipy, `${base}/generator/`), [temy, tipy, base]);
  const engine = useMemo(() => engine18(config, bank, base), [config, bank, base]);
  return <Generator config={config} engine={engine} />;
}
