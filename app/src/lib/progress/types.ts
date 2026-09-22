/**
 * Единый журнал прогресса ученика: типы.
 *
 * Единица учёта — попытка (Attempt). Навык — то, что ученик реально
 * выбирает на экране (коэффициент, метод, блок подготовки, прототип
 * стереометрии), а не служебный идентификатор движка. У опорных
 * задач и у тренажёра одного и того же задания навыки — разные
 * таксономии: они не сливаются в одну без пояснения (см. отчёт
 * этапа 1).
 */

export type TaskNo = '3' | '4' | '5' | '8' | '12';

/** Опорные задачи и тренажёр одного задания — разные списки навыков. */
export type SkillSource = 'prep' | 'trainer';

export type Verdict = 'correct' | 'incorrect' | 'skipped';

export interface Attempt {
  taskNo: TaskNo;
  subtopicId: string;
  source: SkillSource;
  skillId: string;
  /** Экземпляр задачи: для журнала и будущего «повтора ошибок». */
  taskId: string;
  /** null — семя не нужно или недоступно у этого движка (см. отчёт). */
  seed: string | null;
  verdict: Verdict;
  /** Была ли на этом экземпляре открыта подсказка, разбор или решение. */
  hintUsed: boolean;
  /** Верно с первой проверки: до этого не было ни ошибки, ни разбора. */
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

export interface SkillTally {
  /** Последние попытки: true — зачёт. Не длиннее WINDOW (см. store.ts). */
  window: boolean[];
  attemptsTotal: number;
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
