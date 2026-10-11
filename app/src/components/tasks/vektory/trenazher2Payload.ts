import { isRecord } from '@/lib/trainerSession/restore';
import { fingerprint } from '@/lib/vektory/secret';
import { makeTask, randomSeed, type Task2 } from '@/lib/vektory/session';

/** Задания тренировки №2 в том виде, в каком они лежат в сессии. */
export interface Trenazher2Payload {
  tasks: Task2[];
  /** Контроль: без подсказок и решения до конца. */
  control: boolean;
}

function isTask(value: unknown): value is Task2 {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['prototype'] === 'string' &&
    (value['gruppa'] === 'A' || value['gruppa'] === 'B' || value['gruppa'] === 'C') &&
    typeof value['questionHtml'] === 'string' &&
    (value['risunokSvg'] === null || typeof value['risunokSvg'] === 'string') &&
    typeof value['seal'] === 'string' &&
    typeof value['razbor'] === 'string'
  );
}

/** Проверка формата при чтении из хранилища: чужое и повреждённое отсекается. */
export function isTrenazher2Payload(value: unknown): value is Trenazher2Payload {
  return (
    isRecord(value) &&
    typeof value['control'] === 'boolean' &&
    Array.isArray(value['tasks']) &&
    value['tasks'].length > 0 &&
    value['tasks'].every(isTask)
  );
}

/**
 * Задания в записи сессии: идентификатор (прототип|seed) и подпись.
 * Рисунки SVG и разбор весят много, а генератор по идентификатору даёт
 * ту же задачу, поэтому хранится только рецепт.
 */
export interface Trenazher2Packed {
  control: boolean;
  /** [идентификатор, подпись] по порядку пула. */
  tasks: [string, string][];
}

/**
 * Подпись задачи: отпечаток ответа вместе с условием, рисунком и
 * разбором. Сайт обновился и генератор по тому же seed дал другое —
 * подпись не сойдётся.
 */
function signOf(task: Task2): string {
  return fingerprint(
    `${task.seal}\n${task.questionHtml}\n${task.risunokSvg ?? ''}\n${task.razbor}`,
  );
}

export function packTrenazher2(payload: Trenazher2Payload): Trenazher2Packed {
  return {
    control: payload.control,
    tasks: payload.tasks.map((task) => [task.id, signOf(task)]),
  };
}

/** Собрать задания по рецепту заново. null — рецепт не читается или задачи стали другими. */
export function unpackTrenazher2(packed: unknown): Trenazher2Payload | null {
  if (
    !isRecord(packed) ||
    typeof packed['control'] !== 'boolean' ||
    !Array.isArray(packed['tasks'])
  ) {
    return null;
  }
  const tasks: Task2[] = [];
  for (const item of packed['tasks'] as unknown[]) {
    if (!Array.isArray(item) || typeof item[0] !== 'string' || typeof item[1] !== 'string') {
      return null;
    }
    const [id, sign] = item as [string, string];
    const [prototype, seed] = id.split('|');
    if (prototype === undefined || seed === undefined) {
      return null;
    }
    let task: Task2;
    try {
      task = makeTask(prototype, seed);
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
 * «Похожие задачи»: те же прототипы, свежие seed. Как при сборке
 * сессии: seed, на котором генератор не справился, заменяется
 * следующим; задача, совпавшая условием с исходной, — тоже.
 */
export function similarTrenazher2(
  payload: Trenazher2Payload,
  indexes: number[],
): Trenazher2Payload | null {
  const tasks = indexes.flatMap((at) => {
    const source = payload.tasks[at];
    if (source === undefined) {
      return [];
    }
    for (let i = 0; i < ATTEMPTS; i += 1) {
      try {
        const task = makeTask(source.prototype, randomSeed());
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
