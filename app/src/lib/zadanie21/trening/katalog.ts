/**
 * Каталог тренажёра: у каждого типа — по 20 задач генератора с ключами
 * «P01|k1» … «P01|k20» и фиксированные задачи (sbornik.ts): задачи с
 * заданными числами — в `f`, подобранные к ним — в `a` вместе с
 * генераторными. Задачи строит генератор в браузере по ключу (как у
 * №9); самотест (pnpm test:naibolshee) проверяет каждую задачу каталога.
 */

import type { KatalogBanka } from '@/lib/trening/bank';
import { PROTOTYPES } from '../prototypes';
import { FIKSIROVANNYE21, klyuchiTipa } from '../zadacha';

export function katalog21(): KatalogBanka {
  return Object.fromEntries(
    PROTOTYPES.map((p) => {
      const svoi = FIKSIROVANNYE21.filter((z) => z.p === p.id);
      return [
        p.id,
        {
          f: svoi.filter((z) => !z.podobrannaya).map((z) => z.klyuch),
          a: [...klyuchiTipa(p.id), ...svoi.filter((z) => z.podobrannaya).map((z) => z.klyuch)],
        },
      ];
    }),
  );
}
