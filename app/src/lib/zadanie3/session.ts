/**
 * Тренировка тренажёра задания №3 в том виде, в каком она лежит в
 * сохранённой сессии.
 *
 * Задания и чертежи в запись не попадают: они живут в статическом
 * банке (pool.ts), а в сессии — только ссылки на него, «прототип и
 * номер варианта». Первые `size` ссылок — подход в порядке показа
 * на момент старта. За ними идут запасные: все варианты тех же
 * прототипов, из них берётся замена для «Ещё один вариант». Так
 * замена — это новый индекс пула в раскладке экрана, и после
 * возвращения в тренировку на месте оказывается то же задание.
 */

import { isRecord } from '../trainerSession/restore';
import type { PoolKind } from './pool';
import type { RoundItem } from './podhod';

export interface Solid3Payload {
  /** Подход, затем запасные варианты тех же прототипов. */
  pool: RoundItem[];
  /** Сколько первых ссылок пула — задания подхода. */
  size: number;
}

/** Пул тренировки из готового подхода: сам подход и запасные. */
export function makeSolid3Payload(
  items: RoundItem[],
  byId: ReadonlyMap<string, PoolKind>,
): Solid3Payload {
  const spare: RoundItem[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const kind = byId.get(item.kind);
    if (kind === undefined || seen.has(item.kind)) {
      continue;
    }
    seen.add(item.kind);
    kind.variants.forEach((variant) => spare.push({ kind: kind.id, n: variant.n }));
  }
  return { pool: [...items, ...spare], size: items.length };
}

function isItem(value: unknown): value is RoundItem {
  return (
    isRecord(value) &&
    typeof value['kind'] === 'string' &&
    typeof value['n'] === 'number' &&
    Number.isInteger(value['n'])
  );
}

/**
 * Проверка формата при чтении из хранилища. Задания, которых уже нет
 * в банке (сайт обновился), считаются повреждением: тренировка
 * сбрасывается, а не падает на пустом месте.
 */
export function isSolid3Payload(
  value: unknown,
  byId: ReadonlyMap<string, PoolKind>,
): value is Solid3Payload {
  if (
    !isRecord(value) ||
    !Array.isArray(value['pool']) ||
    typeof value['size'] !== 'number' ||
    !Number.isInteger(value['size'])
  ) {
    return false;
  }
  const size = value['size'];
  const pool: unknown[] = value['pool'];
  return (
    size > 0 &&
    size <= pool.length &&
    pool.every(
      (item) =>
        isItem(item) && byId.get(item.kind)?.variants.some((variant) => variant.n === item.n) === true,
    )
  );
}

/**
 * Куда заменить задание: индекс запасного варианта того же прототипа,
 * который ещё не стоит в подходе и не равен нынешнему. null — менять
 * не на что.
 */
export function spareFor(
  payload: Solid3Payload,
  order: readonly number[],
  at: number,
  random: () => number,
): number | null {
  const current = payload.pool[order[at] ?? -1];
  if (current === undefined) {
    return null;
  }
  const used = new Set(order);
  const free: number[] = [];
  for (let i = payload.size; i < payload.pool.length; i += 1) {
    const item = payload.pool[i] as RoundItem;
    if (item.kind === current.kind && item.n !== current.n && !used.has(i)) {
      free.push(i);
    }
  }
  return free.length === 0 ? null : (free[Math.floor(random() * free.length)] ?? null);
}
