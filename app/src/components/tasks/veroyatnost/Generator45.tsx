'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import type { GenConfig } from '@/lib/generator/obshchiy/types';
import { engine45 } from '@/lib/veroyatnost/engine45';
import { MetodIkonka } from './MetodIkonka';

/**
 * Генератор листов №4 и №5 на общем компоненте (components/generator/).
 * Конфиг собран на сервере (lib/veroyatnost/generator45.ts); данные
 * задач и разборы грузятся при первой сборке листа.
 */
export function Generator45({
  config,
  base,
  zadanie,
}: {
  config: GenConfig;
  base: string;
  zadanie: 4 | 5;
}) {
  const engine = useMemo(() => engine45(config, base, zadanie), [config, base, zadanie]);
  /* Значки тем — значки методов, те же, что в тренажёре и «Ключевых методах». */
  const icons = useMemo(
    () =>
      Object.fromEntries(
        config.topics.map((t) => [
          t.id,
          <MetodIkonka key={t.id} zadanie={zadanie} metod={t.id} size="sm" />,
        ]),
      ),
    [config, zadanie],
  );
  return <Generator config={config} engine={engine} icons={icons} />;
}
