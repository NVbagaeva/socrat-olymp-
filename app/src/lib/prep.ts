/**
 * Опорные задачи: мост между конфигом навыков и движком.
 *
 * Единственное место, где приложение разговаривает с graph/. Экраны
 * получают готовые значения пропсами и про движок ничего не знают.
 */

import { prepSkillsFor, type PrepSkill, type PrepSkillId } from '@/content/prepSkills';
import { prep, prototypes } from '@/lib/graph/data/index.js';
import GraphGenerate from '@/lib/graph/generate.js';
import SlopeFigure from '@/lib/graph/slope-figure.js';
import GraphTeacher from '@/lib/graph/solution-teacher.js';
import { katex } from '@/lib/graph/katex';
import { sealAnswer, sealChoice, sealText } from '@/lib/prepSecret';

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
}

export interface PrepOverview {
  skills: PrepSkillView[];
  /** Сколько задач во всех наборах вместе. */
  total: number;
}

/**
 * Состав навыков подтемы.
 *
 * Здесь только то, что известно на сборке: какие навыки есть и
 * сколько в каждом задач. Сколько решено — знает браузер ученика,
 * это читается на клиенте из localStorage.
 */
export function prepOverview(type: string): PrepOverview {
  const skills = prepSkillsFor(type).map((skill) => ({ skill, total: setSize(skill.setId) }));
  const total = skills.reduce((sum, item) => sum + item.total, 0);
  return { skills, total };
}

/** Сколько задач у навыка подтемы. */
export function prepSkillTotal(type: string, id: PrepSkillId): number {
  const found = prepSkillsFor(type).find((skill) => skill.id === id);
  return found === undefined ? 0 : setSize(found.setId);
}

/** Навык подтемы по части адреса. */
export function findPrepSkill(type: string, id: string): PrepSkill | undefined {
  return prepSkillsFor(type).find((skill) => skill.id === id);
}

/** Адреса тренажёров навыков подтемы для статического экспорта. */
export function prepSkillIds(type: string): PrepSkillId[] {
  return prepSkillsFor(type).map((skill) => skill.id);
}

/* ══════════════════════════════════════════════════════════════════
   Задачи навыка: условие, чертёж, ответ и разбор

   Всё это приходит из одной генерации движка, поэтому разбору
   неоткуда разойтись с условием: он считается по той же прямой
   и тому же окну. Захардкоженных условий и разборов в проекте нет.

   Модуль серверный: движок и KaTeX работают на сборке, вниз уходит
   готовая разметка. Ответ вниз не уходит вовсе: только его отпечаток
   (lib/prepSecret.ts), а разбор и пояснения к неверным вариантам —
   закрытыми, они раскрываются после проверки ответа.
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
  /** Порядковый номер шага в разборе: 1…N. */
  number: number;
  /** Номер пункта, как в решении: «3», у задачи с двумя функциями — «II.3». */
  label: string;
  /** Блок задачи с двумя функциями: «II. Находим g(x)». */
  block: string | null;
  title: string;
  /** Направление прямой: движок ставит его только у первого шага. */
  arrow: 'up' | 'down' | null;
  blocks: PrepBlock[];
}

export interface PrepOption {
  number: string;
  html: string;
}

/**
 * Закрытая часть задачи: то, что раскрывается после проверки ответа.
 * В странице лежит JSON этой формы, зашифрованный отпечатком.
 */
export interface PrepZakrytoe {
  /** Разбор. null — если движок не строит его для этой задачи. */
  steps: PrepStep[] | null;
  /**
   * Чем плох вариант — по его номеру. У верного записи нет, поэтому
   * и сам список лежит закрытым: пустое место выдавало бы ответ.
   * Показывается только тому, кто именно этот вариант и выбрал.
   */
  oshibki: Record<string, string>;
}

