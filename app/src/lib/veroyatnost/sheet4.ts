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
  /** Сколько вариантов: 1…4. Структура у всех одна, числа разные. */
  variants: number;
}

/** Сколько вариантов можно заказать: как у генератора №12. */
const MAX_VARIANTS = 4;

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
    variants: (() => {
      const v = Number(query.get('v'));
      return Number.isInteger(v) && v >= 1 && v <= MAX_VARIANTS ? v : 1;
    })(),
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

/** Задача листа до раскладки: прототип и его вариант из банка. */
interface Vybor {
  kind: PoolKind;
  variant: PoolKind['variants'][number];
}

/**
 * Выбор первого варианта листа: по одному списку на прототип.
 * Из всех вариантов выбранных прототипов берутся `count` штук
 * вперемешку, зерно — из адреса, поэтому лист ученика и лист с
 * ответами по одному адресу совпадают.
 */
function vyborPervogo(pool: Pool, params: Sheet4Params): Vybor[][] {
  const kinds = params.skills
    .map((id) => pool.kinds.find((kind) => kind.id === id))
    .filter((kind): kind is PoolKind => kind !== undefined);
  const vse = kinds.flatMap((kind) => kind.variants.map((variant) => ({ kind, variant })));
  const vybrano = shuffle(vse, seeded(zerno(params.seed))).slice(0, params.count);

  return kinds
    .map((kind) =>
      vybrano.filter((item) => item.kind.id === kind.id).sort((a, b) => a.variant.n - b.variant.n),
    )
    .filter((list) => list.length > 0);
}

/**
 * Следующий вариант по образцу первого: те же прототипы в том же
 * порядке и столько же задач, на каждом месте — другой вариант того
 * же прототипа из банка, то есть та же задача с другими числами.
 * Сложность у вариантов прототипа одна.
 *
 * На место берётся вариант, которого ещё не было ни на одном листе;
 * если у прототипа таких не осталось — хотя бы не тот, что стоял на
 * этом месте раньше, и не повтор внутри варианта. Ответы выбор не
 * сверяет: на листе ученика их нет и в памяти, а выбор у листа
 * ученика и листа с ответами должен быть один и тот же. Условия у
 * разных вариантов банка разные, ответы почти всегда тоже.
 */
function vyborSleduyushchego(
  params: Sheet4Params,
  obrazec: Vybor[][],
  k: number,
  bylo: Set<string>,
  naMeste: Map<string, Set<string>>,
): Vybor[][] {
  const random = seeded(zerno(`${params.seed}:v${k}`));
  const zdes = new Set<string>();
  return obrazec.map((list) =>
    list.map((item, i) => {
      const mesto = `${item.kind.id}#${i}`;
      const prezhnie = naMeste.get(mesto) ?? new Set<string>();
      const kandidaty = shuffle(item.kind.variants, random);
      const vzyat =
        kandidaty.find((v) => !bylo.has(v.uslovie) && !zdes.has(v.uslovie)) ??
        kandidaty.find((v) => !prezhnie.has(v.uslovie) && !zdes.has(v.uslovie)) ??
        kandidaty.find((v) => !zdes.has(v.uslovie)) ??
        item.variant;
      zdes.add(vzyat.uslovie);
      return { kind: item.kind, variant: vzyat };
    }),
  );
}

/** Все варианты листа: первый — тот же, что до появления вариантов. */
function vyborVariantov(pool: Pool, params: Sheet4Params): Vybor[][][] {
  const pervyy = vyborPervogo(pool, params);
  const out = [pervyy];
  const bylo = new Set<string>();
  const naMeste = new Map<string, Set<string>>();
  const zapomnit = (variant: Vybor[][]) => {
    variant.forEach((list) =>
      list.forEach((item, i) => {
        bylo.add(item.variant.uslovie);
        const mesto = `${item.kind.id}#${i}`;
        naMeste.set(mesto, (naMeste.get(mesto) ?? new Set<string>()).add(item.variant.uslovie));
      }),
    );
  };
  zapomnit(pervyy);
  for (let k = 2; k <= params.variants; k += 1) {
    const sleduyushchiy = vyborSleduyushchego(params, pervyy, k, bylo, naMeste);
    zapomnit(sleduyushchiy);
    out.push(sleduyushchiy);
  }
  return out;
}

