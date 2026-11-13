/**
 * Каталог задач тренажёра №1 для браузера: прототип → ключи задач
 * открытого банка (`f`) и аналогов (`a`), без условий и ответов.
 * Собирается на сборке; задачи строит движок в браузере (sborka.ts).
 */

import type { KatalogBanka } from '../../trening/bank';
import { analogi } from '../bank/analogi';
import { zadachiPrototipa } from '../bank/fipi';
import { PROTOTIPY } from '../stseny';
import { klyuchProto, nomerAnaloga } from '../trenazher/sessiya';

export function katalog1(): KatalogBanka {
  return Object.fromEntries(
    PROTOTIPY.map((p) => {
      const k = klyuchProto(p.id);
      return [
        k,
        {
          f: zadachiPrototipa(p.id).map((z) => `${k}|b${z.n}`),
          a: analogi(p.id).map((a) => `${k}|a${nomerAnaloga(p.id, a.no)}`),
        },
      ];
    }),
  );
}
