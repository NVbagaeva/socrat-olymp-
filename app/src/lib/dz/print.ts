/**
 * Печать домашнего задания: лист ученика и лист учителя из задач ДЗ.
 *
 * Ничего не генерируется заново (docs/kabinet-dz-8.md): оба листа
 * собираются из одних и тех же строк базы — homework_tasks (условие) и
 * homework_keys (ответ, решение, источник), — поэтому задачи, их условия
 * и порядок на двух листах совпадают всегда. Лист — тот же шаблон
 * lib/sheet/ и тот же вид, что у листов №8 (lib/vychisleniya/sheet8.ts):
 * шапка и подвал content/sheet8.js, решение по шагам в карточке задачи,
 * в конце листа учителя — раздел «Ответы».
 *
 *   Ученик  — название ДЗ, срок, комментарий репетитора, условия со
 *             строкой «Ответ: ____»; по настройке — клетка для решения
 *             (lib/sheetSpace.ts, размер «авто» — по длине решения
 *             учителя). Ни ответов, ни решений, ни источника задач.
 *   Учитель — те же задачи с решением и ответом в карточке и таблица
 *             «номер — ответ — источник» («банк 8.A № 3» / «новая»).
 *             Клетки нет никогда.
 *
 * Индивидуальное ДЗ: варианты учеников подряд — каждый с новой страницы,
 * имя ученика в строке названия; или вариант одного ученика (studentId).
 *
 * Вёрстка условий и решений лежит в базе готовым HTML: перед листом она
 * проходит через sanitize (в браузере — sanitizeHtml из ./sanitize).
 * Функция приходит параметром, чтобы сборку листа проверял Node
 * (scripts/check-dz-print.mjs). Простой текст — название, комментарий,
 * имена, ответ, источник — экранируется.
 *
 * Чистые функции: ни базы, ни браузера.
 */

import { dueRu } from '@/content/dz';
import { DZ_PECHAT as T } from '@/content/dzPechat';
import { foot, head } from '@/content/sheet8.js';
import { displayAnswer } from '@/lib/otvet';
import { keyTable, sectionHead, subHead } from '@/lib/sheet/answers.js';
import { exampleItem } from '@/lib/sheet/sheet.js';
import type { SheetSpace, SpaceField } from '@/lib/sheet/space.js';
import { escape, text } from '@/lib/sheet/typography.js';
import { sheetWithSpace } from '@/lib/sheetSpace';
import { razborSheetSteps, type RazborHtml } from '@/lib/vychisleniya/razbor';
import type { HwFull } from './api';
import type { PrintList } from './links';
import { tasksOf } from './results';
import type { HwRecipientView, HwTaskView, HwView } from './types';

/** Очистка вёрстки из базы: в браузере — sanitizeHtml. */
export type Sanitize = (html: string) => string;

/** Ключ задачи: ответ, решение и источник — только у репетитора. */
export type HwKey = HwFull['keys'] extends ReadonlyMap<string, infer K> ? K : never;

/** Что нужно листу из ДЗ — часть HwFull. */
export interface PrintSource {
  hw: Pick<HwView, 'title' | 'note' | 'dueAt' | 'taskNo'>;
  tasks: readonly HwTaskView[];
  recipients: readonly Pick<HwRecipientView, 'userId' | 'name'>[];
  /** Ключи по id задачи; листу ученика не нужны. */
  keys: ReadonlyMap<string, HwKey>;
}

export type SheetTheme = 'color' | 'print';

export interface PrintOptions {
  list: PrintList;
  /** Клетка для решения (kletka=1) — только у листа ученика. */
  grid: boolean;
  /** Только этот ученик; null — все (у индивидуального ДЗ — по очереди). */
  studentId?: string | null;
  sanitize: Sanitize;
  /** Тема, как у листов №8: цветная (по умолчанию) или ч/б. */
  theme?: SheetTheme;
}

/* ── Кому что печатать ──────────────────────────────────────────── */

export interface PrintGroup {
  /** Ученик варианта; null — общий лист, без имени. */
  student: { id: string; name: string } | null;
  /** Задачи по порядку. */
  tasks: HwTaskView[];
}

const byPosition = (a: HwTaskView, b: HwTaskView) => a.position - b.position;

/**
 * Варианты листа. Общее ДЗ — один лист. Индивидуальное — по варианту на
 * ученика: получатели по порядку, затем те, у кого есть задачи, но кого
 * нет среди получателей. studentId — только этот ученик (не получатель
 * и без задач — печатать нечего).
 */
