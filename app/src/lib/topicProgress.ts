/**
 * Прогресс подтемы: пункты кольца в шапке и условия, при которых
 * пункт считается пройденным.
 *
 * Пункт — вкладка подтемы, в которой есть что изучать: «Теория»,
 * «Ключевые методы», «Опорные задачи», «Тренажёр». «О задании» —
 * справка, «Генератор» — инструмент учителя, в счёт они не идут.
 * Вкладка без содержания (пустая теория, нет навыков) в пункты не
 * входит и появляется в них сама, когда содержание добавят.
 *
 * «Изучено» — это действие, а не открытая вкладка:
 *   - теория и методы — каждый раздел дочитан до конца или вкладка
 *     отмечена кнопкой «Прочитано» (lib/theoryRead.ts);
 *   - опорные задачи — правильно решено не меньше PREP_SHARE задач
 *     подтемы (lib/prepProgress.ts);
 *   - тренажёр — по TRAINER_PER_KIND задач каждого типа решено
 *     правильно и без подсказки (lib/trainerProgress.ts).
 *
 * Модуль только считает: план подтемы приходит со страницы (что в ней
 * есть), отметки — из хранилищ браузера. Ни React, ни localStorage
 * здесь нет, поэтому расчёт проверяется скриптом без браузера
 * (scripts/check-topic-progress.mjs).
 */

import type { PrepProgress } from './prepProgress';
import type { TrainerProgress } from './trainerProgress';

/** Доля опорных задач подтемы, решённых правильно, — пункт пройден. */
export const PREP_SHARE = 0.8;

/** Сколько задач каждого типа тренажёра решить правильно и без подсказки. */
export const TRAINER_PER_KIND = 2;

/**
 * Сколько раздел должен пробыть на экране, чтобы конец прокрутки его
 * засчитал. Пролистанное одним рывком — переход по «Содержанию»,
 * клавиша End — прочитанным не считается.
 */
export const READ_DWELL_MS = 3000;

export type ProgressItemId = 'theory' | 'methods' | 'prep' | 'trainer';

/** Что есть в подтеме: собирается на странице при сборке. */
export interface ProgressPlan {
  /** Разделы теории с содержанием. Пустые («Материал готовится») не входят. */
  theory: string[];
  /** Карточки ключевых методов. */
  methods: string[];
  /** Навыки опорных задач и число задач в каждом. */
  prep: { id: string; total: number }[];
  /** Типы заданий тренажёра — наборы движка. */
  trainer: string[];
}

/** Отметки ученика из хранилищ браузера. */
export interface ProgressMarks {
  theoryRead: readonly string[];
  methodsRead: readonly string[];
  prep: PrepProgress;
  trainer: TrainerProgress;
}

export interface ProgressItem {
  id: ProgressItemId;
  label: string;
  /** Сколько сделано — в единицах пункта: разделах, методах, задачах. */
  done: number;
  /** Сколько нужно для пройденного пункта в тех же единицах. */
  need: number;
  /** Всего единиц у пункта: у опорных задач больше, чем нужно. */
  total: number;
  unit: 'sections' | 'methods' | 'tasks';
  complete: boolean;
}

export interface ProgressSummary {
  items: ProgressItem[];
  /** Пройдено пунктов. */
  done: number;
  /** Всего пунктов. */
  total: number;
  /** Доля пройденных пунктов, 0…100. */
  percent: number;
}

/** Названия пунктов — как у вкладок (content/vkladki.ts). */
export interface ProgressLabels {
  theory: string;
  methods: string;
  prep: string;
  trainer: string;
}

function readItem(
  id: 'theory' | 'methods',
  label: string,
  ids: string[],
  read: readonly string[],
): ProgressItem | null {
  if (ids.length === 0) {
    return null;
  }
  const done = ids.filter((item) => read.includes(item)).length;
  return {
    id,
    label,
    done,
    need: ids.length,
    total: ids.length,
    unit: id === 'theory' ? 'sections' : 'methods',
    complete: done === ids.length,
  };
}

