'use client';

/**
 * Лист для печати из генератора: адрес → задачи → описание листа.
 *
 * Параметры варианта живут в адресе страницы печати: один и тот же
 * адрес всегда даёт один и тот же лист, а лист ученика и лист
 * с ответами по одному seed содержат одни и те же задачи. Задачи
 * считает движок graph/ в браузере, лист раскладывает шаблон
 * lib/sheet/ — тот же, что печатает сборник в CI.
 */

import GraphGenerate from '@/lib/graph/generate.js';
import solutionBuilder from '@/lib/graph/solution.js';
import quadraticBuilder from '@/lib/graph/solution-quadratic.js';
import { answersItems, variantAnswersItems } from '@/lib/sheet/answers12.js';
import { parseAnswer } from '@/lib/answer';
import content from '@/content/sheet12.js';
import { skillTitle } from '@/content/skills12';
import type { SheetLayoutId, SheetThemeId } from '@/content/generator';
import { pickTasks, seedFrom } from '@/lib/trainerSession';
import type { EngineTask } from '@/lib/trainer';

export interface SheetParams {
  /** Наборы движка: 12.A, 12.B … */
  skills: string[];
  count: number;
  /** Уровень задач. null — любой. */
  level: string | null;
  seed: string;
  theme: SheetThemeId;
  layout: SheetLayoutId;
  /** Вид работы: подзаголовок листа. */
  kind: string;
  /** Дата в подзаголовке, в записи ГГГГ-ММ-ДД. Пусто — даты нет. */
  date: string;
  /** Сколько вариантов: 1…4. Структура у всех одна, числа разные. */
  variants: number;
}

/** Сколько вариантов можно заказать в генераторе. */
export const MAX_VARIANTS = 4;

/** Число вариантов из адреса: 1…MAX_VARIANTS, иначе 1. */
export function variantsFrom(raw: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= MAX_VARIANTS ? n : 1;
}

/* Клетка чертежа в миллиметрах: 3,4 в одну колонку, 3,0 в две —
   значения сборника (lib/sheet/README.md). */
const CELL: Record<SheetLayoutId, number> = { single: 3.4, double: 3.0 };

/** Строка адреса из параметров. */
export function sheetQuery(params: SheetParams): string {
  const query = new URLSearchParams();
  query.set('s', params.skills.join(','));
  query.set('n', String(params.count));
  if (params.level !== null) {
    query.set('l', params.level);
  }
  query.set('seed', params.seed);
  query.set('t', params.theme);
  query.set('c', params.layout === 'double' ? '2' : '1');
  if (params.kind !== '') {
    query.set('k', params.kind);
  }
  if (params.date !== '') {
    query.set('d', params.date);
  }
  /* Один вариант — адрес как прежде. */
  if (params.variants > 1) {
    query.set('v', String(params.variants));
  }
  return query.toString();
}

