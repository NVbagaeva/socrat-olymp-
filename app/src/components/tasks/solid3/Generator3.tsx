'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import { IkonkaTela } from '@/components/stereo/IkonkaTela';
import { config3, engine3 } from '@/lib/zadanie3/gen/generator3';
import type { Razdel3 } from '@/lib/zadanie3/gen/info';
import { zagruzitDannye3 } from '@/lib/zadanie3/gen/params3';

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
  /* Значок раздела — тело в стеклянном круге; неизвестный раздел —
     его римская цифра (IkonkaTela сама). */
  const icons = useMemo(
    () =>
      Object.fromEntries(
        razdely.map((r) => [
          r.id,
          <IkonkaTela key={r.id} vid={r.id} nomer={r.nomer} label={r.nazvanie} />,
        ]),
      ),
    [razdely],
  );
  return <Generator config={config} engine={engine} icons={icons} />;
}
