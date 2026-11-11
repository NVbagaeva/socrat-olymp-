/**
 * Журнал попыток тренажёра — чистые функции, без браузера.
 *
 * Прежние хранилища (lib/progressStore.ts) держали счётчики: «решено 7,
 * верно 5». Счётчики двух устройств нельзя сложить без двойного счёта,
 * а «последние пять попыток» и «два верных аналога подряд» из них не
 * узнать. Поэтому здесь журнал: каждая закрытая задача — запись со
 * своим идентификатором. Два устройства сливают журналы объединением по
 * идентификатору, а всё, что видит ученик, считается из журнала:
 *
 *   - прогресс по типам: решено / верно / ошибки;
 *   - «Стоит повторить»: в последних пяти задачах типа ошибок две и больше;
 *   - «Мои ошибки»: задачи с ошибкой или открытым решением; задача
 *     уходит из списка после двух верных аналогов подряд, решённых в
 *     «Работе над ошибками» (поле fixes);
 *   - сколько разных задач банка решено — не больше, чем задач в банке.
 *
 * Ответов в журнале нет: только идентификаторы задач и исходы.
 * Модуль общий: тип задачи (kind) — то, что тренажёр сам считает типом
 * (у №8 — прототип «8.A»).
 */

/** Чем закрылась задача: верно сразу; с ошибкой; решение открыто до верного ответа. */
export type LogOutcome = 'right' | 'wrong' | 'revealed';

export interface LogAttempt {
  /** Идентификатор записи: по нему сливаются журналы устройств. */
  id: string;
  /** Задача: у №8 — «прототип|seed|уровень». */
  task: string;
  /** Тип задачи. */
  kind: string;
  outcome: LogOutcome;
  /** Задача из «Моих ошибок», аналог которой решался. */
  fixes?: string;
  /** Тренировка, в которой решалась задача. */
  session?: string;
  /** Секунды на задачу. */
  seconds: number;
  /** Когда закрыта, мс от эпохи. */
  at: number;
}

/** Счётчики, свёрнутые из старого формата: без отдельных попыток. */
export interface ArchiveTally {
  done: number;
  right: number;
  seconds: number;
}

export interface ProgressLog {
  v: 1;
  /** Попытки по времени. */
  attempts: LogAttempt[];
  /**
   * Счётчики старого формата: устройство → тип → счётчики. Каждое
   * устройство сворачивает свои старые счётчики под своим именем, поэтому
   * при слиянии они не складываются дважды.
   */
  archive: Record<string, Record<string, ArchiveTally>>;
  /** Ошибки старого формата: задачи без записей в журнале. */
  legacyMistakes: string[];
  /**
   * Самые старые попытки, свёрнутые в счётчики, когда журнал перерос
   * предел: все попытки до момента upTo включительно. При слиянии берётся
   * свёртка с более поздним upTo, а попытки до него из журналов уходят.
   */
  folded?: { upTo: number; kinds: Record<string, ArchiveTally> };
}

export const EMPTY_LOG: ProgressLog = { v: 1, attempts: [], archive: {}, legacyMistakes: [] };

/** Сколько попыток держать. Старые сворачиваются в счётчики архива. */
export const LOG_LIMIT = 1500;

const OUTCOMES: readonly LogOutcome[] = ['right', 'wrong', 'revealed'];

function str(value: unknown, max = 120): string | null {
  return typeof value === 'string' && value.length > 0 && value.length <= max ? value : null;
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function parseAttempt(value: unknown): LogAttempt | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  const id = str(v.id, 64);
  const task = str(v.task);
  const kind = str(v.kind, 40);
  const outcome = OUTCOMES.find((item) => item === v.outcome);
  if (id === null || task === null || kind === null || outcome === undefined) return null;
  const out: LogAttempt = {
    id,
    task,
    kind,
    outcome,
    seconds: Math.round(num(v.seconds)),
    at: num(v.at),
  };
  const fixes = str(v.fixes);
  if (fixes !== null) out.fixes = fixes;
  const session = str(v.session, 64);
  if (session !== null) out.session = session;
  return out;
}

/** Разбор записи из хранилища. Мусор — пустой журнал. */
export function parseLog(raw: unknown): ProgressLog {
  if (typeof raw !== 'object' || raw === null) return EMPTY_LOG;
  const v = raw as Record<string, unknown>;
  const attempts = Array.isArray(v.attempts)
    ? v.attempts.map(parseAttempt).filter((item): item is LogAttempt => item !== null)
    : [];
  const archive: ProgressLog['archive'] = {};
  if (typeof v.archive === 'object' && v.archive !== null) {
    for (const [origin, kinds] of Object.entries(v.archive as Record<string, unknown>)) {
      if (typeof kinds !== 'object' || kinds === null) continue;
      const out: Record<string, ArchiveTally> = {};
      for (const [kind, tally] of Object.entries(kinds as Record<string, unknown>)) {
        if (typeof tally !== 'object' || tally === null) continue;
        const t = tally as Record<string, unknown>;
        out[kind] = { done: num(t.done), right: num(t.right), seconds: num(t.seconds) };
      }
      archive[origin] = out;
    }
  }
  const legacyMistakes = Array.isArray(v.legacyMistakes)
    ? v.legacyMistakes.filter((item): item is string => typeof item === 'string')
    : [];
  const out: ProgressLog = { v: 1, attempts: sortAttempts(attempts), archive, legacyMistakes };
  if (typeof v.folded === 'object' && v.folded !== null) {
    const f = v.folded as Record<string, unknown>;
    out.folded = { upTo: num(f.upTo), kinds: parseTallies(f.kinds) };
  }
  return out;
}

