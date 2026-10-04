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
  /* Подпись типа начинается с формулы функции «y = …»: так тип узнаётся
     по записи. Дробь в подписи крупнее обычной строчной — правило
     .type-label в styles/base.css (и в lib/sheet/sheet.css для листов):
     на телефоне числитель и знаменатель \frac иначе слишком мелкие.
     Внутри себя формула не переносится — правило .katex-html там же. */
  '12.A': '$y = kx + b$: значение функции',
  '12.B': '$y = kx + b$: аргумент по значению',
  '12.C': '$y = kx + b$: абсцисса пересечения двух прямых',
  '12.D': '$y = kx + b$: ордината пересечения двух прямых',
  '12Q.A': '$y = ax^2 + bx + c$: знак коэффициента $a$',
  '12Q.B': '$y = ax^2 + bx + c$: значение коэффициента $a$',
  '12Q.C': '$y = ax^2 + bx + c$: свободный член $c$',
  '12Q.D': '$y = ax^2 + bx + c$: коэффициент $b$',
  '12Q.E': '$y = ax^2 + bx + c$: значение функции',
  '12Q.F': '$y = ax^2 + bx + c$: аргумент по значению',
  '12Q.G': '$y = ax^2 + bx + c$: формула по графику',
  '12Q.H': '$y = ax^2 + bx + c$ и прямая: вторая точка пересечения',
  '12Q.I': '$y = ax^2 + bx + c$ и парабола: вторая точка пересечения',
  '12R.A': '$y = \\frac{k}{x} + a$: значение функции',
  '12R.B': '$y = \\frac{k}{x} + a$: аргумент по значению',
  '12R.C': '$y = \\frac{k}{x + a}$: значение функции',
  '12R.D': '$y = \\frac{k}{x + a}$: аргумент по значению',
  '12R.E': '$y = \\frac{kx + a}{x + b}$: коэффициент $k$',
  '12R.F': '$y = \\frac{kx + a}{x + b}$: коэффициент $a$',
  '12R.G': '$y = \\frac{k}{x}$ и $y = ax + b$: абсцисса точки $B$',
  '12R.H': '$y = \\frac{k}{x}$ и $y = ax + b$: ордината точки $B$',
  '12R.I': '$y = \\frac{k}{x}$: значение и аргумент',
  '12R.J': '$y = \\frac{kx + a}{x + b}$: коэффициент $b$ и значение',
};

export type SkillLevelId = 'lucky' | 'unlucky';

export interface SkillLevel {
  /** Значение поля level у задач набора. */
  id: SkillLevelId;
  title: string;
  /** Подпись; формулы в ней — $…$. */
  lead: string;
  /** Подпись, набранная KaTeX на сервере (levelsHtml). */
  leadHtml?: string;
}

/** Уровни в порядке показа. Показываются только те, что есть у набора. */
export const skillLevels: SkillLevel[] = [
  { id: 'lucky', title: 'Базовая', lead: '$b$ читается с графика' },
  { id: 'unlucky', title: 'Повышенная', lead: '$b$ нужно вычислить' },
];

/* У параболы читается с чертежа не b, а то, что спрашивают: знак
   старшего коэффициента, свободный член, вершина. Подпись уровня
   про «b» здесь была бы просто неверной. */
const QUADRATIC_LEVELS: SkillLevel[] = [
  { id: 'lucky', title: 'Базовая', lead: 'ответ читается с чертежа' },
  { id: 'unlucky', title: 'Повышенная', lead: 'ответ нужно вычислить' },
];

/* У гиперболы уровни различаются числами: целые аргументы и ответы
   против десятичных и смешанных дробей. */
const RATIONAL_LEVELS: SkillLevel[] = [
  { id: 'lucky', title: 'Базовая', lead: 'целые числа' },
  { id: 'unlucky', title: 'Повышенная', lead: 'дроби и подстановка' },
];

/** Уровни подтемы: у квадратичной и гиперболы свои подписи. */
export function skillLevelsFor(type: string): SkillLevel[] {
  if (type === 'rational') {
    return RATIONAL_LEVELS;
  }
  return type === 'quadratic' ? QUADRATIC_LEVELS : skillLevels;
}

/** Первый уровень из списка показа, который есть у набора. */
export function firstLevel(levels: string[]): SkillLevelId | null {
  return skillLevels.find((level) => levels.includes(level.id))?.id ?? null;
}

/** Количество заданий. null — «Все»: число берётся из манифеста. */
export const skillCounts: (number | null)[] = [5, 10, 20, null];

/**
 * Уровни с подписями, набранными KaTeX. Зовёт серверная часть вкладки
 * (TrainerShell, GeneratorTab): конфигуратор — клиентский экран.
 */
export function levelsWithHtml(levels: SkillLevel[], typeset: (text: string) => string): SkillLevel[] {
  return levels.map((level) => ({ ...level, leadHtml: typeset(level.lead) }));
}
