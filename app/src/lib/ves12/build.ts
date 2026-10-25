'use client';

/**
 * Зачётная работа по №12: варианты из движка, листы печати, задания
 * онлайн-режима.
 *
 * Варианты собираются в браузере из адреса работы (lib/ves12/work.ts):
 * один адрес — одни и те же задачи на любом устройстве. Движок graph/
 * детерминирован по seed, а seed каждой пачки задач выводится из кода
 * работы, поэтому ни хранилища, ни сервера не нужно.
 *
 * Правила:
 *   • место N во всех вариантах — задача одного прототипа (план —
 *     planWork), и по возможности одного уровня;
 *   • задача не повторяется ни внутри варианта, ни между вариантами:
 *     одинаковым считается то, что видит ученик, — условие и чертёж;
 *   • «Только ФИПИ» — только задачи открытого банка (lib/ves12/fipi.ts).
 */

import GraphGenerate from '@/lib/graph/generate.js';
import { prototypes } from '@/lib/graph/data/index.js';
import solutionBuilder from '@/lib/graph/solution.js';
import quadraticBuilder from '@/lib/graph/solution-quadratic.js';
import rationalSolution from '@/lib/graph/solution-rational.js';
import sqrtSolution from '@/lib/graph/solution-sqrt.js';
import exponentialSolution from '@/lib/graph/solution-exponential.js';
import logarithmicSolution from '@/lib/graph/solution-logarithmic.js';
import trigonometricSolution from '@/lib/graph/solution-trigonometric.js';
import { conditionSvg, solutionFigure } from '@/lib/sheet/figures12.js';
import { exampleSolutionHtml, taskSolutionItem } from '@/lib/sheet/answers12.js';
import answers from '@/lib/sheet/answers.js';
import typo from '@/lib/sheet/typography.js';
import { exampleItem } from '@/lib/sheet/sheet.js';
import content from '@/content/sheet12.js';
import { parseAnswer } from '@/lib/answer';
import { trainerTaskFrom, type EngineTask, type TrainerTask } from '@/lib/trainer';
import { generatorAllText, recapByType } from '@/content/ves12';
import { fipiOfSet, isFipiTask, type RawSet } from './fipi';
import {
  gradeLines,
  minutesLabel,
  planWork,
  rngFrom,
  shuffledBy,
  typeSource,
  type WorkParams,
  type WorkPlan,
} from './work';
import type { Ves12Catalog, Ves12Type } from './types';

const RAW = prototypes as unknown as RawSet[];

type EngineExtra = EngineTask & {
  options?: unknown;
  answerType?: string;
  answerHtml?: string | null;
  scene?: unknown;
  question?: string;
};

/** Задача работы: где стоит и что это. */
/** Что о типе функции нужно листу: название, подпись графика. */
export type TypeRef = Pick<Ves12Type, 'id' | 'title' | 'graphName'>;

export interface WorkTask {
  /** Номер в варианте, с 1. */
  no: number;
  type: Ves12Type;
  setId: string;
  task: EngineTask;
}

export interface WorkVariant {
  no: number;
  tasks: WorkTask[];
}

export interface BuiltWork {
  plan: WorkPlan;
  variants: WorkVariant[];
  /** Мест, на которые банк не дал новой задачи. */
  missing: number;
}

/* Сколько пачек движка перебирать на прототип: как у тренажёра. */
const TRIES = 40;

/** Что видит ученик: условие, чертёж и варианты ответа. */
export function shownKey(task: EngineTask): string {
  const engine = task as EngineExtra;
  return `${task.questionHtml}\u0000${task.svg ?? ''}\u0000${JSON.stringify(engine.options ?? null)}`;
}

/** Задача годится работе: ответ есть и проверяется. */
function usable(task: EngineTask): boolean {
  const engine = task as EngineExtra;
  const type = engine.answerType ?? 'number';
  if (type === 'choice') {
    return Array.isArray(engine.options) && engine.options.length > 0;
  }
  return type === 'number' && parseAnswer(task.answer) !== null;
}

/**
 * Очередь задач прототипа: пачки движка на seed из кода работы, каждая
 * в своём порядке. Задачи берутся по одной; взятое не возвращается.
 */