/** Параметры из адреса. Чего в адресе нет — берётся по умолчанию. */
export function parseSheetQuery(query: URLSearchParams): SheetParams {
  const skills = (query.get('s') ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
  const count = Number(query.get('n'));
  const level = query.get('l');
  return {
    skills,
    count: Number.isFinite(count) && count > 0 ? Math.floor(count) : 10,
    level: level === null || level === '' ? null : level,
    seed: query.get('seed') ?? 'variant',
    theme: query.get('t') === 'print' ? 'print' : 'color',
    layout: query.get('c') === '2' ? 'double' : 'single',
    kind: query.get('k') ?? '',
    date: /^\d{4}-\d{2}-\d{2}$/.test(query.get('d') ?? '') ? (query.get('d') as string) : '',
    variants: variantsFrom(query.get('v')),
  };
}

interface SheetTask {
  no: number;
  id: string;
  questionHtml: string;
  options: unknown;
  figureSvg: string | null;
  answer: string;
  answerHtml: string | null;
  answerRule: string | undefined;
  seed: string;
  meta: EngineTask['meta'];
}

interface SheetBlock {
  title: string;
  note: string;
  set: string;
  tasks: SheetTask[];
}

/* Правило ответа лежит в описании задачи, а не в результате сборки:
   раздел решений выбирает по нему ветку разбора. */
function answerRules(): Record<string, string> {
  const sets = GraphGenerate.loadSets() as { prep: unknown[]; prototypes: unknown[] };
  const rules: Record<string, string> = {};
  [...sets.prep, ...sets.prototypes].forEach((set) => {
    const tasks = (set as { tasks?: { id: string; answerRule: string }[] }).tasks ?? [];
    tasks.forEach((task) => {
      rules[task.id] = task.answerRule;
    });
  });
  return rules;
}

/**
 * Блоки листа: по одному на навык, сквозная нумерация задач.
 * Задачи — те же, что собрал бы тренажёр по этому запросу, только
 * seed воспроизводимый.
 */
export function sheetBlocks(params: SheetParams): SheetBlock[] {
  /* choice: задачи с выбором варианта листу годятся — варианты
     печатаются списком под условием, а на листе с ответами стоит
     текст верного варианта. Без этого признака лист по навыку, где
     отвечают выбором (знак коэффициента a, формула параболы), выходил
     пустым: шапка и колонтитул есть, задач нет. У линейной подтемы
     задач с выбором нет, и её лист от признака не меняется. */
  const picked = pickTasks(
    {
      skills: params.skills,
      level: params.level,
      count: params.count,
      mode: 'practice',
      mistakes: [],
      choice: true,
    },
    seedFrom(params.seed),
  );
  const rules = answerRules();
  let number = 0;

  return params.skills
    .map((setId) => {
      const tasks = picked.tasks.filter((task) => task.meta.set === setId);
      return {
        title: skillTitle[setId] ?? setId,
        note: '',
        set: setId,
        tasks: tasks.map((task): SheetTask => {
          number += 1;
          return sheetTaskFrom(task, number, rules);
        }),
      };
    })
    .filter((block) => block.tasks.length > 0);
}

/* Сколько seed перебирать на набор, подбирая задачи следующего
   варианта: как у тренажёра. */
const VARIANT_TRIES = 24;

type EngineExtra = EngineTask & { options?: unknown; answerType?: string };

/** Что видит ученик: условие, чертёж, варианты ответа. */
function shownKey(task: SheetTask): string {
  return `${task.questionHtml}\u0000${task.figureSvg ?? ''}\u0000${JSON.stringify(task.options)}`;
}

/** Задача годится листу: ответ есть и проверяется. */
function usable(task: EngineExtra): boolean {
  const type = task.answerType ?? 'number';
  if (type === 'choice') {
    return Array.isArray(task.options) && task.options.length > 0;
  }
  return type === 'number' && parseAnswer(task.answer) !== null;
}

function sheetTaskFrom(task: EngineTask, no: number, rules: Record<string, string>): SheetTask {
  const engine = task as EngineExtra & { answerHtml?: string | null };
  return {
    no,
    id: task.id,
    questionHtml: task.questionHtml,
    options: engine.options ?? null,
    figureSvg: task.svg,
    answer: task.answer,
    answerHtml: engine.answerHtml ?? null,
    answerRule: rules[task.id],
    seed: task.meta.seed,
    meta: task.meta,
  };
}

/** Что уже стоит на листах прежних вариантов. */
interface VariantMemory {
  /** Условия с чертежами всех задач всех вариантов. */
  shown: Set<string>;
  /** Ответы по месту задачи: «набор#номер в блоке» → ответы. */
  answers: Map<string, Set<string>>;
}

function remember(memory: VariantMemory, blocks: SheetBlock[]) {
  blocks.forEach((block) => {
    block.tasks.forEach((task, i) => {
      memory.shown.add(shownKey(task));
      const slot = `${block.set}#${i}`;
      const seen = memory.answers.get(slot) ?? new Set<string>();
      seen.add(task.answer);
      memory.answers.set(slot, seen);
    });
  });
}

/**
 * Следующий вариант по образцу первого: те же блоки, то же число
 * задач, на каждом месте — та же задача набора (тот же тип и
 * уровень), только на другом seed, то есть с другими числами.
 * Порядок не меняется.
 *
 * На каждое место берётся лучшее из найденного:
 *   1. та же задача, новое условие, новый ответ;
 *   2. та же задача, новое условие (ответ совпал с прежним вариантом);
 *   3. другая задача того же набора и уровня — у задачи с
 *      закреплёнными числами другого seed не бывает;
 *   4. если ничего не нашлось — задача образца как есть.
 */
function nextVariant(
  params: SheetParams,
  base: SheetBlock[],
  k: number,
  memory: VariantMemory,
  rules: Record<string, string>,
): SheetBlock[] {
  let number = 0;
  return base.map((block) => {
    const batches: EngineTask[][] = [];
    const batch = (attempt: number): EngineTask[] => {
      if (batches[attempt] === undefined) {
        try {
          batches[attempt] = GraphGenerate.generateSet(
            block.set,
            `${params.seed}:v${k}:${block.set}:${attempt}`,
          ) as EngineTask[];
        } catch {
          batches[attempt] = [];
        }
      }
      return batches[attempt] ?? [];
    };

    const tasks = block.tasks.map((sample, i) => {
      const slotAnswers = memory.answers.get(`${block.set}#${i}`) ?? new Set<string>();
      const sampleLevel = sample.meta.level ?? null;
      const sampleType = sample.options === null ? 'number' : 'choice';
      let best: SheetTask | null = null;
      let bestTier = 5;
      for (let attempt = 0; attempt < VARIANT_TRIES && bestTier > 1; attempt += 1) {
        for (const candidate of batch(attempt)) {
          const engine = candidate as EngineExtra;
          const same = candidate.id === sample.id;
          if (!same && ((candidate.meta.level ?? null) !== sampleLevel ||
              (engine.answerType ?? 'number') !== sampleType)) {
            continue;
          }
          if (!usable(engine)) {
            continue;
          }
          const task = sheetTaskFrom(candidate, 0, rules);
          if (memory.shown.has(shownKey(task))) {
            continue;
          }
          const fresh = !slotAnswers.has(task.answer);
          const tier = same ? (fresh ? 1 : 2) : fresh ? 3 : 4;
          if (tier < bestTier) {
            best = task;
            bestTier = tier;
            if (tier === 1) {
              break;
            }
          }
        }
      }
      const picked = best ?? { ...sample };
      /* Взятое сразу запоминается: два места одного варианта не
         получат одно и то же условие. */
      memory.shown.add(shownKey(picked));
      number += 1;
      return { ...picked, no: number };
    });
    return { ...block, tasks };
  });
}

/**
 * Все варианты листа. Первый — ровно тот, что собирался до появления
 * вариантов (тот же seed), остальные — по его образцу.
 */
export function sheetVariants(params: SheetParams): SheetBlock[][] {
  const first = sheetBlocks(params);
  const out = [first];
  if (params.variants <= 1) {
    return out;
  }
  const rules = answerRules();
  const memory: VariantMemory = { shown: new Set(), answers: new Map() };
  remember(memory, first);
  for (let k = 2; k <= params.variants; k += 1) {
    const next = nextVariant(params, first, k, memory, rules);
    remember(memory, next);
    out.push(next);
  }
  return out;
}

/** «18.09.2026» из записи ГГГГ-ММ-ДД. */
export function dateText(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}

/** Подзаголовок листа: вид работы и дата, что есть. */
export function subtitleOf(params: Pick<SheetParams, 'kind' | 'date'>): string {
  return [params.kind, params.date === '' ? '' : dateText(params.date)]
    .filter((part) => part !== '')
    .join(' · ');
}

/**
 * Описание листа для шаблона. Ученику — строка «Ответ: ____» и ни
 * одного ответа; учителю — те же задачи и раздел «Ответы» с новой
 * страницы. Рамки «Повторяем» на варианте нет.
 */
export function sheetSpec(params: SheetParams, withAnswers: boolean, subtopic?: string) {
  const variants = sheetVariants(params);
  const blocks = variants[0] ?? [];
  /* Название подтемы приходит со страницы: лист собирается один на
     все подтемы задания, а в шапке должно стоять то, что печатают.
     Не передали — остаётся название из конфига листа. */
  const name = subtopic ?? content.title.text;
  return {
    theme: params.theme,
    layout: params.layout,
    cell: CELL[params.layout],
    documentTitle: `${content.title.chip}. ${name}` + (params.kind ? ` — ${params.kind}` : ''),
    head: content.head,
    /* Бегунок собран в конфиге листа целиком: у другой подтемы в нём
       меняется только название, остальное остаётся как было. */
    runner: subtopic === undefined ? content.runner
      : content.runner.replace(content.title.text, subtopic),
    title: { chip: content.title.chip, text: name, subtitle: subtitleOf(params) },
    recap: null,
    blocks,
    /* Строка «Фамилия, имя / Класс / Дата» — на каждом варианте. */
    fields: { date: params.date === '' ? '' : dateText(params.date) },
    /* Несколько вариантов: каждый с новой страницы, со своей шапкой
       и номером. Один — лист как прежде. */
    ...(variants.length > 1
      ? {
          variants: variants.map((list, i) => ({
            title: {
              chip: content.title.chip,
              text: name,
              subtitle: subtitleOf(params),
              variant: `Вариант ${i + 1}`,
            },
            blocks: list,
          })),
        }
      : {}),
    withAnswerLine: !withAnswers,
    extraItems: !withAnswers
      ? []
      : variants.length > 1
        ? variantAnswersItems(
            variants.map((list, i) => ({ title: `Вариант ${i + 1}`, blocks: list })),
            GraphGenerate,
            solutionBuilder,
            quadraticBuilder,
          )
        : answersItems(blocks, GraphGenerate, solutionBuilder, quadraticBuilder),
    foot: content.foot,
  };
}
