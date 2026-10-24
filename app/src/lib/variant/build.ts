/**
 * Сборка партии вариантов: настройки + seed + замены → `VariantSet`.
 *
 * Детерминирована: одни и те же входные данные дают те же задачи в
 * том же порядке, поэтому код партии восстанавливает её целиком.
 * Модуль без React и без браузера — его же гоняет автотест
 * (scripts/check-variant.mjs).
 *
 * Как выбираются задачи задания k:
 *   1. Вариант 1 — любая задача по фильтрам.
 *   2. Параллельные варианты — во вариантах 2…n задача того же
 *      прототипа, что в варианте 1 (другие числа и сюжет).
 *   3. Задачи партии не повторяются: каждая взятая задача попадает в
 *      `exclude` для остальных вариантов.
 *   4. Замены применяются после всего плана: замена задачи k в
 *      варианте v не сдвигает ни одну другую задачу. В параллельном
 *      режиме замена сохраняет прототип.
 *
 * Если по фильтрам задачи нет, фильтры ослабляются по одному (прототип →
 * звёзды → источник → подтипы → повтор), а у задачи появляется пометка
 * в `fallbacks` — генератор не падает.
 */

import { rngOf } from '@/lib/vychisleniya/rng';
import type {
  EgeNo,
  Fallback,
  SectionAdapter,
  TaskFilters,
  Variant,
  VariantConfig,
  VariantSet,
  VariantTask,
} from './types';

export interface BuildInput {
  config: VariantConfig;
  seed: string;
  zameny: Record<string, number>;
  version: string;
  code: string;
}

/** Ключ замены: «вариант.задание». */
export function zamenaKey(variant: number, ege: EgeNo): string {
  return `${variant}.${ege}`;
}

interface Attempt {
  filters: TaskFilters;
  /** Все ослабления до этой попытки включительно: пометки копятся. */
  fallbacks: Fallback[];
}

/** Фильтры задания с учётом того, что умеет раздел. */
function baseFilters(
  adapter: SectionAdapter,
  config: VariantConfig,
  ege: EgeNo,
): { filters: Omit<TaskFilters, 'exclude' | 'prototype'>; notes: Fallback[] } {
  const caps = adapter.info.capabilities;
  const notes: Fallback[] = [];
  let source = config.source;
  if (source === 'fipi' && !caps.fipi) {
    source = 'own';
    notes.push({ field: 'source', note: 'В разделе нет задач открытого банка ФИПИ — взята своя' });
  } else if (source === 'own' && !caps.own) {
    source = 'fipi';
    notes.push({ field: 'source', note: 'В разделе нет своих задач — взята задача ФИПИ' });
  }
  const stars = config.stars.length === 0 ? null : config.stars;
  if (stars !== null && !caps.difficulty) {
    notes.push({ field: 'difficulty', note: 'Сложность не размечена — фильтр не применён' });
  }
  const chosen = config.subtypes[ege];
  const known = new Set(adapter.info.subtypes.map((s) => s.id));
  const subtypes =
    chosen === undefined ? null : chosen.filter((id) => known.has(id)).length > 0 ? chosen : null;
  return {
    filters: { subtypes, source, stars: caps.difficulty ? stars : null },
    notes,
  };
}

/**
 * Порядок ослабления фильтров. Каждая следующая попытка снимает ещё
 * один фильтр и несёт пометки всех снятых до неё: задача, найденная
 * без прототипа и без звёзд, помечена обоими.
 */
function attempts(
  base: Omit<TaskFilters, 'exclude' | 'prototype'>,
  exclude: ReadonlySet<string>,
  prototype: string | undefined,
): Attempt[] {
  const out: Attempt[] = [];
  let f: TaskFilters = { ...base, exclude, prototype };
  let notes: Fallback[] = [];
  out.push({ filters: f, fallbacks: notes });
  const relax = (next: TaskFilters, note: Fallback) => {
    f = next;
    notes = [...notes, note];
    out.push({ filters: f, fallbacks: notes });
  };
  if (prototype !== undefined) {
    relax(
      { ...f, prototype: undefined },
      {
        field: 'prototype',
        note: 'Задачи этого прототипа кончились — взят другой прототип того же задания',
      },
    );
  }
  if (f.stars !== null) {
    relax(
      { ...f, stars: null },
      { field: 'stars', note: 'По выбранной сложности задач не хватило — сложность другая' },
    );
  }
  if (f.source !== 'mix') {
    relax(
      { ...f, source: 'mix' },
      { field: 'source', note: 'По выбранному источнику задач не хватило — источник другой' },
    );
  }
  if (f.subtypes !== null) {
    relax(
      { ...f, subtypes: null },
      { field: 'subtypes', note: 'По выбранным подтипам задач не хватило — подтип другой' },
    );
  }
  relax(
    { ...f, exclude: new Set() },
    { field: 'repeat', note: 'Задачи раздела кончились — задача повторяется в партии' },
  );
  return out;
}

