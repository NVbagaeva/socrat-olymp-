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
import rationalSolution from '@/lib/graph/solution-rational.js';
import sqrtSolution from '@/lib/graph/solution-sqrt.js';
import { conditionSvg, solutionFigure } from '@/lib/sheet/figures12.js';
import { variantAnswersItems } from '@/lib/sheet/answers12.js';
import { parseAnswer } from '@/lib/answer';
import content from '@/content/sheet12.js';
import { skillTitle } from '@/content/skills12';
import type { SheetLayoutId } from '@/content/generator';
import { pickTasks, seedFrom } from '@/lib/trainerSession';
import { manifest } from '@/lib/generator/manifest';
import { planCounts, planOrder, type PlanMethod } from '@/lib/sheetPlan';
import type { EngineTask } from '@/lib/trainer';

/* Адрес листа (параметры ↔ строка запроса) лежит в лёгком модуле: экран
   генератора берёт его, не загружая движок. Здесь он для прежних импортов. */
import {
  MAX_VARIANTS,
  dateText,
  parseSheetQuery,
  sheetQuery,
  subtitleOf,
  variantsFrom,
  type SheetParams,
} from '@/lib/generatorQuery';

export { MAX_VARIANTS, dateText, parseSheetQuery, sheetQuery, subtitleOf, variantsFrom };
export type { SheetParams };

/* Клетка чертежа в миллиметрах: 3,4 в одну колонку, 3,0 в две —
   значения сборника (lib/sheet/README.md). */
const CELL: Record<SheetLayoutId, number> = { single: 3.4, double: 3.0 };

interface SheetTask {
  no: number;
  id: string;
  questionHtml: string;
  options: unknown;
  /** Рисунок условия в режиме 'student' — один на оба листа комплекта. */
  figureSvg: string | null;
  /** Сцена движка: по ней лист учителя рисует построения к разбору. */
  scene: unknown;
  /** Рисунок к разбору — только на листе учителя. */
  solutionFigure?: { svg: string; width: number | null } | null;
  answer: string;
  answerHtml: string | null;
  answerRule: string | undefined;
  seed: string;
  meta: EngineTask['meta'];
  /** Навык задачи — только для раздела ответов учителя. */
  method: string;
}

interface SheetBlock {
  title: string;
  note: string;
  set: string;
  /** false — блок без полосы-заголовка: навык на листе не подписан. */
  head?: boolean;
  tasks: SheetTask[];
}

/**
 * Навыки листа для плана: сколько задач в наборе — то же число, что
 * на карточке навыка и за «Все (N)» в генераторе.
 */
