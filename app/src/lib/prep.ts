/**
 * Подготовительные задачи: мост между конфигом навыков и движком.
 *
 * Единственное место, где приложение разговаривает с graph/. Экраны
 * получают готовые значения пропсами и про движок ничего не знают.
 */

import { prepSkills, type PrepSkill, type PrepSkillId } from '@/content/prepSkills';
import { demoPrepSolved } from '@/data/demo';
import { prep, prototypes } from '@/lib/graph/data/index.js';
import GraphGenerate from '@/lib/graph/generate.js';
import GraphSolution from '@/lib/graph/solution.js';
import { renderGraph } from '@/lib/graph/renderer.js';
import { katex } from '@/lib/graph/katex';

interface GraphSet {
  id: string;
  tasks: unknown[];
}

/** Сколько задач в наборе. Число берётся из данных, а не из конфига. */
function setSize(setId: string): number {
  const found = (prep as unknown as GraphSet[]).find((item) => item.id === setId);
  return found ? found.tasks.length : 0;
}

export interface PrepSkillView {
  skill: PrepSkill;
  /** Сколько задач в наборе. */
  total: number;
  /** Сколько решено — витринное значение из demo.ts. */
  solved: number;
  /** Доля решённого, 0–100. */
  percent: number;
}

export interface PrepOverview {
  skills: PrepSkillView[];
  solved: number;
  total: number;
  percent: number;
}

function share(solved: number, total: number): number {
  return total === 0 ? 0 : (solved / total) * 100;
}

/**
 * Состояние всех четырёх навыков разом.
 *
 * Общее число задач и проценты считаются здесь: отдельными
 * константами они не заданы нигде, поэтому разойтись с данными
 * им не на чем.
 */
export function prepOverview(): PrepOverview {
  const skills = prepSkills.map((skill) => {
    const total = setSize(skill.setId);
    /* Решено не может быть больше, чем есть: витринное число живёт
       отдельно от наборов и при их правке могло бы обогнать длину. */
    const solved = Math.min(demoPrepSolved[skill.id], total);
    return { skill, total, solved, percent: share(solved, total) };
  });

  const solved = skills.reduce((sum, item) => sum + item.solved, 0);
  const total = skills.reduce((sum, item) => sum + item.total, 0);
  return { skills, solved, total, percent: share(solved, total) };
}

/** Витрина одного навыка. Берётся из той же выборки, что и список. */
export function prepSkillView(id: PrepSkillId): PrepSkillView | undefined {
  return prepOverview().skills.find((view) => view.skill.id === id);
}

/** Навык по части адреса. */
export function findPrepSkill(id: string): PrepSkill | undefined {
  return prepSkills.find((skill) => skill.id === id);
}

/** Адреса тренажёров навыков для статического экспорта. */
export function prepSkillIds(): PrepSkillId[] {
  return prepSkills.map((skill) => skill.id);
}

/* ══════════════════════════════════════════════════════════════════
   Задачи навыка: условие, чертёж, ответ и разбор

   Всё это приходит из одной генерации движка, поэтому разбору
   неоткуда разойтись с условием: он считается по той же прямой
   и тому же окну. Захардкоженных условий и разборов в проекте нет.

   Модуль серверный: движок и KaTeX работают на сборке, вниз уходит
   готовая разметка.
   ══════════════════════════════════════════════════════════════════ */

/** Блок разбора в том виде, в каком его рисует экран. */
export type PrepBlock =
  | { type: 'text'; html: string }
  | { type: 'formula'; html: string; feature: boolean }
  | { type: 'answer'; html: string }
  | { type: 'chart'; svg: string }
  | { type: 'callout'; title: string; blocks: PrepBlock[] }
  | { type: 'details'; title: string; blocks: PrepBlock[] };

export interface PrepStep {
  number: number;
  title: string;
  /** Направление прямой: движок ставит его только у первого шага. */
  arrow: 'up' | 'down' | null;
  blocks: PrepBlock[];
}

export interface PrepOption {
  number: string;
  html: string;
  /** Чем плох вариант. У верного — null. Показывается только тому,
      кто именно этот вариант и выбрал. */
  error: string | null;
}

