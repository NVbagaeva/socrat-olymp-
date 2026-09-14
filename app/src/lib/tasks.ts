/**
 * Задание тренажёра — общая форма для всех страниц раздела.
 *
 * Сами задания приходят из движка graph/: он собирает условие,
 * чертёж и ответ по набору и seed. Здесь только форма, в которой
 * задание ходит по приложению, и настройки выборки.
 */

import type { FunctionTypeId } from '@/data/functionTypes';
import type { TaskTypeId } from '@/data/taskTypes';

export type Difficulty = 'base' | 'medium' | 'advanced';

/** Режим подборки: обычная тренировка, контроль, работа над ошибками. */
export type TrainingMode = 'practice' | 'control' | 'mistakes';

export interface ExerciseTask {
  id: string;
  functionType: FunctionTypeId;
  taskType: TaskTypeId;
  difficulty: Difficulty;
  /** Условие из данных движка. Своих формулировок проект не пишет. */
  statement: string;
  /** Ответ. На экран не выводится ни при каком исходе проверки. */
  answer: string;
  /** Разбор из данных, если он там есть. */
  solution: string | null;
  /** Сцена чертежа для движка graph/. Нет чертежа — null. */
  graphData: unknown | null;
}

export interface GeneratorSettings {
  functionType: FunctionTypeId;
  /** null — все четыре типа заданий вперемешку. */
  taskType: TaskTypeId | null;
  count: number;
  /** null — сложность вперемешку. */
  difficulty: Difficulty | null;
  mode: TrainingMode;
}

export const defaultGeneratorSettings: GeneratorSettings = {
  functionType: 'linear',
  taskType: null,
  count: 10,
  difficulty: null,
  mode: 'practice',
};