class SetQueue {
  private batch = 0;
  private items: EngineTask[] = [];
  private readonly raw: RawSet | undefined;
  /** Задач банка в наборе: все найдены — новых не будет. */
  private readonly fipiTotal: number | null;
  private readonly fipiSeen = new Set<string>();

  constructor(
    private readonly setId: string,
    private readonly code: string,
    private readonly fipiOnly: boolean,
  ) {
    this.raw = RAW.find((set) => set.id === setId);
    this.fipiTotal = fipiOnly && this.raw !== undefined ? fipiOfSet(this.raw) : null;
  }

  private exhausted(): boolean {
    return (
      this.batch >= TRIES ||
      (this.fipiTotal !== null && this.fipiSeen.size >= this.fipiTotal && this.batch > 0)
    );
  }

  private load(): boolean {
    if (this.exhausted()) {
      return false;
    }
    const seed = `${this.code}:${this.setId}:${this.batch}`;
    this.batch += 1;
    let tasks: EngineTask[] = [];
    try {
      tasks = GraphGenerate.generateSet(this.setId, seed) as EngineTask[];
    } catch {
      return true;
    }
    const fit = tasks.filter(
      (task) =>
        usable(task) &&
        (!this.fipiOnly || (this.raw !== undefined && isFipiTask(this.raw, task.id))),
    );
    fit.forEach((task) => this.fipiSeen.add(task.id));
    this.items.push(...shuffledBy(fit, rngFrom(seed)));
    return true;
  }

  /**
   * Следующая задача, которой ещё не было: сначала того же уровня, что
   * у образца, затем любая. null — банк прототипа кончился.
   */
  take(shown: Set<string>, level: string | null): EngineTask | null {
    const fresh = (task: EngineTask) => !shown.has(shownKey(task));
    for (;;) {
      const same = this.items.findIndex(
        (task) => fresh(task) && (level === null || (task.meta.level ?? null) === level),
      );
      if (same >= 0) {
        return this.items.splice(same, 1)[0] ?? null;
      }
      if (!this.load()) {
        break;
      }
    }
    const any = this.items.findIndex(fresh);
    return any >= 0 ? (this.items.splice(any, 1)[0] ?? null) : null;
  }
}

/** Все варианты работы. */
export function buildWork(params: WorkParams, catalog: Ves12Catalog): BuiltWork {
  const plan = planWork(params, catalog);
  const queues = new Map<string, SetQueue>();
  const queue = (setId: string, typeId: string) => {
    let found = queues.get(setId);
    if (found === undefined) {
      found = new SetQueue(setId, params.code, typeSource(params, typeId) === 'fipi');
      queues.set(setId, found);
    }
    return found;
  };
  const shown = new Set<string>();
  /* Уровень задачи на месте — по первому варианту, если прототип тот же. */
  const first: { setId: string; level: string | null }[] = [];
  let missing = 0;
  const variants: WorkVariant[] = plan.variants.map((slots, v) => {
    const tasks: WorkTask[] = [];
    slots.forEach((slot, i) => {
      const sample = first[i];
      const level = v > 0 && sample !== undefined && sample.setId === slot.setId ? sample.level : null;
      const task = queue(slot.setId, slot.type.id).take(shown, level);
      if (v === 0) {
        first[i] = { setId: slot.setId, level: task?.meta.level ?? null };
      }
      if (task === null) {
        missing += 1;
        return;
      }
      shown.add(shownKey(task));
      tasks.push({ no: tasks.length + 1, type: slot.type, setId: slot.setId, task });
    });
    return { no: v + 1, tasks };
  });
  return { plan, variants, missing };
}

/* ── Онлайн-режим ──────────────────────────────────────────────── */

export interface ExamItem {
  /** Тип функции — для итогов по типам. */
  typeId: string;
  typeTitle: string;
  setId: string;
  task: TrainerTask;
}

/** Задания одного варианта для экрана ученика. */
export function examItems(variant: WorkVariant): ExamItem[] {
  return variant.tasks.map((item) => ({
    typeId: item.type.id,
    typeTitle: item.type.title,
    setId: item.setId,
    task: trainerTaskFrom(item.task),
  }));
}

