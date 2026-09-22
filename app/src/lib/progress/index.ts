/**
 * Единый модуль прогресса — публичный вход.
 *
 * Этап 1: журнал и агрегаты навыков работают и пишутся параллельно
 * старым одиннадцати ключам (временная двойная запись, см. отчёт),
 * но ничего в интерфейсе на них ещё не смотрит — кольцо теории
 * и вкладки «Статистика» подключаются на следующих этапах.
 */

export {
  recordPrep12,
  recordTrainer12,
  recordPrep8,
  recordTrainer8,
  recordPrepVeroyatnost,
  recordTrainerVeroyatnost,
  recordTrainer3,
  type AttemptArgs,
} from './adapters';
export { getSkillState, useSkillState } from './selectors';
export { migrateLegacyProgress } from './migrate';
export { resetAll, exportJournal, PROGRESS_KEY, useProgressData, getProgressData } from './store';
export type { Attempt, SkillSource, SkillState, SkillStatus, TaskNo, Verdict } from './types';
