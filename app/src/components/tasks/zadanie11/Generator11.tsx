'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import { config11, engine11 } from '@/lib/zadanie11/generator11';
import type { RazdelInfo, UslovieBanka } from '@/lib/zadanie11/trenazher/sessiya';
import type { SectionId } from '@/lib/zadanie11/types';
import { IkonkaRazdela } from './Piktogrammy';

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
  const icons = useMemo(
    () =>
      Object.fromEntries(
        razdely.map((r) => [
          r.id,
          <IkonkaRazdela key={r.id} section={r.id as SectionId} className="gen-z11-ikonka" />,
        ]),
      ),
    [razdely],
  );
  return <Generator config={config} engine={engine} icons={icons} />;
}
