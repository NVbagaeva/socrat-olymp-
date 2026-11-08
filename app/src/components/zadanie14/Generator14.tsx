'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import type { GenConfig } from '@/lib/generator/obshchiy/types';
import { engine14 } from '@/lib/zadanie14/generator14';

/**
 * Генератор листов №14 на общем компоненте: фильтры по методам, живой
 * предпросмотр, клетка или без, лист ученика и лист учителя из одного
 * набора. Конфиг — lib/zadanie14/generator14.ts.
 */
export function Generator14({ config }: { config: GenConfig }) {
  const engine = useMemo(() => engine14(config), [config]);
  return <Generator config={config} engine={engine} />;
}
