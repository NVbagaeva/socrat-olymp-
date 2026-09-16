/**
 * Подготовительные задачи: мост между конфигом навыков и движком.
 *
 * Единственное место, где приложение разговаривает с graph/. Экраны
 * получают готовые значения пропсами и про движок ничего не знают.
 */

import { prepSkills, type PrepSkill, type PrepSkillId } from '@/content/prepSkills';
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
}

export interface PrepOverview {
  skills: PrepSkillView[];
  /** Сколько задач во всех наборах вместе. */
  total: number;
}

/**
 * Состав всех четырёх навыков.
 *
 * Здесь только то, что известно на сборке: какие навыки есть и
 * сколько в каждом задач. Сколько решено — знает браузер ученика,
 * это читается на клиенте из localStorage.
 */
export function prepOverview(): PrepOverview {
  const skills = prepSkills.map((skill) => ({ skill, total: setSize(skill.setId) }));
  const total = skills.reduce((sum, item) => sum + item.total, 0);
  return { skills, total };
}

/** Сколько задач у навыка. */
export function prepSkillTotal(id: PrepSkillId): number {
  const found = prepSkills.find((skill) => skill.id === id);
  return found === undefined ? 0 : setSize(found.setId);
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
  if (block.type === 'callout') {
    return { type: 'callout', title: block.title ?? '', blocks: viewBlocks(block.blocks ?? []) };
  }
  if (block.type === 'details') {
    return { type: 'details', title: block.title ?? '', blocks: viewBlocks(block.blocks ?? []) };
  }
  return null;
}

function viewBlocks(blocks: EngineBlock[]): PrepBlock[] {
  return blocks.map(viewBlock).filter((block): block is PrepBlock => block !== null);
}

/** Запись задачи в данных набора: рядом с условием лежит и правило. */
interface TaskData {
  id: string;
  answerRule: string;
  pointName?: string;
}

function taskData(taskId: string): TaskData | null {
  const sets = prep as unknown as { tasks?: TaskData[] }[];
  for (const set of sets) {
    const found = (set.tasks ?? []).find((task) => task.id === taskId);
    if (found !== undefined) {
      return found;
    }
  }
  return null;
}

