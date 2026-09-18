/**
 * Навыки задания №12 — наборы прототипов движка graph/ (12.A … 12.D).
 *
 * Навык — это набор: что есть в данных, то и навык. Здесь только
 * человеческие названия к идентификаторам наборов и уровней: числа,
 * состав и уровни считает манифест (lib/generator/manifest.ts), и
 * руками они нигде не повторяются. Список общий для тренажёра и
 * генератора печати.
 */

/** Название навыка по идентификатору набора движка. */
export const skillTitle: Record<string, string> = {
  '12.A': 'Значение функции',
  '12.B': 'Аргумент по значению',
  '12.C': 'Абсцисса пересечения',
  '12.D': 'Ордината пересечения',
};

export type SkillLevelId = 'lucky' | 'unlucky';

export interface SkillLevel {
  /** Значение поля level у задач набора. */
  id: SkillLevelId;
  title: string;
  lead: string;
}

/** Уровни в порядке показа. Показываются только те, что есть у набора. */
export const skillLevels: SkillLevel[] = [
  { id: 'lucky', title: 'Базовая', lead: 'b читается с графика' },
  { id: 'unlucky', title: 'Повышенная', lead: 'b нужно вычислить' },
];

/** Первый уровень из списка показа, который есть у набора. */
export function firstLevel(levels: string[]): SkillLevelId | null {
  return skillLevels.find((level) => levels.includes(level.id))?.id ?? null;
}

/** Количество заданий. null — «Все»: число берётся из манифеста. */
export const skillCounts: (number | null)[] = [5, 10, 20, null];