/** Пункты подтемы с отметками ученика. */
export function progressSummary(
  plan: ProgressPlan,
  marks: ProgressMarks,
  labels: ProgressLabels,
): ProgressSummary {
  const items: ProgressItem[] = [];

  const theory = readItem('theory', labels.theory, plan.theory, marks.theoryRead);
  if (theory !== null) {
    items.push(theory);
  }
  const methods = readItem('methods', labels.methods, plan.methods, marks.methodsRead);
  if (methods !== null) {
    items.push(methods);
  }

  const prepTotal = plan.prep.reduce((sum, skill) => sum + skill.total, 0);
  if (prepTotal > 0) {
    /* Номер задачи считается, только если он есть в наборе: набор мог
       стать короче, и «12 из 10» в одном навыке не должно добирать
       другой. */
    const done = plan.prep.reduce((sum, skill) => {
      const solved = new Set((marks.prep[skill.id] ?? []).filter((no) => no >= 1 && no <= skill.total));
      return sum + solved.size;
    }, 0);
    const need = Math.ceil(prepTotal * PREP_SHARE);
    items.push({
      id: 'prep',
      label: labels.prep,
      done,
      need,
      total: prepTotal,
      unit: 'tasks',
      complete: done >= need,
    });
  }

  if (plan.trainer.length > 0) {
    const need = plan.trainer.length * TRAINER_PER_KIND;
    /* Тип засчитывает не больше TRAINER_PER_KIND задач: двадцать
       решённых задач одного типа не заменяют остальные типы. */
    const done = plan.trainer.reduce(
      (sum, kind) => sum + Math.min(marks.trainer.kinds[kind]?.right ?? 0, TRAINER_PER_KIND),
      0,
    );
    items.push({
      id: 'trainer',
      label: labels.trainer,
      done,
      need,
      total: need,
      unit: 'tasks',
      complete: done >= need,
    });
  }

  const done = items.filter((item) => item.complete).length;
  return {
    items,
    done,
    total: items.length,
    percent: items.length === 0 ? 0 : (done / items.length) * 100,
  };
}

/** «раздел», «раздела», «разделов» — по числу. */
export function plural(n: number, one: string, few: string, many: string): string {
  const tens = n % 100;
  const units = n % 10;
  if (tens >= 11 && tens <= 14) {
    return many;
  }
  if (units === 1) {
    return one;
  }
  if (units >= 2 && units <= 4) {
    return few;
  }
  return many;
}

/**
 * Подпись под кольцом. «Из N» требует родительного падежа: «из 1
 * раздела», «из 4 разделов», «из 21 раздела».
 */
export function progressText(summary: ProgressSummary): string {
  if (summary.total === 0) {
    return 'Материалы подтемы готовятся';
  }
  if (summary.done === 0) {
    const first = summary.items[0];
    return first?.id === 'theory'
      ? 'Начните с теории — здесь появится ваш прогресс'
      : 'Начните с первого раздела — здесь появится ваш прогресс';
  }
  if (summary.done === summary.total) {
    return 'Вы изучили все разделы подтемы';
  }
  return `Вы изучили ${summary.done} из ${summary.total} ${plural(summary.total, 'раздела', 'разделов', 'разделов')}`;
}

/** Строка пункта в списке под кольцом: «3 из 7 разделов», «34 из 88 задач». */
export function itemDetail(item: ProgressItem): string {
  const words = {
    sections: ['раздела', 'разделов', 'разделов'],
    methods: ['метода', 'методов', 'методов'],
    tasks: ['задачи', 'задач', 'задач'],
  }[item.unit] as [string, string, string];
  const shown = Math.min(item.done, item.need);
  const base = `${shown} из ${item.need} ${plural(item.need, ...words)}`;
  if (item.id === 'prep') {
    return `${base} (нужно ${Math.round(PREP_SHARE * 100)}% из ${item.total})`;
  }
  if (item.id === 'trainer') {
    return `${base}: по ${TRAINER_PER_KIND} каждого типа без подсказки`;
  }
  return base;
}
