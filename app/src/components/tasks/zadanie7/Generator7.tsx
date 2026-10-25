'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import type { GenConfig } from '@/lib/generator/obshchiy/types';
import { engine7 } from '@/lib/zadanie7/engine7';

/**
 * Генератор листов №7 на общем компоненте (components/generator/).
 * Конфиг собран на сервере (lib/zadanie7/generator7.ts); банк задач и
 * решатели грузятся при первой сборке листа.
 */
export function Generator7({ config, base }: { config: GenConfig; base: string }) {
  const engine = useMemo(() => engine7(config, base), [config, base]);
  return <Generator config={config} engine={engine} />;
}
