'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import { Znak, type Ton } from '@/components/tasks/steklo';
import { engineBazy } from '@/lib/baza/engineBazy';
import type { GenConfig } from '@/lib/generator/obshchiy/types';
import './generatorBazy.css';

/**
 * Генератор листов задания базы на общем компоненте
 * (components/generator/): один на все разделы базы с банком. Конфиг
 * собран на сервере (lib/baza/generatorBazy.ts); банк раздела и решатели
 * грузятся при первой сборке листа. Значки тем — знаки групп, как в
 * выборе тем тренажёра.
 */
export function GeneratorBazy({
  config,
  base,
  ekran,
  znaki,
}: {
  config: GenConfig;
  /** Адрес раздела: «/baza/zadaniya/12». */
  base: string;
  /** Адрес вкладки генератора. */
  ekran: string;
  /** Знак группы (HTML KaTeX) и тон — по id темы. */
  znaki: Record<string, { html: string; ton: Ton }>;
}) {
  const engine = useMemo(() => engineBazy(config, base, ekran), [config, base, ekran]);
  const icons = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(znaki).map(([id, z]) => [
          id,
          <Znak key={id} html={z.html} ton={z.ton} size="sm" className="baza-gen-znak" />,
        ]),
      ),
    [znaki],
  );
  return <Generator config={config} engine={engine} icons={icons} />;
}
