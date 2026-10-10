/**
 * Вкладка «Тренажёр» задания №12: слова и подписи.
 *
 * Тренировка собирается на вкладке: навык, режим, количество,
 * сложность. Сами задачи приходят из движка graph/ по наборам
 * прототипов: условий, чертежей и ответов в проекте нет и не будет.
 * Названия навыков и уровней — в content/skills12.ts.
 */

export type TrainerModeId = 'practice' | 'mixed' | 'mistakes' | 'control';

export interface TrainerMode {
  id: TrainerModeId;
  title: string;
  lead: string;
}

export const trainerModes: TrainerMode[] = [
  { id: 'practice', title: 'Отработка', lead: 'Выбранные типы задач' },
  { id: 'mixed', title: 'Смешанная', lead: 'Все типы вперемешку' },
  { id: 'mistakes', title: 'Повтор ошибок', lead: 'Только ошибки' },
  { id: 'control', title: 'Контроль', lead: 'Без подсказок' },
];

/**
 * Ярлыки к конфигуратору: прежние адреса /trenazher/{id}/ открывают
 * ту же вкладку с уже выбранным навыком или режимом. Своих задач у
 * ярлыка нет — тренировка собирается там же, где и без него.
 */
export type TrainerShortcutId =
  | 'value'
  | 'argument'
  | 'intersection'
  | 'mixed'
  | 'koefficienty'
  | 'znachenie'
  | 'formula'
  | 'peresechenie'
  | 'abscissa-line'
  | 'abscissa-parabola'
  | 'ordinate-line'
  | 'ordinate-parabola';

export interface TrainerShortcut {
  /** Часть адреса: /trenazher/{id}. */
  id: TrainerShortcutId;
  /** Заголовок страницы и крошка. */
  title: string;
  /**
   * Наборы движка, которыми ярлык открывает конфигуратор. Пусто —
   * все наборы семейства. Несколько наборов: конфигуратор
   * показывает только их, и «Смешанная» идёт по ним же.
   */
  skills: string[];
  mode: TrainerModeId;
  /**
   * Правила ответа (answerRule движка), которыми ярлык сужает наборы:
   * например, в 12Q.H только задачи на абсциссу второй точки. Не
   * задано — все задачи наборов.
   */
  rules?: string[];
  /** Что оставил фильтр: строка над конфигуратором. */
  filter?: string;
}

const LINEAR_SHORTCUTS: TrainerShortcut[] = [
  { id: 'value', title: 'Найти значение функции', skills: ['12.A'], mode: 'practice' },
  { id: 'argument', title: 'Найти аргумент', skills: ['12.B'], mode: 'practice' },
  { id: 'intersection', title: 'Точка пересечения графиков', skills: ['12.C'], mode: 'practice' },
  { id: 'mixed', title: 'Смешанный тренажёр', skills: [], mode: 'mixed' },
];

/* Девять навыков в ленту ярлыков не влезут и не нужны: ярлык — это
   короткий путь к частой тренировке, а не оглавление. Наборы
   сгруппированы по тому, что ученик делает руками: читает
   коэффициент, считает значение, собирает формулу, решает уравнение
   с двумя кривыми, — те же четыре связки, по которым разложены
   карточки методов. */
const QUADRATIC_SHORTCUTS: TrainerShortcut[] = [
  {
    id: 'koefficienty',
    title: 'Коэффициенты по графику',
    skills: ['12Q.A', '12Q.B', '12Q.C', '12Q.D'],
    mode: 'mixed',
  },
  { id: 'znachenie', title: 'Значение и аргумент', skills: ['12Q.E', '12Q.F'], mode: 'mixed' },
  { id: 'formula', title: 'Формула параболы', skills: ['12Q.G'], mode: 'practice' },
  {
    id: 'peresechenie',
    title: 'Два графика на одном чертеже',
    skills: ['12Q.H', '12Q.I'],
    mode: 'mixed',
  },
  { id: 'mixed', title: 'Смешанный тренажёр', skills: [], mode: 'mixed' },
  /* Ссылки «Потренироваться» из разборов на вкладке «О задании»
     (content/quadraticTypes.ts): тот же набор, но только задачи
     того же типа — абсцисса или ордината второй точки. */
  {
    id: 'abscissa-line',
    title: 'Парабола и прямая: абсцисса',
    skills: ['12Q.H'],
    mode: 'practice',
    rules: ['intersection-x'],
    filter: 'Только задачи «найдите абсциссу второй точки пересечения»',
  },
  {
    id: 'abscissa-parabola',
    title: 'Две параболы: абсцисса',
    skills: ['12Q.I'],
    mode: 'practice',
    rules: ['intersection-x'],
    filter: 'Только задачи «найдите абсциссу второй точки пересечения»',
  },
  {
    id: 'ordinate-line',
    title: 'Парабола и прямая: ордината',
    skills: ['12Q.H'],
    mode: 'practice',
    rules: ['intersection-y'],
    filter: 'Только задачи «найдите ординату второй точки пересечения»',
  },
  {
    id: 'ordinate-parabola',
    title: 'Две параболы: ордината',
    skills: ['12Q.I'],
    mode: 'practice',
    rules: ['intersection-y'],
    filter: 'Только задачи «найдите ординату второй точки пересечения»',
  },
];

