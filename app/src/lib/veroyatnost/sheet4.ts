/**
 * Лист для печати заданий №4 и №5: адрес → задачи → описание листа.
 *
 * Тот же шаблон lib/sheet/, что печатает сборник №12 и варианты его
 * генератора: лист про предмет ничего не знает, ему отдаются готовые
 * куски разметки. Здесь — только выбор задач из прототипов банка и
 * раскладка по блокам. Банк и слова листа приходят параметрами:
 * у заданий №4 и №5 они разные, устройство листа одно.
 *
 * Адрес читается в том же формате, что пишет GeneratorScreen
 * (`sheetQuery` в lib/generatorSheet.ts): s — наборы, n — число задач,
 * seed, t — тема, c — колонки, k — вид работы, d — дата. Свой разбор
 * адреса здесь для того, чтобы страница печати задания №4 не тянула
 * за собой движок графиков, который generatorSheet подключает при
 * загрузке.
 *
 * Ответы: на листе ученика их нет ни в разметке, ни в памяти — разбор
 * открывается только для листа с ответами, по отпечатку.
 */

import content from '@/content/sheet12.js';
import { LIST_4, type ListSlova } from '@/content/veroyatnost';
import answers from '@/lib/sheet/answers.js';
import typo from '@/lib/sheet/typography.js';
import { seeded } from '../zadanie3/podhod';
import type { Pool, PoolKind } from './pool';
import { otkrytRazbor } from './razbor';

export interface Sheet4Params {
  /** Прототипы банка: p4-01, p4-02 … */
  skills: string[];
  count: number;
  seed: string;
  theme: 'color' | 'print';
  layout: 'single' | 'double';
  /** Вид работы: подзаголовок листа. */
  kind: string;
  /** Дата в подзаголовке, в записи ГГГГ-ММ-ДД. Пусто — даты нет. */
  date: string;
}

/** Параметры из адреса. Чего в адресе нет — берётся по умолчанию. */
export function parseSheet4Query(query: URLSearchParams): Sheet4Params {
  const skills = (query.get('s') ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
  const count = Number(query.get('n'));
  return {
    skills,
    count: Number.isFinite(count) && count > 0 ? Math.floor(count) : 10,
    seed: query.get('seed') ?? 'variant',
    theme: query.get('t') === 'print' ? 'print' : 'color',
    layout: query.get('c') === '2' ? 'double' : 'single',
    kind: query.get('k') ?? '',
    date: /^\d{4}-\d{2}-\d{2}$/.test(query.get('d') ?? '') ? (query.get('d') as string) : '',
  };
}

/** «18.09.2026» из записи ГГГГ-ММ-ДД. */
function dateText(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}

/** Подзаголовок листа: вид работы и дата, что есть. */
export function podzagolovok(params: Pick<Sheet4Params, 'kind' | 'date'>): string {
  return [params.kind, params.date === '' ? '' : dateText(params.date)]
    .filter((part) => part !== '')
    .join(' · ');
}

/** Число из строки зерна: FNV-1a, чтобы одно слово давало один лист. */
function zerno(seed: string): number {
  let hash = 0x811c9dc5;
  for (const ch of seed) {
    hash ^= ch.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

export interface Sheet4Task {
  no: number;
  id: string;
  questionHtml: string;
  options: null;
  figureSvg: null;
  /** Ответ строкой — только на листе с ответами; иначе пусто. */
  answer: string;
  answerHtml: null;
  /**
   * Формулы шагов разбора в TeX — краткое решение для учителя. На
   * листе ученика список пуст: разбор для него не открывается.
   */
  formulas: string[];
}

export interface Sheet4Block {
  title: string;
  note: string;
  set: string;
  tasks: Sheet4Task[];
}

/**
 * Блоки листа: по одному на прототип, сквозная нумерация задач.
 * Из всех вариантов выбранных прототипов берутся `count` штук
 * вперемешку, зерно — из адреса, поэтому лист ученика и лист с
 * ответами по одному адресу совпадают.
 */
export function sheet4Blocks(
  pool: Pool,
  params: Sheet4Params,
  withAnswers: boolean,
): Sheet4Block[] {
  const kinds = params.skills
    .map((id) => pool.kinds.find((kind) => kind.id === id))
    .filter((kind): kind is PoolKind => kind !== undefined);
  const vse = kinds.flatMap((kind) => kind.variants.map((variant) => ({ kind, variant })));
  const vybrano = shuffle(vse, seeded(zerno(params.seed))).slice(0, params.count);

  let number = 0;
  return kinds
    .map((kind) => {
      const tasks = vybrano
        .filter((item) => item.kind.id === kind.id)
        .sort((a, b) => a.variant.n - b.variant.n)
        .map(({ variant }): Sheet4Task => {
          number += 1;
          const razbor = withAnswers ? otkrytRazbor(variant.steps, variant.seal) : null;
          return {
            no: number,
            id: `${kind.id}-${variant.n}`,
            questionHtml: typo.escape(variant.uslovie),
            options: null,
            figureSvg: null,
            answer: razbor === null ? '' : razbor.otvet,
            answerHtml: null,
            formulas:
              razbor === null
                ? []
                : razbor.shagi.flatMap((shag) => (shag.tex === undefined ? [] : [shag.tex])),
          };
        });
      return { title: kind.title, note: kind.tip, set: kind.id, tasks };
    })
    .filter((block) => block.tasks.length > 0);
}

/**
 * Описание листа для шаблона. Ученику — строка «Ответ: ____» и ни
 * одного ответа; учителю — те же задачи, таблица ответов с новой
 * страницы и краткие решения: формулы шагов разбора в TeX, те же,
 * что видит ученик в тренажёре. Набирает их KaTeX на странице печати,
 * как у задания №12. `list` — слова листа задания; по умолчанию №4.
 */
export function sheet4Spec(
  pool: Pool,
  params: Sheet4Params,
  withAnswers: boolean,
  list: ListSlova = LIST_4,
) {
  const blocks = sheet4Blocks(pool, params, withAnswers);
  const resheniya = withAnswers
    ? blocks.flatMap((block) =>
        block.tasks
          .filter((task) => task.formulas.length > 0)
          .map((task) => answers.solution(task.no, task.formulas, task.answer)),
      )
    : [];
  const vsego = blocks.reduce((sum, block) => sum + block.tasks.length, 0);
  const extraItems = withAnswers
    ? [
        answers.sectionHead(list.otvety.title, list.otvety.note),
        ...blocks.map((block) =>
          answers.table(
            block.title,
            block.tasks.map((task) => ({ no: task.no, answer: task.answer, html: null })),
            5,
          ),
        ),
        ...(resheniya.length === 0
          ? []
          : [
              answers.sectionHead(
                list.resheniya.title,
                list.resheniya.note(resheniya.length, vsego),
              ),
              ...resheniya,
            ]),
      ]
    : [];

  return {
    theme: params.theme,
    layout: params.layout,
    /* Чертежей на листе нет; клетка нужна шаблону только для них. */
    cell: 3.4,
    documentTitle:
      `${list.title.chip}. ${list.title.text}` + (params.kind ? ` — ${params.kind}` : ''),
    head: content.head,
    runner: list.runner,
    title: { chip: list.title.chip, text: list.title.text, subtitle: podzagolovok(params) },
    recap: null,
    blocks,
    withAnswerLine: !withAnswers,
    extraItems,
    foot: content.foot,
  };
}
