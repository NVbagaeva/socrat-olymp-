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