/** Блоки листа из выбора: по одному на прототип, нумерация с 1. */
function blokiIz(vybor: Vybor[][], withAnswers: boolean): Sheet4Block[] {
  let number = 0;
  return vybor.map((list) => {
    const kind = list[0]?.kind as PoolKind;
    const tasks = list.map(({ variant }): Sheet4Task => {
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
  });
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
  return blokiIz(vyborPervogo(pool, params), withAnswers);
}

/** Блоки каждого варианта листа: по образцу первого, числа другие. */
export function sheet4Variants(
  pool: Pool,
  params: Sheet4Params,
  withAnswers: boolean,
): Sheet4Block[][] {
  return vyborVariantov(pool, params).map((vybor) => blokiIz(vybor, withAnswers));
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
  const variants = sheet4Variants(pool, params, withAnswers);
  const blocks = variants[0] ?? [];
  const title = { chip: list.title.chip, text: list.title.text, subtitle: podzagolovok(params) };
  /* Строка «Фамилия, имя / Класс / Дата» — на каждом варианте. */
  const fields = { date: params.date === '' ? '' : dateText(params.date) };
  if (variants.length > 1) {
    return {
      ...sheet4Base(params, list),
      title,
      fields,
      variants: variants.map((bloki, i) => ({
        title: { ...title, variant: `Вариант ${i + 1}` },
        blocks: bloki,
      })),
      blocks: [],
      withAnswerLine: !withAnswers,
      extraItems: withAnswers ? otvetyVariantov(variants, list) : [],
    };
  }
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
    ...sheet4Base(params, list),
    title,
    fields,
    blocks,
    withAnswerLine: !withAnswers,
    extraItems,
  };
}

/** Общее у листа с одним вариантом и с несколькими. */
function sheet4Base(params: Sheet4Params, list: ListSlova) {
  return {
    theme: params.theme,
    layout: params.layout,
    /* Чертежей на листе нет; клетка нужна шаблону только для них. */
    cell: 3.4,
    documentTitle:
      `${list.title.chip}. ${list.title.text}` + (params.kind ? ` — ${params.kind}` : ''),
    head: content.head,
    runner: list.runner,
    recap: null,
    foot: content.foot,
  };
}

/**
 * Ответы листа с несколькими вариантами: с новой страницы, с пометкой
 * «Только для учителя», по вариантам — подзаголовок «Вариант K» и
 * таблицы его прототипов; затем краткие решения так же по вариантам.
 */
function otvetyVariantov(variants: Sheet4Block[][], list: ListSlova): string[] {
  const items = [answers.sectionHead(list.otvety.title, 'Только для учителя', { section: true })];
  variants.forEach((blocks, i) => {
    items.push(answers.subHead(`Вариант ${i + 1}`));
    blocks.forEach((block) => {
      items.push(
        answers.table(
          block.title,
          block.tasks.map((task) => ({ no: task.no, answer: task.answer, html: null })),
          5,
        ),
      );
    });
  });

  let vsego = 0;
  let resheno = 0;
  const resheniya: string[] = [];
  variants.forEach((blocks, i) => {
    const svoi = blocks.flatMap((block) =>
      block.tasks
        .filter((task) => task.formulas.length > 0)
        .map((task) => answers.solution(task.no, task.formulas, task.answer)),
    );
    vsego += blocks.reduce((sum, block) => sum + block.tasks.length, 0);
    resheno += svoi.length;
    if (svoi.length > 0) {
      resheniya.push(answers.subHead(`Вариант ${i + 1}`), ...svoi);
    }
  });
  if (resheno > 0) {
    items.push(answers.sectionHead(list.resheniya.title, list.resheniya.note(resheno, vsego)));
    items.push(...resheniya);
  }
  return items;
}
