/**
 * Адаптер задания №12: прототипы движка graph/ (наборы 12.A … 12T.F) —
 * те же, что у генератора раздела и зачётной работы (lib/ves12/build.ts).
 *
 * Банк — задачи наборов на их собственном seed: прототип даёт столько
 * задач, сколько в наборе шаблонов с числовым ответом. Кончились в
 * партии — новые числа того же прототипа на свежем seed (кроме
 * дословных задач банка ФИПИ: у них числа закреплены).
 *
 * Разметку дают модули раздела, здесь только раскладка по полям:
 *   рисунок ученика  — sheet/figures12.js conditionSvg (режим 'student');
 *   рисунок учителя  — sheet/figures12.js solutionFigure (построения);
 *   решение учителя  — ключ листа учителя (sheet/answers12.js);
 *   разбор ученика   — разбор опорных задач и тренажёра (lib/prep.ts).
 * Формулы-заглушки движка (`.math[data-tex]`) набираются KaTeX здесь же.
 */

import { prep, prototypes } from '@/lib/graph/data/index.js';
import GraphGenerate from '@/lib/graph/generate.js';
import solutionBuilder from '@/lib/graph/solution.js';
import quadraticBuilder, { fromTask as quadraticFromTask } from '@/lib/graph/solution-quadratic.js';
import rationalSolution from '@/lib/graph/solution-rational.js';
import sqrtSolution from '@/lib/graph/solution-sqrt.js';
import exponentialSolution from '@/lib/graph/solution-exponential.js';
import logarithmicSolution from '@/lib/graph/solution-logarithmic.js';
import trigonometricSolution from '@/lib/graph/solution-trigonometric.js';
import { katex } from '@/lib/graph/katex';
import { conditionSvg, solutionFigure } from '@/lib/sheet/figures12.js';
import { solutionStepsHtml } from '@/lib/sheet/answers12.js';
import { figure as sheetFigure } from '@/lib/sheet/sheet.js';
import { parseAnswer } from '@/lib/answer';
import { typeset } from '@/lib/tex';
import {
  exponentialSteps,
  logarithmicSteps,
  rationalSteps,
  sqrtSteps,
  trigonometricSteps,
  viewSteps,
  type PrepBlock,
  type PrepStep,
} from '@/lib/prep';
import { isFipiTask, type RawSet } from '@/lib/ves12/fipi';
import type {
  Fallback,
  Figure,
  SectionAdapter,
  SectionModule,
  Stars,
  TaskFilters,
  VariantTask,
} from '../../types';
import {
  FALLBACK,
  answerHtml,
  answerText,
  pickCandidate,
  razborAnswer,
  sourceOk,
  starsOk,
  subtypeOk,
  type Candidate,
} from '../common';
import { info } from './info';
import { withPrintFigures, withoutPrintFigures } from '@/lib/sheet/figureRules.js';

/* Наборы движку передаются один раз на модуль, как в lib/trainer.ts. */
GraphGenerate.setSets({ prep, prototypes });

/* ── Шаблоны прототипов ─────────────────────────────────────────── */

interface RawTemplate {
  id: string;
  source?: string;
  question?: string;
  level?: string;
  answerRule: string;
  answerType?: string;
  constraints?: { fixed?: unknown };
}

interface RawSet12 {
  id: string;
  family?: string;
  note?: string;
  tasks: RawTemplate[];
}

interface Template {
  id: string;
  setId: string;
  subtype: string;
  source: 'fipi' | 'own';
  stars: Stars | null;
  rule: string;
  /** Дословная задача банка: числа закреплены, свежий seed даст её же. */
  fixed: boolean;
}

const SETS = prototypes as unknown as RawSet12[];

/** Семейство движка → тип функции (data/functionTypes.ts). */
function subtypeOf(family: string | undefined): string {
  if (family === undefined || family === 'line') return 'linear';
  if (family === 'sqrt') return 'irrational';
  return family;
}

function starsOf(level: string | undefined): Stars | null {
  if (level === 'lucky') return 1;
  if (level === 'unlucky') return 2;
  return null;
}

