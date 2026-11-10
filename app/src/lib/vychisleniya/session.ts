'use client';

/**
 * Сессия тренажёра №8: задачи собираются в браузере.
 *
 * Сначала — задачи банка (десять зафиксированных вариантов на
 * прототип), которых ученик ещё не решал: по ним считается «решено X из
 * 260». Когда задачи банка нужного типа кончились — свежие задачи
 * генератора на новом seed. «Работа над ошибками» — всегда новые
 * аналоги той же задачи (тот же прототип и уровень, другой seed), а не
 * она сама.
 *
 * Ответ считается здесь же и тут же закрывается: в состояние экрана
 * уходит отпечаток и зашифрованный разбор, число ответа нигде не хранится.
 */

import { BANK } from './bank';
import { PROTOTYPE_NAMES, isBankTask, parseTaskId, prototypeOfTask, taskId } from './ids';
import { sealAnswer, sealText } from './secret';
import { generate, hasLevel } from './generate';
import { prototypeById } from './prototypes';
import { SKILLS, skillById, skillOfPrototype } from './skills';
import type { Level } from './types';
import { typeset } from '../tex';
import type { Mistake } from '../progressLog/model';
import type { TrainerModeId } from '@/content/trainerModes';

export interface Task8 {
  /** Идентификатор задачи: прототип, seed и уровень — по нему задача воспроизводится. */
  id: string;
  prototype: string;
  /** Навык прототипа: S1 … S11. */
  skill: string;
  level: Level;
  questionHtml: string;
  /** Отпечаток ответа. */
  seal: string;
  /** Разбор шагами (JSON), закрытый отпечатком. */
  razbor: string;
  /** Задача банка (а не свежая из генератора). */
  bank: boolean;
  /** «Работа над ошибками»: задача из «Моих ошибок», аналог которой это. */
  fixes?: string;
}

export interface Session8Request {
  /** Навыки: один или все. */
  skills: string[];
  level: Level | null;
  count: number;
  mode: TrainerModeId;
  /** Открытые ошибки (lib/progressLog → mistakes). */
  mistakes: Mistake[];
  /** Задачи, которые ученик уже закрывал: банк их не повторяет. */
  closed: ReadonlySet<string>;
}

/** Свежий seed: время и случайное число, как у сессии №12. */
export function randomSeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export { BANK_TOTAL, isBankTask, parseTaskId, prototypeOfTask, taskId } from './ids';

/** Задача по прототипу и seed, сразу в закрытом виде. */
export function makeTask(prototype: string, seed: string, level: Level | null, fixes?: string): Task8 {
  const task = generate(prototype, seed, level);
  const seal = sealAnswer(task.otvet);
  const razbor = sealText(JSON.stringify(task.razbor.map((line) => typeset(line))), seal);
  const id = taskId(prototype, seed, level);
  return {
    id,
    prototype,
    skill: skillOfPrototype(prototype)?.id ?? '',
    level: task.level,
    questionHtml: typeset(task.uslovie),
    seal,
    razbor,
    bank: isBankTask(id),
    ...(fixes === undefined ? {} : { fixes }),
  };
}

/** Задача по идентификатору. null — идентификатор не читается или генератор не справился. */
export function taskById(id: string, fixes?: string): Task8 | null {
  const parsed = parseTaskId(id);
  if (parsed === null) return null;
  try {
    return makeTask(parsed.prototype, parsed.seed, parsed.level, fixes);
  } catch {
    return null;
  }
}

/** Сколько seed пробовать на аналог, если генератор не подобрал параметры. */
const ATTEMPTS = 20;

/**
 * Аналог задачи: тот же прототип и уровень, свежий seed, условие другое.
 * avoid — условия, которые уже есть в тренировке.
 */
export function analogOf(id: string, fixes?: string, avoid: ReadonlySet<string> = new Set()): Task8 | null {
  const parsed = parseTaskId(id);
  if (parsed === null) return null;
  const source = taskById(id);
  for (let i = 0; i < ATTEMPTS; i += 1) {
    try {
      const task = makeTask(parsed.prototype, randomSeed(), parsed.level, fixes);
      if (task.questionHtml !== source?.questionHtml && !avoid.has(task.questionHtml)) return task;
    } catch {
      /* Генератор не подобрал параметры на этом seed — берём следующий. */
    }
  }
  return null;
}

