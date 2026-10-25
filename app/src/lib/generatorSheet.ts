'use client';

/**
 * Лист для печати из генератора: адрес → задачи → описание листа.
 *
 * Параметры варианта живут в адресе страницы печати: один и тот же
 * адрес всегда даёт один и тот же лист, а лист ученика и лист
 * с ответами по одному seed содержат одни и те же задачи. Задачи
 * считает движок graph/ в браузере, лист раскладывает шаблон
 * lib/sheet/ — тот же, что печатает сборник в CI.
 *
 * Адреса общего генератора (ps=2): состав «набор × число» с ключами
 * позиций (lib/generator/obshchiy/klyuchi.ts). Шаблон задачи позиции —
 * по коду листа и ключу, один во всех вариантах: вариант 2 на том же
 * месте — та же задача с другими числами. Условия одного набора в
 * варианте не повторяются; замены — по цепочке, каждая новая.
 */

import GraphGenerate from '@/lib/graph/generate.js';
import solutionBuilder from '@/lib/graph/solution.js';
import quadraticBuilder from '@/lib/graph/solution-quadratic.js';
import rationalSolution from '@/lib/graph/solution-rational.js';
import sqrtSolution from '@/lib/graph/solution-sqrt.js';
import exponentialSolution from '@/lib/graph/solution-exponential.js';
import logarithmicSolution from '@/lib/graph/solution-logarithmic.js';
import trigonometricSolution from '@/lib/graph/solution-trigonometric.js';
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
import { functionTypes } from '@/data/functionTypes';
import { exampleItems, recapOf } from '@/lib/ves12/build';
import { klyuchSlota, slotySostava, type Slot } from '@/lib/generator/obshchiy/klyuchi';
import { rngOf } from '@/lib/vychisleniya/rng';

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
  /** Ключ позиции «вариант.ключ» (ps=2): для замены в генераторе. */
  pos?: string;
  no: number;
  id: string;
  questionHtml: string;
  /** Условие простым текстом: по нему рисунок оставляет названные точки. */
  question: string;
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
  /** Рамка «Запомни» типа (генератор по всем типам №12). */
  recap?: { title: string; items: string[]; phrase: string | null } | null;
  /** Разобранные примеры перед задачами блока. */
  leadItems?: string[];
}

/** Уровни задач набора — из манифеста. */
function levelsOf(setId: string): string[] {
  for (const family of manifest.families) {
    const skill = family.skills.find((item) => item.id === setId);
    if (skill !== undefined) {
      return skill.levels;
    }
  }
  return [];
}

/** Тип функции набора: по манифесту генератора. */
function typeOfSet(setId: string) {
  const family = manifest.families.find((item) => item.skills.some((skill) => skill.id === setId));
  return functionTypes.find((type) => type.id === family?.id);
}

/**
 * Генератор по всем типам №12: задачи по блокам типов (или одним
 * блоком вперемешку), рамка «Запомни» и разобранные примеры каждого
 * типа. У генератора раздела этих полей в адресе нет — лист прежний.
 */