const TEMPLATES: Template[] = SETS.flatMap((set) => {
  const seen = new Set<string>();
  return set.tasks.flatMap((raw): Template[] => {
    /* Бланку ЕГЭ нужно число: задачи с выбором варианта не берутся. */
    if ((raw.answerType ?? 'number') !== 'number') return [];
    const fixed = raw.constraints?.fixed !== undefined;
    if (fixed) {
      /* В банке бывают совпадающие задачи (один рисунок, один вопрос):
         для варианта это одна задача — как в lib/ves12/fipi.ts. */
      const key = JSON.stringify([raw.question ?? '', raw.constraints ?? null]);
      if (seen.has(key)) return [];
      seen.add(key);
    }
    return [
      {
        id: raw.id,
        setId: set.id,
        subtype: subtypeOf(set.family),
        source: isFipiTask(set as unknown as RawSet, raw.id) ? 'fipi' : 'own',
        stars: starsOf(raw.level),
        rule: raw.answerRule,
        fixed,
      },
    ];
  });
});

interface C12 extends Candidate {
  tpl: Template;
  /** null — seed самого набора (банк). */
  seed: string | null;
}

function candidate(tpl: Template, seed: string | null): C12 {
  return {
    taskId: seed === null || tpl.fixed ? tpl.id : `${tpl.id}@${seed}`,
    prototypeId: tpl.setId,
    subtype: tpl.subtype,
    source: tpl.source,
    stars: tpl.stars,
    tpl,
    seed,
  };
}

const POOL: C12[] = TEMPLATES.map((tpl) => candidate(tpl, null));

/* ── Движок ─────────────────────────────────────────────────────── */

interface EngineTask {
  id: string;
  svg: string | null;
  question: string;
  questionHtml: string;
  answer: string;
  answerHtml?: string | null;
  scene?: unknown;
  meta: {
    set: string;
    seed: unknown;
    family?: string;
    window?: unknown;
    points?: unknown;
    query?: unknown;
    probe?: unknown;
    lines?: unknown[];
  };
}

/* Набор считается целиком (у 12Q.H — до полусекунды): пачки движка
   хранятся. Банк — по одной на набор; свежие seed — несколько последних. */
const bank = new Map<string, EngineTask[] | null>();
const fresh = new Map<string, EngineTask[] | null>();
const FRESH_KEEP = 12;

function generated(setId: string, seed: string | null): EngineTask[] | null {
  const store = seed === null ? bank : fresh;
  const key = seed === null ? setId : `${setId}|${seed}`;
  if (store.has(key)) return store.get(key) ?? null;
  let tasks: EngineTask[] | null;
  try {
    tasks = withoutPrintFigures(
      () => GraphGenerate.generateSet(setId, seed ?? undefined) as EngineTask[],
    );
  } catch {
    tasks = null;
  }
  if (store === fresh && fresh.size >= FRESH_KEEP) {
    const first = fresh.keys().next().value;
    if (first !== undefined) fresh.delete(first);
  }
  store.set(key, tasks);
  return tasks;
}

/**
 * Движок для модулей листа №12: ключ учителя и рисунок к разбору зовут
 * generator.analysis(id, seed) — треугольник наклона прямой. Движок для
 * этого собирает набор заново; здесь задача уже собрана, и разбор
 * считается по ней (analysisOf) — один раз на задачу.
 */
function generatorFor(task: EngineTask) {
  let found: unknown = null;
  let done = false;
  return {
    analysis(id: string, seed: unknown): unknown {
      if (id !== task.id || seed !== task.meta.seed) return GraphGenerate.analysis(id, seed);
      if (!done) {
        done = true;
        try {
          found = GraphGenerate.analysisOf(task);
        } catch {
          found = null;
        }
      }
      return found;
    },
  };
}

/* Разбор по шагам: модуль по семейству задачи — как у листа учителя. */
const stepwiseBuilder = {
  fromTask(task: { meta: { family?: string } }) {
    if (task.meta.family === 'exponential') return exponentialSolution.fromTask(task);
    if (task.meta.family === 'logarithmic') return logarithmicSolution.fromTask(task);
    if (task.meta.family === 'trigonometric') return trigonometricSolution.fromTask(task);
    return task.meta.family === 'sqrt'
      ? sqrtSolution.fromTask(task)
      : rationalSolution.fromTask(task);
  },
};

