/**
 * Рисунки к задачам задания №5 — сборщики поверх модели.
 *
 * Дерево вероятностей, таблица 5×5 для условной вероятности, сетка
 * удобного числа и «рисунка нет» для формульных задач. Подсветка
 * возвращается отдельно от параметров: она уезжает только вместе с
 * решением (см. model.ts).
 */

import type { ParametryDereva, Vizual } from '../model';

export type Vetv = ParametryDereva['branches'][number];

/** Дерево: уровни, ветви и подходящие листья. */
export function derevo(levels: string[], branches: Vetv[], podhodyat: string[]): Vizual {
  return {
    parametry: { method: 'probability-tree', levels, branches },
    podsvetka: { method: 'probability-tree', highlightedPaths: podhodyat },
  };
}

/** Двухуровневое дерево из двух независимых испытаний с одинаковыми исходами. */
export function derevoDvuh(
  levels: [string, string],
  ishody: readonly { id: string; label: string; p1: number; p2: number }[],
  podhodyat: string[],
): Vizual {
  const branches: Vetv[] = [];
  for (const a of ishody) {
    branches.push({ id: a.id, parent: null, label: a.label, p: a.p1 });
  }
  for (const a of ishody) {
    for (const b of ishody) {
      branches.push({ id: a.id + b.id, parent: a.id, label: b.label, p: b.p2 });
    }
  }
  return derevo(levels, branches, podhodyat);
}

/** Сетка удобного числа: группы по порядку, искомые — по индексам. */
export function setka(
  baseNumber: 100 | 1000 | 10000,
  groups: { label: string; share: number; tone?: 'soft' | 'mid' | 'strong' }[],
  iskomye: number[],
  unit?: string,
): Vizual {
  const [pervaya] = iskomye;
  if (pervaya === undefined) {
    throw new Error('Сетке нужна хотя бы одна искомая группа');
  }
  return {
    parametry: {
      method: 'convenient-number',
      baseNumber,
      groups,
      ...(unit === undefined ? {} : { unit }),
    },
    podsvetka: {
      method: 'convenient-number',
      highlightedGroup: pervaya,
      ...(iskomye.length > 1 ? { highlightedGroups: iskomye } : {}),
    },
  };
}

/** Кость дважды без одной грани: таблица 5×5 сумм, благоприятны клетки с суммой s. */
export function tablitsaBezGrani(zapret: number, s: number): Vizual {
  const grani = [1, 2, 3, 4, 5, 6].filter((g) => g !== zapret);
  const cells: string[][] = [];
  const favorableCells: [number, number][] = [];
  grani.forEach((a, r) => {
    const ryad: string[] = [];
    grani.forEach((b, c) => {
      ryad.push(String(a + b));
      if (a + b === s) {
        favorableCells.push([r, c]);
      }
    });
    cells.push(ryad);
  });
  const labels = grani.map(String);
  return {
    parametry: {
      method: 'outcome-table',
      rows: 5,
      columns: 5,
      rowLabels: labels,
      columnLabels: labels,
      rowTitle: '1-й бросок',
      columnTitle: '2-й бросок',
      cells,
    },
    podsvetka: { method: 'outcome-table', favorableCells },
  };
}

/** Формульная задача: рисунка нет. */
export function bezRisunka(): Vizual {
  return { parametry: { method: 'formula' }, podsvetka: { method: 'formula' } };
}