export function printGroups(
  source: Pick<PrintSource, 'tasks' | 'recipients'>,
  studentId: string | null = null,
): PrintGroup[] {
  const { tasks, recipients } = source;
  const own = [...new Set(tasks.map((t) => t.studentId).filter((id): id is string => id !== null))];
  const ids = [
    ...recipients.map((r) => r.userId),
    ...own.filter((id) => !recipients.some((r) => r.userId === id)),
  ];
  const student = (id: string) => {
    const name = recipients.find((r) => r.userId === id)?.name.trim() ?? '';
    return { id, name: name !== '' ? name : T.student(ids.indexOf(id) + 1) };
  };
  if (studentId !== null) {
    const list = ids.includes(studentId) ? tasksOf(tasks, studentId) : [];
    return list.length === 0 ? [] : [{ student: student(studentId), tasks: list }];
  }
  if (own.length === 0) {
    return tasks.length === 0 ? [] : [{ student: null, tasks: [...tasks].sort(byPosition) }];
  }
  return ids
    .map((id) => ({ student: student(id), tasks: tasksOf(tasks, id) }))
    .filter((group) => group.tasks.length > 0);
}

/* ── Описание листа для buildDocument (lib/sheet/sheet.js) ─────── */

interface PrintTask {
  no: number;
  /** id задачи в базе: одинаков на обоих листах (по нему и «авто» клетки). */
  id: string;
  questionHtml: string;
  options: null;
  figureSvg: null;
  /** Решение и ответ — только у листа учителя. */
  solutionHtml: string | null;
  /** Клетка для решения — только у листа ученика (applySpace). */
  space?: SpaceField;
}

interface PrintBlock {
  head: false;
  title: string;
  note: string;
  leadItems: string[];
  tasks: PrintTask[];
}

interface PrintTitle {
  chip: string;
  text: string;
  subtitle: string;
  /** Имя ученика — у индивидуального ДЗ. */
  variant?: string;
}

export interface PrintSpec {
  theme: SheetTheme;
  layout: 'single';
  documentTitle: string;
  head: typeof head;
  runner: string;
  title: PrintTitle;
  recap: null;
  fields: { date: string; group: string } | null;
  /** Один лист; у нескольких учеников пусто — всё в variants. */
  blocks: PrintBlock[];
  /** Несколько учеников: каждому свой вариант с новой страницы. */
  variants?: { title: PrintTitle; blocks: PrintBlock[] }[];
  withAnswerLine: boolean;
  extraItems: string[];
  foot: typeof foot;
  kit: null;
}

/** Клетка на листе ученика: высота поля — по длине решения учителя. */
const GRID: SheetSpace = { mode: 'grid', size: 'auto', per: {} };

/**
 * Лист ученика или учителя. null — печатать нечего: в ДЗ нет задач или
 * у выбранного ученика их нет.
 */
export function printSpec(source: PrintSource, options: PrintOptions): PrintSpec | null {
  const groups = printGroups(source, options.studentId ?? null);
  if (groups.length === 0) return null;
  if (options.list === 'uchitel') return sheet(source, groups, true, options);
  const student = sheet(source, groups, false, options);
  if (!options.grid) return student;
  return sheetWithSpace(student, GRID, true, () => sheet(source, groups, true, options));
}

function sheet(
  source: PrintSource,
  groups: readonly PrintGroup[],
  teacher: boolean,
  options: PrintOptions,
): PrintSpec {
  const hw = source.hw;
  const chip = `Задание ${hw.taskNo}`;
  const name = hw.title.trim() || T.vid;
  const subtitle = [T.vid, teacher ? T.uchitel : hw.dueAt === null ? '' : T.srok(dueRu(hw.dueAt))]
    .filter((part) => part !== '')
    .join(' · ');
  const lead = noteItems(hw.note);
  const titleOf = (group: PrintGroup): PrintTitle => ({
    chip,
    text: name,
    subtitle,
    ...(group.student === null ? {} : { variant: group.student.name }),
  });
  const blockOf = (group: PrintGroup): PrintBlock => ({
    head: false,
    title: '',
    note: '',
    leadItems: lead,
    tasks: group.tasks.map((task, i) => ({
      no: i + 1,
      id: task.id,
      questionHtml: options.sanitize(task.questionHtml),
      options: null,
      figureSvg: null,
      solutionHtml: teacher ? solutionOf(source.keys.get(task.id), options.sanitize) : null,
    })),
  });
  const first = groups[0] as PrintGroup;
  const many = groups.length > 1;
  return {
    theme: options.theme ?? 'color',
    layout: 'single',
    documentTitle: `${name} — ${teacher ? T.list.uchitel : T.list.uchenik}`,
    head,
    runner: `${chip} · ${name}`,
    title: titleOf(first),
    recap: null,
    /* «Фамилия, имя / Класс / Дата» — только у листа ученика. */
    fields: teacher ? null : { date: '', group: '' },
    blocks: many ? [] : [blockOf(first)],
    ...(many
      ? { variants: groups.map((group) => ({ title: titleOf(group), blocks: [blockOf(group)] })) }
      : {}),
    withAnswerLine: !teacher,
    extraItems: teacher ? keyItems(groups, source.keys) : [],
    foot,
    kit: null,
  };
}

