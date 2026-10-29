'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import { ikonkiTem } from '@/components/generator/IkonkiTem';
import { config13, engine13 } from '@/lib/zadanie13/gen/generator13';

/**
 * Генератор №13 на общем компоненте (components/generator): типы
 * задач — темы, прототипы — подтипы. Лист ученика, лист учителя и
 * онлайн-набор строятся из одного адреса; QR ведёт в онлайн-набор.
 */
export function Generator13() {
  const config = useMemo(() => config13(), []);
  const engine = useMemo(() => engine13(config), [config]);
  /* Значки тем — рисунки в стеклянном круге, как у тел №3. */
  const icons = useMemo(() => ikonkiTem('13', config.topics), [config]);
  return <Generator config={config} engine={engine} icons={icons} />;
}
