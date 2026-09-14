/**
 * Демонстрационные данные кабинета.
 *
 * Здесь и только здесь живут выдуманные значения: имена, проценты,
 * счётчики. Каждый набор помечен DEMO. Когда появятся настоящие
 * данные, правится этот файл — страницы и компоненты не трогаются,
 * потому что ни одно из этих чисел не вписано в разметку.
 */

import type { FunctionTypeId } from '@/data/functionTypes';

export interface DemoUser {
  initials: string;
  name: string;
  role: string;
}

/* DEMO: пользователь в шапке кабинета. Настоящий придёт из аккаунта. */
export const demoUser: DemoUser = {
  initials: 'НВ',
  name: 'Наталья Витальевна',
  role: 'Преподаватель',
};

/* DEMO: доля решённого по типам функций и общая по заданию. Настоящие
   значения появятся вместе с хранилищем результатов; до тех пор это
   единственное место, где эти проценты записаны. */
export const demoProgress: Record<FunctionTypeId, number> = {
  linear: 92,
  quadratic: 74,
  rational: 61,
  logarithmic: 48,
  exponential: 55,
  trigonometric: 39,
};

/* DEMO: общий прогресс по заданию №12. Не среднее от строк выше —
   отдельное число, как на макете. */
export const demoTotalProgress = 68;

/* DEMO: счётчики тренажёра на старте. Дальше они живут в состоянии и
   пересчитываются после каждой проверки. */
export interface DemoTrainerStats {
  total: number;
  solved: number;
  correct: number;
  /** Среднее время на задание, секунды. */
  averageSeconds: number;
}

export const demoTrainerStats: DemoTrainerStats = {
  total: 20,
  solved: 14,
  correct: 11,
  averageSeconds: 84,
};
