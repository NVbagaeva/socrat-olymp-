/**
 * Журнал попыток глазами прежних хранилищ — чистые функции, без браузера.
 *
 * Разделы, которые раньше держали счётчики (lib/progressStore.ts,
 * lib/trainerProgress.ts), теперь пишут в общий журнал, а их экраны
 * по-прежнему читают «счётчики по типам, список ошибок, исходы задач,
 * решённые задачи». Здесь всё это считается из журнала, и перевод
 * раздела на журнал не трогает его экраны.
 */

import { isMistake, type ArchiveTally, type LogOutcome, type ProgressLog } from './model';

/** Исход задачи, как его знали прежние хранилища: «с подсказкой» там не было. */
export type LegacyOutcome = 'right' | 'wrong' | 'revealed';

export interface LegacyView {
  /** Тип → счётчики: закрыто, верно (без подсказки и ошибок), секунды. */
  kinds: Record<string, { done: number; right: number; seconds: number }>;
  /** Задачи с ошибкой или подсказкой, ещё не решённые начисто. */
  mistakes: string[];
  /** Задача → чем закрылась в последний раз. */
  outcomes: Record<string, LegacyOutcome>;
  /** Задачи, хотя бы раз решённые верно без подсказки. */
  solved: string[];
}

export const EMPTY_VIEW: LegacyView = { kinds: {}, mistakes: [], outcomes: {}, solved: [] };

/** Что прежнее хранилище показало бы по этому журналу. */
export function legacyView(log: ProgressLog): LegacyView {
  const kinds: LegacyView['kinds'] = {};
  const add = (kind: string, tally: ArchiveTally) => {
    const was = kinds[kind] ?? { done: 0, right: 0, seconds: 0 };
    kinds[kind] = {
      done: was.done + tally.done,
      right: was.right + Math.min(tally.right, tally.done),
      seconds: was.seconds + tally.seconds,
    };
  };
  for (const tallies of [...Object.values(log.archive), log.folded?.kinds ?? {}]) {
    for (const [kind, tally] of Object.entries(tallies)) add(kind, tally);
  }

  const mistakes = new Set(log.legacyMistakes);
  const outcomes: Record<string, LegacyOutcome> = { ...legacyOutcomes(log) };
  const solved = new Set(log.legacySolved ?? []);
  for (const item of log.attempts) {
    add(item.kind, {
      done: 1,
      right: item.outcome === 'right' ? 1 : 0,
      seconds: item.seconds,
    });
    if (item.outcome === 'right') {
      mistakes.delete(item.task);
      solved.add(item.task);
    } else {
      /* Как и раньше: ошибка или подсказка ставят задачу в список. */
      mistakes.add(item.task);
    }
    outcomes[item.task] =
      item.outcome === 'right' ? 'right' : item.outcome === 'revealed' ? 'revealed' : 'wrong';
  }
  return { kinds, mistakes: [...mistakes], outcomes, solved: [...solved] };
}

function legacyOutcomes(log: ProgressLog): Record<string, LegacyOutcome> {
  const out: Record<string, LegacyOutcome> = {};
  for (const [task, outcome] of Object.entries(log.legacyOutcomes ?? {})) {
    out[task] = outcome === 'hinted' ? 'wrong' : outcome;
  }
  return out;
}

export interface LegacyAttempt {
  /** Решено самостоятельно. */
  right: boolean;
  /** И при этом без единой ошибки и подсказки. */
  clean: boolean;
  /** Исход, как его передавали прежним хранилищам. */
  itog?: LegacyOutcome;
  /** Точный исход: тренажёр знает, была ли подсказка. Главнее остальных полей. */
  ishod?: LogOutcome;
}

/**
 * Исход попытки для журнала. Тренажёр, который знает точный исход,
 * передаёт ishod. Иначе: начисто — «верно»; решено, но не начисто — «с
 * подсказкой»; не решено — ошибка (или открытое решение, если так
 * сказано в itog).
 */
export function outcomeOf(attempt: LegacyAttempt): LogOutcome {
  if (attempt.ishod !== undefined) return attempt.ishod;
  if (attempt.right && attempt.clean) return 'right';
  if (attempt.right) return 'hinted';
  return attempt.itog === 'revealed' ? 'revealed' : 'wrong';
}

/**
 * Точный исход по тому, что случилось с задачей. Порядок важен:
 * открытое решение и ошибка главнее подсказки.
 */
export function ishodOf(fact: {
  /** Дан верный ответ. */
  solved: boolean;
  /** Сколько неверных ответов было до верного. */
  misses?: number;
  /** Открывалась подсказка. */
  hint?: boolean;
  /** Решение открыто до верного ответа. */
  revealed?: boolean;
}): LogOutcome {
  if (fact.revealed === true) return 'revealed';
  if (!fact.solved || (fact.misses ?? 0) > 0) return 'wrong';
  return fact.hint === true ? 'hinted' : 'right';
}

/**
 * Убрать из журнала всё про типы, для которых drop вернул true: сброс
 * одного раздела там, где журнал общий на несколько (№12). kindOfTask —
 * тип задачи по её идентификатору (для списков старого формата).
 */
export function dropKinds(
  log: ProgressLog,
  drop: (kind: string) => boolean,
  kindOfTask: (task: string) => string,
): ProgressLog {
  const keepTallies = (tallies: Record<string, ArchiveTally>) =>
    Object.fromEntries(Object.entries(tallies).filter(([kind]) => !drop(kind)));
  const keepTask = (task: string) => !drop(kindOfTask(task));
  const out: ProgressLog = {
    v: 1,
    attempts: log.attempts.filter((item) => !drop(item.kind)),
    archive: Object.fromEntries(
      Object.entries(log.archive).map(([origin, tallies]) => [origin, keepTallies(tallies)]),
    ),
    legacyMistakes: log.legacyMistakes.filter(keepTask),
  };
  if (log.folded !== undefined) {
    out.folded = { upTo: log.folded.upTo, kinds: keepTallies(log.folded.kinds) };
  }
  if (log.legacyOutcomes !== undefined) {
    out.legacyOutcomes = Object.fromEntries(
      Object.entries(log.legacyOutcomes).filter(([task]) => keepTask(task)),
    );
  }
  if (log.legacySolved !== undefined) out.legacySolved = log.legacySolved.filter(keepTask);
  return out;
}
