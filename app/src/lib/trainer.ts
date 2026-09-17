/**
 * Тренажёр: мост между режимами вкладки и движком graph/.
 *
 * Задания берутся из наборов-прототипов ФИПИ. Условий, чертежей
 * и ответов в проекте нет: всё приходит из движка. Здесь только
 * подбор набора под режим и набор KaTeX на сборке.
 *
 * Модуль серверный: движок и KaTeX работают во время сборки, вниз
 * уходит готовая разметка.
 */

import { prep, prototypes } from '@/lib/graph/data/index.js';
import GraphGenerate from '@/lib/graph/generate.js';
import { katex } from '@/lib/graph/katex';
import { trainerModes, type TrainerMode } from '@/content/trainerModes';

/* Наборы движку передаются один раз на модуль: дальше он берёт их
   из своего кэша. */
GraphGenerate.setSets({ prep, prototypes });

/** Сколько заданий в одном подходе. */
export const TRAINER_ROUND = 10;

export interface TrainerTask {
  id: string;
  /** Номер в подходе, 1…10. */
  no: number;
  /** Какого типа задание: в смешанном режиме они разные. */
  kind: string;
  questionHtml: string;
  chartSvg: string | null;
  answer: string;
  /**
   * Что проверить при ошибке. Готовится вместе с заданием и вместе
   * с ним же и приходит: на лету ничего не собирается.
   */
  wrongHint: string;
  /** Откуда взялся ответ. Показывается, когда ответ верный. */
  rightHint: string;
}

interface EngineQuery {
  x0: number;
  y0: number;
}

interface EngineCross {
  x: number;
  y: number;
}

interface EngineTask {
  id: string;
  svg: string | null;
  questionHtml: string;
  answer: string;
  meta: {
    set: string;
    k: number;
    b: number;
    query: EngineQuery | null;
    intersection: EngineCross | null;
    lines: { k: number; b: number }[];
  };
}

/* ── KaTeX на сборке ─────────────────────────────────────────────
   Движок оставляет формулы заглушками <span class="math" data-tex>,
   а штатный renderFormulas требует DOM. Здесь те же места набираются
   во время сборки — как во вкладке подготовительных задач. */

const MATH_OPEN = /<span class="math" data-tex="([^"]*)"[^>]*>/;

function unescapeTex(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

/* Внутри заглушки лежит запасная вёрстка со своими <span>, поэтому
   парный </span> ищется со счётчиком вложенности. */
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
      return out + rest;
    }
    out +=
      rest.slice(0, open.index) +
      katex.renderToString(unescapeTex(open[1] ?? ''), { throwOnError: false });
    rest = rest.slice(close + '</span>'.length);
  }
}

/* ── Подбор заданий ──────────────────────────────────────────────

   Наборы движка детерминированы: один и тот же набор всегда даёт
   одни и те же двадцать заданий. Подход берёт из них первые десять,
   а в смешанном режиме — поровну из каждого типа. Порядок внутри
   подхода решает браузер ученика: перемешивать на сборке нельзя,
   иначе у всех будет один и тот же «случайный» порядок. */

function fromSet(setId: string, take: number): EngineTask[] {
  const tasks = GraphGenerate.generateSet(setId) as EngineTask[];
  return tasks.slice(0, take);
}

/* ── Пояснения к ответу ──────────────────────────────────────────
   Оба текста собираются на сборке из чисел самого задания и приходят
   вместе с ним. Числа набираются KaTeX, как и условие. */

/** То же число для KaTeX. */
function tex(value: number): string {
  return String(Math.round(value * 1000) / 1000).replace('.', '{,}');
}

function math(source: string): string {
  return katex.renderToString(source, { throwOnError: false });
}

/** Коэффициент перед x: единица и минус единица не пишутся. */
function slope(k: number): string {
  if (Math.abs(k - 1) < 1e-9) {
    return '';
  }
  if (Math.abs(k + 1) < 1e-9) {
    return '-';
  }
  return tex(k);
}

