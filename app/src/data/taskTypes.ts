/**
 * Четыре типа заданий №12. Общие для всех типов функций: меняется
 * формула, а вопрос остаётся одним из этих четырёх.
 *
 * Названия и описания заданы автором. Примеров условий здесь нет:
 * условия приходят из данных движка graph/.
 */

export type TaskTypeId = 'find-value' | 'find-argument' | 'find-abscissa' | 'find-ordinate';

export interface TaskType {
  id: TaskTypeId;
  /** Номер на карточке: 01 … 04. */
  no: string;
  title: string;
  /** Короткая подпись для фильтров тренажёра. */
  shortTitle: string;
  description: string;
}

export const taskTypes: TaskType[] = [
  {
    id: 'find-value',
    no: '01',
    title: 'Найти значение функции',
    shortTitle: 'Найти y',
    description: 'Найти y, если известен x.',
  },
  {
    id: 'find-argument',
    no: '02',
    title: 'Найти аргумент',
    shortTitle: 'Найти x',
    description: 'Найти x, если известно y.',
  },
  {
    id: 'find-abscissa',
    no: '03',
    title: 'Найти абсциссу точки пересечения',
    shortTitle: 'Абсцисса',
    description: 'Найти x точки пересечения графиков функций.',
  },
  {
    id: 'find-ordinate',
    no: '04',
    title: 'Найти ординату точки пересечения',
    shortTitle: 'Ордината',
    description: 'Найти y точки пересечения графиков функций.',
  },
];

export function findTaskType(id: string): TaskType | undefined {
  return taskTypes.find((type) => type.id === id);
}