function groupedBlocks(params: SheetParams, tasks: SheetTask[]): SheetBlock[] {
  const theory = params.theory === true;
  const examples = params.examples ?? 0;
  const types = functionTypes.filter((type) =>
    params.skills.some((setId) => typeOfSet(setId)?.id === type.id),
  );
  /* Примеры — по выбранным прототипам типа; не у всякого прототипа
     движок строит разбор (знак коэффициента параболы — выбор варианта),
     и тогда пример берётся из других прототипов того же типа. */
  const exampleSets = (typeId: string) => {
    const chosen = params.skills.filter((setId) => typeOfSet(setId)?.id === typeId);
    const others = (manifest.families.find((family) => family.id === typeId)?.skills ?? [])
      .filter((skill) => skill.kind === 'prototype' && !chosen.includes(skill.id))
      .map((skill) => skill.id);
    return [...chosen, ...others];
  };
  const extras = (type: (typeof types)[number]) => ({
    recap: theory ? recapOf(type) : null,
    leadItems:
      examples > 0
        ? exampleItems(type, exampleSets(type.id), examples, params.seed)
        : [],
  });
  if (params.order === 'types') {
    let number = 0;
    return types
      .map((type) => {
        const own = tasks
          .filter((task) => typeOfSet(task.meta.set)?.id === type.id)
          .map((task) => {
            number += 1;
            return { ...task, no: number };
          });
        return { title: type.title, note: type.graphName, set: type.id, tasks: own, ...extras(type) };
      })
      .filter((block) => block.tasks.length > 0);
  }
  /* Вперемешку: сначала теория всех типов, затем задачи одним блоком. */
  const lead: SheetBlock[] =
    theory || examples > 0
      ? types.map((type) => ({ title: type.title, note: type.graphName, set: `teoriya:${type.id}`, tasks: [], ...extras(type) }))
      : [];
  return [...lead, { title: '', note: '', set: '', head: false, tasks }];
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
  /* Генератор по всем типам задаёт задачи каждого прототипа сам (по
     счётчикам типов); у генератора раздела — поровну по плану. */
  const plan =
    params.per === undefined
      ? planCounts(sheetMethods(params.skills), params.count)
      : { counts: params.skills.map((id) => ({ id, count: params.per?.[id] ?? 0 })) };
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
              /* Уровня нет у набора — задачи любого уровня: иначе
                 прототип молча выпал бы с листа. */
              level: levelsOf(id).includes(params.level ?? '') ? params.level : null,
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
  if (tasks.length === 0) {
    return [];
  }
  if (params.order === 'types' || params.theory === true || (params.examples ?? 0) > 0) {
    return groupedBlocks(params, tasks);
  }
  return [{ title: '', note: '', set: '', head: false, tasks }];
}

/* Сколько seed перебирать на набор, подбирая задачи следующего
   варианта: как у тренажёра. */
const VARIANT_TRIES = 24;

type EngineExtra = EngineTask & { options?: unknown; answerType?: string };

/** Что видит ученик: условие, чертёж (по сцене), варианты ответа. Сцена,
 *  а не SVG: так кандидата следующего варианта не нужно рисовать. */
