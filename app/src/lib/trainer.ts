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
  /**
   * Цепочка подсказки: шаги с полями. Пусто — кнопки «Показать
   * подсказку» у задания нет.
   */
  steps: TrainerStep[];
}

/** Одно поле шага: подпись слева и ожидаемое значение. */
export interface TrainerField {
  /** Подпись поля, набранная KaTeX: «k =», «f(13,5) =». */
  labelHtml: string;
  answer: string;
}

export interface TrainerStep {
  /** Заголовок шага. Буквы в нём набраны формулами. */
  titleHtml: string;
  /** Пояснение под заголовком. */
  textHtml: string;
  /**
   * Как расставлены поля: обычной строкой с подписью или внутри
   * формулы y = [ ] · x + [ ].
   */
  shape: 'plain' | 'equation';
  fields: TrainerField[];
  /** Что проверить, если на шаге ошибка. Значения не выдаёт. */
  wrongHint: string;
}

interface EngineQuery {
  x0: number;
  y0: number;
}

interface EngineCross {
  x: number;
  y: number;
}

interface EngineLine {
  k: number;
  b: number;
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
    lines: EngineLine[];
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
    const before = rest.slice(0, open.index);
    rest = rest.slice(close + '</span>'.length);
    const formula = katex.renderToString(unescapeTex(open[1] ?? ''), { throwOnError: false });
    /* Знак препинания после формулы уезжал на новую строку один.
       Формула и знак идут вместе, одним неразрывным куском. */
    const mark = /^[.,;:!?)]/.exec(rest);
    if (mark === null) {
      out += before + formula;
    } else {
      out += before + '<span class="tight-math">' + formula + mark[0] + '</span>';
      rest = rest.slice(1);
    }
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

/* Что проверить при ошибке. Один текст на тип задания: один для
   задач с одной прямой, другой — для задач с двумя.

   Ответа текст не выдаёт: он говорит, где искать ошибку, и повторяет
   те же слова, которыми описаны шаги подсказки. Буквы набираются
   формулами — как и везде в условиях. */
const ONE_LINE =
  'Проверьте, как сняты $k$ и $b$ по чертежу: $k$ — это $\\Delta y : \\Delta x$ ' +
  'по двум отмеченным точкам, $b$ — значение $y$ там, где прямая пересекает ось $Oy$.';

const TWO_LINES =
  'Проверьте уравнения обеих прямых: $k$ — это $\\Delta y : \\Delta x$ по двум ' +
  'отмеченным точкам, $b$ — значение $y$ там, где прямая пересекает ось $Oy$.';

const WRONG_HINT: Record<string, string> = {
  '12.A': ONE_LINE,
  '12.B': ONE_LINE,
  '12.C': TWO_LINES,
  '12.D': TWO_LINES,
};

/* Формулы в пояснении размечены долларами, как в условиях задач:
   движок превращает их в заглушки, KaTeX набирает на сборке. */
function hintHtml(text: string): string {
  return typeset(GraphGenerate.typeset(text) as string);
}


/* ── Цепочка подсказки ───────────────────────────────────────────

   Шаги ведут тем же путём, которым задача решается на бумаге:
   снять k, снять b, записать уравнение, ответить на вопрос. Тексты
   заголовков и пояснений заданы методикой, числа подставляются
   из самого задания. */

/** Число в поле: ученик набирает его так же, как итоговый ответ. */
function plain(value: number): string {
  return String(Math.round(value * 1000) / 1000).replace('.', ',');
}

function stepK(k: number): TrainerStep {
  return {
    titleHtml: hintHtml('Давай проверим, правильно ли ты нашёл $k$.'),
    textHtml: hintHtml(
      'Возьми две отмеченные точки. Посчитай, на сколько клеток прямая сдвинулась ' +
        'вправо и на сколько вверх. Тогда $k = \\Delta y : \\Delta x$.',
    ),
    shape: 'plain',
    fields: [{ labelHtml: math('k ='), answer: plain(k) }],
    wrongHint: hintHtml(
      'Проверь, на сколько клеток прямая сдвинулась вправо и на сколько вверх.',
    ),
  };
}

function stepB(b: number): TrainerStep {
  return {
    titleHtml: hintHtml('Теперь проверим $b$.'),
    textHtml: hintHtml(
      'Коэффициент $b$ — это значение $y$ в точке, где прямая пересекает ось $Oy$.',
    ),
    shape: 'plain',
    fields: [{ labelHtml: math('b ='), answer: plain(b) }],
    wrongHint: hintHtml('Проверь, в какой точке прямая пересекает ось $Oy$.'),
  };
}

/* Уравнение сверяется по числам: ученик подставляет k и b в готовую
   формулу, а не набирает выражение строкой. Сверка та же, что
   у остальных полей, второй функции для этого не нужно. */
function stepEquation(k: number, b: number): TrainerStep {
  return {
    titleHtml: hintHtml('Запиши уравнение прямой.'),
    textHtml: hintHtml('Подставь найденные $k$ и $b$ в формулу $y = kx + b$.'),
    shape: 'equation',
    fields: [
      { labelHtml: math('y ='), answer: plain(k) },
      { labelHtml: math('\\cdot x {}+{}'), answer: plain(b) },
    ],
    wrongHint: hintHtml('Проверь, те ли $k$ и $b$ ты подставил.'),
  };
}

