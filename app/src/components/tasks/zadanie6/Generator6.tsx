'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import type { GenConfig } from '@/lib/generator/obshchiy/types';
import { engine6 } from '@/lib/zadanie6/engine6';

/**
 * Генератор листов №6 на общем компоненте (components/generator/).
 * Конфиг собран на сервере (lib/zadanie6/generator6.ts); банк задач и
 * решатели грузятся при первой сборке листа.
 */
export function Generator6({ config, base }: { config: GenConfig; base: string }) {
  const engine = useMemo(() => engine6(config, base), [config, base]);
  return <Generator config={config} engine={engine} />;
}
