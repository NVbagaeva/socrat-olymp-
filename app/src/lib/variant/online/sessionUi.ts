/**
 * Онлайн-вариант в общей сессии тренажёров (TrainerSessionHost):
 * задания, их упаковка для localStorage и состояние экрана.
 *
 * В хранилище — только рецепт: код партии, номер варианта, режим и
 * таймер (и номера заданий для «Работы над ошибками»). Задачи с
 * рисунками и разборами собираются заново по коду — тем же кодом, что
 * при старте, — и сверяются по подписи. Не сошлась (сайт обновился) —
 * сессия сбрасывается как устаревшая.
 */

import { asNumber, asNumberList, asStringRecord, isRecord } from '@/lib/trainerSession/restore';
import type { BaseUi } from '@/lib/trainerSession/types';
import { readChast2, type Chast2Ui } from '@/lib/chast2/sostoyanie';
import { naborRazdela } from '@/lib/povyshennye/razdely';
import type { Chast2Zadacha } from '@/lib/povyshennye/chast2/types';
import type { HintStep, VariantTask } from '../types';
import type { Mode, Timer } from './link';
import { loadSet, oshibkiTasks, tasksSignature } from './work';

export interface WorkPayload {
  code: string;
  variant: number;
  mode: Mode;
  timer: Timer;
  kind: string;
  title: string;
  tasks: VariantTask[];
  /**
   * «Работа над ошибками»: номера неверных заданий исходного варианта и
   * для каждой задачи — из какого задания она и аналог ли. null — вариант.
   */
  oshibki: { wrong: number[]; from: number[]; analog: boolean[] } | null;
  sig: string;
  /**
   * Работа, выданная через кабинет: проверка на сервере. Задачи — условия
   * с сервера, без ответов и подсказок.
   */
  kabinet?: { workId: string; attemptId: string; /** Номер варианта в работе. */ variant: number };
  /** Начало работы по часам сервера (отсчёт контрольной). */
  startedAt?: number;
  /**
   * Часть 2 (задания 14–20) — у вариантов повышенной сложности. Как и
   * часть 1, собирается заново по коду и номеру версии.
   */
  chast2?: Chast2Zadacha[];
  /** Черновик с сервера — продолжить на другом устройстве. */
  draft?: { answers?: Record<number, string>; later?: number[]; times?: Record<number, number> };
}

interface PackedWork {
  work: 1;
  code: string;
  variant: number;
  mode: Mode;
  timer: Timer;
  kind: string;
  title: string;
  wrong: number[] | null;
  sig: string;
}

export function isWorkPayload(value: unknown): value is WorkPayload {
  return (
    isRecord(value) &&
    typeof value['code'] === 'string' &&
    typeof value['variant'] === 'number' &&
    (value['mode'] === 'trening' || value['mode'] === 'kontrol') &&
    Array.isArray(value['tasks']) &&
    value['tasks'].length > 0
  );
}

export function packWork(p: WorkPayload): PackedWork {
  return {
    work: 1,
    code: p.code,
    variant: p.variant,
    mode: p.mode,
    timer: p.timer,
    kind: p.kind,
    title: p.title,
    wrong: p.oshibki?.wrong ?? null,
    sig: p.sig,
  };
}

function readTimer(v: unknown): Timer {
  if (isRecord(v) && v['kind'] === 'up') return { kind: 'up' };
  if (isRecord(v) && v['kind'] === 'down' && typeof v['minutes'] === 'number') {
    return { kind: 'down', minutes: v['minutes'] };
  }
  return { kind: 'none' };
}

/** Задания варианта или «Работы над ошибками» по коду партии. */
export async function buildWork(
  base: Omit<WorkPayload, 'tasks' | 'oshibki' | 'sig'>,
  wrong: number[] | null,
): Promise<WorkPayload | null> {
  const loaded = await loadSet(base.code);
  if (loaded === null) return null;
  const tasks = loaded.set.variants[base.variant - 1]?.tasks;
  if (tasks === undefined || tasks.length === 0) return null;
  if (wrong === null) {
    const nabor = naborRazdela(base.code);
    const chast2 =
      nabor === null
        ? null
        : await import('@/lib/povyshennye/nabor').then((m) => m.naborChast2(nabor, base.variant));
    return {
      ...base,
      tasks,
      oshibki: null,
      sig: tasksSignature(tasks),
      ...(chast2 === null ? {} : { chast2 }),
    };
  }
  const items = await oshibkiTasks(loaded.set, base.variant, wrong);
  if (items.length === 0) return null;
  const list = items.map((i) => i.task);
  return {
    ...base,
    mode: 'trening',
    tasks: list,
    oshibki: { wrong, from: items.map((i) => i.from), analog: items.map((i) => i.analog) },
    sig: tasksSignature(list),
  };
}

