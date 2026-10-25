'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import type { GenConfig } from '@/lib/generator/obshchiy/types';
import { engine10 } from '@/lib/zadanie10/engine10';
import type { IllInfo } from './Zadacha10';

/**
 * Генератор листов №10 на общем компоненте (components/generator/).
 * Конфиг собран на сервере (lib/zadanie10/generator10.ts); банк задач и
 * решатели грузятся при первой сборке листа. ill — картинки сюжетов для
 * предпросмотра (переключатель «Картинки сюжетов» в «Дополнительно»).
 */
export function Generator10({
  config,
  base,
  ill,
}: {
  config: GenConfig;
  base: string;
  ill: Record<string, IllInfo>;
}) {
  const engine = useMemo(() => engine10(config, base, ill), [config, base, ill]);
  return <Generator config={config} engine={engine} />;
}