function equation(k: number, b: number): string {
  const left = slope(k) + 'x';
  if (Math.abs(b) < 1e-9) {
    return left;
  }
  return left + (b > 0 ? ' + ' : ' - ') + tex(Math.abs(b));
}

/** Откуда взялся ответ: по чертежу сняли k и b, дальше вычисление. */
function rightHintFor(task: EngineTask): string {
  const { set, k, b, query, intersection, lines } = task.meta;
  const found = 'По чертежу ' + math('k = ' + tex(k)) + ' и ' + math('b = ' + tex(b)) + '. ';

  if (set === '12.A' && query !== null) {
    const value = k * query.x0 + b;
    /* Отрицательная абсцисса подставляется в скобках: иначе два знака
       подряд читаются как вычитание. */
    const factor = query.x0 < 0 ? '(' + tex(query.x0) + ')' : tex(query.x0);
    const tail = Math.abs(b) < 1e-9 ? '' : (b > 0 ? ' + ' : ' - ') + tex(Math.abs(b));
    return (
      found +
      'Тогда ' +
      math('f(' + factor + ') = ' + tex(k) + ' \\cdot ' + factor + tail + ' = ' + tex(value)) +
      '.'
    );
  }
  if (set === '12.B' && query !== null) {
    return (
      found +
      'Из уравнения ' +
      math(equation(k, b) + ' = ' + tex(query.y0)) +
      ' получаем ' +
      math('x = ' + tex((query.y0 - b) / k)) +
      '.'
    );
  }
  if (intersection !== null && lines.length === 2) {
    const first = lines[0];
    const second = lines[1];
    if (first !== undefined && second !== undefined) {
      return (
        'По чертежу ' +
        math('y = ' + equation(first.k, first.b)) +
        ' и ' +
        math('y = ' + equation(second.k, second.b)) +
        '. Приравняли правые части и нашли точку ' +
        math('(' + tex(intersection.x) + ';\\, ' + tex(intersection.y) + ')') +
        '.'
      );
    }
  }
  return 'Ответ получается из уравнений, снятых по чертежу.';
}

/** Что проверить при ошибке. Один текст на тип задания. */
const WRONG_HINT: Record<string, string> = {
  '12.A': 'Проверьте, как сняты k и b по чертежу: k — это Δy : Δx по двум отмеченным точкам, b — значение y там, где прямая пересекает ось Oy.',
  '12.B': 'Проверьте, как сняты k и b по чертежу: k — это Δy : Δx по двум отмеченным точкам, b — значение y там, где прямая пересекает ось Oy.',
  '12.C': 'Проверьте уравнения обеих прямых: k — это Δy : Δx по двум отмеченным точкам, b — значение y там, где прямая пересекает ось Oy.',
  '12.D': 'Проверьте уравнения обеих прямых: k — это Δy : Δx по двум отмеченным точкам, b — значение y там, где прямая пересекает ось Oy.',
};

/** Десять заданий подхода для режима. */
export function buildTrainerTasks(mode: TrainerMode): TrainerTask[] {
  const perSet = Math.max(1, Math.round(TRAINER_ROUND / mode.setIds.length));
  const picked = mode.setIds.flatMap((setId) => fromSet(setId, perSet));

  return picked.slice(0, TRAINER_ROUND).map((task, index) => ({
    id: task.id,
    no: index + 1,
    kind: task.meta.set,
    questionHtml: typeset(task.questionHtml),
    chartSvg: task.svg,
    answer: task.answer,
    wrongHint: WRONG_HINT[task.meta.set] ?? '',
    rightHint: rightHintFor(task),
  }));
}

/** Режим по части адреса. Нужен маршруту и оболочке. */
export function findMode(id: string): TrainerMode | undefined {
  return trainerModes.find((mode) => mode.id === id);
}
