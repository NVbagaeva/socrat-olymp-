'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import { ikonkiTem } from '@/components/generator/IkonkiTem';
import { config2, engine2 } from '@/lib/vektory/generator2';

/**
 * Вкладка «Генератор» задания №2: общий генератор (components/generator/)
 * с конфигом и движком №2 (lib/vektory/generator2.ts). Задачи и рисунки
 * считает движок в браузере.
 */
export function Generator2({ base }: { base: string }) {
  const config = useMemo(() => config2(base), [base]);
  const engine = useMemo(() => engine2(config, base), [config, base]);
  /* Значки тем — рисунки в стеклянном круге, как у тел №3. */
  const icons = useMemo(() => ikonkiTem('2', config.topics), [config]);
  return <Generator config={config} engine={engine} icons={icons} />;
}
