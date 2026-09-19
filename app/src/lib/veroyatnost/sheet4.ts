/**
 * Лист для печати задания №4: адрес → задачи → описание листа.
 *
 * Тот же шаблон lib/sheet/, что печатает сборник №12 и варианты его
 * генератора: лист про предмет ничего не знает, ему отдаются готовые
 * куски разметки. Здесь — только выбор задач из прототипов банка и
 * раскладка по блокам.
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
import { LIST_4 } from '@/content/veroyatnost';
import answers from '@/lib/sheet/answers.js';
import typo from '@/lib/sheet/typography.js';
import { seeded } from '../zadanie3/podhod';
import type { Pool, PoolKind, PoolVariant } from './pool';
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
          return {
            no: number,
            id: `${kind.id}-${variant.n}`,
            questionHtml: typo.escape(variant.uslovie),
            options: null,
            figureSvg: null,
            answer: withAnswers ? otvet(variant) : '',
            answerHtml: null,
          };
        });
      return { title: kind.title, note: kind.tip, set: kind.id, tasks };
    })
    .filter((block) => block.tasks.length > 0);
}

/** Ответ варианта — из закрытого разбора, по отпечатку. */
function otvet(variant: PoolVariant): string {
  return otkrytRazbor(variant.steps, variant.seal).otvet;
}

/**
 * Описание листа для шаблона. Ученику — строка «Ответ: ____» и ни
 * одного ответа; учителю — те же задачи и таблица ответов с новой
 * страницы. Кратких решений нет: разбор уезжает в браузер готовой
 * вёрсткой, а не формулами, и шаблон листа его не наберёт.
 */
export function sheet4Spec(pool: Pool, params: Sheet4Params, withAnswers: boolean) {
  const blocks = sheet4Blocks(pool, params, withAnswers);
  const extraItems = withAnswers
    ? [
        answers.sectionHead(LIST_4.otvety.title, LIST_4.otvety.note),
        ...blocks.map((block) =>
          answers.table(
            block.title,
            block.tasks.map((task) => ({ no: task.no, answer: task.answer, html: null })),
            5,
          ),
        ),
      ]
    : [];

  return {
    theme: params.theme,
    layout: params.layout,
    /* Чертежей на листе нет; клетка нужна шаблону только для них. */
    cell: 3.4,
    documentTitle:
      `${LIST_4.title.chip}. ${LIST_4.title.text}` + (params.kind ? ` — ${params.kind}` : ''),
    head: content.head,
    runner: LIST_4.runner,
    title: { chip: LIST_4.title.chip, text: LIST_4.title.text, subtitle: podzagolovok(params) },
    recap: null,
    blocks,
    withAnswerLine: !withAnswers,
    extraItems,
    foot: content.foot,
  };
}
