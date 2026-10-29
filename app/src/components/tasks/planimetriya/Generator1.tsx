'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import { config1, engine1 } from '@/lib/planimetriya/generator1';
import type { RazdelInfo, UslovieBanka } from '@/lib/planimetriya/trenazher/sessiya';
import { IkonkaBloka1 } from './IkonkaBloka1';

/**
 * Вкладка «Генератор» задания №1: общий генератор (components/generator/)
 * с конфигом и движком №1 (lib/planimetriya/generator1.ts). Блоки и
 * условия банка без ответов собираются на сборке, лист и чертежи — в
 * браузере.
 */
export function Generator1({
  razdely,
  bank,
  base,
}: {
  razdely: RazdelInfo[];
  bank: UslovieBanka[];
  base: string;
}) {
  const config = useMemo(() => config1(razdely, base), [razdely, base]);
  const engine = useMemo(() => engine1(config, razdely, bank, base), [config, razdely, bank, base]);
  const icons = useMemo(
    () => Object.fromEntries(razdely.map((r) => [r.id, <IkonkaBloka1 key={r.id} blok={r.id} />])),
    [razdely],
  );
  return <Generator config={config} engine={engine} icons={icons} />;
}