function parseTallies(raw: unknown): Record<string, ArchiveTally> {
  const out: Record<string, ArchiveTally> = {};
  if (typeof raw !== 'object' || raw === null) return out;
  for (const [kind, tally] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof tally !== 'object' || tally === null) continue;
    const t = tally as Record<string, unknown>;
    out[kind] = { done: num(t.done), right: num(t.right), seconds: num(t.seconds) };
  }
  return out;
}

function sortAttempts(list: LogAttempt[]): LogAttempt[] {
  return [...list].sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Свернуть самые старые попытки в счётчики, если журнал перерос предел. */
function trim(log: ProgressLog): ProgressLog {
  if (log.attempts.length <= LOG_LIMIT) return log;
  const cut = log.attempts.length - LOG_LIMIT;
  const old = log.attempts.slice(0, cut);
  const kinds: Record<string, ArchiveTally> = { ...(log.folded?.kinds ?? {}) };
  for (const item of old) {
    const tally = kinds[item.kind] ?? { done: 0, right: 0, seconds: 0 };
    kinds[item.kind] = {
      done: tally.done + 1,
      right: tally.right + (item.outcome === 'right' ? 1 : 0),
      seconds: tally.seconds + item.seconds,
    };
  }
  const upTo = old[old.length - 1]?.at ?? log.folded?.upTo ?? 0;
  return { ...log, attempts: log.attempts.slice(cut), folded: { upTo, kinds } };
}

/** Добавить попытку. */
export function addAttempt(log: ProgressLog, attempt: LogAttempt): ProgressLog {
  if (log.attempts.some((item) => item.id === attempt.id)) return log;
  return trim({ ...log, attempts: sortAttempts([...log.attempts, attempt]) });
}

/**
 * Слить два журнала: попытки — объединением по идентификатору, архивы —
 * по устройству, старые ошибки — объединением.
 */
export function mergeLogs(a: ProgressLog, b: ProgressLog): ProgressLog {
  const folded =
    a.folded === undefined
      ? b.folded
      : b.folded === undefined || a.folded.upTo >= b.folded.upTo
        ? a.folded
        : b.folded;
  const byId = new Map<string, LogAttempt>();
  for (const item of [...a.attempts, ...b.attempts]) {
    if (folded === undefined || item.at > folded.upTo) byId.set(item.id, item);
  }
  const out: ProgressLog = {
    v: 1,
    attempts: sortAttempts([...byId.values()]),
    archive: { ...b.archive, ...a.archive },
    legacyMistakes: [...new Set([...a.legacyMistakes, ...b.legacyMistakes])],
  };
  if (folded !== undefined) out.folded = folded;
  return trim(out);
}

/**
 * Свернуть хранилище старого формата (lib/progressStore.ts:
 * { kinds: {тип: {done, right, seconds}}, mistakes: [...] }) в журнал.
 * origin — имя этого устройства в архиве.
 */
export function fromLegacy(raw: unknown, origin: string): ProgressLog {
  if (typeof raw !== 'object' || raw === null) return EMPTY_LOG;
  const v = raw as Record<string, unknown>;
  const kinds: Record<string, ArchiveTally> = {};
  if (typeof v.kinds === 'object' && v.kinds !== null) {
    for (const [kind, tally] of Object.entries(v.kinds as Record<string, unknown>)) {
      if (typeof tally !== 'object' || tally === null) continue;
      const t = tally as Record<string, unknown>;
      kinds[kind] = { done: num(t.done), right: num(t.right), seconds: num(t.seconds) };
    }
  }
  const mistakes = Array.isArray(v.mistakes)
    ? v.mistakes.filter((item): item is string => typeof item === 'string')
    : [];
  return {
    v: 1,
    attempts: [],
    archive: Object.keys(kinds).length === 0 ? {} : { [origin]: kinds },
    legacyMistakes: mistakes,
  };
}

/* ── Что считается из журнала ─────────────────────────────────── */

export interface KindStats {
  kind: string;
  /** Сколько задач этого типа закрыто. */
  done: number;
  /** Решено верно с первого раза, без открытого решения. */
  right: number;
  /** С ошибкой или с открытым решением. */
  mistakes: number;
  seconds: number;
  /** Исходы последних пяти задач, от старых к новым. */
  recent: LogOutcome[];
  /** «Стоит повторить»: в последних пяти задачах типа две ошибки и больше. */
  repeat: boolean;
}

/** Сколько последних задач смотреть и сколько ошибок в них — повод повторить. */
export const RECENT = 5;
export const REPEAT_AT = 2;

/**
 * Статистика по типам. keyOf — во что сводить тип: у №8 карточки идут
 * по навыкам, и прототипы одного навыка сводятся в одну строку; тогда
 * «последние пять» — последние пять задач навыка, а не каждого прототипа.
 */
export function kindStats(
  log: ProgressLog,
  keyOf: (kind: string) => string = (kind) => kind,
): Map<string, KindStats> {
  const out = new Map<string, KindStats>();
  const row = (kind: string): KindStats => {
    let found = out.get(kind);
    if (found === undefined) {
      found = { kind, done: 0, right: 0, mistakes: 0, seconds: 0, recent: [], repeat: false };
      out.set(kind, found);
    }
    return found;
  };
  for (const kinds of [...Object.values(log.archive), log.folded?.kinds ?? {}]) {
    for (const [kind, tally] of Object.entries(kinds)) {
      const r = row(keyOf(kind));
      r.done += tally.done;
      r.right += Math.min(tally.right, tally.done);
      r.mistakes += Math.max(0, tally.done - tally.right);
      r.seconds += tally.seconds;
    }
  }
  for (const item of log.attempts) {
    const r = row(keyOf(item.kind));
    r.done += 1;
    if (item.outcome === 'right') r.right += 1;
    else r.mistakes += 1;
    r.seconds += item.seconds;
    r.recent = [...r.recent, item.outcome].slice(-RECENT);
  }
  for (const r of out.values()) {
    r.repeat = r.recent.filter((item) => item !== 'right').length >= REPEAT_AT;
  }
  return out;
}

export interface Totals {
  done: number;
  right: number;
  mistakes: number;
  seconds: number;
}

export function totals(log: ProgressLog): Totals {
  let done = 0;
  let right = 0;
  let mistakes = 0;
  let seconds = 0;
  for (const r of kindStats(log).values()) {
    done += r.done;
    right += r.right;
    mistakes += r.mistakes;
    seconds += r.seconds;
  }
  return { done, right, mistakes, seconds };
}

/** Сколько разных задач закрыто среди тех, что подходят под отбор (у №8 — задачи банка). */
export function distinctSolved(log: ProgressLog, counts: (task: string) => boolean): number {
  const seen = new Set<string>();
  for (const item of log.attempts) {
    if (counts(item.task)) seen.add(item.task);
  }
  return seen.size;
}

/** Задачи, которые уже закрывались: тренажёр не даёт их снова, пока есть новые. */
export function closedTasks(log: ProgressLog): Set<string> {
  return new Set(log.attempts.map((item) => item.task));
}

export interface Mistake {
  /** Задача, в которой была ошибка. */
  task: string;
  kind: string;
  /** Когда ошибка случилась (0 — из старого формата). */
  at: number;
  /** Сколько верных аналогов подряд уже решено (0 или 1: на втором задача уходит). */
  streak: number;
}

/** Сколько верных аналогов подряд нужно, чтобы задача ушла из «Моих ошибок». */
export const FIX_STREAK = 2;

/**
 * «Мои ошибки». Задача попадает сюда, если закрыта с ошибкой или с
 * открытым решением. Аналоги, решённые в «Работе над ошибками», ведут
 * счёт подряд: верный — плюс один, неверный — счёт с нуля. Два верных
 * подряд — задача уходит. Ошибка в аналоге сама в список не попадает:
 * это та же ошибка, она уже в списке.
 */
export function mistakes(log: ProgressLog, kindOfTask: (task: string) => string): Mistake[] {
  const open = new Map<string, Mistake>();
  for (const task of log.legacyMistakes) {
    open.set(task, { task, kind: kindOfTask(task), at: 0, streak: 0 });
  }
  for (const item of log.attempts) {
    if (item.fixes !== undefined) continue;
    if (item.outcome !== 'right' && !open.has(item.task)) {
      open.set(item.task, { task: item.task, kind: item.kind, at: item.at, streak: 0 });
    }
  }
  const cleared = new Set<string>();
  for (const item of log.attempts) {
    if (item.fixes === undefined) continue;
    const m = open.get(item.fixes);
    if (m === undefined || cleared.has(item.fixes)) continue;
    m.streak = item.outcome === 'right' ? m.streak + 1 : 0;
    if (m.streak >= FIX_STREAK) cleared.add(item.fixes);
  }
  return [...open.values()].filter((m) => !cleared.has(m.task)).sort((a, b) => b.at - a.at);
}

/** Новый идентификатор попытки: время и случайный хвост. */
export function newAttemptId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
