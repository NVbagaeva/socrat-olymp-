/**
 * Онлайн-вариант из кода партии: тот же `VariantSet`, что у печатного
 * листа, — тот же код, те же задачи по порядку. Плюс серия (партия без
 * повторов) и «Работа над ошибками» (неверные задания и аналоги того
 * же прототипа с другими числами).
 */

import { rngOf } from '@/lib/vychisleniya/rng';
import { loadAdapters } from '../load';
import { buildSet, currentVersion, readCode } from '../session';
import type { EgeNo, SectionAdapter, VariantSet, VariantTask } from '../types';

export interface LoadedSet {
  set: VariantSet;
  /** Код собран другой версией генератора: задачи могут отличаться. */
  outdated: boolean;
  /** Задания, раздел которых не загрузился. */
  failed: EgeNo[];
}

/** Собрать партию по коду. null — код не читается. */
export async function loadSet(code: string): Promise<LoadedSet | null> {
  const d = readCode(code);
  if (d === null) return null;
  const built = await buildSet(d.config, d.seed, d.zameny);
  return {
    /* Код — тот, по которому открыли: ссылка ученика и код на листе
       совпадают, даже если генератор с тех пор обновился. */
    set: { ...built.set, code },
    outdated: d.version !== currentVersion(),
    failed: built.failed,
  };
}

/** Подпись набора задач: по ней сессия узнаёт, что задачи изменились. */
export function tasksSignature(tasks: readonly VariantTask[]): string {
  let h = 0x811c9dc5;
  for (const ch of tasks.map((t) => `${t.taskId}=${t.answer}`).join('|')) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/* ── Серия ──────────────────────────────────────────────────────── */

export const SERIES_DEFAULT = 10;

/**
 * Задания, где в серии нашёлся повтор: пул раздела кончился и сборщик
 * взял задачу второй раз (пометка `repeat`). В серии повторов быть не
 * должно — экран просит уменьшить число вариантов или расширить фильтры.
 */
export function seriesRepeats(set: VariantSet): EgeNo[] {
  const out = new Set<EgeNo>();
  /* Номера задач у разделов свои: «F139» бывает и в №7, и в №10. */
  const seen = new Set<string>();
  for (const v of set.variants) {
    for (const t of v.tasks) {
      const key = `${t.egeNumber}:${t.taskId}`;
      if (t.fallbacks.some((f) => f.field === 'repeat') || seen.has(key)) out.add(t.egeNumber);
      seen.add(key);
    }
  }
  return [...out].sort((a, b) => a - b);
}

/* ── Работа над ошибками ────────────────────────────────────────── */

/**
 * Аналог задачи: тот же прототип, другие числа, не из этой партии.
 * Детерминирован по коду партии, варианту и заданию — после
 * перезагрузки тот же. null — у прототипа нет других задач.
 */
export function analogOf(
  adapter: SectionAdapter,
  task: VariantTask,
  exclude: ReadonlySet<string>,
  salt: string,
): VariantTask | null {
  const filters = {
    subtypes: null,
    source: 'mix' as const,
    stars: null,
    prototype: task.prototypeId,
    exclude,
  };
  return adapter.getRandomTask(filters, rngOf(`oshibki|${salt}|${task.egeNumber}|${task.taskId}`));
}

export interface OshibkiItem {
  task: VariantTask;
  /** Задание варианта, к которому относится: его номер в варианте. */
  from: number;
  analog: boolean;
}

/**
 * Задачи «Работы над ошибками»: каждое неверное задание варианта и
 * сразу за ним — аналог того же прототипа (если нашёлся).
 */
export async function oshibkiTasks(
  set: VariantSet,
  variant: number,
  wrong: readonly number[],
): Promise<OshibkiItem[]> {
  const tasks = set.variants[variant - 1]?.tasks ?? [];
  /* Задачи партии — по разделам: номера задач у разделов свои. */
  const used = new Map<EgeNo, Set<string>>();
  for (const t of set.variants.flatMap((v) => v.tasks)) {
    const ids = used.get(t.egeNumber) ?? new Set<string>();
    ids.add(t.taskId);
    used.set(t.egeNumber, ids);
  }
  const numbers = [
    ...new Set(wrong.map((i) => tasks[i]?.egeNumber).filter((n) => n !== undefined)),
  ];
  const { adapters } = await loadAdapters(numbers as EgeNo[]);
  const out: OshibkiItem[] = [];
  for (const i of wrong) {
    const task = tasks[i];
    if (task === undefined) continue;
    out.push({ task, from: i, analog: false });
    const adapter = adapters.get(task.egeNumber);
    const exclude = used.get(task.egeNumber) ?? new Set<string>();
    const analog =
      adapter === undefined ? null : analogOf(adapter, task, exclude, `${set.code}|${variant}`);
    if (analog !== null) {
      exclude.add(analog.taskId);
      used.set(task.egeNumber, exclude);
      out.push({ task: analog, from: i, analog: true });
    }
  }
  return out;
}