export interface PrepTask {
  id: string;
  /** Номер в наборе, 1…10. */
  no: number;
  questionHtml: string;
  chartSvg: string | null;
  hintHtml: string | null;
  answerType: 'number' | 'choice';
  /** Число текстом — или номер верного варианта у задач с выбором. */
  answer: string;
  options: PrepOption[] | null;
  /** Разбор. null — если движок не строит его для этой задачи. */
  steps: PrepStep[] | null;
}

/* Наборы движку передаются один раз на модуль: дальше он берёт их
   из своего кэша. */
GraphGenerate.setSets({ prep, prototypes });

/* ── KaTeX на сборке ─────────────────────────────────────────────
   Движок оставляет формулы заглушками <span class="math" data-tex>,
   а штатный renderFormulas требует DOM и работает в браузере. Здесь
   те же места набираются во время сборки: в браузер уходит готовая
   вёрстка, без вспышки сырого TeX и без работы на клиенте. */

const MATH_OPEN = /<span class="math" data-tex="([^"]*)"[^>]*>/;

/** Обратная замена к esc() движка: он экранирует &, < и >. */
function unescapeTex(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

/* Внутри заглушки лежит запасная вёрстка со своими <span>, поэтому
   парный </span> ищется со счётчиком вложенности, а не первым
   попавшимся. */
function closingSpan(html: string, from: number): number {
  const tags = /<span\b|<\/span>/g;
  tags.lastIndex = from;
  let depth = 1;
  let tag = tags.exec(html);
  while (tag !== null) {
    depth += tag[0] === '</span>' ? -1 : 1;
    if (depth === 0) {
      return tag.index;
    }
    tag = tags.exec(html);
  }
  return -1;
}

function katexHtml(tex: string, displayMode = false): string {
  return katex.renderToString(tex, { throwOnError: false, displayMode });
}

/** Заменить заглушки формул вёрсткой KaTeX. */
function typeset(html: string): string {
  let rest = html;
  let out = '';

  for (;;) {
    const open = MATH_OPEN.exec(rest);
    if (open === null) {
      return out + rest;
    }

    const from = open.index + open[0].length;
    const close = closingSpan(rest, from);
    if (close === -1) {
      /* Разметка не сошлась — оставляем как есть: запасная вёрстка
         движка читаемая, пустого места не будет. */
      return out + rest;
    }

    out += rest.slice(0, open.index) + katexHtml(unescapeTex(open[1] ?? ''));
    rest = rest.slice(close + '</span>'.length);
  }
}

/* ── Сборка задач навыка ─────────────────────────────────────── */

interface EngineBlock {
  type: string;
  html?: string;
  tex?: string;
  feature?: boolean;
  title?: string;
  scene?: unknown;
  blocks?: EngineBlock[];
}

function viewBlock(block: EngineBlock): PrepBlock | null {
  if (block.type === 'text') {
    return { type: 'text', html: typeset(block.html ?? '') };
  }
  if (block.type === 'answer') {
    return { type: 'answer', html: typeset(block.html ?? '') };
  }
  if (block.type === 'formula') {
    return {
      type: 'formula',
      html: katexHtml(block.tex ?? '', true),
      feature: block.feature === true,
    };
  }
  if (block.type === 'scene') {
    return { type: 'chart', svg: renderGraph(block.scene) as string };
  }
  if (block.type === 'callout' || block.type === 'details') {
    return {
      type: block.type,
      title: block.title ?? '',
      blocks: viewBlocks(block.blocks ?? []),
    };
  }
  return null;
}

function viewBlocks(blocks: EngineBlock[]): PrepBlock[] {
  return blocks.map(viewBlock).filter((block): block is PrepBlock => block !== null);
}

/** Правило ответа задачи: лежит в данных набора, рядом с условием. */
function answerRule(taskId: string): string | null {
  const sets = prep as unknown as { tasks?: { id: string; answerRule: string }[] }[];
  for (const set of sets) {
    const found = (set.tasks ?? []).find((task) => task.id === taskId);
    if (found !== undefined) {
      return found.answerRule;
    }
  }
  return null;
}

interface EngineTask {
  id: string;
  svg: string | null;
  questionHtml: string;
  hintHtml: string | null;
  answer: string;
  answerType: string;
  options: { number: string; html: string; error: string | null }[] | null;
  meta: { query: unknown; probe: unknown; k: number };
}

interface Analysis {
  triangle: unknown;
  line: unknown;
  scene: { window: unknown };
}

/* Ответ в записи TeX. Числа приходят из движка в школьной записи:
   запятая как разделитель и типографский минус в некоторых местах. */
function answerTex(answer: string): string {
  return answer.replace(/,/g, '{,}').replace(/\u2212/g, '-');
}

/**
 * Разбор горизонтальной прямой.
 *
 * Треугольника наклона у неё нет, поэтому движок разбора не строит —
 * но задача законная и объясняется проще прочих. Это отдельная ветка
 * ровно на этот случай: обычный разбор она не подменяет, движок
 * не трогает.
 *
 * Число в ответе берётся из данных задачи, а не пишется руками.
 */
function flatSteps(task: EngineTask): PrepStep[] {
  const value = answerTex(task.answer);

  return [
    {
      number: 1,
      title: 'Смотрим на прямую',
      arrow: null,
      blocks: [
        {
          type: 'text',
          html: 'Прямая горизонтальная: при движении вправо она не поднимается и не опускается.',
        },
      ],
    },
    {
      number: 2,
      title: 'Находим k',
      arrow: null,
      blocks: [
        {
          type: 'text',
          html:
            'Значит, ' + katexHtml('\\Delta y = 0') + ' при любом ' + katexHtml('\\Delta x') + '.',
        },
        {
          type: 'formula',
          html: katexHtml(
            'k = \\Delta y : \\Delta x = 0 : \\Delta x = ' + value,
            true,
          ),
          feature: false,
        },
        {
          type: 'answer',
          html: 'Ответ: <b class="key">' + katexHtml('k = ' + value) + '</b>.',
        },
      ],
    },
  ];
}

/**
 * Разбор задачи по шагам.
 *
 * Шаги и числа считает движок: заголовки, выкладки и ответ приходят
 * из него, а экран только расставляет их по разметке. Для прямой без
 * наклона треугольник не строится, и разбора у такой задачи нет —
 * это честное null, а не выдуманные шаги.
 */
function buildSteps(task: EngineTask): PrepStep[] | null {
  const found = GraphGenerate.analysis(task.id) as Analysis | null;
  if (!found) {
    /* Единственный случай без треугольника, который мы умеем
       объяснить сами. Любая другая причина — по-прежнему null,
       и экран честно скажет, что разбора нет. */
    return task.meta.k === 0 ? flatSteps(task) : null;
  }

  const steps = GraphSolution.build({
    triangle: found.triangle,
    line: found.line,
    window: found.scene.window,
    task: {
      rule: answerRule(task.id),
      answer: task.answer,
      query: task.meta.query,
      probe: task.meta.probe,
    },
  }) as { number: number; title: string; arrow?: string; blocks: EngineBlock[] }[];

  return steps.map((step) => ({
    number: step.number,
    title: step.title,
    arrow: step.arrow === 'up' || step.arrow === 'down' ? step.arrow : null,
    blocks: viewBlocks(step.blocks),
  }));
}

/** Десять задач навыка: условия, чертежи, ответы и разборы. */
export function buildPrepTasks(skill: PrepSkill): PrepTask[] {
  const tasks = GraphGenerate.generateSet(skill.setId) as EngineTask[];

  return tasks.map((task, index) => ({
    id: task.id,
    no: index + 1,
    questionHtml: typeset(task.questionHtml),
    chartSvg: task.svg,
    hintHtml: task.hintHtml === null ? null : typeset(task.hintHtml),
    answerType: task.answerType === 'choice' ? 'choice' : 'number',
    answer: task.answer,
    options:
      task.options === null
        ? null
        : task.options.map((option) => ({
            number: option.number,
            html: typeset(option.html),
            error: option.error,
          })),
    steps: buildSteps(task),
  }));
}
