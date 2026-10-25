/**
 * Место для решения на странице печати раздела (lib/sheet/space.js).
 *
 * Настройка приходит параметром sp= адреса листа ученика (его ставит
 * панель комплекта KitBar). Лист учителя и разбор — без поля всегда,
 * поэтому поле ставится только листу ученика. Для «авто» нужны длины
 * решений учителя — по листу учителя тех же задач (teacher()); строится
 * он, только если настройка «авто» где-то нужна.
 */

import { applySpace, decodeSpace, solutionLengths, type SheetSpace } from '@/lib/sheet/space.js';

/** Настройка из адреса листа. */
export function spaceOfQuery(query: URLSearchParams): SheetSpace {
  return decodeSpace(query.get('sp'));
}

/** Нужны ли длины решений учителя (размер «авто» у листа или номера). */
export function needsLengths(space: SheetSpace): boolean {
  return space.size === 'auto' || Object.values(space.per).includes('auto');
}

/** Лист с полями для решения: только у листа ученика и только по настройке. */
export function sheetWithSpace<T>(
  spec: T,
  space: SheetSpace,
  student: boolean,
  teacher: () => unknown,
): T {
  if (!student || space.mode === 'none') return spec;
  return applySpace(spec, space, {
    lengths: needsLengths(space) ? solutionLengths(teacher()) : null,
  });
}
