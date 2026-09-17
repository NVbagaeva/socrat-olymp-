/**
 * Режимы вкладки «Тренажёр» задания №12.
 *
 * Здесь перечислено, какие режимы показываются и в каком порядке.
 * Сами задачи приходят из движка graph/ по наборам прототипов:
 * условий, чертежей и ответов в проекте нет и не будет.
 */

export type TrainerModeId = 'value' | 'argument' | 'intersection' | 'mixed';

/** Какую иконку рисует плашка режима. */
export type TrainerIconId = 'value' | 'argument' | 'intersection' | 'mixed';

export interface TrainerMode {
  /** Часть адреса: /trenazher/{id}. */
  id: TrainerModeId;
  /** Цифра в списке: 01 … 04. */
  no: string;
  title: string;
  /** Вторая строка в списке режимов. */
  lead: string;
  icon: TrainerIconId;
  /** Наборы прототипов движка, из которых берутся задания. */
  setIds: string[];
}

export const trainerModes: TrainerMode[] = [
  {
    id: 'value',
    no: '01',
    title: 'Найти значение функции',
    lead: 'По графику (найти f(x))',
    icon: 'value',
    setIds: ['12.A'],
  },
  {
    id: 'argument',
    no: '02',
    title: 'Найти аргумент',
    lead: 'По графику (найти x)',
    icon: 'argument',
    setIds: ['12.B'],
  },
  {
    id: 'intersection',
    no: '03',
    title: 'Точка пересечения графиков',
    lead: 'Найти абсциссу или ординату',
    icon: 'intersection',
    setIds: ['12.C', '12.D'],
  },
  {
    id: 'mixed',
    no: '04',
    title: 'Смешанный тренажёр',
    lead: 'Все типы заданий вперемешку',
    icon: 'mixed',
    setIds: ['12.A', '12.B', '12.C', '12.D'],
  },
];

/** Заголовок и подписи вкладки. */
export const trainerPage = {
  title: 'Тренажёр',
  /* Строка выбора в закрытом состоянии. */
  pickTitle: 'Выберите тип заданий',
  pickLead: 'Нажмите, чтобы начать тренировку',
};

export function findTrainerMode(id: string): TrainerMode | undefined {
  return trainerModes.find((mode) => mode.id === id);
}

export function trainerModeIds(): TrainerModeId[] {
  return trainerModes.map((mode) => mode.id);
}

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
  back: 'Вернуться к заданиям',
  trophyAlt: 'Кубок',
};
