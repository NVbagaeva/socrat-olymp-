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
import { answersItems } from '@/lib/sheet/answers12.js';
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
  const picked = pickTasks(
    { skills: params.skills, level: params.level, count: params.count, mode: 'practice', mistakes: [] },
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
          const engine = task as EngineTask & {
            options?: unknown;
            answerHtml?: string | null;
          };
          return {
            no: number,
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
        }),
      };
    })
    .filter((block) => block.tasks.length > 0);
}

/**
 * Описание листа для шаблона. Ученику — строка «Ответ: ____» и ни
 * одного ответа; учителю — те же задачи и раздел «Ответы» с новой
 * страницы. Рамки «Повторяем» на варианте нет.
 */
export function sheetSpec(params: SheetParams, withAnswers: boolean) {
  const blocks = sheetBlocks(params);
  return {
    theme: params.theme,
    layout: params.layout,
    cell: CELL[params.layout],
    documentTitle: `${content.title.chip}. ${content.title.text}` + (params.kind ? ` — ${params.kind}` : ''),
    head: content.head,
    runner: content.runner,
    title: { chip: content.title.chip, text: content.title.text, subtitle: params.kind },
    recap: null,
    blocks,
    withAnswerLine: !withAnswers,
    extraItems: withAnswers ? answersItems(blocks, GraphGenerate, solutionBuilder) : [],
    foot: content.foot,
  };
}
