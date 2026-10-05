/**
 * Тренажёр: мост между режимами вкладки и движком graph/.
 *
 * Задания берутся из наборов-прототипов ФИПИ. Условий, чертежей
 * и ответов в проекте нет: всё приходит из движка. Здесь только
 * подбор набора под режим и набор KaTeX на сборке.
 *
 * Модуль работает и на сборке, и в браузере: сессию со свежими
 * числами собирает lib/trainerSession.ts на клиенте, движок и KaTeX
 * там те же. В разметку страницы ни одно задание при этом не идёт.
 */

import { prep, prototypes } from '@/lib/graph/data/index.js';
import GraphGenerate from '@/lib/graph/generate.js';
import { interceptVisible } from '@/lib/graph/solution.js';
import RationalHints from '@/lib/graph/hints-rational.js';
import { katex } from '@/lib/graph/katex';
import { quadraticSteps, rationalSteps as rationalSolution, type PrepStep } from '@/lib/prep';
import { methodFor } from '@/lib/trainerMethod';

/* Наборы движку передаются один раз на модуль: дальше он берёт их
   из своего кэша. */
GraphGenerate.setSets({ prep, prototypes });

export interface TrainerTask {
  id: string;
  /** Набор движка, из которого пришло задание. */
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
  /**
   * Варианты ответа. null — ответ вводится числом. Появляются
   * у подтемы с признаком choiceAnswers.
   */
  options: TrainerOption[] | null;
  /** Чем плох вариант — по его номеру. У верного записи нет. */
  oshibki: Record<string, string>;
  /**
   * Разбор — тот же, что в опорных задачах, вместе со свёрнутым
   * блоком «Если нужна вся формула» там, где он есть. null —
   * движок не строит разбора для этой задачи.
   */
  solution: PrepStep[] | null;
  /** Рисунок метода: чем эта задача решается. null — рисунка нет. */
  method: TrainerMethod | null;
}

/** Вариант ответа: номер и готовая разметка. */
export interface TrainerOption {
  number: string;
  html: string;
}

/** Рисунок метода под разбором: миниатюра, название и приём. */
export interface TrainerMethod {
  /** Название приёма — вёрстка KaTeX (формулы в нём бывают). */
  title: string;
  /** Приём одной строкой — вёрстка KaTeX. */
  tip: string;
  svg: string;
}

/** Одно поле шага: подпись слева и ожидаемое значение. */
export interface TrainerField {
  /** Подпись поля, набранная KaTeX: «k =», «f(13,5) =». */
  labelHtml: string;
  answer: string;
}

/** Вариант ответа на вопрос шага — кнопка. */
export interface TrainerChoice {
  html: string;
  right: boolean;
  /** Почему вариант неверен. У верного — пусто. */
  whyHtml: string;
}

/** Вопрос шага с вариантами ответа кнопками. */
export interface TrainerQuestion {
  promptHtml: string;
  options: TrainerChoice[];
  /** Вывод после верного ответа. */
  rightHtml: string;
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
  /**
   * Вопросы с вариантами ответа (гипербола). Есть — шаг проходится
   * кнопками по очереди, полей у него нет.
   */
  questions?: TrainerQuestion[];
  /** Напоминание правила: видно на шаге всегда. */
  reminderHtml?: string;
  /** Напоминание выделено — правило, на котором чаще всего ошибаются. */
  reminderStrong?: boolean;
  /** Что показать после верно заполненных полей: подстановка и вычисление. */
  afterHtml?: string;
  /**
   * Другие верные наборы значений полей — например, координаты другой
   * отмеченной точки. Поля проверяются по fields или по любому набору.
   */
  variants?: string[][];
  /** Какую асимптоту подсветить на рисунке, пока открыт шаг. */
  focus?: 'horizontal' | 'vertical' | null;
}

interface EngineQuery {
  x0: number;
  y0: number;
}

interface EngineCross {
  x: number;
  y: number;
}

interface EnginePoint {
  x: number;
  y: number;
}