function shownKey(task: { questionHtml: string; scene?: unknown; options?: unknown }): string {
  return `${task.questionHtml}\u0000${JSON.stringify(task.scene ?? null)}\u0000${JSON.stringify(task.options ?? null)}`;
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
  const engine = task as EngineExtra & { answerHtml?: string | null; scene?: unknown; question?: string };
  return {
    no,
    id: task.id,
    questionHtml: task.questionHtml,
    question: engine.question ?? '',
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
          if (memory.shown.has(shownKey(engine))) {
            continue;
          }
          const fresh = !slotAnswers.has(candidate.answer);
          const tier = same ? (fresh ? 1 : 2) : fresh ? 3 : 4;
          if (tier < bestTier) {
            /* Рисунок листа — только у взятой задачи. */
            best = sheetTaskFrom(candidate, 0, rules);
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

/* ── Схема ps=2 ───────────────────────────────────────────────────── */

type ShablonNabora = { id: string; level?: string | null };

/** Шаблоны набора, годные уровню листа; у набора нет такого уровня — все. */
function shablonyNabora(setId: string, level: string | null): string[] {
  const sets = GraphGenerate.loadSets() as { prototypes: { id: string; tasks?: ShablonNabora[] }[] };
  const tasks = sets.prototypes.find((set) => set.id === setId)?.tasks ?? [];
  const fit = level === null ? tasks : tasks.filter((t) => t.level === level);
  return (fit.length > 0 ? fit : tasks).map((t) => t.id);
}

/**
 * Задачи позиций по вариантам (ps=2). Позиции одного набора считаются
 * по возрастанию ключа и обходят условия младших: перестановка задач их
 * не меняет. Шаблон позиции — k-й в перестановке шаблонов набора по коду
 * листа, один во всех вариантах.
 */
function zadachiPoKlyucham(params: SheetParams, rules: Record<string, string>) {
  const sloty = slotySostava(params.sostav ?? []);
  const poryadok = sloty.slice().sort((a, b) => a.id.localeCompare(b.id) || a.k - b.k);
  const level = (id: string) => (levelsOf(id).includes(params.level ?? '') ? params.level : null);
  const batches = new Map<string, EngineTask[]>();
  const batch = (setId: string, seed: string): EngineTask[] => {
    const key = `${setId}|${seed}`;
    let list = batches.get(key);
    if (list === undefined) {
      try {
        list = GraphGenerate.generateSet(setId, seed) as EngineTask[];
      } catch {
        list = [];
      }
      batches.set(key, list);
    }
    return list;
  };
  const shablon = (slot: Slot) => {
    const all = shablonyNabora(slot.id, level(slot.id));
    const perm = rngOf(`${params.seed}|${slot.id}|shablony`).sample(all, all.length);
    return perm.length === 0 ? null : (perm[slot.k % perm.length] as string);
  };
  /* Что видит ученик: условие, варианты и нарисованный рисунок. Сцена
     движка для этого не годится — она различается и в невидимых полях. */
  const vid = (t: EngineTask): string => {
    const e = t as EngineExtra & { scene?: unknown };
    return `${t.questionHtml}\u0000${JSON.stringify(e.options ?? null)}\u0000${t.svg === null ? '' : String(conditionSvg(e) ?? '')}`;
  };
  /* Задача позиции на seed: сначала её шаблон, затем другие шаблоны того же уровня. */
  const vzyat = (slot: Slot, seed: string, zanyato: ReadonlySet<string>): EngineTask | null => {
    const id = shablon(slot);
    const lv = level(slot.id);
    /* Набор на seed может не собраться целиком (движок бросает, если хоть
       одна задача не подобралась) — тогда попытка пустая. Другой шаблон того
       же уровня запоминается из любой попытки: у шаблона бывает мало чисел. */
    let zapas: EngineTask | null = null;
    let drugoy: EngineTask | null = null;
    for (let a = 0; a < VARIANT_TRIES; a += 1) {
      const list = batch(slot.id, a === 0 ? seed : `${seed}~${a}`).filter((t) =>
        usable(t as EngineExtra),
      );
      const svoy = list.find((t) => t.id === id);
      if (svoy !== undefined && !zanyato.has(vid(svoy))) return svoy;
      zapas ??= svoy ?? null;
      drugoy ??=
        list.find((t) => (lv === null || t.meta.level === lv) && !zanyato.has(vid(t))) ?? null;
    }
    return drugoy ?? zapas;
  };
  return Array.from({ length: params.variants }, (_, vi) => {
    const v = vi + 1;
    const out = new Map<string, SheetTask>();
    const vzyato = new Map<string, Set<string>>();
    for (const slot of poryadok) {
      const key = klyuchSlota(slot);
      const base = `${params.seed}|${v}|${key}`;
      const zanyato = vzyato.get(slot.id) ?? new Set<string>();
      let task = vzyat(slot, base, zanyato);
      const bylo = new Set([...zanyato, ...(task === null ? [] : [vid(task)])]);
      const z = params.zameny?.[`${v}.${key}`] ?? 0;
      for (let j = 1; j <= z && task !== null; j += 1) {
        task = vzyat(slot, `${base}|z${j}`, bylo) ?? task;
        bylo.add(vid(task));
      }
      if (task === null) continue;
      zanyato.add(vid(task));
      vzyato.set(slot.id, zanyato);
      out.set(key, { ...sheetTaskFrom(task, 0, rules), pos: `${v}.${key}` });
    }
    return sloty.flatMap((slot) => {
      const t = out.get(klyuchSlota(slot));
      return t === undefined ? [] : [t];
    });
  });
}

/**
 * Варианты листа ps=2. Одна подтема без рамок — один блок без полосы:
 * навык на листе ученика не подписан. Несколько типов или рамки —
 * подряд идущие задачи одного типа блоком, «Запомни» и примеры — перед
 * первым блоком типа.
 */
export function sheetVariantsPoKlyucham(params: SheetParams): SheetBlock[][] {
  const rules = answerRules();
  const theory = params.theory === true;
  const examples = params.examples ?? 0;
  const tipy = new Set(params.skills.map((id) => typeOfSet(id)?.id));
  const poTipam = theory || examples > 0 || tipy.size > 1;
  const exampleSets = (typeId: string) => {
    const chosen = params.skills.filter((setId) => typeOfSet(setId)?.id === typeId);
    const others = (manifest.families.find((family) => family.id === typeId)?.skills ?? [])
      .filter((skill) => skill.kind === 'prototype' && !chosen.includes(skill.id))
      .map((skill) => skill.id);
    return [...chosen, ...others];
  };
  return zadachiPoKlyucham(params, rules).map((tasks) => {
    const numbered = tasks.map((t, i) => ({ ...t, no: i + 1 }));
    if (!poTipam) {
      return numbered.length === 0 ? [] : [{ title: '', note: '', set: '', head: false, tasks: numbered }];
    }
    const out: SheetBlock[] = [];
    const bylo = new Set<string>();
    for (const task of numbered) {
      const type = typeOfSet(task.meta.set);
      if (type === undefined) continue;
      const last = out[out.length - 1];
      if (last !== undefined && last.set === type.id) {
        last.tasks.push(task);
        continue;
      }
      const pervyy = !bylo.has(type.id);
      bylo.add(type.id);
      out.push({
        title: type.title,
        note: type.graphName,
        set: type.id,
        tasks: [task],
        recap: pervyy && theory ? recapOf(type) : null,
        leadItems:
          pervyy && examples > 0
            ? exampleItems(type, exampleSets(type.id), examples, params.seed)
            : [],
      });
    }
    return out;
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

/**
 * Описание листа для шаблона. Ученику — строка «Ответ: ____» и ни
 * одного ответа; учителю — те же задачи и раздел «Ответы» с новой
 * страницы. Рамки «Повторяем» на варианте нет.
 */
export function sheetSpec(
  params: SheetParams,
  withAnswers: boolean,
  subtopic?: string,
  /** QR-код на лист ученика, SVG (ps=2): считает страница печати по своему адресу. */
  qrSvg?: string,
) {
  const vse = params.poKlyucham === true ? sheetVariantsPoKlyucham(params) : sheetVariants(params);
  const variants = withAnswers ? withSolutionFigures(vse, CELL[params.layout]) : vse;
  const blocks = variants[0] ?? [];
  /* Название подтемы приходит со страницы: лист собирается один на
     все подтемы задания, а в шапке должно стоять то, что печатают.
     Не передали — остаётся название из конфига листа. */
  const name = subtopic ?? content.title.text;
  /* Лист генератора (ps=2) без вида работы и даты — подпись по умолчанию;
     QR-код — справа в строке названия. Прежние листы — как были. */
  const nova = params.poKlyucham === true;
  const subtitle = subtitleOf(params) || (nova ? content.title.subtitle : '');
  const qr = nova && params.qr === true && qrSvg !== undefined ? { qr: qrSvg } : {};
  return {
    theme: params.theme,
    layout: params.layout,
    cell: CELL[params.layout],
    documentTitle: `${content.title.chip}. ${name}` + (params.kind ? ` — ${params.kind}` : ''),
    head:
      nova && params.uchitel !== undefined ? { ...content.head, author: params.uchitel } : content.head,
    /* Бегунок собран в конфиге листа целиком: у другой подтемы в нём
       меняется только название, остальное остаётся как было. */
    runner:
      subtopic === undefined
        ? content.runner
        : content.runner.replace(content.title.text, subtopic),
    title: { chip: content.title.chip, text: name, subtitle, ...qr },
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
              subtitle,
              variant: `Вариант ${i + 1}`,
              ...qr,
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

const STROKA_OTVETA =
  '<p class="sheet-answer-line">Ответ:<span class="sheet-answer-blank"></span></p>';

/**
 * «Всё одним файлом» генератора (ps=2): листы ученика всех вариантов
 * (со строкой ответа), затем листы учителя с построениями и ответы.
 */
export function sheetSpecVse(params: SheetParams, subtopic?: string, qrSvg?: string) {
  const uchenik = sheetSpec(params, false, subtopic, qrSvg);
  const uchitel = sheetSpec(params, true, subtopic, qrSvg);
  const spisok = (spec: typeof uchenik) =>
    spec.variants ?? [{ title: spec.title, blocks: spec.blocks }];
  return {
    ...uchitel,
    blocks: [],
    variants: [
      ...spisok(uchenik).map((v) => ({
        ...v,
        blocks: v.blocks.map((b) => ({
          ...b,
          tasks: b.tasks.map((t) => ({ ...t, solutionHtml: STROKA_OTVETA })),
        })),
      })),
      ...spisok(uchitel).map((v) => ({
        ...v,
        title: { ...v.title, subtitle: [v.title.subtitle, content.resheniya].filter(Boolean).join(' · ') },
      })),
    ],
    withAnswerLine: false,
  };
}
