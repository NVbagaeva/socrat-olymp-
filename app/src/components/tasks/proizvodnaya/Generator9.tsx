'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import { ikonkiTem } from '@/components/generator/IkonkiTem';
import { config9, engine9 } from '@/lib/proizvodnaya/generator9';

/**
 * Вкладка «Генератор» задания №9: общий генератор (components/generator/)
 * с конфигом и движком №9 (lib/proizvodnaya/generator9.ts). Задачи и
 * рисунки считает движок в браузере.
 */
export function Generator9({ base }: { base: string }) {
  const config = useMemo(() => config9(base), [base]);
  const engine = useMemo(() => engine9(config, base), [config, base]);
  /* Значки тем — рисунки в стеклянном круге, как у тел №3. */
  const icons = useMemo(() => ikonkiTem('9', config.topics), [config]);
  return <Generator config={config} engine={engine} icons={icons} />;
}