/** Задача, которой нет: так лист честно показывает пробел, а не падает. */
function missingTask(ege: EgeNo): VariantTask {
  return {
    egeNumber: ege,
    taskId: `missing-${ege}`,
    prototypeId: 'missing',
    subtype: '',
    source: { kind: 'own', label: '—' },
    difficulty: null,
    statement: '<p>Задачу подобрать не удалось.</p>',
    figure: null,
    figureTeacher: null,
    answer: '—',
    answerHtml: '—',
    solutionTeacher: null,
    solutionStudent: null,
    fallbacks: [{ field: 'subtypes', note: 'Раздел не отдал ни одной задачи' }],
    ref: { ege },
  };
}

function pick(
  adapter: SectionAdapter,
  base: Omit<TaskFilters, 'exclude' | 'prototype'>,
  notes: Fallback[],
  exclude: ReadonlySet<string>,
  prototype: string | undefined,
  rngSeed: string,
  inherited: readonly Fallback[] = [],
): { task: VariantTask; relaxed: Fallback[] } {
  for (const a of attempts(base, exclude, prototype)) {
    /* Своя последовательность на каждую попытку: ослабление фильтра
       не зависит от того, сколько чисел съела предыдущая. */
    const last = a.fallbacks[a.fallbacks.length - 1];
    const task = adapter.getRandomTask(a.filters, rngOf(`${rngSeed}|${last?.field ?? ''}`));
    if (task !== null) {
      /* Прототип взят из варианта 1, а там фильтр уже ослабляли: та же
         пометка и здесь, иначе задача выглядит нарушающей фильтр. */
      const relaxed = a.fallbacks.length === 0 ? [...inherited] : a.fallbacks;
      return { task: { ...task, fallbacks: [...notes, ...relaxed, ...task.fallbacks] }, relaxed };
    }
  }
  return { task: missingTask(adapter.info.egeNumber), relaxed: [] };
}

/**
 * Партия вариантов. `adapters` — готовые разделы (данные загружены);
 * раздела нет — на его месте задача-пробел.
 */
export function buildVariantSet(
  input: BuildInput,
  adapters: ReadonlyMap<EgeNo, SectionAdapter>,
): VariantSet {
  const { config, seed, zameny } = input;
  const count = Math.max(1, config.count);
  const variants: Variant[] = Array.from({ length: count }, (_, i) => ({
    index: i + 1,
    tasks: [],
  }));

  for (const ege of config.tasks) {
    const adapter = adapters.get(ege);
    if (adapter === undefined) {
      for (const v of variants) v.tasks.push(missingTask(ege));
      continue;
    }
    const { filters, notes } = baseFilters(adapter, config, ege);
    const used = new Set<string>();
    let prototype: string | undefined;
    /* Ослабления фильтра у варианта 1: в параллельных вариантах они
       переходят вместе с прототипом. */
    let relaxed: Fallback[] = [];
    const column: VariantTask[] = [];
    for (let v = 1; v <= count; v += 1) {
      const got = pick(
        adapter,
        filters,
        notes,
        used,
        config.parallel && v > 1 ? prototype : undefined,
        `var|${seed}|${ege}|${v}`,
        config.parallel ? relaxed : [],
      );
      const task = got.task;
      used.add(task.taskId);
      if (v === 1) {
        prototype = task.prototypeId;
        relaxed = got.relaxed;
      }
      column.push(task);
    }
    /* Замены — после плана: остальные задачи не сдвигаются. Замена с
       номером k проигрывается с первой: так результат не зависит от
       того, в каком порядке учитель нажимал «заменить». */
    for (let v = 1; v <= count; v += 1) {
      const k = zameny[zamenaKey(v, ege)] ?? 0;
      let task = column[v - 1];
      if (task === undefined) continue;
      for (let j = 1; j <= k; j += 1) {
        task = pick(
          adapter,
          filters,
          notes,
          used,
          config.parallel ? task.prototypeId : undefined,
          `var|${seed}|${ege}|${v}|z${j}`,
          config.parallel ? relaxed : [],
        ).task;
        used.add(task.taskId);
      }
      column[v - 1] = task;
    }
    column.forEach((task, i) => variants[i]?.tasks.push(task));
  }

  return {
    code: input.code,
    seed,
    version: input.version,
    config,
    zameny: { ...zameny },
    variants,
    createdAt: new Date().toISOString(),
  };
}
