/**
 * Тренировка прежнего тренажёра задания №3 в том виде, в каком она
 * лежит в сохранённой сессии. Новый тренажёр на общей панели фильтров
 * (components/tasks/solid3/Trenazher3.tsx) переводит её в свою запись.
 *
 * В записи — только ссылки на банк, «прототип и номер варианта»:
 * первые `size` — подход в порядке показа, за ними запасные варианты
 * тех же прототипов (на них ссылается раскладка экрана после замены
 * варианта).
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
        isItem(item) &&
        byId.get(item.kind)?.variants.some((variant) => variant.n === item.n) === true,
    )
  );
}