/* ── Листы печати ──────────────────────────────────────────────── */

/* Клетка чертежа, мм: как у листов генератора в одну колонку. */
const CELL = 3.4;

/* Разбор по шагам: модуль по семейству задачи. */
const stepwiseBuilder = {
  fromTask(task: { meta: { family?: string } }) {
    if (task.meta.family === 'exponential') {
      return exponentialSolution.fromTask(task);
    }
    if (task.meta.family === 'logarithmic') {
      return logarithmicSolution.fromTask(task);
    }
    if (task.meta.family === 'trigonometric') {
      return trigonometricSolution.fromTask(task);
    }
    return task.meta.family === 'sqrt'
      ? sqrtSolution.fromTask(task)
      : rationalSolution.fromTask(task);
  },
};

function answerRules(): Record<string, string> {
  const rules: Record<string, string> = {};
  RAW.forEach((set) => {
    (set.tasks as { id: string; answerRule?: string }[]).forEach((task) => {
      if (task.answerRule !== undefined) {
        rules[task.id] = task.answerRule;
      }
    });
  });
  return rules;
}

/** Задача в виде, который понимают шаблон листа и раздел ответов. */
function sheetTask(item: Omit<WorkTask, 'type'> & { type: TypeRef }, rules: Record<string, string>, withFigure: boolean) {
  const engine = item.task as EngineExtra;
  const base = {
    no: item.no,
    id: item.task.id,
    questionHtml: item.task.questionHtml,
    question: engine.question ?? '',
    options: engine.options ?? null,
    figureSvg: item.task.svg === null ? null : (conditionSvg(engine) as string | null),
    scene: engine.scene ?? null,
    answer: item.task.answer,
    answerHtml: engine.answerHtml ?? null,
    answerRule: rules[item.task.id],
    seed: item.task.meta.seed,
    meta: item.task.meta,
    method: item.type.title,
  };
  return withFigure
    ? { ...base, solutionFigure: solutionFigure(base, GraphGenerate, CELL) as unknown }
    : base;
}

/**
 * Блоки варианта: по типам функций, с полосой-названием типа. Вперемешку
 * — один блок без полосы: тип по соседним задачам не угадать.
 */
function variantBlocks(
  variant: WorkVariant,
  rules: Record<string, string>,
  withFigure: boolean,
  order: WorkParams['order'],
) {
  const blocks: {
    title: string;
    note: string;
    set: string;
    head?: boolean;
    tasks: ReturnType<typeof sheetTask>[];
  }[] = [];
  if (order === 'mix') {
    return [
      { title: '', note: '', set: 'mix', head: false, tasks: variant.tasks.map((item) => sheetTask(item, rules, withFigure)) },
    ];
  }
  variant.tasks.forEach((item) => {
    const last = blocks[blocks.length - 1];
    const task = sheetTask(item, rules, withFigure);
    if (last !== undefined && last.set === item.type.id) {
      last.tasks.push(task);
    } else {
      blocks.push({ title: item.type.title, note: item.type.graphName, set: item.type.id, tasks: [task] });
    }
  });
  return blocks;
}

function subtitle(params: WorkParams): string {
  return [
    params.teacher === '' ? '' : `Учитель: ${params.teacher}`,
    `Время: ${minutesLabel(params.minutes)}`,
  ]
    .filter((part) => part !== '')
    .join(' · ');
}

/** Ответ для таблицы: у задачи с выбором — номер и текст варианта. */
function answerCell(task: ReturnType<typeof sheetTask>): string {
  const options = task.options as { number: string; html?: string; text?: string }[] | null;
  if (Array.isArray(options)) {
    const picked = options.find((option) => option.number === task.answer);
    return picked === undefined
      ? typo.markup(task.answer)
      : `${typo.escape(task.answer)}) ${typo.markup(picked.html ?? picked.text ?? '')}`;
  }
  if (task.answerHtml) {
    return task.answerHtml;
  }
  const value = String(task.answer);
  return /^[-−]?\d+(?:[,.]\d+)?$/.test(value)
    ? typo.mathText(`$${value.replace('−', '-').replace(/[,.]/, '{,}')}$`)
    : typo.markup(value);
}