/** Правило ответа задачи: лежит в данных набора, рядом с условием. */
function answerRule(taskId: string): string | null {
  return taskData(taskId)?.answerRule ?? null;
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
  meta: { query: unknown; probe: EngineProbe | null; k: number; b: number };
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

/* ── Разбор подстановкой: набор без чертежа ──────────────────────
   У задач с флагом noChart окна и опорных точек нет, поэтому движок
   разбора не строит: треугольнику наклона не по чему строиться.
   Разбор при этом простой и один и тот же — подставить абсциссу
   точки в формулу и сравнить результат с её ординатой. Это отдельная
   ветка ровно на такие задачи; движок она не подменяет и не трогает.

   Все числа берутся из данных задачи: k, b и координаты точки
   приходят в meta той же генерации, что собрала условие.
   ══════════════════════════════════════════════════════════════════ */

const MINUS = '\u2212';

/** Число в школьной записи: запятая вместо точки, настоящий минус. */
function schoolNumber(value: number): string {
  return String(Math.round(value * 1000) / 1000)
    .replace('.', ',')
    .replace('-', MINUS);
}

/** То же число для KaTeX: десятичная запятая набирается как {,}. */
function texNumber(value: number): string {
  return String(Math.round(value * 1000) / 1000).replace('.', '{,}');
}

/** Коэффициент перед x: единица и минус единица не пишутся. */
function slopeTex(k: number): string {
  if (Math.abs(k - 1) < 1e-9) {
    return '';
  }
  if (Math.abs(k + 1) < 1e-9) {
    return '-';
  }
  return texNumber(k);
}

/** Формула функции той же записью, что и в условии задачи. */
function equationTex(k: number, b: number): string {
  const slope = slopeTex(k) + 'x';
  if (Math.abs(b) < 1e-9) {
    return 'y = ' + slope;
  }
  return 'y = ' + slope + (b > 0 ? ' + ' : ' - ') + texNumber(Math.abs(b));
}

/** Свободный член в выкладке: знак и число, у нуля — пусто. */
function tailTex(b: number): string {
  if (Math.abs(b) < 1e-9) {
    return '';
  }
  return (b > 0 ? ' + ' : ' - ') + texNumber(Math.abs(b));
}

/**
 * Окно чертежа проверки.
 *
 * Готового окна у задачи нет — его и не считали, раз чертежа в
 * условии не будет. Здесь оно подбирается под то, что нужно увидеть:
 * начало координат, точку пересечения с осью Oy и саму проверяемую
 * точку, с запасом в две клетки. Пропорции держим не круче трёх к
 * двум — иначе чертёж вытягивается в полосу.
 */
function checkWindow(b: number, probe: EngineProbe) {
  const pad = 2;
  let xmax = Math.max(3, Math.ceil(Math.abs(probe.x)) + pad);
  let ymin = Math.floor(Math.min(0, probe.y, b)) - pad;
  let ymax = Math.ceil(Math.max(0, probe.y, b)) + pad;

  const height = () => ymax - ymin;
  if (height() > 2 * xmax * 1.5) {
    xmax = Math.ceil(height() / 3);
  }
  if (2 * xmax > height() * 1.5) {
    const add = Math.ceil(((2 * xmax) / 1.5 - height()) / 2);
    ymin -= add;
    ymax += add;
  }

  return { xmin: -xmax, xmax, ymin, ymax };
}

/** Засечки оси: через шаг сетки, у нуля своя подпись. */
function checkMarks(lo: number, hi: number, step: number) {
  const marks: { at: number; label: string }[] = [];
  for (let at = Math.ceil(lo / step) * step; at <= hi; at += step) {
    if (at !== 0) {
      marks.push({ at, label: schoolNumber(at) });
    }
  }
  return marks;
}

/** Чертёж проверки: та же прямая движка и отмеченная на ней точка. */
function checkChart(task: EngineTask, probe: EngineProbe): PrepBlock {
  const { k, b } = task.meta;
  const win = checkWindow(b, probe);
  const span = Math.max(win.xmax - win.xmin, win.ymax - win.ymin);
  /* Клеток поперёк чертежа не больше шестнадцати: дальше сетка
     сливается в серое поле. */
  const step = span <= 16 ? 1 : Math.ceil(span / 16);
  const name = taskData(task.id)?.pointName ?? 'A';

  const scene = {
    window: win,
    grid: { step, show: true },
    axes: {
      labelX: 'x',
      labelY: 'y',
      origin: '0',
      ticks: {
        x: checkMarks(win.xmin, win.xmax, step),
        y: checkMarks(win.ymin, win.ymax, step),
      },
    },
    axisLabels: 'full',
    curves: [{ type: 'line', k, b, color: 'lineA', label: 'y = f(x)' }],
    points: [
      {
        x: probe.x,
        y: probe.y,
        style: 'solid',
        color: 'lineB',
        label: name + '(' + schoolNumber(probe.x) + '; ' + schoolNumber(probe.y) + ')',
      },
    ],
    alt: 'Проверка построением: прямая и отмеченная точка',
  };

  return { type: 'chart', svg: renderGraph(scene) as string };
}

/**
 * Четыре шага подстановки и чертёж под ними.
 *
 * Чертёж стоит последним блоком последнего шага: он иллюстрирует
 * уже полученный ответ, и увидеть его раньше вычислений нельзя.
 */
function substitutionSteps(task: EngineTask, probe: EngineProbe): PrepStep[] {
  const { k, b } = task.meta;
  const name = taskData(task.id)?.pointName ?? 'A';

  const product = k * probe.x;
  const value = product + b;
  const same = Math.abs(value - probe.y) < 1e-9;
  const tail = tailTex(b);
  /* Отрицательная абсцисса подставляется в скобках: иначе два знака
     подряд читаются как вычитание. */
  const factor = probe.x < 0 ? '(' + texNumber(probe.x) + ')' : texNumber(probe.x);
  const pointTex = name + '(' + texNumber(probe.x) + ';\, ' + texNumber(probe.y) + ')';
  const answer = task.options?.find((option) => option.number === task.answer)?.html ?? task.answer;

  return [
    {
      number: 1,
      title: 'Подставляем координату x точки в формулу',
      arrow: null,
      blocks: [
        {
          type: 'text',
          html:
            'Функция задана формулой ' +
            katexHtml(equationTex(k, b)) +
            ', а у точки ' +
            katexHtml(pointTex) +
            ' абсцисса ' +
            katexHtml('x = ' + texNumber(probe.x)) +
            '.',
        },
        {
          type: 'text',
          html: 'Подставим ' + katexHtml('x = ' + texNumber(probe.x)) + ' в формулу:',
        },
        {
          type: 'formula',
          html: katexHtml('y = ' + texNumber(k) + ' \\cdot ' + factor + tail, true),
          feature: false,
        },
      ],
    },
    {
      number: 2,
      title: 'Вычисляем значение функции',
      arrow: null,
      blocks: [
        { type: 'text', html: 'Сначала умножаем, потом прибавляем свободный член.' },
        {
          type: 'formula',
          html: katexHtml('y = ' + texNumber(product) + tail, true),
          feature: false,
        },
        { type: 'formula', html: katexHtml('y = ' + texNumber(value), true), feature: false },
        {
          type: 'text',
          html:
            'При ' +
            katexHtml('x = ' + texNumber(probe.x)) +
            ' функция принимает значение <b class="key">' +
            schoolNumber(value) +
            '</b>.',
        },
      ],
    },
    {
      number: 3,
      title: 'Сравниваем с координатой y точки',
      arrow: null,
      blocks: [
        {
          type: 'text',
          html:
            'Координата ' +
            katexHtml('y') +
            ' точки ' +
            katexHtml(name) +
            ' равна <b class="key">' +
            schoolNumber(probe.y) +
            '</b>.',
        },
        {
          type: 'text',
          html: same
            ? 'Мы вычислили ' + katexHtml('y = ' + texNumber(value)) + ' — значения совпали.'
            : 'Мы вычислили ' +
              katexHtml('y = ' + texNumber(value)) +
              ', а у точки ' +
              katexHtml('y = ' + texNumber(probe.y)) +
              ' — значения разные.',
        },
      ],
    },
    {
      number: 4,
      title: 'Делаем вывод',
      arrow: null,
      blocks: [
        {
          type: 'text',
          html: same
            ? 'Значения совпали, значит точка принадлежит графику.'
            : 'Значения разные, значит точка не принадлежит графику.',
        },
        { type: 'answer', html: 'Ответ: <b class="key">' + answer + '</b>.' },
        checkChart(task, probe),
        { type: 'text', html: 'Проверим построением.' },
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
    /* Два случая без треугольника, которые мы умеем объяснить сами:
       горизонтальная прямая и задача без чертежа, где всё решает
       подстановка. Любая другая причина — по-прежнему null,
       и экран честно скажет, что разбора нет. */
    if (task.meta.k === 0) {
      return flatSteps(task);
    }
    const probe = task.meta.probe;
    if (task.svg === null && probe !== null && answerRule(task.id) === 'point-choice') {
      return substitutionSteps(task, probe);
    }
    return null;
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
