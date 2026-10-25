/**
 * Место для решения на странице печати раздела (lib/sheet/space.js).
 *
 * Настройка приходит параметром sp= адреса листа ученика (его ставит
 * общий генератор, components/generator). Лист учителя и разбор — без поля всегда,
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

interface VseTask {
  space?: unknown;
  solutionHtml?: string | null;
}
interface VseVariant {
  blocks: { tasks?: VseTask[] }[];
}

/**
 * «Всё одним файлом»: первая половина вариантов — листы ученика, вторая
 * — листы учителя тех же задач. Поле ставится только листам ученика;
 * строка ответа у них лежит в solutionHtml — с полем она уходит под
 * поле (answerLine), как на отдельном листе ученика.
 */
export function vseWithSpace<T extends object>(spec: T, space: SheetSpace): T {
  const all = (spec as { variants?: VseVariant[] }).variants ?? [];
  if (space.mode === 'none' || all.length === 0 || all.length % 2 !== 0) return spec;
  const uchenik = all.slice(0, all.length / 2);
  const uchitel = all.slice(all.length / 2);
  const marked = applySpace({ variants: uchenik }, space, {
    lengths: needsLengths(space) ? solutionLengths({ variants: uchitel }) : null,
  }).variants.map((v) => ({
    ...v,
    blocks: v.blocks.map((b) =>
      b.tasks === undefined
        ? b
        : {
            ...b,
            tasks: b.tasks.map((t) =>
              t.space === undefined ? t : { ...t, solutionHtml: null, answerLine: true },
            ),
          },
    ),
  }));
  return { ...spec, variants: [...marked, ...uchitel] };
}