/* ── Формулы ────────────────────────────────────────────────────── */

const MATH_OPEN = /<span class="math( math--display-frac)?" data-tex="([^"]*)"[^>]*>/;

function unescapeTex(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

/* Внутри заглушки движка — запасная вёрстка со своими <span>. */
function closingSpan(html: string, from: number): number {
  const tags = /<span\b|<\/span>/g;
  tags.lastIndex = from;
  let depth = 1;
  for (let tag = tags.exec(html); tag !== null; tag = tags.exec(html)) {
    depth += tag[0] === '</span>' ? -1 : 1;
    if (depth === 0) return tag.index;
  }
  return -1;
}

/**
 * Заглушки `<span class="math" data-tex>` → вёрстка KaTeX. Класс
 * math--display-frac (ключ учителя) оставляет дроби крупными — как
 * graph/katex-upgrade.js на листе раздела.
 */
function katexPlaceholders(html: string): string {
  let rest = html;
  let out = '';
  for (;;) {
    const open = MATH_OPEN.exec(rest);
    if (open === null) return out + rest;
    const close = closingSpan(rest, open.index + open[0].length);
    if (close === -1) return out + rest;
    const options = { throwOnError: false, displayFrac: open[1] !== undefined };
    out +=
      rest.slice(0, open.index) +
      (katex.renderToString(unescapeTex(open[2] ?? ''), options) as string);
    rest = rest.slice(close + '</span>'.length);
  }
}

/** $…$, оставшиеся в тексте разбора (заголовки вложенных шагов), → KaTeX. */
function dollars(html: string): string {
  return html.replace(/\$([^$<>]+)\$/g, (_, tex: string) =>
    katex.renderToString(unescapeTex(tex), { throwOnError: false }),
  );
}

/* ── Разбор для ученика ─────────────────────────────────────────── */

const CELL = 3.4;
const CELL_UNITS = 34;

function blockHtml(block: PrepBlock): string {
  switch (block.type) {
    case 'text':
      return `<p class="var-razbor__line">${dollars(block.html)}</p>`;
    case 'formula':
      return `<p class="var-razbor__line">${block.html}</p>`;
    case 'answer':
      /* Ответ стоит в конце разбора отдельной строкой. */
      return '';
    case 'chart':
      return sheetFigure(block.svg, { cell: CELL, frame: null }) as string;
    case 'callout':
    case 'details':
      return (
        `<div class="var-razbor__why"><p class="var-razbor__line"><b>${typeset(block.title)}</b></p>` +
        block.blocks.map(blockHtml).join('') +
        `</div>`
      );
    default:
      return '';
  }
}

function razborHtml(steps: readonly PrepStep[]): string {
  const items = steps
    .map(
      (s, i) =>
        `<li class="var-razbor__step">` +
        `<p class="var-razbor__q"><span class="var-razbor__n">${i + 1}</span>${s.titleHtml ?? typeset(s.title)}</p>` +
        s.blocks.map(blockHtml).join('') +
        `</li>`,
    )
    .join('');
  return `<p class="var-razbor__h">Решаем</p><ol class="var-razbor">${items}</ol>`;
}

type EngineStep = Parameters<typeof viewSteps>[0][number];

/** Прямая: та же цепочка, что у опорных задач, с правилом прототипа. */
function lineSteps(
  task: EngineTask,
  rule: string,
  generator: ReturnType<typeof generatorFor>,
): PrepStep[] | null {
  const lines = task.meta.lines ?? [];
  if (lines.length === 2) {
    return viewSteps(
      solutionBuilder.build({
        lines,
        window: task.meta.window,
        task: { rule, answer: task.answer },
      }) as EngineStep[],
    );
  }
  const found = generator.analysis(task.id, task.meta.seed) as {
    triangle: unknown;
    line: unknown;
    task: { meta: { window: unknown } };
  } | null;
  if (found === null) return null;
  return viewSteps(
    solutionBuilder.build({
      triangle: found.triangle,
      line: found.line,
      window: found.task.meta.window,
      points: task.meta.points,
      task: { rule, answer: task.answer, query: task.meta.query, probe: task.meta.probe },
    }) as EngineStep[],
  );
}

function studentSteps(
  task: EngineTask,
  rule: string,
  generator: ReturnType<typeof generatorFor>,
): PrepStep[] | null {
  try {
    switch (task.meta.family) {
      case 'quadratic':
        /* Правило ответа прототипа — в meta задачи (fromTask), а не в
           наборе подготовки, по которому идёт lib/prep.ts quadraticSteps. */
        return viewSteps(quadraticFromTask(task) as EngineStep[]);
      case 'rational':
        return rationalSteps(task);
      case 'sqrt':
        return sqrtSteps(task);
      case 'exponential':
        return exponentialSteps(task);
      case 'logarithmic':
        return logarithmicSteps(task);
      case 'trigonometric':
        return trigonometricSteps(task);
      default:
        return lineSteps(task, rule, generator);
    }
  } catch {
    return null;
  }
}

/** Последний шаг-заглушка («Ответ читается из формулы») — разбора нет. */
function stub(steps: readonly PrepStep[]): boolean {
  const last = steps[steps.length - 1];
  return (
    last === undefined ||
    last.blocks.some((b) => b.type === 'text' && /Ответ читается из формулы/.test(b.html))
  );
}

/* ── Задача ─────────────────────────────────────────────────────── */

function figureOf(svg: string | null, width: number | null = null): Figure | null {
  if (svg === null) return null;
  const box = /viewBox="0 0 ([0-9.]+) /.exec(svg);
  const mm = width ?? (box === null ? null : (Number(box[1]) / CELL_UNITS) * CELL);
  return mm === null ? { svg } : { svg, width: Math.round(mm * 100) / 100 };
}

function sourceLabel(tpl: Template, isNew: boolean): string {
  if (tpl.source === 'own') {
    return `Аналог прототипа ${tpl.setId}${isNew ? ', новые числа' : ''}`;
  }
  return tpl.fixed
    ? `Открытый банк ФИПИ: прототип ${tpl.setId}, задача банка ${tpl.id}`
    : `Открытый банк ФИПИ: прототип ${tpl.setId}, числа новые`;
}

/**
 * Задача с рисунками в печатном профиле (lib/sheet/figureRules.js):
 * клетчатый рисунок на листе печатается клеткой 7 мм, и подписи движок
 * рисует сразу печатным кеглем. Тот же рисунок — в предпросмотре.
 */
function build(c: C12): VariantTask | null {
  return withPrintFigures(() => buildTask(c));
}

function buildTask(c: C12): VariantTask | null {
  const task = generated(c.tpl.setId, c.seed)?.find((t) => t.id === c.tpl.id);
  if (task === undefined) return null;
  const value = parseAnswer(task.answer);
  if (value === null) return null;
  const otvet = answerHtml(value);

  /* Задача в том виде, в каком её берут модули листа №12. */
  const item = {
    no: 1,
    id: task.id,
    question: task.question,
    questionHtml: task.questionHtml,
    options: null,
    scene: task.scene ?? null,
    answer: task.answer,
    answerHtml: task.answerHtml ?? null,
    answerRule: c.tpl.rule,
    seed: task.meta.seed,
    meta: task.meta,
  };

  const generator = generatorFor(task);
  const fallbacks: Fallback[] = [];
  const steps = solutionStepsHtml(
    item,
    generator,
    solutionBuilder,
    quadraticBuilder,
    stepwiseBuilder,
  ) as string | null;
  const solutionTeacher = steps === null ? null : katexPlaceholders(steps) + razborAnswer(otvet);
  if (solutionTeacher === null) fallbacks.push(FALLBACK.noTeacher);

  const razbor = studentSteps(task, c.tpl.rule, generator);
  const solutionStudent =
    razbor === null || stub(razbor) ? null : razborHtml(razbor) + razborAnswer(otvet);
  if (solutionStudent === null) fallbacks.push(FALLBACK.studentFromTeacher);

  if (c.tpl.source === 'fipi') fallbacks.push(FALLBACK.noPrototypeNo);
  if (c.tpl.stars === null) fallbacks.push(FALLBACK.noDifficulty);

  const teacherFigure = solutionFigure(item, generator, CELL) as {
    svg: string;
    width: number | null;
  } | null;
  const isNew = c.seed !== null && !c.tpl.fixed;

  return {
    egeNumber: 12,
    taskId: c.taskId,
    prototypeId: c.prototypeId,
    subtype: c.subtype,
    source: { kind: c.tpl.source, label: sourceLabel(c.tpl, isNew) },
    difficulty: c.tpl.stars,
    statement: katexPlaceholders(task.questionHtml),
    figure: figureOf(conditionSvg(task) as string | null),
    figureTeacher: teacherFigure === null ? null : figureOf(teacherFigure.svg, teacherFigure.width),
    answer: answerText(value),
    answerHtml: otvet,
    solutionTeacher,
    solutionStudent,
    fallbacks,
    ref: { prototype: c.tpl.setId, task: c.tpl.id, seed: c.seed ?? 'bank' },
  };
}

/** Новые числа того же прототипа: шаблоны набора на свежем seed. */
function freshTask(
  filters: TaskFilters,
  prototype: string,
  rng: Parameters<SectionAdapter['getRandomTask']>[1],
): VariantTask | null {
  const tpls = TEMPLATES.filter(
    (t) =>
      t.setId === prototype &&
      !t.fixed &&
      subtypeOk(t.subtype, filters.subtypes) &&
      starsOk(t.stars, filters.stars) &&
      sourceOk(t.source, filters.source),
  );
  if (tpls.length === 0) return null;
  for (let i = 0; i < 3; i += 1) {
    const seed = `v${Math.floor(rng.next() * 1e9).toString(36)}`;
    for (const tpl of rng.sample(tpls, tpls.length)) {
      const c = candidate(tpl, seed);
      if (filters.exclude.has(c.taskId)) continue;
      const t = build(c);
      if (t !== null) return t;
    }
  }
  return null;
}

/**
 * Параллельный вариант: фильтр, которому прототип не отвечает ни одной
 * задачей, в варианте 1 уже ослаблен (иначе этот прототип не взяли бы),
 * и пометка о том у задачи есть. Здесь он ослабляется так же и в том же
 * порядке, что в lib/variant/build.ts, — иначе сборщик ослабил бы сначала
 * прототип и задача ушла бы в чужой прототип без пометки.
 */
function forPrototype(filters: TaskFilters): TaskFilters {
  const own = TEMPLATES.filter((t) => t.setId === filters.prototype);
  if (own.length === 0) return filters;
  const fits = (f: TaskFilters) =>
    own.some(
      (t) =>
        subtypeOk(t.subtype, f.subtypes) &&
        starsOk(t.stars, f.stars) &&
        sourceOk(t.source, f.source),
    );
  let f = filters;
  if (!fits(f)) f = { ...f, stars: null };
  if (!fits(f)) f = { ...f, source: 'mix' };
  if (!fits(f)) f = { ...f, subtypes: null };
  return f;
}

function init(): SectionAdapter {
  return {
    info,
    getRandomTask(asked, rng) {
      const filters = asked.prototype === undefined ? asked : forPrototype(asked);
      /* Задача, которую движок не собрал, пропускается — берётся другая. */
      const skip = new Set(filters.exclude);
      for (let i = 0; i < 8; i += 1) {
        const c = pickCandidate(POOL, { ...filters, exclude: skip }, rng);
        if (c === null) break;
        const t = build(c);
        if (t !== null) return t;
        skip.add(c.taskId);
      }
      /* Банк прототипа в партии кончился: новые числа на своём seed. */
      return filters.prototype === undefined ? null : freshTask(filters, filters.prototype, rng);
    },
  };
}

export const section: SectionModule = {
  load: () => Promise.resolve(null),
  init,
};
