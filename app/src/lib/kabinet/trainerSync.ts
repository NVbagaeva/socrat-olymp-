'use client';

/**
 * Тренировки в кабинете.
 *
 * Сессия тренажёра живёт в хранилище тренажёров (lib/trainerSession):
 * пишется при каждом действии и не сбрасывается при переходе между
 * разделами. Здесь — то, что к этому добавляет кабинет:
 *
 *   - список незавершённых тренировок, «Поставить на паузу» и
 *     «Завершить тренировку» — через то же хранилище: открытая вкладка
 *     тренажёра увидит паузу или конец (событие storage);
 *   - завершённая тренировка записывается ученику (попытки и строка
 *     сессии) — отсюда прогресс по №1–20 и выполнение ДЗ;
 *   - «Решать» из ДЗ запоминает контекст: попытки тренировки этого
 *     номера идут в ДЗ.
 *
 * Гость тренируется как раньше: без вошедшего ученика ничего не пишется,
 * а код кабинета даже не загружается (динамический import).
 */

import {
  clearSession,
  encodeSession,
  readSession,
  TAB_ID,
  writeRaw,
} from '@/lib/trainerSession/store';
import type { BaseUi, TaskMark } from '@/lib/trainerSession/types';
import { currentStudentId } from './localDb';
import { taskNoOfScope } from './scope';
import type { AttemptInput, AttemptOutcome, SessionResultInput } from './types';

const DZ_KEY = 'budetege:kabinet:dz';
/** Сколько живёт контекст «решаю ДЗ» после нажатия «Решать». */
const DZ_TTL = 12 * 60 * 60 * 1000;

interface DzContext {
  homeworkId: string;
  taskNo: number;
  at: number;
}

/** «Решать» в ДЗ: следующие тренировки этого номера считаются в ДЗ. */
export function setHomeworkContext(homeworkId: string, taskNo: number): void {
  try {
    window.localStorage.setItem(DZ_KEY, JSON.stringify({ homeworkId, taskNo, at: Date.now() }));
  } catch {
    /* Без хранилища тренировка просто не попадёт в ДЗ. */
  }
}

export function homeworkContextFor(taskNo: number | null): string | null {
  try {
    const raw = window.localStorage.getItem(DZ_KEY);
    if (raw === null || taskNo === null) return null;
    const ctx = JSON.parse(raw) as Partial<DzContext>;
    return ctx.taskNo === taskNo &&
      typeof ctx.homeworkId === 'string' &&
      typeof ctx.at === 'number' &&
      Date.now() - ctx.at < DZ_TTL
      ? ctx.homeworkId
      : null;
  } catch {
    return null;
  }
}

/** Итог задания так же, как его считают итоги тренажёра. */
function outcomeOf(mark: TaskMark | 'wrong' | 'skipped' | undefined): AttemptOutcome | null {
  return mark === 'right' || mark === 'hinted' || mark === 'wrong' ? mark : null;
}

async function save(result: SessionResultInput): Promise<void> {
  const { kabinetApi } = await import('./client');
  await kabinetApi().saveSessionResult(result);
}

/**
 * Тренажёр завершил тренировку (оболочка TrainerSessionHost). Пишет
 * попытки, если в этом браузере вошёл ученик кабинета.
 */
export function reportTrainerFinished(
  scope: string,
  sessionId: string,
  items: readonly { mark: string; code?: string | undefined }[],
  seconds: number,
): void {
  const taskNo = taskNoOfScope(scope);
  if (taskNo === null || currentStudentId() === null) return;
  const homeworkId = homeworkContextFor(taskNo);
  const attempts: AttemptInput[] = items.flatMap((item) => {
    const outcome = outcomeOf(item.mark as TaskMark);
    return outcome === null
      ? []
      : [
          {
            taskNo,
            prototypeCode: null,
            taskRef: item.code ?? null,
            outcome,
            timeMs: null,
            homeworkId,
            sessionId,
          },
        ];
  });
  void save({
    id: sessionId,
    scope,
    total: items.length,
    activeMs: seconds * 1000,
    homeworkId,
    attempts,
  }).catch(() => {
    /* Прогресс не сохранился (например, ждём согласия родителя) — итоги тренажёра на экране остаются. */
  });
}

/** Незавершённая тренировка — для списка в кабинете. */
export interface OpenSession {
  scope: string;
  id: string;
  paused: boolean;
  total: number;
  solved: number;
  activeMs: number;
  updatedAt: number;
}

function uiOf(value: unknown): BaseUi | null {
  if (typeof value !== 'object' || value === null) return null;
  const ui = value as Partial<BaseUi>;
  return typeof ui.marks === 'object' && ui.marks !== null ? (ui as BaseUi) : null;
}

export function openSession(scope: string): OpenSession | null {
  const read = readSession(scope);
  if (read.status !== 'ok') return null;
  const s = read.session;
  const ui = uiOf(s.ui);
  return {
    scope,
    id: s.id,
    paused: s.paused,
    total: ui?.order?.length ?? s.total,
    solved: ui === null ? 0 : Object.keys(ui.marks).length,
    activeMs: s.activeMs,
    updatedAt: s.updatedAt,
  };
}

/** «Поставить на паузу» из кабинета: та же запись, отметка паузы. */
export function pauseTrainerSession(scope: string): boolean {
  const read = readSession(scope);
  if (read.status !== 'ok') return false;
  const s = read.session;
  if (s.paused) return true;
  const raw = encodeSession(
    { ...s, paused: true, rev: s.rev + 1, writer: TAB_ID, updatedAt: Date.now() },
    JSON.stringify(s.ui ?? null),
    JSON.stringify(s.payload),
  );
  return writeRaw(scope, raw) === 'ok';
}

/**
 * «Завершить тренировку» из кабинета: решённое записывается ученику,
 * запись тренажёра удаляется — как кнопка «Завершить» в самом тренажёре.
 */
export async function finishTrainerSession(scope: string): Promise<void> {
  const read = readSession(scope);
  if (read.status !== 'ok') return;
  const s = read.session;
  const ui = uiOf(s.ui);
  const total = ui?.order?.length ?? s.total;
  const items = Array.from({ length: total }, (_, i) => ({
    mark: ui?.marks[i] ?? (ui?.tried[i] === true ? 'wrong' : 'skipped'),
  }));
  reportTrainerFinished(scope, s.id, items, Math.round(s.activeMs / 1000));
  clearSession(scope);
}
