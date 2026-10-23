'use client';

/**
 * Лист для печати задания №2: адрес → задачи → описание листа.
 *
 * Параметры варианта живут в адресе страницы печати: один и тот же
 * адрес всегда даёт один и тот же лист, а лист ученика и лист с
 * решениями по одному адресу содержат одни и те же задачи. Задачи
 * считает движок №2 в браузере, лист раскладывает тот же шаблон
 * lib/sheet/, что печатает сборники №4, №8 и №12.
 *
 * Два источника задач: генератор (seed из адреса, прототипы и
 * количество по выбору, до четырёх вариантов одной структуры) и банк
 * для репетиторов (`bank=1`: десять зафиксированных вариантов на
 * прототип из bank.ts). Ответы и решения считаются только для листа
 * с решениями и для ключа: student-запрос их не строит.
 *
 * Рисунок задачи на листе ученика — без катетов; на листе с
 * решениями — с катетами: это лист учителя, разбор рядом.
 */

import type { SheetLayoutId, SheetThemeId } from '@/content/generator';
import { SHEET_2 } from '@/content/sheet2';
import { O_ZADANII } from '@/content/vektory';
import answers from '@/lib/sheet/answers.js';
import { typeset } from '../tex';
import { BANK } from './bank';
import { generate } from './generate';
import { PROTOTYPES, prototypeById } from './prototypes';
import { renderVectorPlane } from './render';
import { ru } from './tex';
import type { Generated, Risunok } from './types';

export interface SheetParams2 {
  /** Прототипы: A1 … C2. */
  prototypes: string[];
  count: number;
  /** Вариантов одной структуры: 1–4. В режиме банка — всегда 1. */
  variants: number;
  seed: string;
  theme: SheetThemeId;
  layout: SheetLayoutId;
  /** Вид работы: подзаголовок листа. */
  kind: string;
  /** Дата в подзаголовке, в записи ГГГГ-ММ-ДД. Пусто — даты нет. */
  date: string;
  /** Банк для репетиторов: зафиксированные варианты вместо seed. */
  bank: boolean;
}

/** Клетка рисунка на листе, мм: в две колонки чуть мельче. */
const CELL: Record<SheetLayoutId, number> = { single: 3.4, double: 3.0 };

export const VARIANTS_MAX = 4;

/** Строка адреса из параметров — тот же формат, что у листов №8 и №12. */
export function sheetQuery2(params: SheetParams2): string {
  const query = new URLSearchParams();
  query.set('s', params.prototypes.join(','));
  if (params.bank) {
    query.set('bank', '1');
  } else {
    query.set('n', String(params.count));
    if (params.variants > 1) {
      query.set('v', String(params.variants));
    }
    query.set('seed', params.seed);
  }
  query.set('t', params.theme);
  query.set('c', params.layout === 'double' ? '2' : '1');
  if (params.kind !== '') {
    query.set('k', params.kind);
  }
  if (params.date !== '') {
    query.set('d', params.date);
  }
  return query.toString();
}

