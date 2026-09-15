/**
 * Демонстрационные данные кабинета.
 *
 * Здесь и только здесь живут выдуманные значения: имена, проценты,
 * счётчики. Каждый набор помечен DEMO. Когда появятся настоящие
 * данные, правится этот файл — страницы и компоненты не трогаются,
 * потому что ни одно из этих чисел не вписано в разметку.
 */

import type { FunctionTypeId } from '@/data/functionTypes';
import type { PrepSkillId } from '@/content/prepSkills';

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

/* DEMO: сколько разделов теории темы изучено — число из шапки темы.
   Счётчик один: общее число разделов нигде не записано, оно равно
   длине списка теории в functionTypes.ts, а здесь лежит только
   витринное «изучено». Настоящее значение придёт из прогресса
   ученика, когда он появится; до тех пор оно живёт здесь и приходит
   на страницу через lib/storage.ts. */
export const demoStudied = 6;

/* DEMO: сколько задач решено по каждому навыку подготовительных
   задач. Общее число и проценты нигде не записаны — они считаются
   отсюда и из длин наборов движка. Настоящий прогресс появится
   вместе с личным кабинетом; до тех пор это единственное место,
   где эти числа заданы. */
export const demoPrepSolved: Record<PrepSkillId, number> = {
  k: 6,
  b: 3,
  equation: 0,
  point: 8,
};