/** Прототипы навыков, у которых есть нужный уровень. */
function prototypesFor(skills: string[], level: Level | null): string[] {
  const ids = skills.flatMap((id) => skillById(id)?.prototypes ?? []);
  const fit = ids.filter((id) => {
    const prototype = prototypeById(id);
    return prototype !== undefined && (level === null || hasLevel(prototype, level));
  });
  return fit.length > 0 ? fit : ids;
}

/** Перемешивание на Math.random: сессия и так собирается в браузере. */
function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** Нерешённые задачи банка прототипа под уровень, в случайном порядке. */
function bankLeft(prototype: string, level: Level | null, closed: ReadonlySet<string>): string[] {
  const entry = BANK.find((item) => item.prototype === prototype);
  if (entry === undefined) return [];
  return shuffled(
    entry.variants
      .filter((v) => level === null || v.level === null || v.level === level)
      .map((v) => taskId(prototype, v.seed, v.level))
      .filter((id) => !closed.has(id)),
  );
}

/** Сколько аналогов одной ошибки в одной тренировке: столько нужно подряд, чтобы она ушла. */
const ANALOGS_PER_MISTAKE = 2;

/**
 * «Работа над ошибками»: по каждой открытой ошибке — новые аналоги
 * (до двух), вперемешку с аналогами других ошибок, чтобы два аналога
 * одной задачи не шли рядом.
 */
export function buildMistakes8(mistakes: Mistake[], count: number): Task8[] {
  const picked = shuffled(mistakes.filter((m) => parseTaskId(m.task) !== null)).slice(
    0,
    Math.max(1, Math.ceil(count / ANALOGS_PER_MISTAKE)),
  );
  const tasks: Task8[] = [];
  const seen = new Set<string>();
  for (let round = 0; round < ANALOGS_PER_MISTAKE; round += 1) {
    for (const mistake of picked) {
      if (tasks.length >= count) break;
      const task = analogOf(mistake.task, mistake.task, seen);
      if (task !== null) {
        tasks.push(task);
        seen.add(task.questionHtml);
      }
    }
  }
  return tasks;
}

export function buildSession8(request: Session8Request): Task8[] {
  if (request.mode === 'mistakes') {
    const allowed = new Set(request.skills);
    return buildMistakes8(
      request.mistakes.filter((m) => {
        const skill = skillOfPrototype(prototypeOfTask(m.task));
        return skill !== undefined && allowed.has(skill.id);
      }),
      request.count,
    );
  }
  const prototypes = shuffled(prototypesFor(request.skills, request.level));
  if (prototypes.length === 0) {
    return [];
  }
  /* По каждому прототипу — очередь нерешённых задач банка. */
  const queues = new Map(prototypes.map((id) => [id, bankLeft(id, request.level, request.closed)]));
  const tasks: Task8[] = [];
  const seen = new Set<string>();
  let misses = 0;
  for (let i = 0; tasks.length < request.count && misses < 200; i += 1) {
    const prototype = prototypes[i % prototypes.length] as string;
    const fromBank = queues.get(prototype)?.shift();
    let task: Task8 | null = null;
    if (fromBank !== undefined) {
      task = taskById(fromBank);
    } else {
      try {
        task = makeTask(prototype, randomSeed(), request.level);
      } catch {
        task = null;
      }
    }
    if (task === null || seen.has(task.questionHtml)) {
      /* Генератор не подобрал параметры на этом seed — берём следующий. */
      misses += 1;
      continue;
    }
    seen.add(task.questionHtml);
    tasks.push(task);
  }
  return tasks;
}

/** Название типа задания для итогов и статистики по навыкам: название навыка. */
export function kindTitle(prototype: string): string {
  return skillOfPrototype(prototype)?.nazvanie ?? prototype;
}

/** Название прототипа: «Степени с одним основанием» (формулы в $…$). */
export function prototypeTitle(prototype: string): string {
  return PROTOTYPE_NAMES[prototype] ?? prototype;
}

export { SKILLS };
