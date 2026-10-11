import { isRecord } from '@/lib/trainerSession/restore';
import type { Task9 } from '@/lib/proizvodnaya/session';

/** Задания тренировки №9 в том виде, в каком их показывает экран. */
export interface Trenazher9Payload {
  tasks: Task9[];
  /** Контроль: без подсказок и решения до конца. */
  control: boolean;
}

/**
 * Задания в хранилище. Целиком тренировка весит много: лесенки подсказок
 * набраны KaTeX (около 65 КБ на задачу, 2,5 МБ на сорок). Генератор
 * детерминирован по seed, поэтому в запись идут только идентификаторы
 * «прототип|seed» и подпись каждой задачи, а задачи при входе собираются
 * заново тем же кодом, что и при старте.
 */
export interface Packed9 {
  v: 1;
  ids: string[];
  /** Подпись задачи: условие, рисунок и отпечаток ответа. Не сошлась — генератор дал другое. */
  sig: string[];
  control: boolean;
}

function isTask(value: unknown): value is Task9 {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['prototype'] === 'string' &&
    typeof value['group'] === 'string' &&
    typeof value['questionHtml'] === 'string' &&
    (value['risunok'] === null || isRecord(value['risunok'])) &&
    (value['kartinka'] === null || typeof value['kartinka'] === 'string') &&
    typeof value['seal'] === 'string' &&
    typeof value['razborHtml'] === 'string' &&
    Array.isArray(value['podskazka'])
  );
}

/** Проверка формата распакованных заданий: чужое и повреждённое отсекается. */
export function isTrenazher9Payload(value: unknown): value is Trenazher9Payload {
  return (
    isRecord(value) &&
    typeof value['control'] === 'boolean' &&
    Array.isArray(value['tasks']) &&
    value['tasks'].length > 0 &&
    value['tasks'].every(isTask)
  );
}

/* FNV-1a, 32 бита: короткая подпись, а не защита — она ловит только
   то, что генератор после обновления сайта собрал другую задачу. */
function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** Подпись задачи: условие, данные рисунка и отпечаток ответа. */
export function signature(task: Task9): string {
  return hash(`${task.questionHtml}\u0000${JSON.stringify(task.risunok)}\u0000${task.seal}`);
}

export function packTrenazher9(payload: Trenazher9Payload): Packed9 {
  return {
    v: 1,
    ids: payload.tasks.map((task) => task.id),
    sig: payload.tasks.map(signature),
    control: payload.control,
  };
}

function isPacked(value: unknown): value is Packed9 {
  if (!isRecord(value) || value['v'] !== 1 || typeof value['control'] !== 'boolean') {
    return false;
  }
  const { ids, sig } = value;
  return (
    Array.isArray(ids) &&
    Array.isArray(sig) &&
    ids.length > 0 &&
    ids.length === sig.length &&
    ids.every((id) => typeof id === 'string') &&
    sig.every((s) => typeof s === 'string')
  );
}

/**
 * Собрать задания из записи. Генератор с рисунками тяжёлый (до секунды
 * на сорок задач), поэтому грузится отдельно: оболочка тем временем
 * показывает «Возвращаем вашу тренировку…». Хоть одна задача не
 * собралась или подпись не сошлась — null: тренировка устарела.
 */
export async function unpackTrenazher9(packed: unknown): Promise<Trenazher9Payload | null> {
  if (!isPacked(packed)) {
    return null;
  }
  const { taskFromId } = await import('@/lib/proizvodnaya/session');
  const tasks: Task9[] = [];
  for (let i = 0; i < packed.ids.length; i += 1) {
    const task = taskFromId(packed.ids[i] as string);
    if (task === null || signature(task) !== packed.sig[i]) {
      return null;
    }
    tasks.push(task);
  }
  return { tasks, control: packed.control };
}

/** Перемешивание на Math.random: аналоги выбираются в браузере. */
function pick<T>(items: T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * «Похожие задачи»: на каждое задание — другой вариант банка того же
 * прототипа (у открытого банка — другая задача того же прототипа).
 * Задачи этой тренировки и уже выбранные аналоги не повторяются. Для
 * задания аналога нет — оно выпадает; не нашлось ни одного — null.
 */
export async function similarTrenazher9(
  payload: Trenazher9Payload,
  indexes: number[],
): Promise<Trenazher9Payload | null> {
  const [{ BANK }, { OPEN_BANK }, session] = await Promise.all([
    import('@/lib/proizvodnaya/bank'),
    import('@/lib/proizvodnaya/otkrytyj-bank'),
    import('@/lib/proizvodnaya/session'),
  ]);
  const used = new Set(payload.tasks.map((task) => task.id));
  const tasks: Task9[] = [];
  for (const at of indexes) {
    const source = payload.tasks[at];
    if (source === undefined) {
      continue;
    }
    const candidates: string[] = session.isOpenId(source.id)
      ? OPEN_BANK.filter((item) => item.prototype === source.prototype).map((item) =>
          session.taskId(item.prototype, `ob:${item.id}`),
        )
      : (BANK.find((entry) => entry.prototype === source.prototype)?.variants ?? []).map((v) =>
          session.taskId(source.prototype, v.seed),
        );
    const id = pick(candidates.filter((candidate) => !used.has(candidate)));
    const task = id === undefined ? null : session.taskFromId(id);
    if (id !== undefined && task !== null) {
      used.add(id);
      tasks.push(task);
    }
  }
  return tasks.length === 0 ? null : { tasks, control: payload.control };
}