export async function unpackWork(packed: unknown): Promise<WorkPayload | null> {
  if (!isRecord(packed) || packed['work'] !== 1 || typeof packed['code'] !== 'string') return null;
  const wrong = Array.isArray(packed['wrong']) ? asNumberList(packed['wrong']) : null;
  const built = await buildWork(
    {
      code: packed['code'],
      variant: asNumber(packed['variant'], 1),
      mode: packed['mode'] === 'kontrol' ? 'kontrol' : 'trening',
      timer: readTimer(packed['timer']),
      kind: typeof packed['kind'] === 'string' ? packed['kind'] : 'ege',
      title: typeof packed['title'] === 'string' ? packed['title'] : '',
    },
    wrong,
  );
  return built !== null && built.sig === packed['sig'] ? built : null;
}

/* ── Состояние экрана ───────────────────────────────────────────── */

export type Check = 'right' | 'wrong';

export interface WorkUi extends BaseUi {
  /** Ответ (контрольная) или первая попытка (тренировка) — как ввёл ученик. */
  answers: Record<number, string>;
  /** Тренировка: вторая попытка. */
  second: Record<number, string>;
  /** Тренировка: проверка первой и второй попытки. */
  v1: Record<number, Check>;
  v2: Record<number, Check>;
  /** «Вернусь позже». */
  later: number[];
  /** Тренировка: открывал подсказку. */
  hinted: number[];
  /** Сколько шагов разбора открыто подсказкой (разделы без вопросов). */
  steps: Record<number, number>;
  /** Подсказки, присланные сервером с первой ошибкой. */
  srvHints: Record<number, HintStep[]>;
  /** Время на задание, мс активного времени. */
  times: Record<number, number>;
  /** Начало работы, мс по часам: для таймера контрольной. */
  startedAt: number;
  /** Часть 2: ответы по пунктам, сверка, открытые решения, самооценка. */
  c2?: Chast2Ui;
}

function checks(v: unknown): Record<number, Check> {
  const out: Record<number, Check> = {};
  for (const [k, x] of Object.entries(asStringRecord(v))) {
    if (x === 'right' || x === 'wrong') out[Number(k)] = x;
  }
  return out;
}

function numbers(v: unknown): Record<number, number> {
  const out: Record<number, number> = {};
  if (!isRecord(v)) return out;
  for (const [k, x] of Object.entries(v)) {
    if (typeof x === 'number' && Number.isFinite(x) && x >= 0 && /^\d+$/.test(k))
      out[Number(k)] = x;
  }
  return out;
}

function strings(v: unknown): Record<number, string> {
  const out: Record<number, string> = {};
  for (const [k, x] of Object.entries(asStringRecord(v))) {
    if (/^\d+$/.test(k)) out[Number(k)] = x.slice(0, 40);
  }
  return out;
}

function hintsOf(v: unknown): Record<number, HintStep[]> {
  const out: Record<number, HintStep[]> = {};
  if (!isRecord(v)) return out;
  for (const [k, list] of Object.entries(v)) {
    if (!/^\d+$/.test(k) || !Array.isArray(list)) continue;
    const ok = list.filter(
      (h): h is HintStep =>
        isRecord(h) &&
        typeof h['question'] === 'string' &&
        Array.isArray(h['options']) &&
        h['options'].every((o) => typeof o === 'string') &&
        typeof h['correct'] === 'number',
    );
    if (ok.length > 0) out[Number(k)] = ok.map((h) => ({ ...h, comment: h.comment ?? null }));
  }
  return out;
}

/** Состояние экрана из хранилища: что не прочиталось — по умолчанию. */
export function readWorkUi(base: BaseUi): WorkUi {
  const raw = base as unknown as Record<string, unknown>;
  return {
    index: base.index,
    marks: base.marks,
    tried: base.tried,
    order: null,
    answers: strings(raw['answers']),
    second: strings(raw['second']),
    v1: checks(raw['v1']),
    v2: checks(raw['v2']),
    later: asNumberList(raw['later']),
    hinted: asNumberList(raw['hinted']),
    steps: numbers(raw['steps']),
    srvHints: hintsOf(raw['srvHints']),
    times: numbers(raw['times']),
    startedAt: asNumber(raw['startedAt'], Date.now()),
    ...(raw['c2'] === undefined ? {} : { c2: readChast2(raw['c2']) }),
  };
}