interface EngineWindow {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

interface EngineLine {
  k: number;
  b: number;
  /** Опорные точки прямой: узлы сетки, отмеченные на чертеже. */
  points?: EnginePoint[] | null;
}

export interface EngineTask {
  id: string;
  svg: string | null;
  questionHtml: string;
  answer: string;
  meta: {
    set: string;
    /** Seed, на котором собран набор: по нему задача воспроизводится. */
    seed: string;
    k: number;
    b: number;
    /** Окно чертежа. Нет — у задачи нет и чертежа. */
    window: EngineWindow | null;
    points: EnginePoint[] | null;
    query: EngineQuery | null;
    intersection: EngineCross | null;
    lines: EngineLine[];
    /** Уровень задачи: lucky или unlucky у прототипов, null у подготовки. */
    level?: string | null;
    /** Семейство кривой: 'line', 'quadratic' или 'rational'. */
    family?: string;
  };
  answerType?: string;
  /**
   * Варианты ответа у задачи с выбором. Пояснение к неверному
   * варианту движок кладёт в error — у верного там null.
   */
  options?: { number: string; html: string; text?: string; error: string | null }[] | null;
  /** Подсказка условия: у наборов подготовки она есть, у прототипов нет. */
  hintHtml?: string | null;
}

/* ── KaTeX на сборке ─────────────────────────────────────────────
   Движок оставляет формулы заглушками <span class="math" data-tex>,
   а штатный renderFormulas требует DOM. Здесь те же места набираются
   во время сборки — как во вкладке подготовительных задач. */

const MATH_OPEN = /<span class="math" data-tex="([^"]*)"[^>]*>/;

/* Тот же режим, в котором движок набирает формулы в браузере
   (graph/katex-upgrade.js): без MathML разметка вдвое легче, а её
   на странице с пулом заданий очень много. */
const KATEX = { throwOnError: false, output: 'html' as const };

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

/* bigFractions — дроби \\dfrac остаются крупными (напоминание правила
   в подсказке гиперболы: строчная дробь там не читается). */
