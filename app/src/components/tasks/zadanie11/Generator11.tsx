'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import { ikonkiTem } from '@/components/generator/IkonkiTem';
import { config11, engine11 } from '@/lib/zadanie11/generator11';
import type { RazdelInfo, UslovieBanka } from '@/lib/zadanie11/trenazher/sessiya';

/**
 * Вкладка «Генератор» задания №11: общий генератор (components/generator/)
 * с конфигом и движком №11 (lib/zadanie11/generator11.ts). Разделы и
 * условия банка без ответов собираются на сборке, лист — в браузере.
 */
export function Generator11({
  razdely,
  bank,
  base,
}: {
  razdely: RazdelInfo[];
  bank: UslovieBanka[];
  base: string;
}) {
  const config = useMemo(() => config11(razdely, base), [razdely, base]);
  const engine = useMemo(
    () => engine11(config, razdely, bank, base),
    [config, razdely, bank, base],
  );
  /* Значки тем — рисунки в стеклянном круге, как у тел №3. */
  const icons = useMemo(() => ikonkiTem('11', config.topics), [config]);
  return <Generator config={config} engine={engine} icons={icons} />;
}
