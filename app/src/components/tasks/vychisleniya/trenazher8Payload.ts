import { isRecord } from '@/lib/trainerSession/restore';
import { fingerprint } from '@/lib/vychisleniya/secret';
import { analogOf, parseTaskId, taskById, type Task8 } from '@/lib/vychisleniya/session';

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
    typeof value['razbor'] === 'string' &&
    typeof value['bank'] === 'boolean' &&
    (value['fixes'] === undefined || typeof value['fixes'] === 'string')
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
  /**
   * [идентификатор, подпись] по порядку пула; у аналога из «Работы над
   * ошибками» третьим — задача, ошибку в которой он закрывает.
   */
  tasks: ([string, string] | [string, string, string])[];
}

/**
 * Подпись задачи: отпечаток ответа вместе с условием и разбором. Сайт
 * обновился и генератор по тому же seed дал другое — подпись не сойдётся.
 */
function signOf(task: Task8): string {
  return fingerprint(`${task.seal}\n${task.questionHtml}\n${task.razbor}`);
}

export function packTrenazher8(payload: Trenazher8Payload): Trenazher8Packed {
  return {
    control: payload.control,
    tasks: payload.tasks.map((task) =>
      task.fixes === undefined ? [task.id, signOf(task)] : [task.id, signOf(task), task.fixes],
    ),
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
    if (
      !Array.isArray(item) ||
      typeof item[0] !== 'string' ||
      typeof item[1] !== 'string' ||
      (item[2] !== undefined && typeof item[2] !== 'string')
    ) {
      return null;
    }
    const [id, sign, fixes] = item as [string, string, string | undefined];
    if (parseTaskId(id) === null) {
      return null;
    }
    const task = taskById(id, fixes);
    if (task === null || task.id !== id || signOf(task) !== sign) {
      return null;
    }
    tasks.push(task);
  }
  return tasks.length === 0 ? null : { control: packed['control'], tasks };
}

/**
 * «Похожие задачи» на итогах: те же прототипы и уровни, свежие seed.
 * Аналог задачи с ошибкой закрывает её в «Моих ошибках»: он помнит,
 * к какой ошибке относится (у аналога аналога — к той же исходной).
 */
export function similarTrenazher8(
  payload: Trenazher8Payload,
  indexes: number[],
): Trenazher8Payload | null {
  const seen = new Set<string>();
  const tasks = indexes.flatMap((at) => {
    const source = payload.tasks[at];
    if (source === undefined) {
      return [];
    }
    const task = analogOf(source.id, source.fixes ?? source.id, seen);
    if (task === null) {
      return [];
    }
    seen.add(task.questionHtml);
    return [task];
  });
  return tasks.length === 0 ? null : { ...payload, tasks };
}