/** Параметры из адреса. Чего в адресе нет — берётся по умолчанию. */
export function parseSheetQuery2(query: URLSearchParams): SheetParams2 {
  const raw = (query.get('s') ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
  const prototypes = raw.includes('all')
    ? PROTOTYPES.map((p) => p.id)
    : raw.filter((id) => prototypeById(id) !== undefined);
  const count = Number(query.get('n'));
  const variants = Number(query.get('v'));
  return {
    prototypes,
    count: Number.isFinite(count) && count > 0 ? Math.floor(count) : 10,
    variants:
      Number.isFinite(variants) && variants > 1 ? Math.min(VARIANTS_MAX, Math.floor(variants)) : 1,
    seed: query.get('seed') ?? 'variant',
    theme: query.get('t') === 'print' ? 'print' : 'color',
    layout: query.get('c') === '2' ? 'double' : 'single',
    kind: query.get('k') ?? '',
    date: /^\d{4}-\d{2}-\d{2}$/.test(query.get('d') ?? '') ? (query.get('d') as string) : '',
    bank: query.get('bank') === '1',
  };
}

export interface SheetTask2 {
  no: number;
  id: string;
  questionHtml: string;
  options: null;
  figureSvg: string | null;
  answer: string;
  answerHtml: null;
  solutionHtml: string | null;
}

export interface SheetBlock2 {
  /** Плашка с кодом прототипа перед названием. */
  id: string;
  title: string;
  note: string;
  set: string;
  tasks: SheetTask2[];
}

/** Разбор по шагам с заголовками и строка ответа — под ту же CSS, что у №8 и №12. */
function razborHtml(task: Generated, answerText: string): string {
  /* Шаг «Ответ» на листе не нужен: ответ стоит строкой под разбором. */
  const items = task.shagi
    .filter((s) => s.zagolovok !== 'Ответ')
    .map(
      (s) =>
        `<li class="sheet-step"><b>${typeset(s.zagolovok)}.</b> ${s.stroki.map((line) => typeset(line)).join(' ')}</li>`,
    )
    .join('');
  return `<ol class="sheet-steps">${items}</ol><p class="sheet-task-answer">Ответ: <b>${answerText}</b></p>`;
}

/* Клетка рисунка к разбору, мм: он стоит в колонке разбора и мельче
   рисунка условия. У движка клетка — 34 единицы viewBox. */
const SOLUTION_CELL_MM = 2.6;
const CELL_UNITS = 34;

/**
 * Рисунок к разбору: катеты-подсказки отдельным рисунком рядом с
 * решением. null — если катетов нет (рисунок без сетки) и он совпал
 * бы с рисунком условия.
 */
function solutionFigureHtml(risunok: Risunok, condition: string): string {
  const svg = renderVectorPlane({ ...risunok, hints: true });
  if (svg === condition) {
    return '';
  }
  const box = /viewBox="0 0 ([0-9.]+) /.exec(svg);
  const width =
    box === null
      ? ''
      : ` style="width:${Math.round((Number(box[1]) / CELL_UNITS) * SOLUTION_CELL_MM * 100) / 100}mm"`;
  return `<figure class="sheet-figure sheet-solution-figure sheet-solution-figure--float"${width}>${svg}</figure>`;
}

/**
 * Карточка задачи листа. Рисунок условия один и тот же у ученика и
 * учителя — без катетов-подсказок; у учителя катеты стоят отдельным
 * рисунком в разборе.
 */
function sheetTask(task: Generated, no: number, withAnswers: boolean): SheetTask2 {
  const answerText = ru(task.otvet);
  const risunok = task.risunok;
  const condition = risunok === null ? null : renderVectorPlane(risunok);
  return {
    no,
    id: `${task.prototype}|${task.seed}`,
    questionHtml: typeset(task.uslovie),
    options: null,
    figureSvg: condition,
    answer: withAnswers ? answerText : '',
    answerHtml: null,
    solutionHtml: withAnswers
      ? (risunok === null || condition === null ? '' : solutionFigureHtml(risunok, condition)) +
        razborHtml(task, answerText)
      : null,
  };
}

const ATTEMPTS_PER_TASK = 30;

/** Задачи одного прототипа: `want` штук, воспроизводимо по адресу. */
function tasksForPrototype(
  prototype: string,
  want: number,
  base: string,
  numberRef: { n: number },
  withAnswers: boolean,
): SheetTask2[] {
  const out: SheetTask2[] = [];
  let attempt = 0;
  while (out.length < want && attempt < want * ATTEMPTS_PER_TASK + ATTEMPTS_PER_TASK) {
    const seed = `${base}:${prototype}:${attempt}`;
    attempt += 1;
    try {
      const task = generate(prototype, seed);
      numberRef.n += 1;
      out.push(sheetTask(task, numberRef.n, withAnswers));
    } catch {
      /* Параметры не подобрались на этом seed — берём следующий. */
    }
  }
  return out;
}

function blockOf(prototype: string, tasks: SheetTask2[]): SheetBlock2 {
  const p = prototypeById(prototype);
  return {
    id: prototype,
    title: p === undefined ? prototype : typeset(p.nazvanie),
    note: '',
    set: prototype,
    tasks,
  };
}

/** Блоки одного варианта: по блоку на прототип, сквозная нумерация. */
export function sheetBlocks2(
  params: SheetParams2,
  withAnswers: boolean,
  variant = 1,
): SheetBlock2[] {
  const numberRef = { n: 0 };
  if (params.bank) {
    return params.prototypes
      .map((prototype) => {
        const entry = BANK.find((e) => e.prototype === prototype);
        const tasks = (entry?.variants ?? []).map((v) => {
          numberRef.n += 1;
          return sheetTask(generate(prototype, v.seed), numberRef.n, withAnswers);
        });
        return blockOf(prototype, tasks);
      })
      .filter((block) => block.tasks.length > 0);
  }
  const base = variant === 1 ? params.seed : `${params.seed}:v${variant}`;
  const per = Math.floor(params.count / Math.max(1, params.prototypes.length));
  let rest = params.count - per * params.prototypes.length;
  return params.prototypes
    .map((prototype) => {
      const extra = rest > 0 ? 1 : 0;
      rest -= extra;
      return blockOf(
        prototype,
        tasksForPrototype(prototype, per + extra, base, numberRef, withAnswers),
      );
    })
    .filter((block) => block.tasks.length > 0);
}

/** Все варианты листа: первый — по seed адреса, остальные — по его образцу. */
export function sheetVariants2(params: SheetParams2, withAnswers: boolean): SheetBlock2[][] {
  const n = params.bank ? 1 : params.variants;
  return Array.from({ length: n }, (_, i) => sheetBlocks2(params, withAnswers, i + 1));
}

/** «18.09.2026» из записи ГГГГ-ММ-ДД. */
export function dateText2(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}

/** Подзаголовок листа: вид работы и дата, что есть. */
export function subtitleOf2(params: Pick<SheetParams2, 'kind' | 'date' | 'bank'>): string {
  const parts = [
    params.bank ? SHEET_2.bank.subtitle : '',
    params.kind,
    params.date === '' ? '' : dateText2(params.date),
  ];
  return parts.filter((part) => part !== '').join(' · ');
}

/** Раздел «Ответы»: таблица на блок, у нескольких вариантов — с подзаголовком варианта. */
function answersItems2(variants: SheetBlock2[][]): string[] {
  /* Свой счёт страниц у раздела ответов — только при нескольких
     вариантах (как у №12): у одного варианта колонтитул сквозной. */
  const items: string[] = [
    answers.sectionHead('Ответы', 'по прототипам, сквозная нумерация', {
      section: variants.length > 1,
    }),
  ];
  variants.forEach((blocks, i) => {
    if (variants.length > 1) {
      items.push(answers.subHead(`Вариант ${i + 1}`));
    }
    blocks.forEach((block) => {
      items.push(
        answers.table(
          `${block.id}. ${block.title}`,
          block.tasks.map((task) => ({ no: task.no, answer: task.answer, html: null })),
          5,
        ),
      );
    });
  });
  return items;
}

function titleOf(params: SheetParams2, variant?: string) {
  return {
    chip: SHEET_2.title.chip,
    text: SHEET_2.title.text,
    subtitle: subtitleOf2(params),
    ...(variant === undefined ? {} : { variant }),
  };
}

/**
 * Описание листа для шаблона. Ученику — строка «Ответ: ____» и ни
 * одного ответа в тексте карточки; учителю — те же задачи с разбором
 * по шагам внутри карточки, рисунком с катетами и сводной таблицей
 * «Ответы» в конце.
 */
export function sheetSpec2(params: SheetParams2, withAnswers: boolean) {
  const variants = sheetVariants2(params, withAnswers);
  const blocks = variants[0] ?? [];
  return {
    theme: params.theme,
    layout: params.layout,
    cell: CELL[params.layout],
    documentTitle:
      `${SHEET_2.title.chip}. ${SHEET_2.title.text}` + (params.kind ? ` — ${params.kind}` : ''),
    head: SHEET_2.head,
    runner: SHEET_2.runner,
    title: titleOf(params),
    recap: null,
    blocks,
    fields: { date: params.date === '' ? '' : dateText2(params.date) },
    ...(variants.length > 1
      ? {
          variants: variants.map((list, i) => ({
            title: titleOf(params, `Вариант ${i + 1}`),
            blocks: list,
          })),
        }
      : {}),
    withAnswerLine: !withAnswers,
    extraItems: withAnswers ? answersItems2(variants) : [],
    foot: SHEET_2.foot,
  };
}

/**
 * Ключ ответов банка: таблица «вариант → ответ» на каждый прототип,
 * группами A, B, C. Задач на листе нет — только ответы, посчитанные
 * в браузере по seed банка.
 */
export function keySpec2(theme: SheetThemeId) {
  const items: string[] = [];
  for (const gruppa of O_ZADANII.gruppy) {
    items.push(answers.subHead(`${gruppa.id}. ${gruppa.title}`));
    for (const entry of BANK) {
      const p = prototypeById(entry.prototype);
      if (p === undefined || p.gruppa !== gruppa.id) continue;
      items.push(
        answers.table(
          `${entry.prototype}. ${typeset(p.nazvanie)}`,
          entry.variants.map((v) => ({
            no: v.n,
            answer: ru(generate(entry.prototype, v.seed).otvet),
            html: null,
          })),
          5,
        ),
      );
    }
  }
  return {
    theme,
    layout: 'single' as SheetLayoutId,
    documentTitle: `${SHEET_2.title.chip}. ${SHEET_2.title.text} — ${SHEET_2.klyuch.subtitle}`,
    head: SHEET_2.head,
    runner: SHEET_2.runner,
    title: {
      chip: SHEET_2.title.chip,
      text: SHEET_2.title.text,
      subtitle: SHEET_2.klyuch.subtitle,
    },
    recap: null,
    blocks: [],
    withAnswerLine: false,
    extraItems: items,
    foot: SHEET_2.foot,
  };
}
