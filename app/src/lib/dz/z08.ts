/**
 * Задачи ДЗ по №8: выбор и вёрстка при выдаче.
 *
 * Работает в браузере репетитора и только при выдаче: условие и решение
 * набираются KaTeX здесь же и уходят в базу готовыми, ответ — в
 * нормальной записи. Ученик и печать берут их из базы, ничего не
 * генерируя заново (docs/kabinet-dz-8.md).
 *
 * Как выбираются задачи:
 *   - по типам: сначала задачи банка (десять зафиксированных вариантов на
 *     прототип), потом свежие задачи генератора;
 *   - индивидуально: каждому ученику свои варианты банка, пока они есть,
 *     дальше — свежие;
 *   - выбранные вручную: эти задачи всем, а при индивидуальной выдаче —
 *     первому ученику они, остальным аналоги (тот же прототип и уровень,
 *     другие числа);
 *   - работа над ошибками: каждому — аналоги его задач с ошибкой.
 */

import { normalizeAnswer } from '@/lib/otvet';
import { BANK } from '@/lib/vychisleniya/bank';
import { generate } from '@/lib/vychisleniya/generate';
import { isBankTask, parseTaskId, taskId } from '@/lib/vychisleniya/ids';
import { ru } from '@/lib/vychisleniya/numbers';
import { razborData } from '@/lib/vychisleniya/razbor';
import { randomSeed } from '@/lib/vychisleniya/session';
import type { Level } from '@/lib/vychisleniya/types';
import { typeset } from '@/lib/tex';
import type { HwTaskInput } from './types';

/** Сколько задач можно выдать одному ученику (как в базе). */
export const MAX_TASKS = 60;

/** Задача, набранная для ДЗ, без адресата и позиции. */
export type Built8 = Omit<HwTaskInput, 'studentId' | 'position' | 'comment'>;

/** Источник задачи для листа учителя. */
function sourceOf(ref: string): string {
  if (!isBankTask(ref)) return 'новая';
  const parsed = parseTaskId(ref);
  const entry = BANK.find((item) => item.prototype === parsed?.prototype);
  const n = entry?.variants.find((v) => v.seed === parsed?.seed)?.n;
  return n === undefined ? 'банк' : `банк ${parsed?.prototype} № ${n}`;
}

/** Набрать задачу по идентификатору. null — генератор её не собрал. */
export function build8(ref: string): Built8 | null {
  const parsed = parseTaskId(ref);
  if (parsed === null) return null;
  try {
    const task = generate(parsed.prototype, parsed.seed, parsed.level);
    const answer = normalizeAnswer(ru(task.otvet));
    if (!answer.ok) return null;
    return {
      kind: parsed.prototype,
      ref,
      questionHtml: typeset(task.uslovie),
      answer: answer.value,
      razbor: razborData(task.razbor, task.delimost),
      source: sourceOf(ref),
    };
  } catch {
    return null;
  }
}

/** Варианты банка прототипа в случайном порядке. */
function bankRefs(prototype: string): string[] {
  const entry = BANK.find((item) => item.prototype === prototype);
  const refs = (entry?.variants ?? []).map((v) => taskId(prototype, v.seed, v.level));
  for (let i = refs.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [refs[i], refs[j]] = [refs[j] as string, refs[i] as string];
  }
  return refs;
}

/**
 * Свежая задача прототипа: другой seed, условие не совпадает с уже
 * выбранными. level — уровень исходной задачи (для аналога).
 */
function fresh(prototype: string, level: Level | null, avoid: Set<string>): Built8 | null {
  for (let i = 0; i < 30; i += 1) {
    const built = build8(taskId(prototype, randomSeed(), level));
    if (built !== null && !avoid.has(built.questionHtml)) return built;
  }
  return null;
}

/**
 * Задачи по типам: perKind задач каждого прототипа на каждого из
 * students наборов (один набор — students = 1). Банк — без повторов
 * между наборами, пока хватает вариантов.
 */
export function byKinds(kinds: readonly string[], perKind: number, sets: number): Built8[][] {
  const out: Built8[][] = Array.from({ length: sets }, () => []);
  for (const kind of kinds) {
    const queue = bankRefs(kind);
    const seen = new Set<string>();
    for (let s = 0; s < sets; s += 1) {
      const set = out[s] as Built8[];
      for (let k = 0; k < perKind; k += 1) {
        let built: Built8 | null = null;
        while (built === null && queue.length > 0) {
          const candidate = build8(queue.shift() as string);
          if (candidate !== null && !seen.has(candidate.questionHtml)) built = candidate;
        }
        built ??= fresh(kind, null, seen);
        if (built !== null) {
          seen.add(built.questionHtml);
          set.push(built);
        }
      }
    }
  }
  return out;
}

/** Аналог задачи: тот же прототип и уровень, другие числа. */
export function analog8(ref: string, avoid: Set<string>): Built8 | null {
  const parsed = parseTaskId(ref);
  if (parsed === null) return null;
  const original = build8(ref);
  if (original !== null) avoid.add(original.questionHtml);
  const built = fresh(parsed.prototype, parsed.level, avoid);
  if (built !== null) avoid.add(built.questionHtml);
  return built;
}

/**
 * Выбранные вручную задачи: один набор — они сами; индивидуально —
 * первому ученику они, остальным аналоги.
 */
export function byRefs(refs: readonly string[], sets: number): Built8[][] {
  const first = refs.map((ref) => build8(ref)).filter((t): t is Built8 => t !== null);
  const out: Built8[][] = [first];
  for (let s = 1; s < sets; s += 1) {
    const avoid = new Set(first.map((t) => t.questionHtml));
    out.push(first.map((t) => analog8(t.ref, avoid)).filter((t): t is Built8 => t !== null));
  }
  return out;
}

/** Работа над ошибками: аналоги каждой задачи с ошибкой, по одному на задачу. */
export function mistakesOf(refs: readonly string[]): Built8[] {
  const avoid = new Set<string>();
  return refs.map((ref) => analog8(ref, avoid)).filter((t): t is Built8 => t !== null);
}

/**
 * Разложить наборы по ученикам. Один набор — задачи для всех
 * (studentId = null); индивидуально — каждому свой.
 */
export function placeTasks(
  sets: readonly Built8[][],
  students: readonly string[],
  individual: boolean,
): HwTaskInput[] {
  if (!individual) {
    return (sets[0] ?? []).slice(0, MAX_TASKS).map((t, i) => ({
      ...t,
      studentId: null,
      position: i + 1,
      comment: null,
    }));
  }
  return students.flatMap((student, s) =>
    (sets[s] ?? []).slice(0, MAX_TASKS).map((t, i) => ({
      ...t,
      studentId: student,
      position: i + 1,
      comment: null,
    })),
  );
}
