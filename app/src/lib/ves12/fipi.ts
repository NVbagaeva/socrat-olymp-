/**
 * Что считать задачей открытого банка ФИПИ.
 *
 * В наборах показательной, логарифмической и тригонометрических функций
 * у каждой задачи есть поле source: задачи банка — source: 'fipi',
 * дословно, аналоги без него и подписаны «не из открытого банка».
 * У линейной функции поля нет, а весь набор «соответствует открытому
 * банку ФИПИ»: это прототипы банка, числа в них новые. У параболы,
 * гиперболы и корня наборы — собственный материал платформы, задач
 * банка в них нет.
 */

export interface RawTask {
  id: string;
  source?: string;
  question?: string;
  constraints?: unknown;
}

export interface RawSet {
  id: string;
  note?: string;
  tasks: RawTask[];
}

/** Весь набор — прототипы банка (поля source у задач нет). */
function wholeSetFipi(set: RawSet): boolean {
  return (
    !set.tasks.some((task) => task.source !== undefined) &&
    /^Соответствует открытому банку/.test(set.note ?? '')
  );
}

/**
 * Сколько РАЗНЫХ задач банка в наборе. В банке встречаются совпадающие
 * задачи (логарифмическая, №4 и №5: один рисунок, один вопрос) — для
 * работы это одна задача. null — все задачи набора из банка, а числа в
 * них движок даёт каждый раз новые: задач «сколько угодно».
 */
export function fipiOfSet(set: RawSet): number | null {
  if (wholeSetFipi(set)) {
    return null;
  }
  const distinct = new Set(
    set.tasks
      .filter((task) => task.source === 'fipi')
      .map((task) => JSON.stringify([task.question ?? '', task.constraints ?? null])),
  );
  return distinct.size;
}

/** Задача из открытого банка ФИПИ. */
export function isFipiTask(set: RawSet, taskId: string): boolean {
  if (wholeSetFipi(set)) {
    return true;
  }
  return set.tasks.some((task) => task.id === taskId && task.source === 'fipi');
}
