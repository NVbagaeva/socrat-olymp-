import { isRecord } from '@/lib/trainerSession/restore';
import { fingerprint } from '@/lib/vychisleniya/secret';
import { makeTask, randomSeed, type Task8 } from '@/lib/vychisleniya/session';
import type { Level } from '@/lib/vychisleniya/types';

/** Задания тренировки №8 в том виде, в каком они лежат в сессии. */
export interface Trenazher8Payload {
  tasks: Task8[];
  /** Контроль: без решения и подсказок до конца. */
  control: boolean;
}

function isTask(value: unknown): value is Task8 {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['prototype'] === 'string' &&
    typeof value['skill'] === 'string' &&
    (value['level'] === 'base' || value['level'] === 'advanced') &&
    typeof value['questionHtml'] === 'string' &&
    typeof value['seal'] === 'string' &&
    typeof value['razbor'] === 'string'
  );
}

/** Проверка формата при чтении из хранилища: чужое и повреждённое отсекается. */
export function isTrenazher8Payload(value: unknown): value is Trenazher8Payload {
  return (
    isRecord(value) &&
    typeof value['control'] === 'boolean' &&
    Array.isArray(value['tasks']) &&
    value['tasks'].length > 0 &&
    value['tasks'].every(isTask)
  );
}

/**
 * Задания в записи сессии: идентификатор (прототип|seed|уровень) и
 * подпись. Разбор и условие весят много (KaTeX), а генератор по
 * идентификатору даёт ту же задачу, поэтому хранится только рецепт.
 */
export interface Trenazher8Packed {
  control: boolean;
  /** [идентификатор, подпись] по порядку пула. */
  tasks: [string, string][];
}

/**
 * Подпись задачи: отпечаток ответа вместе с условием и разбором. Сайт
 * обновился и генератор по тому же seed дал другое — подпись не сойдётся.
 */
function signOf(task: Task8): string {
  return fingerprint(`${task.seal}\n${task.questionHtml}\n${task.razbor}`);
}

/** Уровень из идентификатора задачи: «any» — уровень не задавался. */
function levelOfId(level: string | undefined): Level | null {
  return level === 'base' || level === 'advanced' ? level : null;
}

export function packTrenazher8(payload: Trenazher8Payload): Trenazher8Packed {
  return {
    control: payload.control,
    tasks: payload.tasks.map((task) => [task.id, signOf(task)]),
  };
}

/** Собрать задания по рецепту заново. null — рецепт не читается или задачи стали другими. */
export function unpackTrenazher8(packed: unknown): Trenazher8Payload | null {
  if (
    !isRecord(packed) ||
    typeof packed['control'] !== 'boolean' ||
    !Array.isArray(packed['tasks'])
  ) {
    return null;
  }
  const tasks: Task8[] = [];
  for (const item of packed['tasks'] as unknown[]) {
    if (!Array.isArray(item) || typeof item[0] !== 'string' || typeof item[1] !== 'string') {
      return null;
    }
    const [id, sign] = item as [string, string];
    const [prototype, seed, level] = id.split('|');
    if (prototype === undefined || seed === undefined) {
      return null;
    }
    let task: Task8;
    try {
      task = makeTask(prototype, seed, levelOfId(level));
    } catch {
      return null;
    }
    if (task.id !== id || signOf(task) !== sign) {
      return null;
    }
    tasks.push(task);
  }
  return tasks.length === 0 ? null : { control: packed['control'], tasks };
}

/** Сколько seed пробовать на одну задачу, если генератор не подобрал параметры. */
const ATTEMPTS = 20;

/**
 * «Похожие задачи»: те же прототипы и уровни, свежие seed. Как при
 * сборке сессии: seed, на котором генератор не справился, заменяется
 * следующим; задача, совпавшая условием с исходной, — тоже.
 */
export function similarTrenazher8(
  payload: Trenazher8Payload,
  indexes: number[],
): Trenazher8Payload | null {
  const tasks = indexes.flatMap((at) => {
    const source = payload.tasks[at];
    if (source === undefined) {
      return [];
    }
    for (let i = 0; i < ATTEMPTS; i += 1) {
      try {
        const task = makeTask(source.prototype, randomSeed(), source.level);
        if (task.questionHtml !== source.questionHtml) {
          return [task];
        }
      } catch {
        /* Генератор не подобрал параметры на этом seed — берём следующий. */
      }
    }
    return [];
  });
  return tasks.length === 0 ? null : { ...payload, tasks };
}
