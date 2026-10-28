/**
 * Работа-вариант из кабинета (этап 2) для экрана решения.
 *
 * Условия приходят с сервера (variant_work_tasks) — без ответа и без
 * подсказок: ключ лежит в variant_work_keys и в браузер до завершения не
 * попадает. Экран решения работает с теми же `VariantTask`, что и у
 * варианта по коду, только `answer` пуст, а разбора нет: он
 * открывается после завершения — партия собирается по тому же коду
 * (`withSolutions`).
 */

import type { KabinetApi } from '@/lib/kabinet/api';
import type { VariantStart, VariantWorkTask, VariantWorkView } from '@/lib/kabinet/types';
import { razdelitSvg } from '@/lib/stereo/zhivoy';
import { isRecord } from '@/lib/trainerSession/restore';
import type { EgeNo, VariantTask } from '../types';
import type { WorkLink } from './link';
import type { WorkPayload } from './sessionUi';
import { loadSet, tasksSignature } from './work';

/** Ссылка на работу из кабинета. */
export function rabotaHref(workId: string, variant: number): string {
  return `/variant/reshat/?${new URLSearchParams({ rabota: workId, v: String(variant) }).toString()}`;
}

/** Ключ сессии решения работы из кабинета. */
export function rabotaScope(workId: string, variant: number): string {
  return `variant:kab:${workId}:${variant}`;
}

/** Задание с сервера → задача экрана (без ответа и разбора). */
export function taskOf(t: VariantWorkTask): VariantTask {
  return {
    egeNumber: t.egeNo as EgeNo,
    taskId: t.taskRef,
    prototypeId: t.prototypeId,
    subtype: t.subtype,
    source: { kind: 'own', label: '' },
    difficulty: null,
    statement: t.statement,
    figure: t.figure === null ? null : razdelitSvg(t.figure),
    figureTeacher: null,
    answer: '',
    answerHtml: '',
    solutionTeacher: null,
    solutionStudent: null,
    fallbacks: [],
    ref: { position: t.position },
  };
}

/**
 * Ссылка экрана по работе: режим, таймер, тип и код партии — из работы.
 * Номер варианта — в партии (setVariants): по нему собираются разборы и
 * «Работа над ошибками».
 */
export function linkOf(view: VariantWorkView, variant: number): WorkLink {
  const w = view.work;
  return {
    code: w.setCode,
    variant: w.setVariants[variant - 1] ?? variant,
    mode: w.mode,
    timer: w.timer,
    kind: w.kind,
    title: w.kind === 'custom' ? w.title : '',
  };
}

function draftOf(raw: Record<string, unknown>): WorkPayload['draft'] {
  const pick = (v: unknown): Record<number, string> => {
    const out: Record<number, string> = {};
    if (isRecord(v)) {
      for (const [k, x] of Object.entries(v))
        if (/^\d+$/.test(k) && typeof x === 'string') out[Number(k)] = x;
    }
    return out;
  };
  const times: Record<number, number> = {};
  if (isRecord(raw['times'])) {
    for (const [k, x] of Object.entries(raw['times'])) {
      if (/^\d+$/.test(k) && typeof x === 'number' && x >= 0) times[Number(k)] = x;
    }
  }
  return {
    answers: pick(raw['answers']),
    later: Array.isArray(raw['later'])
      ? raw['later'].filter((x): x is number => typeof x === 'number')
      : [],
    times,
  };
}

/** Задания работы и начатая попытка → задания сессии решения. */
export function kabinetPayload(
  view: VariantWorkView,
  variant: number,
  start: VariantStart,
): WorkPayload {
  const link = linkOf(view, variant);
  const tasks = (view.tasks[variant - 1] ?? []).map(taskOf);
  const w = view.work;
  return {
    ...link,
    tasks,
    oshibki: null,
    sig: tasksSignature(tasks),
    kabinet: { workId: w.id, attemptId: start.attemptId, variant },
    ...(start.deadlineAt !== null && w.timer.kind === 'down'
      ? { startedAt: Date.parse(start.deadlineAt) - w.timer.minutes * 60_000 }
      : {}),
    draft: draftOf(start.draft),
  };
}

/** В хранилище — только адрес работы и попытка. */
export interface PackedKabinet {
  kab: 1;
  workId: string;
  variant: number;
}

export function packKabinet(p: WorkPayload): PackedKabinet {
  return { kab: 1, workId: p.kabinet?.workId ?? '', variant: p.kabinet?.variant ?? 1 };
}

/** Собрать задания заново: работа с сервера и та же незавершённая попытка. */
export async function unpackKabinet(api: KabinetApi, packed: unknown): Promise<WorkPayload | null> {
  if (!isRecord(packed) || packed['kab'] !== 1 || typeof packed['workId'] !== 'string') return null;
  const variant = Number(packed['variant']);
  try {
    const view = await api.variantWork(packed['workId']);
    if (view === null) return null;
    const start = await api.variantStart(view.work.id, variant);
    return kabinetPayload(view, variant, start);
  } catch {
    return null;
  }
}

/**
 * Разборы после завершения: партия по тому же коду — те же задачи. Где
 * задача не совпала (сайт обновился), разбора нет.
 */
export async function withSolutions(
  tasks: readonly VariantTask[],
  code: string,
  variant: number,
): Promise<VariantTask[]> {
  try {
    const loaded = await loadSet(code);
    const local = loaded?.set.variants[variant - 1]?.tasks ?? [];
    return tasks.map((t) => {
      const same = local.find((x) => x.egeNumber === t.egeNumber && x.taskId === t.taskId);
      return same === undefined
        ? t
        : { ...t, solutionStudent: same.solutionStudent, answer: same.answer };
    });
  } catch {
    return [...tasks];
  }
}
