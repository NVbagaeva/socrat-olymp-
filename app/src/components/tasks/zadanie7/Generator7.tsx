'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import { ikonkiTem } from '@/components/generator/IkonkiTem';
import type { GenConfig } from '@/lib/generator/obshchiy/types';
import { engine7 } from '@/lib/zadanie7/engine7';

/**
 * Генератор листов №7 на общем компоненте (components/generator/).
 * Конфиг собран на сервере (lib/zadanie7/generator7.ts); банк задач и
 * решатели грузятся при первой сборке листа.
 */
export function Generator7({ config, base }: { config: GenConfig; base: string }) {
  const engine = useMemo(() => engine7(config, base), [config, base]);
  /* Значки тем — рисунки в стеклянном круге, как у тел №3. */
  const icons = useMemo(() => ikonkiTem('7', config.topics), [config]);
  return <Generator config={config} engine={engine} icons={icons} />;
}
