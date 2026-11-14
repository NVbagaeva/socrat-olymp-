'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import { config21, engine21 } from '@/lib/zadanie21/generator21';

/**
 * Вкладка «Генератор»: общий генератор (components/generator/) с
 * конфигом и движком раздела (lib/zadanie21/generator21.ts). Задачи
 * считает движок в браузере.
 */
export function Generator21({ base }: { base: string }) {
  const config = useMemo(() => config21(base), [base]);
  const engine = useMemo(() => engine21(config, base), [config, base]);
  return <Generator config={config} engine={engine} icons={{}} />;
}