function stepAnswer(task: EngineTask): TrainerStep | null {
  const { set, k, b, query } = task.meta;
  if (query === null) {
    return null;
  }
  if (set === '12.A') {
    return {
      titleHtml: hintHtml('Найди ответ.'),
      textHtml: hintHtml('Подставь $x = ' + tex(query.x0) + '$ в полученное уравнение.'),
      shape: 'plain',
      fields: [
        { labelHtml: math('f(' + tex(query.x0) + ') ='), answer: plain(k * query.x0 + b) },
      ],
      wrongHint: hintHtml('Проверь, как подставил $x$ в уравнение.'),
    };
  }
  if (set === '12.B') {
    return {
      titleHtml: hintHtml('Найди ответ.'),
      textHtml: hintHtml(
        'Реши уравнение $' + equation(k, b) + ' = ' + tex(query.y0) + '$ относительно $x$.',
      ),
      shape: 'plain',
      fields: [{ labelHtml: math('x ='), answer: plain((query.y0 - b) / k) }],
      wrongHint: hintHtml('Проверь, как решил уравнение.'),
    };
  }
  return null;
}

/* ── Цепочка для двух прямых ─────────────────────────────────────

   Путь тот же, только проделать его нужно дважды: снять k и b
   у каждой прямой, приравнять правые части и решить уравнение.
   Где спрашивают ординату, добавляется седьмой шаг. */

/** Имя прямой в заголовке и в тексте: f или g. */
function curve(name: string): string {
  return 'y = ' + name + '(x)';
}

function stepPairK(name: string, k: number, firstOne: boolean): TrainerStep {
  return {
    titleHtml: hintHtml('Проверим $k$ для прямой $' + curve(name) + '$.'),
    textHtml: hintHtml(
      firstOne
        ? 'Возьми две отмеченные точки на прямой $' +
            curve(name) +
            '$. Посчитай, на сколько клеток она сдвинулась вправо и на сколько вверх. ' +
            'Тогда $k = \\Delta y : \\Delta x$.'
        : 'То же самое для второй прямой: две отмеченные точки, сдвиг вправо и вверх, ' +
            '$k = \\Delta y : \\Delta x$.',
    ),
    shape: 'plain',
    fields: [{ labelHtml: math('k ='), answer: plain(k) }],
    wrongHint: hintHtml(
      'Проверь, на сколько клеток прямая сдвинулась вправо и на сколько вверх.',
    ),
  };
}

function stepPairB(name: string, b: number): TrainerStep {
  return {
    titleHtml: hintHtml('Проверим $b$ для прямой $' + curve(name) + '$.'),
    textHtml: hintHtml(
      'Коэффициент $b$ — это значение $y$ в точке, где прямая $' +
        curve(name) +
        '$ пересекает ось $Oy$.',
    ),
    shape: 'plain',
    fields: [{ labelHtml: math('b ='), answer: plain(b) }],
    wrongHint: hintHtml('Проверь, в какой точке прямая пересекает ось $Oy$.'),
  };
}

/* Уравнение собирается из тех же числовых полей: четыре подставленных
   значения вместо набранного строкой выражения. */
function stepPairEquation(first: EngineLine, second: EngineLine): TrainerStep {
  return {
    titleHtml: hintHtml('Приравняй правые части уравнений.'),
    textHtml: hintHtml(
      'В точке пересечения значения функций равны. Подставь найденные $k$ и $b$ в обе части.',
    ),
    shape: 'equation',
    fields: [
      { labelHtml: '', answer: plain(first.k) },
      { labelHtml: math('\\cdot x {}+{}'), answer: plain(first.b) },
      { labelHtml: math('='), answer: plain(second.k) },
      { labelHtml: math('\\cdot x {}+{}'), answer: plain(second.b) },
    ],
    wrongHint: hintHtml('Проверь, те ли $k$ и $b$ ты подставил.'),
  };
}

function stepCrossX(x: number): TrainerStep {
  return {
    titleHtml: hintHtml('Реши уравнение и найди $x$.'),
    textHtml: hintHtml('Перенеси слагаемые с $x$ в одну часть, числа — в другую.'),
    shape: 'plain',
    fields: [{ labelHtml: math('x ='), answer: plain(x) }],
    wrongHint: hintHtml('Проверь, как перенёс слагаемые.'),
  };
}

function stepCrossY(y: number): TrainerStep {
  return {
    titleHtml: hintHtml('Найди ординату.'),
    textHtml: hintHtml('Подставь найденный $x$ в любое из двух уравнений.'),
    shape: 'plain',
    fields: [{ labelHtml: math('y ='), answer: plain(y) }],
    wrongHint: hintHtml('Проверь, как подставил $x$ в уравнение.'),
  };
}

function stepsForPair(task: EngineTask): TrainerStep[] {
  const { set, intersection, lines } = task.meta;
  const first = lines[0];
  const second = lines[1];
  if (intersection === null || first === undefined || second === undefined) {
    return [];
  }
  const steps = [
    stepPairK('f', first.k, true),
    stepPairB('f', first.b),
    stepPairK('g', second.k, false),
    stepPairB('g', second.b),
    stepPairEquation(first, second),
    stepCrossX(intersection.x),
  ];
  /* Набор 12.D спрашивает ординату: одного x мало, нужно подставить
     его обратно в уравнение. */
  if (set === '12.D') {
    steps.push(stepCrossY(intersection.y));
  }
  return steps;
}

/** Шаги задания. Пусто — цепочки для этого типа ещё нет. */
function stepsFor(task: EngineTask): TrainerStep[] {
  const { set, k, b } = task.meta;
  if (set === '12.C' || set === '12.D') {
    return stepsForPair(task);
  }
  const last = stepAnswer(task);
  return last === null ? [] : [stepK(k), stepB(b), stepEquation(k, b), last];
}

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
    wrongHint: hintHtml(WRONG_HINT[task.meta.set] ?? ''),
    rightHint: rightHintFor(task),
    steps: stepsFor(task),
  }));
}

/** Режим по части адреса. Нужен маршруту и оболочке. */
export function findMode(id: string): TrainerMode | undefined {
  return trainerModes.find((mode) => mode.id === id);
}
