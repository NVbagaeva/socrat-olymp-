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
  '12Q.A': 'Знак коэффициента a',
  '12Q.B': 'Значение коэффициента a',
  '12Q.C': 'Свободный член c',
  '12Q.D': 'Коэффициент b',
  '12Q.E': 'Значение функции',
  '12Q.F': 'Аргумент по значению',
  '12Q.G': 'Формула по графику',
  '12Q.H': 'Парабола и прямая',
  '12Q.I': 'Парабола и парабола',
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

/* У параболы читается с чертежа не b, а то, что спрашивают: знак
   старшего коэффициента, свободный член, вершина. Подпись уровня
   про «b» здесь была бы просто неверной. */
const QUADRATIC_LEVELS: SkillLevel[] = [
  { id: 'lucky', title: 'Базовая', lead: 'ответ читается с чертежа' },
  { id: 'unlucky', title: 'Повышенная', lead: 'ответ нужно вычислить' },
];

/** Уровни подтемы: у квадратичной свои подписи. */
export function skillLevelsFor(type: string): SkillLevel[] {
  return type === 'quadratic' ? QUADRATIC_LEVELS : skillLevels;
}

/** Первый уровень из списка показа, который есть у набора. */
export function firstLevel(levels: string[]): SkillLevelId | null {
  return skillLevels.find((level) => levels.includes(level.id))?.id ?? null;
}

/** Количество заданий. null — «Все»: число берётся из манифеста. */
export const skillCounts: (number | null)[] = [5, 10, 20, null];
