'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import { config3, engine3 } from '@/lib/zadanie3/gen/generator3';
import type { Razdel3 } from '@/lib/zadanie3/gen/info';
import { zagruzitDannye3 } from '@/lib/zadanie3/gen/list3';

/**
 * Вкладка «Генератор» задания №3: общий генератор (components/generator/)
 * с конфигом и движком №3 (lib/zadanie3/gen/generator3.ts). Разделы и
 * прототипы собираются на сборке; задачи, чертежи и лист — в браузере,
 * по первому «Сгенерировать».
 */
export function Generator3({ razdely, base }: { razdely: Razdel3[]; base: string }) {
  const config = useMemo(() => config3(razdely, `${base}/generator/`), [razdely, base]);
  const engine = useMemo(
    () => engine3(config, razdely, base, zagruzitDannye3),
    [config, razdely, base],
  );
  return <Generator config={config} engine={engine} />;
}