/* Гипербола: те же связки действий — значение и аргумент, коэффициенты
   по асимптотам, две кривые на одном чертеже. */
const RATIONAL_SHORTCUTS: TrainerShortcut[] = [
  {
    id: 'znachenie',
    title: 'Значение и аргумент',
    skills: ['12R.A', '12R.B', '12R.C', '12R.D', '12R.I'],
    mode: 'mixed',
  },
  {
    id: 'koefficienty',
    title: 'Коэффициенты по графику',
    skills: ['12R.E', '12R.F', '12R.J'],
    mode: 'mixed',
  },
  { id: 'peresechenie', title: 'Гипербола и прямая', skills: ['12R.G', '12R.H'], mode: 'mixed' },
  { id: 'mixed', title: 'Смешанный тренажёр', skills: [], mode: 'mixed' },
];

/* График корня: значение, аргумент и корень с прямой. */
const IRRATIONAL_SHORTCUTS: TrainerShortcut[] = [
  { id: 'znachenie', title: 'Найти значение функции', skills: ['12S.A'], mode: 'practice' },
  { id: 'argument', title: 'Найти аргумент по значению', skills: ['12S.B'], mode: 'practice' },
  {
    id: 'peresechenie',
    title: 'Корень и прямая',
    skills: ['12S.C', '12S.D'],
    mode: 'mixed',
  },
  { id: 'mixed', title: 'Смешанный тренажёр', skills: [], mode: 'mixed' },
];

export const trainerShortcuts = LINEAR_SHORTCUTS;

/**
 * Ярлыки подтемы по её идентификатору (data/functionTypes.ts).
 *
 * У подтемы без своего списка ярлыков нет — вкладка тренажёра
 * открывается обычным адресом.
 */
export function trainerShortcutsFor(type: string): TrainerShortcut[] {
  if (type === 'linear') {
    return LINEAR_SHORTCUTS;
  }
  if (type === 'quadratic') {
    return QUADRATIC_SHORTCUTS;
  }
  if (type === 'rational') {
    return RATIONAL_SHORTCUTS;
  }
  if (type === 'irrational') {
    return IRRATIONAL_SHORTCUTS;
  }
  return [];
}

export function findTrainerShortcut(type: string, id: string): TrainerShortcut | undefined {
  return trainerShortcutsFor(type).find((item) => item.id === id);
}

export function trainerShortcutIds(type: string): TrainerShortcutId[] {
  return trainerShortcutsFor(type).map((item) => item.id);
}

/** Заголовок и подписи вкладки. */
export const trainerPage = {
  title: 'Тренажёр',
  /* Конфигуратор: заголовок с макета и подписи шагов. */
  builder: 'Собери свою тренировку',
  skill: {
    step: '1',
    title: 'Выбери навыки',
    /* «{family}» подставляется названием семейства. */
    lead: 'Что хочешь потренировать в разделе «{family}»? Можно выбрать несколько.',
    /* Сколько выбрано — в строке сводки: «3 типа задач». */
    unit: ['тип задач', 'типа задач', 'типов задач'] as [string, string, string],
  },
  params: {
    step: '2',
    title: 'Настрой параметры тренировки',
    lead: 'Выбери формат, количество заданий и сложность',
    mode: 'Режим тренировки',
    /* Подпись режима «Повтор ошибок», пока в истории ошибок пусто. */
    noMistakes: 'Пока нет ошибок для повторения',
    count: 'Количество заданий',
    all: 'Все',
    level: 'Сложность',
  },
  summary: {
    title: 'Выбранная тренировка',
    note: 'Все задания соответствуют реальным прототипам ЕГЭ.',
  },
  start: 'Начать тренировку',
};

