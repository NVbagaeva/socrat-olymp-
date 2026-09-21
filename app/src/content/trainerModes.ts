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
  { id: 'practice', title: 'Отработка', lead: 'Один тип задач' },
  { id: 'mixed', title: 'Смешанная', lead: 'Несколько типов' },
  { id: 'mistakes', title: 'Повтор ошибок', lead: 'Только ошибки' },
  { id: 'control', title: 'Контроль', lead: 'Без подсказок' },
];

/**
 * Ярлыки к конфигуратору: прежние адреса /trenazher/{id}/ открывают
 * ту же вкладку с уже выбранным навыком или режимом. Своих задач у
 * ярлыка нет — тренировка собирается там же, где и без него.
 */
export type TrainerShortcutId = 'value' | 'argument' | 'intersection' | 'mixed';

export interface TrainerShortcut {
  /** Часть адреса: /trenazher/{id}. */
  id: TrainerShortcutId;
  /** Заголовок страницы и крошка. */
  title: string;
  /** Что выбрано при заходе: набор движка и (или) режим. */
  skill: string | null;
  mode: TrainerModeId;
}

export const trainerShortcuts: TrainerShortcut[] = [
  { id: 'value', title: 'Найти значение функции', skill: '12.A', mode: 'practice' },
  { id: 'argument', title: 'Найти аргумент', skill: '12.B', mode: 'practice' },
  { id: 'intersection', title: 'Точка пересечения графиков', skill: '12.C', mode: 'practice' },
  { id: 'mixed', title: 'Смешанный тренажёр', skill: null, mode: 'mixed' },
];

/**
 * Ярлыки подтемы по её идентификатору (data/functionTypes.ts).
 *
 * Список выше ведёт на наборы линейной подтемы; у остальных ярлыков
 * пока нет. Новая подтема добавляет сюда свой список.
 */
export function trainerShortcutsFor(type: string): TrainerShortcut[] {
  return type === 'linear' ? trainerShortcuts : [];
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
    title: 'Выбери навык',
    /* «{family}» подставляется названием семейства. */
    lead: 'Что именно хочешь потренировать в разделе «{family}»?',
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

/** Название типа задания по набору движка: для статистики подхода. */
export const trainerKindTitle: Record<string, string> = {
  '12.A': 'Найти значение функции',
  '12.B': 'Найти аргумент',
  /* Абсцисса и ордината — один и тот же тип задания, в статистике
     они идут одной строкой. */
  '12.C': 'Точка пересечения графиков',
  '12.D': 'Точка пересечения графиков',
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
  empty: 'Здесь появится ваша статистика: сколько заданий решено, с какой точностью и какой тип стоит повторить.',
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