/**
 * Ответы всех вариантов одной таблицей: строка — номер задачи и тип,
 * столбец — вариант. Длинная таблица режется по десять строк: кусок
 * потока неделим.
 */
function keyTableAll(variants: ReturnType<typeof variantBlocks>[]): string[] {
  const rows = (variants[0] ?? []).flatMap((block) => block.tasks.map((task) => ({ no: task.no, type: task.method })));
  const cells = variants.map((blocks) => {
    const byNo = new Map<number, string>();
    blocks.forEach((block) => block.tasks.forEach((task) => byNo.set(task.no, answerCell(task))));
    return byNo;
  });
  const head =
    '<thead><tr><th scope="col">№</th><th scope="col">Тип функции</th>' +
    variants.map((_, i) => `<th scope="col">Вариант ${i + 1}</th>`).join('') +
    '</tr></thead>';
  const lines = rows.map(
    (row) =>
      `<tr><th scope="row">${row.no}</th><td class="sheet-work-type">${typo.text(row.type)}</td>` +
      cells.map((byNo) => `<td class="sheet-work-answer">${byNo.get(row.no) ?? '—'}</td>`).join('') +
      '</tr>',
  );
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += 10) {
    out.push(
      '<div class="sheet-item sheet-answers"><table class="sheet-key-table sheet-work-key">' +
        head +
        '<tbody>' +
        lines.slice(i, i + 10).join('') +
        '</tbody></table></div>',
    );
  }
  return out;
}

/** Шкала оценок рамкой «Повторяем»: на листе учителя. */
function gradesItem(params: WorkParams, total: number): string {
  const items = gradeLines(params.grades, total)
    .map(
      (line, i) =>
        `<li class="sheet-recap-item"><span class="sheet-recap-no">${i + 1}</span><span>${typo.text(line)}</span></li>`,
    )
    .join('');
  return (
    '<div class="sheet-item"><section class="sheet-recap"><div class="sheet-recap-main">' +
    `<h2 class="sheet-recap-title">${typo.text('Шкала оценок')}</h2>` +
    `<ul class="sheet-recap-list">${items}</ul></div></section></div>`
  );
}

/**
 * Описание листа зачётной работы для шаблона lib/sheet/. Ученику —
 * варианты: условия, чертежи без построений, строка «Ответ». Учителю —
 * те же варианты, затем ответы всех вариантов таблицей, шкала оценок и
 * решения по шагам каждого варианта.
 */
export function workSheetSpec(params: WorkParams, built: BuiltWork, withAnswers: boolean) {
  const rules = answerRules();
  const variants = built.variants.map((variant) => variantBlocks(variant, rules, withAnswers, params.order));
  const sub = subtitle(params);
  const title = (variant: number) => ({
    chip: content.title.chip,
    text: params.title,
    subtitle: sub,
    ...(variants.length > 1 ? { variant: `Вариант ${variant}` } : {}),
  });
  const total = variants[0]?.reduce((sum, block) => sum + block.tasks.length, 0) ?? 0;

  const extraItems: string[] = [];
  if (withAnswers) {
    extraItems.push(answers.sectionHead('Ответы', `Только для учителя · код работы ${params.code}`, { section: true }));
    keyTableAll(variants).forEach((item) => extraItems.push(item));
    extraItems.push(gradesItem(params, total));
    const solved: string[] = [];
    variants.forEach((blocks, i) => {
      const own: string[] = [];
      blocks.forEach((block) =>
        block.tasks.forEach((task) => {
          const item = taskSolutionItem(task, GraphGenerate, solutionBuilder, quadraticBuilder, stepwiseBuilder);
          if (item) {
            own.push(item);
          }
        }),
      );
      if (own.length > 0) {
        if (variants.length > 1) {
          solved.push(answers.subHead(`Вариант ${i + 1}`));
        }
        solved.push(...own);
      }
    });
    if (solved.length > 0) {
      extraItems.push(answers.sectionHead('Решения по шагам', 'Только для учителя'));
      extraItems.push(...solved);
    }
  }

  return {
    theme: 'color' as const,
    layout: 'single' as const,
    cell: CELL,
    documentTitle: `${content.title.chip}. ${params.title}`,
    head: content.head,
    runner: `${content.title.chip} · ${params.title}`,
    title: title(1),
    recap: null,
    blocks: variants[0] ?? [],
    fields: { date: '' },
    variants: variants.map((blocks, i) => ({ title: title(i + 1), blocks })),
    withAnswerLine: !withAnswers,
    extraItems,
    foot: content.foot,
  };
}

