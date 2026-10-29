'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import { ikonkiTem } from '@/components/generator/IkonkiTem';
import { RazdelIkonka } from '@/components/tasks/razdely/RazdelIkonka';
import type { IkonkaRazdela } from '@/components/tasks/razdely/types';
import type { GenConfig } from '@/lib/generator/obshchiy/types';
import { engine12 } from '@/lib/ves12/engine12';

export interface Generator12Props {
  /** Конфиг, собранный на сервере (lib/ves12/generator12.ts). */
  config: GenConfig;
  /** Адрес, под которым лежат страницы печати: …/pechat/. */
  base: string;
  /** Адрес экрана генератора до строки параметров: «…/?vkladka=generator&». */
  ekran: string;
  /** Иконки типов функций — иконки подтем раздела. */
  ikonki: Record<string, IkonkaRazdela | undefined>;
}

/**
 * Генератор №12 на общем компоненте (components/generator/): вкладка
 * подтемы и генератор по всем типам. Задачи и рисунки считает движок
 * graph/ в браузере, он грузится при сборке листа.
 */
export function Generator12({ config, base, ekran, ikonki }: Generator12Props) {
  const engine = useMemo(
    () => engine12(config, base, (q) => `${ekran}${q}`),
    [config, base, ekran],
  );
  const icons = useMemo(
    () => ({
      /* Плитка раздела — запасной значок; у типов функций — рисунок
         в стеклянном круге, как у тел №3. */
      ...Object.fromEntries(
        Object.entries(ikonki).map(([id, icon]) => [
          id,
          <RazdelIkonka key={id} icon={icon} sizes="36px" className="gen-z12-ikonka" />,
        ]),
      ),
      ...ikonkiTem('12', config.topics),
    }),
    [ikonki, config],
  );
  return <Generator config={config} engine={engine} icons={icons} />;
}
