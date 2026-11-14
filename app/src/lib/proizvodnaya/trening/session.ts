/**
 * Тренировка №9: ключи задач и чтение прежней записи. Сама логика
 * тренировки — общая (lib/trening/bank.ts).
 *
 * Ключ задачи — «прототип|seed» («9.2.1|9.2.1#7»), как у прежнего
 * тренажёра: по нему генератор воспроизводит задачу. Ключи со
 * случайным seed (ошибки и закладки прежних лет) тоже читаются.
 *
 * Прежний тренажёр держал незаконченную тренировку в sessionStorage
 * (budetege:proizvodnaya-9:session:v1, до закрытия вкладки), со своим
 * состоянием экрана. prezhnyayaSessiya9 переводит её в запись общего
 * тренажёра: тренировка открывается на той же задаче, режим «Контроль»
 * становится «Без подсказок и решений». Модуль чистый — без браузера.
 */

import {
  isPayloadBanka,
  razobratZapis,
  type PayloadBanka,
  type TaskBanka,
} from '@/lib/trening/bank';

/** Ключи задач №9: прототип 9.x.y, черта, seed. */
export const KLYUCH9 = /^9\.[1-5]\.\d{1,2}\|[0-9a-z.#:_-]+$/i;

/** Прототип задачи по ключу. */
export function prototipKlyucha9(id: string): string {
  return id.split('|')[0] ?? id;
}

export function isTrenazher9Payload(value: unknown): value is PayloadBanka {
  return isPayloadBanka(value, KLYUCH9);
}

/** Запись тренировки общего тренажёра (и прежний формат банка — общим разбором). */
export function razobratZapis9(packed: unknown): PayloadBanka | null {
  return razobratZapis(packed, KLYUCH9);
}

/** Ключ прежней незаконченной тренировки (sessionStorage). */
export const PREZHNYAYA_SESSIYA9_KEY = 'budetege:proizvodnaya-9:session:v1';

/** Прежняя тренировка, переведённая в запись общего тренажёра. */
export interface PerenosSessii9 {
  /** Идентификатор прежней тренировки: по нему перенос не повторяется. */
  id: string;
  payload: PayloadBanka;
  /** Состояние экрана в формате общего тренажёра (UiBanka). */
  ui: Record<string, unknown>;
  activeMs: number;
  paused: boolean;
}

function zapis(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function chislo(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

/**
 * Прочитать прежнюю запись (lib/proizvodnaya/sessionStore.ts, формат
 * v1: taskIds, items, index, seconds, paused, settings.mode). Задачи с
 * чужими ключами (открытый банк пуст) выпадают; нет задач — null.
 */
export function prezhnyayaSessiya9(raw: string | null): PerenosSessii9 | null {
  if (raw === null) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    !zapis(value) ||
    value['v'] !== 1 ||
    typeof value['id'] !== 'string' ||
    !Array.isArray(value['taskIds']) ||
    !zapis(value['settings'])
  ) {
    return null;
  }
  const items = Array.isArray(value['items']) ? (value['items'] as unknown[]) : [];
  const tasks: TaskBanka[] = [];
  const sostoyanie: Record<string, unknown>[] = [];
  (value['taskIds'] as unknown[]).forEach((id, i) => {
    if (typeof id === 'string' && KLYUCH9.test(id)) {
      tasks.push({ id, p: prototipKlyucha9(id) });
      const item = items[i];
      sostoyanie.push(zapis(item) ? item : {});
    }
  });
  if (tasks.length === 0) return null;
  const index = Math.min(Math.max(0, Math.floor(chislo(value['index']))), tasks.length - 1);
  const marks: Record<number, 'right' | 'hinted'> = {};
  const tried: Record<number, true> = {};
  let misses = 0;
  sostoyanie.forEach((item, i) => {
    if (item['mark'] === 'right' || item['mark'] === 'hinted') marks[i] = item['mark'];
    const m = Math.floor(chislo(item['misses']));
    if (m > 0) tried[i] = true;
    misses += m;
  });
  const tek = sostoyanie[index] ?? {};
  const hintStep = Math.floor(chislo(tek['hintStep']));
  return {
    id: value['id'],
    payload: {
      tasks,
      control: (value['settings'] as Record<string, unknown>)['mode'] === 'control',
      timer: true,
    },
    ui: {
      index,
      marks,
      tried,
      /* Порядок показа — как в прежней тренировке; null дал бы новую
         раскладку, и тренировка открылась бы на другой задаче. */
      order: tasks.map((_, i) => i),
      value: typeof tek['value'] === 'string' ? tek['value'] : '',
      checked: tek['checked'] === 'right' || tek['checked'] === 'wrong' ? tek['checked'] : null,
      solutionOpen: tek['solution'] === true,
      hintOpen: tek['hintOn'] === true,
      shag: hintStep + 1,
      mimo: Array.isArray(tek['hintWrong'])
        ? (tek['hintWrong'] as unknown[]).filter((n): n is number => typeof n === 'number')
        : [],
      misses,
      failed: chislo(tek['misses']) > 0,
      taskFrom: null,
      pohozhie: {},
    },
    activeMs: Math.round(chislo(value['seconds']) * 1000),
    paused: value['paused'] === true,
  };
}
