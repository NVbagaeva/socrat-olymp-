/**
 * Каталог тренажёра №2 — на сборке, в браузер уходят только ключи.
 *
 * У №2 нет банка задач: задачу строит генератор по прототипу и seed.
 * Чтобы тренажёр работал как у остальных разделов (нерешённые раньше
 * решённых, «Похожая задача», «Работа над ошибками»), у каждого типа
 * есть список из 50 seed «k01»…: каждый проверен генератором, задачи
 * в списке разные (по подписи набора векторов). Генератор и его
 * логика не меняются.
 */

import type { KatalogBanka } from '@/lib/trening/bank';
import { generate } from '../generate';
import { PROTOTYPES } from '../prototypes';

export const ZADACH_NA_TIP = 50;
/** Сколько seed пробовать на тип, пока не наберётся 50 разных задач. */
const POPYTOK = 400;

export function katalog2(): KatalogBanka {
  return Object.fromEntries(
    PROTOTYPES.map((p) => {
      const seen = new Set<string>();
      const ids: string[] = [];
      for (let n = 1; n <= POPYTOK && ids.length < ZADACH_NA_TIP; n += 1) {
        const seed = `k${String(n).padStart(2, '0')}`;
        try {
          const task = generate(p.id, seed);
          if (!seen.has(task.signature)) {
            seen.add(task.signature);
            ids.push(`${p.id}|${seed}`);
          }
        } catch {
          /* Генератор не подобрал параметры на этом seed — следующий. */
        }
      }
      return [p.id, { f: [], a: ids }];
    }),
  );
}
