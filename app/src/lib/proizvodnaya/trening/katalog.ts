/**
 * Каталог тренажёра №9 — на сборке, в браузер уходят только ключи.
 *
 * У №9 задачи строит генератор по прототипу и seed, а проверенные seed
 * уже есть: банк зафиксированных вариантов (lib/proizvodnaya/bank.ts,
 * по 20 на прототип, собирает scripts/build-bank-9.mjs). Каталог
 * общего тренажёра — эти же варианты, ключ задачи «прототип|seed», как
 * у прежнего тренажёра. Генератор и банк не меняются.
 */

import type { KatalogBanka } from '@/lib/trening/bank';
import { BANK } from '../bank';
import { PROTOTYPES } from '../prototypes';

export function katalog9(): KatalogBanka {
  return Object.fromEntries(
    PROTOTYPES.map((p) => {
      const seeds = BANK.find((e) => e.prototype === p.id)?.variants.map((v) => v.seed) ?? [];
      return [p.id, { f: [], a: seeds.map((seed) => `${p.id}|${seed}`) }];
    }),
  );
}
