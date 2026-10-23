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
  '12Q.A': 'Знак коэффициента $a$',
  '12Q.B': 'Значение коэффициента $a$',
  '12Q.C': 'Свободный член $c$',
  '12Q.D': 'Коэффициент $b$',
  '12Q.E': 'Значение функции',
  '12Q.F': 'Аргумент по значению',
  '12Q.G': 'Формула по графику',
  '12Q.H': 'Парабола и прямая',
  '12Q.I': 'Парабола и парабола',
  '12R.A': '$\\frac{k}{x} + a$: значение функции',
  '12R.B': '$\\frac{k}{x} + a$: аргумент по значению',
  '12R.C': '$\\frac{k}{x + a}$: значение функции',
  '12R.D': '$\\frac{k}{x + a}$: аргумент по значению',
  '12R.E': '$\\frac{kx + a}{x + b}$: коэффициент $k$',
  '12R.F': '$\\frac{kx + a}{x + b}$: коэффициент $a$',
  '12R.G': 'Гипербола и прямая: абсцисса $B$',
  '12R.H': 'Гипербола и прямая: ордината $B$',
  '12R.I': '$\\frac{k}{x}$: значение и аргумент',
  '12R.J': '$\\frac{kx + a}{x + b}$: $b$ и значение',
  '12S.A': 'Значение функции',
  '12S.B': 'Аргумент по значению',
  '12S.C': 'Корень и прямая: абсцисса $B$',
  '12S.D': 'Корень и прямая: ордината $B$',
  '12E.A': '$a^x$: значение функции',
  '12E.B': '$a^x + b$: значение функции',
  '12E.C': '$a^x + b$: аргумент по значению',
  '12E.D': '$a^{x+b}$: аргумент по значению',
  '12L.A': '$\\log_a x$: значение функции',
  '12L.B': '$b + \\log_a x$: значение функции',
  '12L.C': '$b + \\log_a x$: аргумент по значению',
  '12L.D': '$\\log_a(x + b)$: значение функции',
  '12L.E': '$\\log_a(x + b)$: аргумент по значению',
  '12T.A': '$a\\cos x + b$: найти $a$',
  '12T.B': '$a\\cos x + b$: найти $b$',
  '12T.C': '$a\\operatorname{tg} x + b$: найти $a$',
  '12T.D': '$a\\operatorname{tg} x + b$: найти $b$',
  '12T.E': '$a\\sin x + b$: найти $a$',
  '12T.F': '$a\\sin x + b$: найти $b$',
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

/* У графика корня: под корнем целый квадрат против десятичного,
   ответ целый против дробного. */
const IRRATIONAL_LEVELS: SkillLevel[] = [
  { id: 'lucky', title: 'Базовая', lead: 'целые числа' },
  { id: 'unlucky', title: 'Повышенная', lead: 'десятичные дроби' },
];

/* У показательной: основание целое или 1/n, одна из точек — (0; 1 + b),
   ответ целый — против дробного ответа, «дальних» точек и √2 в основании. */
const EXPONENTIAL_LEVELS: SkillLevel[] = [
  { id: 'lucky', title: 'Базовая', lead: 'целое основание, целый ответ' },
  { id: 'unlucky', title: 'Повышенная', lead: 'дробный ответ, корень в основании' },
];

/* У логарифмической: соседние точки и целый ответ — против дробного
   ответа и «дальних» точек. */
const LOGARITHMIC_LEVELS: SkillLevel[] = [
  { id: 'lucky', title: 'Базовая', lead: 'соседние точки, целый ответ' },
  { id: 'unlucky', title: 'Повышенная', lead: 'дробный ответ, дальние точки' },
];

/* У тригонометрических: целый ответ и клетка, равная единице, — против
   клетки 0,5 и системы сложением. */
const TRIGONOMETRIC_LEVELS: SkillLevel[] = [
  { id: 'lucky', title: 'Базовая', lead: 'клетка — единица, целый ответ' },
  { id: 'unlucky', title: 'Повышенная', lead: 'клетка 0,5, система сложением' },
];

/** Уровни подтемы: у квадратичной, гиперболы, корня, показательной и логарифмической свои подписи. */
export function skillLevelsFor(type: string): SkillLevel[] {
  if (type === 'trigonometric') {
    return TRIGONOMETRIC_LEVELS;
  }
  if (type === 'logarithmic') {
    return LOGARITHMIC_LEVELS;
  }
  if (type === 'exponential') {
    return EXPONENTIAL_LEVELS;
  }
  if (type === 'irrational') {
    return IRRATIONAL_LEVELS;
  }
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
export function levelsWithHtml(
  levels: SkillLevel[],
  typeset: (text: string) => string,
): SkillLevel[] {
  return levels.map((level) => ({ ...level, leadHtml: typeset(level.lead) }));
}