/* ── Генератор по всем типам: теория и разобранные примеры ─────── */

/* У движка клетка — 34 единицы viewBox: ширина рисунка примера в мм. */
function figureWidth(svg: string | null): number | null {
  const box = /viewBox="0 0 ([0-9.]+) /.exec(svg ?? '');
  return box === null ? null : (Number(box[1]) / 34) * CELL;
}

/** Рамка «Запомни» типа — на листе генератора по всем типам. */
export function recapOf(type: TypeRef) {
  return {
    title: generatorAllText.recapTitle(type.title),
    items: recapByType[type.id].map((line) => typo.mathText(line)),
    phrase: null,
  };
}

/**
 * Разобранные примеры типа: задачи выбранных прототипов на отдельном
 * seed — не те, что в листе, — с решением по шагам из разбора движка.
 */
export function exampleItems(type: TypeRef, sets: string[], count: number, seed: string): string[] {
  const out: string[] = [];
  const rules = answerRules();
  for (let i = 0; i < sets.length * 2 && out.length < count; i += 1) {
    /* Сначала по разу каждый прототип по порядку, затем по второму кругу. */
    const setId = sets[i % sets.length] as string;
    let tasks: EngineTask[] = [];
    try {
      tasks = GraphGenerate.generateSet(setId, `${seed}:primer:${setId}:${i}`) as EngineTask[];
    } catch {
      continue;
    }
    const task = tasks.find(usable);
    if (task === undefined) {
      continue;
    }
    /* Пример — решённая задача: чертёж с построениями решения (у прямой —
       треугольник наклона), как в листе учителя. Задачи листа ученика
       остаются без построений. */
    const item = sheetTask({ no: 0, type, setId, task }, rules, true) as ReturnType<
      typeof sheetTask
    > & { solutionFigure?: { svg: string; width: number | null } | null };
    const html = exampleSolutionHtml(item, GraphGenerate, solutionBuilder, quadraticBuilder, stepwiseBuilder);
    if (html === null) {
      continue;
    }
    const svg = item.solutionFigure?.svg ?? item.figureSvg;
    out.push(
      exampleItem({
        label: generatorAllText.exampleLabel,
        title: type.title,
        conditionHtml: task.questionHtml,
        solutionHtml: html,
        figureSvg: svg,
        figureWidth: item.solutionFigure?.width ?? figureWidth(svg),
      }),
    );
  }
  return out;
}

/* ── Предпросмотр на экране настройки ──────────────────────────── */

export interface PreviewTask {
  no: number;
  typeTitle: string;
  /** Условие, набранное KaTeX. */
  html: string;
  /** Рисунок условия — как на листе ученика, без построений. */
  svg: string | null;
}

export interface WorkPreview {
  /** Задачи начала первого варианта. */
  tasks: PreviewTask[];
  /** Мест, на которые банк не дал задачи. */
  missing: number;
}

/** Начало первого варианта — для мини-листа в сводке. */
export function previewOf(params: WorkParams, catalog: Ves12Catalog, count = 2): WorkPreview {
  const built = buildWork(params, catalog);
  const first = built.variants[0]?.tasks ?? [];
  return {
    missing: built.missing,
    tasks: first.slice(0, count).map((item) => ({
      no: item.no,
      typeTitle: item.type.title,
      html: trainerTaskFrom(item.task).questionHtml,
      svg: item.task.svg === null ? null : (conditionSvg(item.task as EngineExtra) as string | null),
    })),
  };
}
