'use client';

/**
 * Сессия тренажёра №8: задачи со свежими числами, собранные в браузере.
 *
 * Генератор детерминирован по seed, новый seed — новые числа. Ответ
 * считается здесь же и тут же закрывается: в состояние экрана уходит
 * отпечаток и зашифрованный разбор, число ответа нигде не хранится.
 */

import { sealAnswer, sealText } from './secret';
import { generate, hasLevel } from './generate';
import { prototypeById } from './prototypes';
import { SKILLS, skillById, skillOfPrototype } from './skills';
import type { Level } from './types';
import { typeset } from '../tex';
import type { TrainerModeId } from '@/content/trainerModes';

export interface Task8 {
  /** Идентификатор задачи: прототип, seed и уровень — по нему задача воспроизводится. */
  id: string;
  prototype: string;
  /** Навык прототипа: S1 … S11. */
  skill: string;
  level: Level;
  /**
   * Подтип прототипа («1», «brackets»): по нему подбираются подписи
   * шагов (content/vychisleniya8/tipy.ts). У записей до редизайна нет —
   * тогда подписи общие для прототипа.
   */
  podtip?: string;
  questionHtml: string;
  /** Отпечаток ответа. */
  seal: string;
  /** Разбор строками HTML, закрытый отпечатком. */
  razbor: string;
}

export interface Session8Request {
  /** Навыки: один или все. */
  skills: string[];
  level: Level | null;
  count: number;
  mode: TrainerModeId;
  /** История ошибок: идентификаторы задач. */
  mistakes: string[];
}

/** Свежий seed: время и случайное число, как у сессии №12. */
export function randomSeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function taskId(prototype: string, seed: string, level: Level | null): string {
  return `${prototype}|${seed}|${level ?? 'any'}`;
}

/** Задача по прототипу и seed, сразу в закрытом виде. */
export function makeTask(prototype: string, seed: string, level: Level | null): Task8 {
  const task = generate(prototype, seed, level);
  const seal = sealAnswer(task.otvet);
  const razbor = sealText(JSON.stringify(task.razbor.map((line) => typeset(line))), seal);
  return {
    id: taskId(prototype, seed, level),
    prototype,
    skill: skillOfPrototype(prototype)?.id ?? '',
    level: task.level,
    podtip: task.podtip,
    questionHtml: typeset(task.uslovie),
    seal,
    razbor,
  };
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

export function buildSession8(request: Session8Request): Task8[] {
  if (request.mode === 'mistakes') {
    const allowed = new Set(request.skills);
    const own = request.mistakes.filter((id) => {
      const prototype = id.split('|')[0] ?? '';
      const skill = skillOfPrototype(prototype);
      return skill !== undefined && allowed.has(skill.id);
    });
    return shuffled(own)
      .slice(0, request.count)
      .flatMap((id) => {
        const [prototype, seed, level] = id.split('|');
        if (prototype === undefined || seed === undefined) {
          return [];
        }
        try {
          return [
            makeTask(prototype, seed, level === 'base' || level === 'advanced' ? level : null),
          ];
        } catch {
          return [];
        }
      });
  }
  const prototypes = shuffled(prototypesFor(request.skills, request.level));
  if (prototypes.length === 0) {
    return [];
  }
  const tasks: Task8[] = [];
  for (let i = 0; i < request.count; i += 1) {
    const prototype = prototypes[i % prototypes.length] as string;
    try {
      tasks.push(makeTask(prototype, randomSeed(), request.level));
    } catch {
      /* Генератор не подобрал параметры на этом seed — берём следующий. */
      i -= 1;
    }
  }
  return tasks;
}

/** Название типа задания для статистики: название навыка. */
export function kindTitle(prototype: string): string {
  return skillOfPrototype(prototype)?.nazvanie ?? prototype;
}

/* ── Сборка по прототипам: тренажёр после редизайна ──────────────
   Выбор тем идёт по типам (прототипам), а не по навыкам; уровень не
   выбирается — подтипы обоих уровней вперемешку. */

/** Сколько попыток подобрать seed на одну задачу. */
const ATTEMPTS = 20;

/** Свежая задача прототипа: seed, на котором генератор не справился, заменяется следующим. */
export function freshTask(prototype: string, level: Level | null = null): Task8 | null {
  for (let i = 0; i < ATTEMPTS; i += 1) {
    try {
      return makeTask(prototype, randomSeed(), level);
    } catch {
      /* Параметры не подобрались — следующий seed. */
    }
  }
  return null;
}

/**
 * Тренировка из прототипов: задачи идут по кругу по перемешанному
 * списку, числа у каждой свои. Условия не повторяются в пределах
 * тренировки.
 */
export function buildByPrototypes(prototypes: string[], count: number): Task8[] {
  const order = shuffled(prototypes.filter((id) => prototypeById(id) !== undefined));
  if (order.length === 0) {
    return [];
  }
  const tasks: Task8[] = [];
  const seen = new Set<string>();
  let misses = 0;
  while (tasks.length < count && misses < count * ATTEMPTS) {
    const prototype = order[(tasks.length + misses) % order.length] as string;
    const task = freshTask(prototype);
    if (task === null || seen.has(task.questionHtml)) {
      misses += 1;
      continue;
    }
    seen.add(task.questionHtml);
    tasks.push(task);
  }
  return tasks;
}

/** Прототип задачи по её идентификатору «8.A|seed|base». */
export function prototypeOfTaskId(id: string): string {
  return id.split('|')[0] ?? id;
}

/**
 * Уровень, с которым задача была собрана, по идентификатору: «any» —
 * уровень не задавался (null). Похожая задача собирается с тем же
 * условием на уровень, что и исходная, а не с уровнем её подтипа.
 */
export function levelOfTaskId(id: string): Level | null {
  const level = id.split('|')[2];
  return level === 'base' || level === 'advanced' ? level : null;
}

/**
 * Типы, где были ошибки: по списку ошибочных задач из прогресса,
 * без повторов, самые свежие первыми.
 */
export function mistakePrototypes(mistakes: readonly string[]): string[] {
  const out: string[] = [];
  for (let i = mistakes.length - 1; i >= 0; i -= 1) {
    const prototype = prototypeOfTaskId(mistakes[i] as string);
    if (!out.includes(prototype) && prototypeById(prototype) !== undefined) {
      out.push(prototype);
    }
  }
  return out;
}

export { SKILLS };
