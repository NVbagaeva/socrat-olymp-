/**
 * Каталог тренажёра: у каждого типа — по 20 задач с ключами «P01|k1» …
 * «P01|k20». Задачи строит генератор в браузере по ключу (как у №9);
 * самотест (pnpm test:naibolshee) проверяет каждую задачу каталога.
 */

import type { KatalogBanka } from '@/lib/trening/bank';
import { PROTOTYPES } from '../prototypes';
import { klyuchiTipa } from '../zadacha';

export function katalog21(): KatalogBanka {
  return Object.fromEntries(PROTOTYPES.map((p) => [p.id, { f: [], a: klyuchiTipa(p.id) }]));
}
