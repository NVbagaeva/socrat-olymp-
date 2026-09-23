/**
 * Единый журнал прогресса ученика: типы.
 *
 * Единица журнала — попытка (Attempt): каждая проверка ответа, раскрытие
 * решения или пропуск. Единица окна навыка — экземпляр задачи: задача,
 * показанная ученику, от момента показа до перехода к другой. Окно
 * получает одну запись на экземпляр — его итог, — сколько бы проверок
 * ни было внутри (см. core.ts).
 *
 * Навык — то, что ученик реально выбирает на экране (коэффициент, метод,
 * блок подготовки, прототип стереометрии), а не служебный идентификатор
 * движка. У опорных задач и у тренажёра одного задания навыки — разные
 * списки, они не сливаются в один.
 */

export type TaskNo = '3' | '4' | '5' | '8' | '12';

/** Опорные задачи и тренажёр одного задания — разные списки навыков. */
export type SkillSource = 'prep' | 'trainer';

/** Пропуск в окно навыка не идёт и на статус не влияет. */
export type Verdict = 'correct' | 'incorrect' | 'skipped';

export interface Attempt {
  taskNo: TaskNo;
  subtopicId: string;
  source: SkillSource;
  skillId: string;
  /** Задача: для журнала и будущего «повтора ошибок». */
  taskId: string;
  /** Экземпляр задачи: все попытки одного показа несут один id. */
  instanceId: string;
  /** null — семя не нужно или недоступно у этого движка. */
  seed: string | null;
  verdict: Verdict;
  /** Была ли на этом экземпляре открыта подсказка, разбор или решение. */
  hintUsed: boolean;
  /** Первая проверка этого экземпляра: до неё ошибок не было. */
  firstTry: boolean;
  seconds: number;
  ts: number;
}

/** Зачёт — верно, с первой проверки и без подсказки. Решённое
    с подсказкой в зачёт не идёт, но в активность идёт. */
export function isCredit(attempt: Pick<Attempt, 'verdict' | 'hintUsed' | 'firstTry'>): boolean {
  return attempt.verdict === 'correct' && attempt.firstTry && !attempt.hintUsed;
}

export type SkillStatus = 'none' | 'in-progress' | 'mastered';

/** Итог одного экземпляра задачи в окне навыка. */
export interface WindowEntry {
  instance: string;
  credit: boolean;
}

export interface SkillTally {
  /** Итоги последних экземпляров, не длиннее WINDOW (см. core.ts). */
  window: WindowEntry[];
  /** Все счётчики ниже — по экземплярам, а не по проверкам. */
  instancesTotal: number;
  creditsTotal: number;
  hintsTotal: number;
  secondsTotal: number;
  lastAttemptAt: number | null;
}

export interface SkillState extends SkillTally {
  status: SkillStatus;
  /** Освоен, но давно не подтверждён: последняя попытка старше 30 дней.
      На статус и агрегаты не влияет — это подсказка, что повторить. */
  dueForReview: boolean;
}