/**
 * Подписи конфигуратора подтемы.
 *
 * У квадратичной и гиперболы наборы — собственный материал платформы, в открытый
 * банк ФИПИ они не входят, и обещать обратное нельзя: так и сказано
 * в поле note самих наборов.
 */
export function trainerWordsFor(type: string) {
  if (type !== 'quadratic' && type !== 'rational' && type !== 'irrational') {
    return trainerPage;
  }
  return {
    ...trainerPage,
    summary: {
      ...trainerPage.summary,
      note: 'Задания составлены платформой по разборам прототипов ЕГЭ.',
    },
  };
}

/** Название типа задания по набору движка: для статистики подхода. */
export const trainerKindTitle: Record<string, string> = {
  '12.A': 'Найти значение функции',
  '12.B': 'Найти аргумент',
  /* Абсцисса и ордината — один и тот же тип задания, в статистике
     они идут одной строкой. */
  '12.C': 'Точка пересечения графиков',
  '12.D': 'Точка пересечения графиков',
  /* Квадратичная: по этим именам подход раскладывает задания так,
     чтобы одинаковые не шли подряд, и по ним же собирается сводка. */
  '12Q.A': 'Знак коэффициента $a$',
  '12Q.B': 'Значение коэффициента $a$',
  '12Q.C': 'Свободный член $c$',
  '12Q.D': 'Коэффициент $b$',
  '12Q.E': 'Значение функции',
  '12Q.F': 'Аргумент по значению',
  '12Q.G': 'Формула по графику',
  /* Парабола с прямой и парабола с параболой — одно и то же
     действие: приравнять формулы и найти второй корень. */
  '12Q.H': 'Два графика на одном чертеже',
  '12Q.I': 'Два графика на одном чертеже',
  /* Гипербола: значение и аргумент — по записи функции, точки B —
     одним типом, как у параболы. */
  '12R.A': 'Значение функции $\\frac{k}{x} + a$',
  '12R.B': 'Аргумент: $\\frac{k}{x} + a$',
  '12R.C': 'Значение функции $\\frac{k}{x + a}$',
  '12R.D': 'Аргумент: $\\frac{k}{x + a}$',
  '12R.E': 'Коэффициент $k$ в $\\frac{kx + a}{x + b}$',
  '12R.F': 'Коэффициент $a$ в $\\frac{kx + a}{x + b}$',
  '12R.G': 'Гипербола и прямая',
  '12R.H': 'Гипербола и прямая',
  '12R.I': 'Гипербола $y = \\frac{k}{x}$',
  '12R.J': 'Коэффициент $b$ и значение $\\frac{kx + a}{x + b}$',
  /* График корня: точки B — одним типом, как у гиперболы. */
  '12S.A': 'Значение функции',
  '12S.B': 'Аргумент по значению',
  '12S.C': 'Корень и прямая',
  '12S.D': 'Корень и прямая',
};

/** Итоговый экран подхода. Тексты заданы заказчиком дословно. */
export const trainerResult = {
  title: 'Тренировка завершена!',
  lead: 'Отличная работа!',
  scoreLabel: 'Правильных ответов',
  percentLabel: 'Результат',
  rows: {
    total: 'Всего заданий',
    right: 'Правильных ответов',
    wrong: 'Ошибок',
    hinted: 'Решено с подсказкой',
    time: 'Потраченное время',
  },
  kinds: 'Статистика по типам заданий',
  again: 'Начать заново',
  back: 'Вернуться к заданиям',
  trophyAlt: 'Кубок',
};

/** Сводка тренажёра на вкладке. */
export const trainerStats = {
  empty:
    'Здесь появится ваша статистика: сколько заданий решено, с какой точностью и какой тип стоит повторить.',
  rows: {
    total: 'Всего заданий',
    done: 'Решено',
    right: 'Верно',
    wrong: 'Неверно',
    accuracy: 'Точность',
    average: 'Среднее время',
  },
  kinds: 'Статистика по типам заданий',
  advice: 'Рекомендуем повторить:',
  adviceTail: 'точность',
  mistakes: 'Повторение ошибок',
  reset: 'Сбросить',
};
