/**
 * Каталог банка №4 и №5 для тренажёра «Стеклянной сцены»: прототип →
 * ключи задач («p4-07:3» — прототип и номер варианта). Собирается на
 * сборке из банка (lib/veroyatnost) и уезжает в браузер без условий и
 * ответов: условия, отпечатки и картинки идут отдельно, банком страницы
 * (pool.ts, bezRazborov), как и раньше.
 *
 * Варианты сборника — `f` (переключатель «Из сборника»), новые и с урока
 * — `a` («Новые»): так общая сборка тренировок (lib/trening/bank.ts)
 * делит источник задач.
 */

import type { KatalogBanka } from '@/lib/trening/bank';
import { BANK_4, BANK_5 } from '../index';
import type { Zadanie45 } from './links';

/** Ключ задачи: прототип и номер варианта — тот же, что в журнале и списке ошибок. */
export function klyuch45(prototip: string, n: number): string {
  return `${prototip}:${n}`;
}

export function katalog45(z: Zadanie45): KatalogBanka {
  const bank = z === 4 ? BANK_4 : BANK_5;
  return Object.fromEntries(
    bank.map((p) => [
      p.id,
      {
        f: p.varianty.filter((v) => v.source === 'sbornik').map((v) => klyuch45(p.id, v.n)),
        a: p.varianty.filter((v) => v.source !== 'sbornik').map((v) => klyuch45(p.id, v.n)),
      },
    ]),
  );
}