/** Комментарий репетитора к заданию — рамкой перед задачами. */
function noteItems(note: string): string[] {
  const value = note.trim();
  if (value === '') return [];
  return [exampleItem({ label: T.note, conditionHtml: text(value).replace(/\r?\n/g, '<br>') })];
}

/** Решение по шагам и ответ — в карточке задачи листа учителя, как у №8. */
function solutionOf(key: HwKey | undefined, clean: Sanitize): string {
  if (key === undefined) return `<p class="sheet-task-answer">${escape(T.noKey)}</p>`;
  const razbor: RazborHtml = {
    shagi: (key.razbor?.shagi ?? []).map((s) => ({ chto: clean(s.chto), tex: clean(s.tex) })),
    delimost: (key.razbor?.delimost ?? []).map((d) => ({
      title: escape(d.title),
      html: clean(d.html),
    })),
  };
  const steps = razbor.shagi.length === 0 ? '' : razborSheetSteps(razbor);
  return (
    steps +
    `<p class="sheet-task-answer">${T.answer}: <b>${escape(displayAnswer(key.answer))}</b></p>`
  );
}

/**
 * Раздел «Ответы» листа учителя: номер, ответ и источник задачи. У
 * нескольких учеников — таблица на каждого под его именем, раздел со
 * своей нумерацией страниц (как у вариантов листа №8).
 */
function keyItems(groups: readonly PrintGroup[], keys: ReadonlyMap<string, HwKey>): string[] {
  const rows = (group: PrintGroup) =>
    group.tasks.map((task, i) => {
      const key = keys.get(task.id);
      const shown = key === undefined ? '—' : displayAnswer(key.answer);
      /* Источник — простой текст: экранируется; «$» включил бы формулу. */
      const method = escape((key?.source ?? '').replace(/\$/g, ''));
      return { no: i + 1, answer: shown, html: escape(shown), method };
    });
  if (groups.length === 1) {
    return [sectionHead(T.otvety, T.otvetyNote), ...keyTable(null, rows(groups[0] as PrintGroup))];
  }
  return [
    sectionHead(T.otvety, T.otvetyNote, { section: true }),
    ...groups.flatMap((group) => [
      subHead(group.student?.name ?? ''),
      ...keyTable(null, rows(group)),
    ]),
  ];
}

/* ── Адрес страницы печати ─────────────────────────────────────── */

export interface PrintQuery {
  id: string;
  list: PrintList;
  grid: boolean;
  /** uchenik= — вариант одного ученика. */
  studentId: string | null;
  theme: SheetTheme;
}

/** Параметры страницы печати: ?id=…&list=uchenik|uchitel[&kletka=1][&uchenik=…][&t=print]. */
export function readPrintQuery(query: URLSearchParams): PrintQuery {
  const student = (query.get('uchenik') ?? '').trim();
  return {
    id: (query.get('id') ?? '').trim(),
    list: query.get('list') === 'uchitel' ? 'uchitel' : 'uchenik',
    grid: query.get('kletka') === '1',
    studentId: student === '' ? null : student,
    theme: query.get('t') === 'print' ? 'print' : 'color',
  };
}

/** Адрес печати (printHref) для одного ученика; null — для всех. */
export function withStudent(href: string, studentId: string | null): string {
  const [path = '', search = ''] = href.split('?');
  const query = new URLSearchParams(search);
  if (studentId === null) query.delete('uchenik');
  else query.set('uchenik', studentId);
  const rest = query.toString();
  return rest === '' ? path : `${path}?${rest}`;
}
