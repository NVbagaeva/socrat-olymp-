/**
 * Вкладка «Генератор» задания №12: слова и подписи.
 *
 * Навык генератора — набор прототипов движка graph/ (12.A … 12.D):
 * что есть в данных, то и навык. Здесь только человеческие названия
 * к идентификаторам наборов и уровней — сами числа, состав и уровни
 * считает манифест (lib/generator/manifest.ts), руками они нигде
 * не повторяются. Тексты — с макета и от заказчика дословно.
 */

/** Название навыка по идентификатору набора движка. */
export const generatorSkillTitle: Record<string, string> = {
  '12.A': 'Значение функции',
  '12.B': 'Аргумент по значению',
  '12.C': 'Абсцисса пересечения',
  '12.D': 'Ордината пересечения',
};

export type GeneratorLevelId = 'lucky' | 'unlucky';

export interface GeneratorLevel {
  /** Значение поля level у задач набора. */
  id: GeneratorLevelId;
  title: string;
  lead: string;
}

/** Уровни в порядке показа. Показываются только те, что есть у набора. */
export const generatorLevels: GeneratorLevel[] = [
  { id: 'lucky', title: 'Базовая', lead: 'b читается с графика' },
  { id: 'unlucky', title: 'Повышенная', lead: 'b нужно вычислить' },
];

export type GeneratorModeId = 'practice' | 'mixed' | 'mistakes' | 'control';

export interface GeneratorMode {
  id: GeneratorModeId;
  title: string;
  lead: string;
}

export const generatorModes: GeneratorMode[] = [
  { id: 'practice', title: 'Отработка', lead: 'Один тип задач' },
  { id: 'mixed', title: 'Смешанная', lead: 'Несколько типов' },
  { id: 'mistakes', title: 'Повтор ошибок', lead: 'Только ошибки' },
  { id: 'control', title: 'Контроль', lead: 'Без подсказок' },
];

/** Количество заданий. null — «Все»: число берётся из манифеста. */
export const generatorCounts: (number | null)[] = [5, 10, 20, null];

export type GeneratorLaunchId = 'online' | 'pdf';

export interface GeneratorLaunch {
  id: GeneratorLaunchId;
  title: string;
}

export const generatorLaunches: GeneratorLaunch[] = [
  { id: 'online', title: 'Онлайн' },
  { id: 'pdf', title: 'PDF' },
];

export const generatorPage = {
  title: 'Собери свою тренировку',
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
  launch: {
    label: 'Как тренироваться',
    /* Подпись режима «PDF», пока печать не сделана. */
    pdfSoon: 'Готовится',
    start: 'Начать тренировку',
  },
};
