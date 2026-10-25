'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import { config9, engine9 } from '@/lib/proizvodnaya/generator9';
import { GRUPPY } from '@/lib/proizvodnaya/skills';
import { GroupGlyph } from './GroupGlyph';

/**
 * Вкладка «Генератор» задания №9: общий генератор (components/generator/)
 * с конфигом и движком №9 (lib/proizvodnaya/generator9.ts). Задачи и
 * рисунки считает движок в браузере.
 */
export function Generator9({ base }: { base: string }) {
  const config = useMemo(() => config9(base), [base]);
  const engine = useMemo(() => engine9(config, base), [config, base]);
  const icons = useMemo(
    () => Object.fromEntries(GRUPPY.map((g) => [g.id, <GroupGlyph key={g.id} gruppa={g.id} />])),
    [],
  );
  return <Generator config={config} engine={engine} icons={icons} />;
}