function typeset(html: string, bigFractions = false): string {
  const options = bigFractions ? ({ ...KATEX, displayFrac: true } as typeof KATEX) : KATEX;
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
    const formula = katex.renderToString(unescapeTex(open[1] ?? ''), options);
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

/* ── Пояснения к ответу ──────────────────────────────────────────
   Оба текста собираются на сборке из чисел самого задания и приходят
   вместе с ним. Числа набираются KaTeX, как и условие. */

/** То же число для KaTeX. */
function tex(value: number): string {
  return String(Math.round(value * 1000) / 1000).replace('.', '{,}');
}

function math(source: string): string {
  return katex.renderToString(source, KATEX);
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
    /* Отрицательная абсцисса в выражении берётся в скобки: иначе два
       знака подряд читаются как вычитание. В скобках самой функции —
       без вторых: f(−4), а не f((−4)). Умножение на 1 и −1 не пишется,
       отрицательный коэффициент — в скобках. */
    const factor = query.x0 < 0 ? '(' + tex(query.x0) + ')' : tex(query.x0);
    const product =
      Math.abs(k - 1) < 1e-9
        ? factor
        : Math.abs(k + 1) < 1e-9
          ? '-' + factor
          : (k < 0 ? '(' + tex(k) + ')' : tex(k)) + ' \\cdot ' + factor;
    const tail = Math.abs(b) < 1e-9 ? '' : (b > 0 ? ' + ' : ' - ') + tex(Math.abs(b));
    return (
      found +
      'Тогда ' +
      math('f(' + tex(query.x0) + ') = ' + product + tail + ' = ' + tex(value)) +
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
const SLOPE_ONE = 'Проверьте, как сняты $k$ и $b$ по чертежу: ';
const SLOPE_TWO = 'Проверьте уравнения обеих прямых: ';
const SLOPE_RULE = '$k$ — это $\\Delta y : \\Delta x$ по двум отмеченным точкам, ';

/* Две концовки: там, где пересечение с осью Oy видно в узле сетки,
   b читается прямо с чертежа; где не видно — только подстановкой. */
const B_FROM_CHART = '$b$ — значение $y$ там, где прямая пересекает ось $Oy$.';
const B_BY_POINT =
  '$b$ здесь с чертежа не снять: возьмите точку с целыми координатами ' +
  'на прямой и подставьте её в $y = kx + b$.';

/**
 * Что проверить после неверного ответа.
 *
 * Подсказка зависит не только от набора, но и от самой задачи:
 * в одном и том же наборе у части задач пересечение с осью Oy
 * видно, у части — за кадром.
 */
function wrongHintFor(task: EngineTask): string | null {
  const { set, b, window: win, lines } = task.meta;
  const pair = set === '12.C' || set === '12.D';
  if (set !== '12.A' && set !== '12.B' && !pair) {
    return null;
  }
  /* У пары достаточно одной прямой с невидимым b: подставлять всё
     равно придётся. */
  const readable = pair
    ? lines.every((line) => interceptVisible(line.b, win))
    : interceptVisible(b, win);
  return (
    (pair ? SLOPE_TWO : SLOPE_ONE) + SLOPE_RULE + (readable ? B_FROM_CHART : B_BY_POINT)
  );
}

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

/* ── Подсказка про b, когда его не снять с чертежа ───────────────

   Пересечение с осью Oy бывает за краем поля или между узлами
   сетки. Прочитать b тогда неоткуда, и путь один: взять точку
   с целыми координатами, которая лежит на прямой, и подставить её
   в уравнение — коэффициент k к этому шагу уже найден.

   Признак «читается / не читается» берётся из разбора (solution.js),
   а не пишется здесь заново: иначе подсказка и разбор однажды
   разойдутся. */

/**
 * Число внутри формулы: десятичная запятая берётся в скобки, иначе
 * KaTeX ставит после неё отбивку знака препинания. Минус он рисует
 * сам, подменять дефис не нужно.
 */
function texNum(value: number): string {
  return plain(value).replace(',', '{,}');
}

/** Отрицательное берётся в скобки: «2 · −3» без них нечитаемо. */
function texFactor(value: number): string {
  return value < 0 ? '(' + texNum(value) + ')' : texNum(value);
}

/** Целое ли число с точностью до машинной погрешности. */
function whole(value: number): boolean {
  return Number.isInteger(Math.round(value * 1e9) / 1e9);
}

/**
 * Точка с целыми координатами, лежащая на прямой.
 *
 * Сначала — отмеченная на чертеже: её ученик видит, и это та самая
 * точка, которую движок уже выбрал. Из отмеченных берётся та, где
 * произведение k·x целое: арифметика в подсказке тогда без лишних
 * долей. Отмеченных нет — идём целыми x от нуля в обе стороны и
 * берём первый, где y тоже целый и точка попадает в кадр.
 */
function wholePoint(
  k: number,
  b: number,
  win: EngineWindow | null,
  marked: EnginePoint[] | null | undefined,
): EnginePoint | null {
  const ready = (marked ?? []).filter((p) => whole(p.x) && whole(p.y));
  const nice = ready.find((p) => whole(k * p.x));
  if (nice !== undefined) {
    return nice;
  }
  const first = ready[0];
  if (first !== undefined) {
    return first;
  }
  const limit = win === null ? 20 : Math.max(Math.abs(win.xmin), Math.abs(win.xmax));
  for (let step = 0; step <= limit; step += 1) {
    for (const x of step === 0 ? [0] : [step, -step]) {
      const y = Math.round((k * x + b) * 1e9) / 1e9;
      if (!Number.isInteger(y)) {
        continue;
      }
      if (win !== null && (y < win.ymin || y > win.ymax)) {
        continue;
      }
      return { x, y };
    }
  }
  return null;
}

/**
 * Текст шага «находим b» подстановкой точки.
 *
 * curve — имя прямой в задачах с двумя графиками: «f» или «g».
 * Пусто — прямая одна, и называть её незачем.
 */
function bySubstitution(
  k: number,
  b: number,
  win: EngineWindow | null,
  candidates: EnginePoint[] | null | undefined,
  marked: EnginePoint[] | null | undefined,
  curve: string,
): { textHtml: string; wrongHint: string } | null {
  const point = wholePoint(k, b, win, candidates);
  if (point === null) {
    return null;
  }
  const which = curve === '' ? 'Прямая' : 'Прямая $' + curve + '$';
  const where = Number.isInteger(b)
    ? which + ' пересекает ось $Oy$ за пределами чертежа — с рисунка $b$ не снять.'
    : which +
      ' пересекает ось $Oy$ не в узле сетки — с чертежа $b$ не снять, ' +
      'а «примерно» в ответе не бывает.';
  /* «Отмеченная» — только если точка и правда нарисована жирной на
     чертеже. У второй прямой опорные точки движок считает, но не
     рисует: назвать их отмеченными значило бы отправить ученика
     искать то, чего он не видит. */
  const onChart = (marked ?? []).some((p) => p.x === point.x && p.y === point.y);
  /* Тонкий пробел после «;» ставит сам движок (graph/math.js),
     руками его дублировать не нужно. */
  const dot = '$(' + texNum(point.x) + '; ' + texNum(point.y) + ')$';
  const product = Math.round((k * point.x) * 1e9) / 1e9;
  const line = curve === '' ? 'на прямой' : 'на $' + curve + '$';

  return {
    textHtml: hintHtml(
      where +
        ' Возьми точку с целыми координатами, которая точно лежит ' +
        line +
        ', — например' +
        (onChart ? ', отмеченную ' : ' точку ') +
        dot +
        '. Подставь её координаты в $y = kx + b$ вместо $x$ и $y$; ' +
        'коэффициент $k = ' +
        texNum(k) +
        '$ ты уже нашёл:<br>' +
        '$' +
        texNum(point.y) +
        ' = ' +
        /* Умножение на 1 и −1 не пишется. */
        (Math.abs(k - 1) < 1e-9 ? '' : Math.abs(k + 1) < 1e-9 ? '-' : texNum(k) + ' \\cdot ') +
        texFactor(point.x) +
        ' + b$<br>' +
        '$' +
        texNum(point.y) +
        ' = ' +
        texNum(product) +
        ' + b$<br>' +
        'Отсюда найди $b$.',
    ),
    wrongHint: hintHtml(
      'Подставь координаты точки ' +
        dot +
        ' в $y = kx + b$ и реши уравнение относительно $b$.',
    ),
  };
}

function stepB(task: EngineTask, b: number): TrainerStep {
  const { window: win, points } = task.meta;
  const substitution = interceptVisible(b, win)
    ? null
    : bySubstitution(task.meta.k, b, win, points, points, '');
  return {
    titleHtml: hintHtml('Теперь проверим $b$.'),
    textHtml:
      substitution === null
        ? hintHtml('Коэффициент $b$ — это значение $y$ в точке, где прямая пересекает ось $Oy$.')
        : substitution.textHtml,
    shape: 'plain',
    fields: [{ labelHtml: math('b ='), answer: plain(b) }],
    wrongHint:
      substitution === null
        ? hintHtml('Проверь, в какой точке прямая пересекает ось $Oy$.')
        : substitution.wrongHint,
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

function stepPairB(task: EngineTask, name: string, line: EngineLine): TrainerStep {
  const win = task.meta.window;
  /* Отмечены на чертеже только опорные точки первой прямой; у второй
     их нет, и точка для подстановки считается. */
  const substitution = interceptVisible(line.b, win)
    ? null
    : bySubstitution(line.k, line.b, win, line.points, task.meta.points, curve(name));
  return {
    titleHtml: hintHtml('Проверим $b$ для прямой $' + curve(name) + '$.'),
    textHtml:
      substitution === null
        ? hintHtml(
            'Коэффициент $b$ — это значение $y$ в точке, где прямая $' +
              curve(name) +
              '$ пересекает ось $Oy$.',
          )
        : substitution.textHtml,
    shape: 'plain',
    fields: [{ labelHtml: math('b ='), answer: plain(line.b) }],
    wrongHint:
      substitution === null
        ? hintHtml('Проверь, в какой точке прямая пересекает ось $Oy$.')
        : substitution.wrongHint,
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
    stepPairB(task, 'f', first),
    stepPairK('g', second.k, false),
    stepPairB(task, 'g', second),
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
  return last === null ? [] : [stepK(k), stepB(task, b), stepEquation(k, b), last];
}

/* ── Цепочка для гиперболы ───────────────────────────────────────

   Шаги строит graph/hints-rational.js: вопросы с вариантами ответа
   кнопками о сдвигах (вверх-вниз, влево-вправо и знак в знаменателе),
   затем k по отмеченной точке, у задач с прямой — прямая через
   треугольник, уравнение, корни и выбор корня. Номера и названия
   шагов — те же, что в полном решении листа учителя. Здесь шаги
   только набираются KaTeX. */

interface Exact {
  p: number;
  q: number;
}

interface RationalMeta {
  set: string;
  form: string;
  rule: string;
  m: Exact;
  s: Exact;
  t: Exact;
  coefficients: Record<string, Exact>;
  points: { x: number; y: number; role: string }[];
  query: { type: string; x0: Exact | null; y0: Exact | null; answer: Exact } | null;
  line: { k: Exact; b: Exact } | null;
  intersection: { axis: string; A: { x: number; y: number }; B: { x: Exact; y: Exact } } | null;
  answer: Exact;
}

const val = (e: Exact): number => e.p / e.q;

/** Число в подсказке: десятичная, а трети — дробью, как в условии. */
function rtex(e: Exact): string {
  let q = e.q;
  while (q % 2 === 0) { q /= 2; }
  while (q % 5 === 0) { q /= 5; }
  if (q === 1) { return tex(val(e)); }
  return (e.p < 0 ? '-' : '') + '\\dfrac{' + Math.abs(e.p) + '}{' + e.q + '}';
}

/* Шаг подсказки из graph/hints-rational.js: тексты с формулами в $…$,
   номер и название — из полного решения. */
interface RationalHint {
  title: string;
  kind: 'questions' | 'fields';
  focus?: 'horizontal' | 'vertical' | null;
  reminder?: string | null;
  strong?: boolean;
  questions?: {
    prompt: string;
    options: { text: string; right: boolean; why: string | null }[];
    right: string;
  }[];
  text?: string;
  fields?: { label: string; answer: string }[];
  variants?: string[][] | null;
  wrong?: string;
  after?: string[];
}

/* Подстановка и вычисление после верного шага — формулы полного
   решения, по одной в строку, с крупными дробями. */
function afterHtml(lines: string[]): string {
  return lines
    .map((line) => '<span class="tstep__line">' +
      katex.renderToString(line, { ...KATEX, displayFrac: true } as typeof KATEX) + '</span>')
    .join('');
}

function rationalSteps(task: EngineTask): TrainerStep[] {
  const hints = RationalHints.fromTask(task) as RationalHint[];
  /* Дроби в подсказке крупные: \\dfrac{k}{x - 3} строчной дробью на
     телефоне не читается. */
  const big = (text: string): string => typeset(GraphGenerate.typeset(text) as string, true);
  return hints.map((hint) => {
    const step: TrainerStep = {
      titleHtml: hintHtml(hint.title),
      textHtml: hint.text === undefined ? '' : big(hint.text),
      shape: 'plain',
      fields: (hint.fields ?? []).map((field) => ({ labelHtml: math(field.label), answer: field.answer })),
      wrongHint: hint.wrong === undefined ? '' : big(hint.wrong),
      focus: hint.focus ?? null,
    };
    if (hint.reminder) {
      step.reminderHtml = big(hint.reminder);
      step.reminderStrong = hint.strong === true;
    }
    if (hint.questions) {
      step.questions = hint.questions.map((question) => ({
        promptHtml: big(question.prompt),
        options: question.options.map((option) => ({
          html: big(option.text),
          right: option.right,
          whyHtml: option.why === null ? '' : big(option.why),
        })),
        rightHtml: big(question.right),
      }));
    }
    if (hint.variants) {
      step.variants = hint.variants;
    }
    if (hint.after && hint.after.length > 0) {
      step.afterHtml = afterHtml(hint.after);
    }
    return step;
  });
}

/* Асимптоты на чертеже — пунктиры цвета --graph-asymptote. Шагу о
   сдвиге нужно подсветить свою, поэтому каждая получает класс по
   направлению: вертикальная — chart-asym--v, горизонтальная — --h.
   Подписей не добавляется: значение ученик определяет сам. */
function markAsymptotes(svg: string): string {
  return svg.replace(
    /<path d="M([\d.]+) ([\d.]+)L([\d.]+) ([\d.]+)"([^>]*stroke="var\(--graph-asymptote)/g,
    (whole, x1: string, y1: string, x2: string, y2: string, rest: string) => {
      const dir = x1 === x2 ? 'v' : y1 === y2 ? 'h' : null;
      return dir === null ? whole
        : `<path class="chart-asym chart-asym--${dir}" d="M${x1} ${y1}L${x2} ${y2}"${rest}`;
    },
  );
}

/** Что проверить при неверном ответе: начало цепочки, без значения. */
function rationalWrongHint(task: EngineTask): string {
  const meta = task.meta as unknown as RationalMeta;
  if (meta.form === 'line') {
    return hintHtml(
      'Проверь по шагам: $k$ гиперболы $f(x)$ по точке $A$, коэффициенты $a$ и $b$ прямой ' +
        '$g(x)$ по двум точкам, уравнение $ax^2 + bx - k = 0$ и выбор корня — абсцисса $A$ ' +
        'в ответ не идёт.',
    );
  }
  if (meta.form === 'linear') {
    return hintHtml(
      'Проверь асимптоты: вертикальная $x = -b$, горизонтальная $y = k$ — и подстановку точки ' +
        'для $a$.',
    );
  }
  return hintHtml(
    'Проверь сдвиги по асимптотам — особенно знак сдвига влево-вправо, — потом $k$ по ' +
      'отмеченной точке и итоговое вычисление.',
  );
}

/** Откуда взялся ответ — формула функции, восстановленная по чертежу. */
function rationalRightHint(task: EngineTask): string {
  const meta = task.meta as unknown as RationalMeta & { equation?: string; line: { text?: string } | null };
  if (meta.form === 'line' && meta.line !== null) {
    return hintHtml(
      'По чертежу $f(x) = ' + rtex(meta.m) + '/x$ и $' + (meta.line.text ?? '') + '$. ' +
        'Второй корень уравнения $ax^2 + bx - k = 0$ — абсцисса точки $B$.',
    );
  }
  return hintHtml('По чертежу $' + (meta.equation ?? '') + '$, дальше вычисление.');
}

/* ── Задание тренажёра из задачи движка ──────────────────────────
   Условие набирается KaTeX, подсказки и цепочка шагов собираются
   вместе с заданием. Откуда пришла задача — с сборки или из браузера
   со свежим seed, — этой функции всё равно. */

export function trainerTaskFrom(task: EngineTask): TrainerTask {
  /* У параболы своя ветка: цепочки подсказок с полями у неё нет,
     зато есть разбор — тот же, что во вкладке опорных задач, — и
     рисунок метода. */
  const quadratic = task.meta.family === 'quadratic';
  const rational = task.meta.family === 'rational';
  if (rational) {
    return {
      id: task.id,
      kind: task.meta.set,
      questionHtml: typeset(task.questionHtml),
      chartSvg: task.svg === null ? null : markAsymptotes(task.svg),
      answer: task.answer,
      wrongHint: rationalWrongHint(task),
      rightHint: rationalRightHint(task),
      steps: rationalSteps(task),
      options: null,
      oshibki: {},
      solution: rationalSolution(task),
      method: methodFor(task.meta.set),
    };
  }
  return {
    id: task.id,
    kind: task.meta.set,
    questionHtml: typeset(task.questionHtml),
    chartSvg: task.svg,
    answer: task.answer,
    wrongHint: quadratic ? '' : hintHtml(wrongHintFor(task) ?? ''),
    rightHint: quadratic ? '' : rightHintFor(task),
    steps: quadratic ? [] : stepsFor(task),
    options: task.options == null ? null
      : task.options.map((option) => ({ number: option.number, html: typeset(option.html) })),
    oshibki: Object.fromEntries((task.options ?? []).flatMap((option) =>
      option.error === null ? [] : [[option.number, hintHtml(option.error)]])),
    solution: quadratic ? quadraticSteps(task) : null,
    method: quadratic ? methodFor(task.meta.set) : null,
  };
}