export function sheetMethods(skills: readonly string[]): PlanMethod[] {
  const sizes = new Map<string, number>();
  manifest.families.forEach((family) => {
    family.skills.forEach((skill) => sizes.set(skill.id, skill.count));
  });
  return skills.map((id) => ({ id, capacity: sizes.get(id) ?? 0 }));
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
 * Задачи листа одним блоком без заголовка: навык на листе ученика не
 * подписан. Доли навыков — поровну по плану (lib/sheetPlan.ts), задачи
 * каждого навыка — те же, что собрал бы тренажёр, только seed
 * воспроизводимый. Порядок чередует навыки, чтобы по соседним задачам
 * нельзя было угадать метод.
 */
export function sheetBlocks(params: SheetParams): SheetBlock[] {
  const plan = planCounts(sheetMethods(params.skills), params.count);
  const rules = answerRules();
  /* choice: задачи с выбором варианта листу годятся — варианты
     печатаются списком под условием, а на листе с ответами стоит
     текст верного варианта. Без этого признака лист по навыку, где
     отвечают выбором (знак коэффициента a, формула параболы), выходил
     пустым: шапка и колонтитул есть, задач нет. У линейной подтемы
     задач с выбором нет, и её лист от признака не меняется. */
  const queues = new Map(
    plan.counts.map(({ id, count }) => [
      id,
      count <= 0
        ? []
        : pickTasks(
            {
              skills: [id],
              level: params.level,
              count,
              mode: 'practice',
              mistakes: [],
              choice: true,
            },
            seedFrom(params.seed),
          ).tasks,
    ]),
  );

  let number = 0;
  const tasks: SheetTask[] = [];
  planOrder(plan.counts, params.seed).forEach((id) => {
    const task = queues.get(id)?.shift();
    if (task !== undefined) {
      number += 1;
      tasks.push(sheetTaskFrom(task, number, rules));
    }
  });
  return tasks.length === 0 ? [] : [{ title: '', note: '', set: '', head: false, tasks }];
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
  const engine = task as EngineExtra & { answerHtml?: string | null; scene?: unknown };
  return {
    no,
    id: task.id,
    questionHtml: task.questionHtml,
    options: engine.options ?? null,
    /* На печать — только чистый рисунок: без пунктиров, асимптот,
       треугольников и отмеченных «удобных» узлов (graph/renderer.js,
       режим 'student'). Рисунок сайта task.svg сюда не идёт. */
    figureSvg: task.svg === null ? null : (conditionSvg(engine) as string | null),
    scene: engine.scene ?? null,
    answer: task.answer,
    answerHtml: engine.answerHtml ?? null,
    answerRule: rules[task.id],
    seed: task.meta.seed,
    meta: task.meta,
    method: skillTitle[task.meta.set] ?? task.meta.set,
  };
}

/** Что уже стоит на листах прежних вариантов. */
interface VariantMemory {
  /** Условия с чертежами всех задач всех вариантов. */
  shown: Set<string>;
  /** Ответы по месту задачи: номер на листе → ответы. */
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
 * Следующий вариант по образцу первого: то же число задач, на каждом
 * месте — та же задача того же навыка (тот же тип и уровень), только
 * на другом seed, то есть с другими числами. Порядок и доли навыков
 * не меняются: задача N в каждом варианте — одного навыка.
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
  /* Наборы движка на новых seed — по набору задачи: в блоке листа
     навыки перемешаны. */
  const batches = new Map<string, EngineTask[][]>();
  const batchOf = (setId: string, attempt: number): EngineTask[] => {
    const list = batches.get(setId) ?? [];
    batches.set(setId, list);
    if (list[attempt] === undefined) {
      try {
        list[attempt] = GraphGenerate.generateSet(
          setId,
          `${params.seed}:v${k}:${setId}:${attempt}`,
        ) as EngineTask[];
      } catch {
        list[attempt] = [];
      }
    }
    return list[attempt] ?? [];
  };

  return base.map((block) => {
    const tasks = block.tasks.map((sample, i) => {
      const batch = (attempt: number) => batchOf(sample.meta.set, attempt);
      const slotAnswers = memory.answers.get(`${block.set}#${i}`) ?? new Set<string>();
      const sampleLevel = sample.meta.level ?? null;
      const sampleType = sample.options === null ? 'number' : 'choice';
      let best: SheetTask | null = null;
      let bestTier = 5;
      for (let attempt = 0; attempt < VARIANT_TRIES && bestTier > 1; attempt += 1) {
        for (const candidate of batch(attempt)) {
          const engine = candidate as EngineExtra;
          const same = candidate.id === sample.id;
          if (
            !same &&
            ((candidate.meta.level ?? null) !== sampleLevel ||
              (engine.answerType ?? 'number') !== sampleType)
          ) {
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

/* Лист учителя: рисунок условия тот же, что у ученика, а построения
   (система x′Oy′ у параболы, треугольник наклона у прямой и у корня,
   асимптоты у гиперболы) — отдельным рисунком рядом с разбором
   (sheet/figures12.js). */
function withSolutionFigures(variants: SheetBlock[][], cell: number): SheetBlock[][] {
  return variants.map((blocks) =>
    blocks.map((block) => ({
      ...block,
      tasks: block.tasks.map((task) => ({
        ...task,
        solutionFigure: solutionFigure(task, GraphGenerate, cell) as SheetTask['solutionFigure'],
      })),
    })),
  );
}

/* Разбор по шагам на листе учителя: гипербола и график корня — у
   каждого свой модуль, выбор по семейству задачи. */
const rationalBuilder = {
  fromTask(task: { meta: { family?: string } }) {
    return task.meta.family === 'sqrt'
      ? sqrtSolution.fromTask(task)
      : rationalSolution.fromTask(task);
  },
};

/**
 * Описание листа для шаблона. Ученику — строка «Ответ: ____» и ни
 * одного ответа; учителю — те же задачи и раздел «Ответы» с новой
 * страницы. Рамки «Повторяем» на варианте нет.
 */
export function sheetSpec(params: SheetParams, withAnswers: boolean, subtopic?: string) {
  const variants = withAnswers
    ? withSolutionFigures(sheetVariants(params), CELL[params.layout])
    : sheetVariants(params);
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
    runner:
      subtopic === undefined
        ? content.runner
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
      : variantAnswersItems(
          variants.map((list, i) => ({
            title: variants.length > 1 ? `Вариант ${i + 1}` : null,
            blocks: list,
          })),
          GraphGenerate,
          solutionBuilder,
          quadraticBuilder,
          rationalBuilder,
        ),
    foot: content.foot,
  };
}