export interface PrepTask {
  id: string;
  /** Номер в наборе, 1…10. */
  no: number;
  questionHtml: string;
  chartSvg: string | null;
  hintHtml: string | null;
  answerType: 'number' | 'choice';
  options: PrepOption[] | null;
  /** Отпечаток верного ответа с ключом задачи (её id). Ответа здесь нет. */
  seal: string;
  /** Закрытая часть: JSON формы PrepZakrytoe, зашифрованный отпечатком. */
  zakryto: string;
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

/** Запись задачи в данных набора: рядом с условием лежит и правило. */
interface TaskData {
  id: string;
  answerRule: string;
  pointName?: string;
  /** Задачи о параболе: старший коэффициент дан в условии. */
  knownA?: boolean;
}

/** Опорная точка, отмеченная на чертеже задачи. */
interface EnginePoint {
  x: number;
  y: number;
  /** Чем точка стоит на чертеже: вершина, точка на оси, пересечение. */
  role?: string;
}

/** Проверяемая точка: движок кладёт её в meta вместе с расхождением. */
interface EngineProbe {
  x: number;
  y: number;
  delta: number;
}

interface EngineTask {
  id: string;
  svg: string | null;
  questionHtml: string;
  hintHtml: string | null;
  answer: string;
  answerType: string;
  options: { number: string; html: string; error: string | null }[] | null;
  meta: {
    query: unknown;
    probe: EngineProbe | null;
    k: number;
    b: number;
    points: EnginePoint[] | null;
    /* Поля параболы. У задач о прямой их нет, и разбор идёт своей
       веткой: семейство задачи решает, какой модуль его строит. */
    family?: string;
    aFraction?: unknown;
    bFraction?: unknown;
    cFraction?: unknown;
    window?: unknown;
    intersection?: unknown;
    curves?: {
      kind: string;
      kFraction?: unknown;
      bFraction?: unknown;
      aFraction?: unknown;
      cFraction?: unknown;
    }[];
  };
}

/* ── Разбор по пунктам ───────────────────────────────────────────
   Разбор опорной задачи — то же решение по пунктам, что в листе
   ответов для учителя (graph/solution-teacher.js): «Общий вид»,
   «Точки с рисунка», «Направление прямой», «Треугольник», «Находим k»,
   «Находим b», «Формула». Номера пунктов те же, что у шагов подсказки
   в тренажёре. У задачи с двумя функциями пункты разбиты на блоки
   I, II, III, и номер шага — «II.3». */

interface TeacherRow {
  text?: string;
  tex?: string;
}

interface TeacherStep {
  block: string | null;
  no: number;
  title: string;
  rows: TeacherRow[];
  /** Треугольник наклона пункта «Треугольник». */
  slope?: { triangle: unknown; curve: number };
}

/** Что разбору нужно от задачи движка — и ничего сверх. */
export interface SolutionSource {
  id: string;
  answer: string;
  options?: { number: string; html: string }[] | null;
  meta: unknown;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Строка с формулами между знаками $…$ — разметкой KaTeX. */
function inlineHtml(text: string): string {
  return text
    .split('$')
    .map((piece, i) => (i % 2 ? katexHtml(piece) : escapeHtml(piece)))
    .join('');
}

/** Правило ответа: лежит в данных набора — опорного или прототипа. */
function ruleOf(task: SolutionSource): string | null {
  const sets = [...(prep as unknown as GraphSet[]), ...(prototypes as unknown as GraphSet[])];
  for (const set of sets) {
    const found = (set.tasks as TaskData[]).find((item) => item.id === task.id);
    if (found !== undefined) {
      return found.answerRule;
    }
  }
  return (task.meta as { rule?: string }).rule ?? null;
}

/** Номер блока «II. Находим g(x)» → «II». */
function blockNumber(block: string | null): string | null {
  return block === null ? null : (block.split('.')[0] ?? null);
}

/** Ответ разбора: у задач с выбором — номер и текст варианта. */
function answerHtml(task: SolutionSource): string {
  const picked = (task.options ?? []).find((option) => option.number === task.answer);
  const value = picked === undefined ? escapeHtml(task.answer) : task.answer + ') ' + typeset(picked.html);
  return 'Ответ: <b class="key">' + value + '</b>';
}

/**
 * Разбор задачи по пунктам. null — движок решения не строит:
 * придумывать шаги вместо него нельзя.
 */
export function solutionSteps(task: SolutionSource): PrepStep[] | null {
  const rule = ruleOf(task);
  if (rule === null) {
    return null;
  }
  let steps: TeacherStep[];
  try {
    steps = (GraphTeacher.build({ ...task, answerRule: rule }) as { steps: TeacherStep[] }).steps;
  } catch {
    return null;
  }
  if (steps.length === 0) {
    return null;
  }
  return steps.map((step, i) => {
    const blocks: PrepBlock[] = [];
    /* Пункт «Треугольник» начинается с чертежа условия, на котором
       треугольник построен: на чертеже ученика его нет. */
    if (step.slope !== undefined) {
      let svg: string | null = null;
      try {
        svg = SlopeFigure.render(task, [{ triangle: step.slope.triangle, curve: step.slope.curve }]) as
          | string
          | null;
      } catch {
        svg = null;
      }
      if (svg !== null) {
        blocks.push({ type: 'chart', svg });
      }
    }
    step.rows.forEach((row) => {
      if (row.text) {
        blocks.push({ type: 'text', html: inlineHtml(row.text) });
      }
      if (row.tex) {
        blocks.push({ type: 'formula', html: katexHtml(row.tex, true), feature: false });
      }
    });
    if (i === steps.length - 1) {
      blocks.push({ type: 'answer', html: answerHtml(task) });
    }
    const text = step.rows.map((row) => row.text ?? '').join(' ');
    const arrow =
      step.title === 'Направление прямой'
        ? /возрастает/.test(text)
          ? 'up'
          : /убывает/.test(text)
            ? 'down'
            : null
        : null;
    const roman = blockNumber(step.block ?? null);
    return {
      number: i + 1,
      label: roman === null ? String(step.no) : roman + '.' + step.no,
      block: step.block ?? null,
      title: step.title,
      arrow,
      blocks,
    };
  });
}

/** Разбор опорной задачи по шагам — тот, что лежит в странице
    зашифрованным. Открыт для проверок (scripts/check-slope-visibility.mjs). */
export function prepSolutionSteps(task: EngineTask): PrepStep[] | null {
  return solutionSteps(task);
}

/**
 * Десять задач навыка: условия, чертежи, отпечатки ответов и
 * закрытые разборы. Ключ отпечатка — идентификатор задачи: у одного
 * и того же числа в двух задачах отпечатки разные.
 */
export function buildPrepTasks(skill: PrepSkill): PrepTask[] {
  const tasks = GraphGenerate.generateSet(skill.setId) as EngineTask[];

  return tasks.map((task, index) => {
    const choice = task.answerType === 'choice';
    /* У задач с выбором ответ движка — номер варианта, у остальных
       число. Поэтому и отпечаток разный: номер как есть, число — в
       единственной записи. */
    const seal = choice ? sealChoice(task.answer, task.id) : sealAnswer(task.answer, task.id);
    const zakryto: PrepZakrytoe = {
      steps: solutionSteps(task),
      oshibki: Object.fromEntries(
        (task.options ?? []).flatMap((option) =>
          option.error === null ? [] : [[option.number, option.error]],
        ),
      ),
    };
    return {
      id: task.id,
      no: index + 1,
      questionHtml: typeset(task.questionHtml),
      chartSvg: task.svg,
      hintHtml: task.hintHtml === null ? null : typeset(task.hintHtml),
      answerType: choice ? 'choice' : 'number',
      options:
        task.options === null
          ? null
          : task.options.map((option) => ({ number: option.number, html: typeset(option.html) })),
      seal,
      /* Разбор шифруется отпечатком ответа: в странице он лежит
         набором символов, а раскрывается после проверки. */
      zakryto: sealText(JSON.stringify(zakryto), seal),
    };
  });
}
