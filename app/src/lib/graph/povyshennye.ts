/**
 * Шаблоны раздела «Варианты повышенной сложности» для задания №12.
 *
 * График f(x) = k·logₐ x: в разделе такой записи нет (12L — logₐ x,
 * b + logₐ x, logₐ(x + b)), а кривую рисует тот же движок — семейство
 * `loga` (families/loga.js) умеет множитель k. Отмеченные точки — узлы
 * сетки: x = rⁿ, y = c·n. Подвох задачи: k и a по отдельности не
 * находятся, но f(x) = k·logₐ x = c·log_r x, где c = f(r).
 *
 * В наборы 12L, тренажёр и генератор №12 шаблон не входит.
 */

import renderer from './renderer.js';
import Exp from './families/exponential.js';
import './families/expo.js';
import './families/loga.js';
import './families/quadratic.js';
import './families/rational.js';
import './families/sqrt.js';
import { asymptotes, horizontalAsymptote, verticalAsymptote } from './families/shared.js';

export interface KLog {
  /** Основание, в котором точки читаются: f(x) = c·log_r x. */
  r: number;
  /** f(r) = c — целое. */
  c: number;
  /** Абсциссы отмеченных точек: степени r (1, r, r² …), значения — целые. */
  marks: number[];
  /** Спрошенное значение функции. */
  y0: number;
}

export interface KLogTask {
  uslovie: string;
  otvet: number;
  /** Независимый счёт: решение f(x) = y0 численно (бисекция по кривой). */
  proverka: number;
  svg: string;
  svgUchitel: string;
  points: { x: number; y: number }[];
  /** Шаги разбора: подпись и строки с $…$. */
  shagi: { title: string; lines: string[] }[];
  hints: { question: string; options: string[]; correct: number; comment?: string }[];
}

/** Печать листа: наименьший кегль подписей в единицах движка (lib/variant/pechat). */
export interface Pechat {
  minFont?: number;
}

/** Рисунок движком №12; лист задаёт наименьший кегль. */
function risuy(sc: object, pechat: Pechat): string {
  return renderer.renderGraph(
    pechat.minFont === undefined ? sc : { ...sc, minFont: pechat.minFont },
  );
}

const log = (x: number, r: number) => Math.log(x) / Math.log(r);
const round9 = (x: number) => Math.round(x * 1e9) / 1e9;
const dec = (x: number) => String(round9(x)).replace('.', '{,}').replace('-', '-');
/** Целое ли (с допуском). */
const celoe = (x: number) => Math.abs(x - Math.round(x)) < 1e-9;

function scene(p: KLog, points: { x: number; y: number }[], uchitel: boolean) {
  const ys = points.map((t) => t.y);
  const xs = points.map((t) => t.x);
  /* Хвост у асимптоты обрезаем там, где кривая ещё отстоит от оси Oy
     на 0,2 клетки (то же правило, что у 12L). */
  const tail = Math.ceil(p.c * log(0.2, p.r));
  const win = {
    xmin: -2,
    xmax: Math.max(...xs) + 2,
    ymin: Math.max(Math.min(tail, -2), -4),
    ymax: Math.max(...ys) + 2,
  };
  const guides = uchitel
    ? points.flatMap((t) => [
        ...(t.y !== 0
          ? [{ type: 'segment', from: [t.x, 0], to: [t.x, t.y], style: 'dashed', color: 'accent' }]
          : []),
        { type: 'segment', from: [0, t.y], to: [t.x, t.y], style: 'dashed', color: 'accent' },
      ])
    : [];
  return {
    window: win,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    labelRules: 'strict',
    axisLabels: 'minimal',
    curves: [{ type: 'loga', a: p.r, k: p.c, c: 0, d: 0, color: 'lineA', label: 'y = f(x)' }],
    points: points.map((t) => ({ x: t.x, y: t.y, style: 'solid', color: 'lineA', label: null })),
    shapes: asymptotes([verticalAsymptote(0, win)]).concat(guides),
    alt: 'График функции f(x) = k·logₐ x с отмеченными точками в узлах сетки',
  };
}

export function kLog(p: KLog, pechat: Pechat = {}): KLogTask {
  const points = p.marks.map((x) => ({ x, y: round9(p.c * log(x, p.r)) }));
  if (!points.every((t) => celoe(t.x) && celoe(t.y))) {
    throw new Error('kLog: точки не в узлах сетки');
  }
  const n0 = p.y0 / p.c;
  const otvet = round9(p.r ** n0);
  /* Второй счёт: бисекция по самой кривой на (0; 1000). */
  const f = (x: number) => p.c * log(x, p.r);
  let lo = 1e-9;
  let hi = 1000;
  for (let i = 0; i < 200; i += 1) {
    const m = (lo + hi) / 2;
    if (f(m) < p.y0) lo = m;
    else hi = m;
  }
  const proverka = (lo + hi) / 2;
  const [, A, B] = points;
  const Pr = points.find((t) => t.x === p.r) ?? A!;
  const tochki = points.map((t) => `$(${dec(t.x)};\\ ${dec(t.y)})$`).join(', ');
  const n0tex = celoe(n0) ? dec(n0) : `\\dfrac{${p.y0}}{${p.c}}`;
  const shagi = [
    {
      title: 'Читаем точки',
      lines: [`На графике отмечены узлы сетки ${tochki}.`],
    },
    {
      title: 'Что дают точки',
      lines: [
        `Точка $(1;\\ 0)$ лежит на любом графике $k\\log_a x$: $\\log_a 1=0$. Из точки $(${dec(Pr.x)};\\ ${dec(Pr.y)})$: $k\\log_a ${dec(p.r)}=${dec(p.c)}$.`,
        `По отдельности $k$ и $a$ не находятся — и не нужны: по формуле перехода $\\log_a x=\\log_a ${dec(p.r)}\\cdot\\log_{${dec(p.r)}} x$, поэтому $f(x)=k\\log_a ${dec(p.r)}\\cdot\\log_{${dec(p.r)}} x=${dec(p.c)}\\log_{${dec(p.r)}} x$.`,
        ...(B === undefined || B === Pr
          ? []
          : [
              `Проверяем по третьей точке: $f(${dec(B.x)})=${dec(p.c)}\\log_{${dec(p.r)}} ${dec(B.x)}=${dec(B.y)}$ — сходится.`,
            ]),
      ],
    },
    {
      title: 'Решаем уравнение',
      lines: [
        `$${dec(p.c)}\\log_{${dec(p.r)}} x=${dec(p.y0)}$, откуда $\\log_{${dec(p.r)}} x=${n0tex}$.`,
        `По определению логарифма $x=${dec(p.r)}^{${n0tex}}=${dec(otvet)}$.`,
      ],
    },
  ];
  const r = dec(p.r);
  const hints = [
    {
      question: 'Можно ли по графику найти $k$ и $a$ по отдельности?',
      options: [
        `Нет, но $f(x)=${dec(p.c)}\\log_{${r}} x$ — этого достаточно`,
        `Да: $k=${dec(p.c)}$, $a=${r}$ — других вариантов нет`,
        'Да: $k=1$, а $a$ читается по точке',
      ],
      correct: 0,
      comment: `$k\\log_a x=k\\log_a ${r}\\cdot\\log_{${r}} x$, а $k\\log_a ${r}=f(${r})=${dec(p.c)}$.`,
    },
    {
      question: `Какое уравнение решаем?`,
      options: [
        `$\\log_{${r}} x=${dec(p.y0)}$`,
        `$${dec(p.c)}\\log_{${r}} x=${dec(p.y0)}$`,
        `$${dec(p.c)}\\log_{${r}} x=0$`,
      ],
      correct: 1,
    },
    {
      question: 'Чему равен $x$?',
      options: [`$${r}^{${n0tex}}$`, `$${r}^{${dec(p.y0)}}$`, `$${dec(p.y0)}^{${r}}$`],
      correct: 0,
      comment: `$\\log_{${r}} x=${n0tex}$ значит $x=${r}^{${n0tex}}=${dec(otvet)}$.`,
    },
  ];
  return {
    uslovie: `На рисунке изображён график функции вида $f(x)=k\\log_a x$. При каком значении $x$ функция $f(x)$ принимает значение $${dec(p.y0)}$?`,
    otvet,
    proverka,
    svg: risuy(scene(p, points, false), pechat),
    svgUchitel: risuy(scene(p, points, true), pechat),
    points,
    shagi,
    hints,
  };
}

/* ── Гипербола и прямая: вторая точка пересечения ─────────────────── */

export interface GiperbolaPryamaya {
  /** Общая точка графиков — узел сетки. */
  A: [number, number];
  /** Ещё одна точка прямой — узел сетки. */
  P: [number, number];
}

export interface GrafikTask extends Omit<KLogTask, 'points'> {
  points: { x: number; y: number }[];
}

type T = [number, number];

/** Множитель или вычитаемое: отрицательное — в скобках. */
const mn = (x: number) => (x < 0 ? `(${dec(x)})` : dec(x));

/** Пунктиры от точки к осям — на рисунке учителя. */
function napravlyayushchie(points: readonly T[]) {
  return points.flatMap(([x, y]) => [
    ...(y !== 0
      ? [{ type: 'segment', from: [x, 0], to: [x, y], style: 'dashed', color: 'accent' }]
      : []),
    ...(x !== 0
      ? [{ type: 'segment', from: [0, y], to: [x, y], style: 'dashed', color: 'accent' }]
      : []),
  ]);
}

/**
 * f(x) = k/x и g(x) = ax + b пересекаются в A (узел сетки) и B; прямая
 * проходит ещё через узел P. Найти абсциссу B. Подвох — B на рисунке не
 * видно: k читается по A, прямая — по A и P, а B — второй корень
 * квадратного уравнения (по Виету: x_A·x_B = −k/a).
 */
export function giperbolaPryamaya(p: GiperbolaPryamaya, pechat: Pechat = {}): GrafikTask {
  const [ax, ay] = p.A;
  const [px, py] = p.P;
  const k = ax * ay;
  const m = round9((py - ay) / (px - ax));
  const b = round9(ay - m * ax);
  if (k === 0 || m === 0) throw new Error('giperbolaPryamaya: вырожденные графики');
  /* Коэффициенты прямой пишутся десятичными — дробь должна быть конечной. */
  if (!celoe(m * 1e4)) throw new Error(`giperbolaPryamaya: наклон ${m} — бесконечная дробь`);
  /* x_B из целых: x_A·x_B = −k/a, a = (y_P − y_A)/(x_P − x_A). */
  const xB = round9((-ay * (px - ax)) / (py - ay));
  if (Math.abs(xB - ax) < 1e-9) throw new Error('giperbolaPryamaya: касание, B = A');
  /* Второй счёт: бисекция разности k/x − (mx + b) на ветви, где лежит B. */
  const h = (x: number) => k / x - (m * x + b);
  let lo = xB < 0 ? -1000 : 1e-6;
  let hi = xB < 0 ? -1e-6 : 1000;
  /* Отрезок без корня A: сужаем к стороне, где B. */
  if (Math.sign(ax) === Math.sign(xB)) {
    if (xB < ax) hi = (ax + xB) / 2;
    else lo = (ax + xB) / 2;
  }
  for (let i = 0; i < 300; i += 1) {
    const c = (lo + hi) / 2;
    if (Math.sign(h(c)) === Math.sign(h(lo))) lo = c;
    else hi = c;
  }
  const proverka = (lo + hi) / 2;
  /* Узлы гиперболы рядом с началом — подсказка глазу и проверка k. */
  const uzly: T[] = [];
  for (let x = -6; x <= 6; x += 1) {
    if (x !== 0 && Number.isInteger(k / x) && Math.abs(k / x) <= 6) uzly.push([x, k / x]);
  }
  const xs = [ax, px, -6, 6];
  const ys = [ay, py, -6, 6];
  const win = {
    xmin: Math.min(...xs) - 1,
    xmax: Math.max(...xs) + 1,
    ymin: Math.min(...ys) - 1,
    ymax: Math.max(...ys) + 1,
  };
  const scene = (uchitel: boolean) => ({
    window: win,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    labelRules: 'strict',
    axisLabels: 'minimal',
    curves: [
      { type: 'rational', k, b: 0, a: 0, color: 'lineA', label: 'y = f(x)' },
      { type: 'line', k: m, b, color: 'lineB', label: 'y = g(x)' },
    ],
    points: [
      { x: ax, y: ay, style: 'solid', color: 'lineA', label: 'A' },
      { x: px, y: py, style: 'solid', color: 'lineB', label: null },
    ],
    shapes: uchitel ? napravlyayushchie([p.A, p.P]) : [],
    alt: 'Графики гиперболы f(x) = k/x и прямой g(x) = ax + b, отмечены точка A и ещё одна точка прямой',
  });
  const kv = (t: T) => `(${dec(t[0])};\\ ${dec(t[1])})`;
  const bm = round9(b / m);
  const km = round9(-k / m);
  const kvUr = `x^2${bm < 0 ? '' : '+'}${dec(bm)}x${km < 0 ? '' : '+'}${dec(km)}=0`;
  const shagi = [
    {
      title: 'Читаем точки',
      lines: [`Оба графика проходят через $A${kv(p.A)}$, прямая — ещё через $${kv(p.P)}$.`],
    },
    {
      title: 'Гипербола',
      lines: [
        `$f(${dec(ax)})=${dec(ay)}$, поэтому $k=${dec(ax)}\\cdot${mn(ay)}=${dec(k)}$: $f(x)=\\dfrac{${dec(k)}}{x}$.`,
      ],
    },
    {
      title: 'Прямая',
      lines: [
        `$a=\\dfrac{${dec(py)}-${mn(ay)}}{${dec(px)}-${mn(ax)}}=${dec(m)}$, $b=${dec(ay)}-${mn(m)}\\cdot${mn(ax)}=${dec(b)}$: $g(x)=${dec(m)}x${b < 0 ? '' : '+'}${dec(b)}$.`,
      ],
    },
    {
      title: 'Точки пересечения',
      lines: [
        `$\\dfrac{${dec(k)}}{x}=${dec(m)}x${b < 0 ? '' : '+'}${dec(b)}$. Умножаем на $x\\ne0$ и делим на $${dec(m)}$: $${kvUr}$.`,
        `Один корень известен — это $x_A=${dec(ax)}$. По теореме Виета $x_A\\cdot x_B=${dec(km)}$, откуда $x_B=${dec(km)}:${mn(ax)}=${dec(xB)}$.`,
      ],
    },
  ];
  const hints = [
    {
      question: 'Как найти $k$?',
      options: [
        `$k=${dec(ax)}\\cdot${mn(ay)}=${dec(k)}$ по точке $A$`,
        `$k=${dec(ay)}:${dec(ax)}$`,
        'По точке пересечения с осью $Oy$',
      ],
      correct: 0,
      comment: 'Точка $A$ лежит на гиперболе: $y=\\dfrac{k}{x}$, значит, $k=xy$.',
    },
    {
      question: 'Как найти угловой коэффициент прямой?',
      options: [
        `$\\dfrac{${dec(py)}-${mn(ay)}}{${dec(px)}-${mn(ax)}}$`,
        `$\\dfrac{${dec(px)}-${mn(ax)}}{${dec(py)}-${mn(ay)}}$`,
        `$\\dfrac{${dec(py)}}{${dec(px)}}$`,
      ],
      correct: 0,
    },
    {
      question: 'Как быстрее найти второй корень?',
      options: [
        'По теореме Виета: один корень уже известен',
        'Прочитать по рисунку',
        'Подставить $x=0$',
      ],
      correct: 0,
      comment: `Точки $B$ на рисунке нет, а $x_A=${dec(ax)}$ — корень уравнения $${kvUr}$.`,
    },
  ];
  return {
    uslovie: `На рисунке изображены графики функций $f(x)=\\dfrac{k}{x}$ и $g(x)=ax+b$, которые пересекаются в точках $A$ и $B$. Найдите абсциссу точки $B$.`,
    otvet: xB,
    proverka,
    svg: risuy(scene(false), pechat),
    svgUchitel: risuy(scene(true), pechat),
    points: [p.A, p.P, ...uzly].map(([x, y]) => ({ x, y })),
    shagi,
    hints,
  };
}

/* ── Два корня: абсцисса точки пересечения ────────────────────────── */

export interface KorenKoren {
  /** f(x) = √(ax) проходит через узел F. */
  F: [number, number];
  /** g(x) = √(x − b). */
  b: number;
}

const nod = (x: number, y: number): number => (y === 0 ? Math.abs(x) : nod(y, x % y));

/**
 * f(x) = √(ax) и g(x) = √(x − b) пересекаются в A вне рисунка. По узлам
 * читаются a (по F) и b (по точкам (b + 1; 1), (b + 4; 2)); абсцисса A —
 * из ax = x − b. Подвох — a дробное, ответ на рисунке не прочесть.
 */
export function korenKoren(p: KorenKoren, pechat: Pechat = {}): GrafikTask {
  const [fx, fy] = p.F;
  const b = p.b;
  const an = fy * fy;
  const g0 = nod(an, fx);
  const aTex = fx / g0 === 1 ? dec(an / g0) : `\\dfrac{${an / g0}}{${fx / g0}}`;
  const a = an / fx;
  if (a <= 1 || b >= 0) throw new Error('korenKoren: графики не пересекаются правее');
  const otvet = round9((-b * fx) / (an - fx));
  /* Второй счёт: бисекция √(ax) − √(x − b) на (0; 1000). */
  const h = (x: number) => Math.sqrt(a * x) - Math.sqrt(x - b);
  let lo = 1e-9;
  let hi = 1000;
  for (let i = 0; i < 300; i += 1) {
    const c = (lo + hi) / 2;
    if (h(c) < 0) lo = c;
    else hi = c;
  }
  const proverka = (lo + hi) / 2;
  const G1: T = [b + 1, 1];
  const G2: T = [b + 4, 2];
  const win = {
    xmin: Math.min(b, 0) - 1,
    xmax: Math.max(fx, G2[0], 4) + 3,
    ymin: -2,
    ymax: Math.max(fy, 2) + 3,
  };
  const scene = (uchitel: boolean) => ({
    window: win,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    labelRules: 'strict',
    axisLabels: 'minimal',
    curves: [
      { type: 'sqrt', a: Math.sqrt(a), c: 0, d: 0, color: 'lineA', label: 'y = f(x)' },
      { type: 'sqrt', a: 1, c: b, d: 0, color: 'lineB', label: 'y = g(x)' },
    ],
    points: [
      { x: fx, y: fy, style: 'solid', color: 'lineA', label: null },
      { x: G1[0], y: G1[1], style: 'solid', color: 'lineB', label: null },
      { x: G2[0], y: G2[1], style: 'solid', color: 'lineB', label: null },
    ],
    shapes: uchitel ? napravlyayushchie([p.F, G1, G2]) : [],
    alt: 'Графики функций f(x) = √(ax) и g(x) = √(x − b) с отмеченными точками в узлах сетки',
  });
  const kv = (t: T) => `(${dec(t[0])};\\ ${dec(t[1])})`;
  const minusB = b < 0 ? `+${dec(-b)}` : `-${dec(b)}`;
  const shagi = [
    {
      title: 'Читаем точки',
      lines: [
        `График $f$ проходит через $${kv(p.F)}$, график $g$ — через $${kv(G1)}$ и $${kv(G2)}$.`,
      ],
    },
    {
      title: 'Коэффициенты',
      lines: [
        `$f(${dec(fx)})=\\sqrt{${dec(fx)}a}=${dec(fy)}$, значит, $${dec(fx)}a=${dec(an)}$, $a=${aTex}$.`,
        `$g(${dec(G1[0])})=\\sqrt{${dec(G1[0])}-b}=1$, значит, $b=${dec(b)}$; проверка: $g(${dec(G2[0])})=\\sqrt{${dec(G2[0])}${minusB}}=2$.`,
      ],
    },
    {
      title: 'Точка пересечения',
      lines: [
        `$\\sqrt{${aTex}x}=\\sqrt{x${minusB}}$. Обе части неотрицательны — возводим в квадрат: $${aTex}x=x${minusB}$.`,
        `$${dec(an)}x=${dec(fx)}x${b < 0 ? '+' : '-'}${dec(Math.abs(b * fx))}$, $${dec(an - fx)}x=${dec(-b * fx)}$, $x=${dec(otvet)}$.`,
      ],
    },
  ];
  const hints = [
    {
      question: 'Как найти $a$?',
      options: [
        `По точке $${kv(p.F)}$: $${dec(fx)}a=${dec(an)}$`,
        `По точке $${kv(p.F)}$: $${dec(fx)}a=${dec(fy)}$`,
        'По точке, где график начинается',
      ],
      correct: 0,
      comment: 'Под корнем стоит $ax$: квадрат значения равен $ax$.',
    },
    {
      question: 'Как найти $b$?',
      options: [`По точке $${kv(G1)}$: $${dec(G1[0])}-b=1$`, `$b=${dec(G1[0])}$`, `$b=${dec(-b)}$`],
      correct: 0,
    },
    {
      question: 'Какое уравнение даёт абсциссу точки пересечения?',
      options: [`$${aTex}x=x${minusB}$`, `$\\sqrt{${aTex}x}=x${minusB}$`, `$${aTex}x=0$`],
      correct: 0,
      comment: 'Равны корни из неотрицательных чисел — равны и подкоренные выражения.',
    },
  ];
  return {
    uslovie: `На рисунке изображены графики функций $f(x)=\\sqrt{ax}$ и $g(x)=\\sqrt{x-b}$, которые пересекаются в точке $A$. Найдите абсциссу точки $A$.`,
    otvet,
    proverka,
    svg: risuy(scene(false), pechat),
    svgUchitel: risuy(scene(true), pechat),
    points: [p.F, G1, G2].map(([x, y]) => ({ x, y })),
    shagi,
    hints,
  };
}

/* ── Партия 2: парабола и показательная по узлам сетки ────────────── */

/** Многочлен ax² + bx + c в TeX: «0{,}4x^2-0{,}8x-2», «-x^2+3x+4». */
function mnogochlen(a: number, b: number, c: number): string {
  const chlen = (k: number, v: string, pervyy: boolean) => {
    if (k === 0) return '';
    const znak = k < 0 ? '-' : pervyy ? '' : '+';
    const m = Math.abs(k);
    return `${znak}${m === 1 && v !== '' ? '' : dec(m)}${v}`;
  };
  return chlen(a, 'x^2', true) + chlen(b, 'x', false) + chlen(c, '', false) || '0';
}

/** Множитель (x − r) в TeX: «(x+4)», «(x-1)», «x». */
const skobka = (r: number) => (r === 0 ? 'x' : `(x${r < 0 ? '+' : '-'}${dec(Math.abs(r))})`);

/** Окно по точкам с полями: не уже восьми клеток по каждой оси. */
function oknoPo(pts: readonly T[], vverh: boolean) {
  const xs = pts.map((t) => t[0]);
  const ys = pts.map((t) => t[1]);
  let xmin = Math.floor(Math.min(...xs, 0)) - 2;
  let xmax = Math.ceil(Math.max(...xs, 0)) + 2;
  let ymin = Math.floor(Math.min(...ys, 0)) - 2;
  let ymax = Math.ceil(Math.max(...ys, 0)) + 2;
  while (xmax - xmin < 8) {
    xmin -= 1;
    if (xmax - xmin < 8) xmax += 1;
  }
  /* Не хватает высоты — растим в сторону ветвей. */
  while (ymax - ymin < 8) {
    if (vverh) ymax += 1;
    else ymin -= 1;
  }
  return { xmin, xmax, ymin, ymax };
}

/** Точка за окном — по рисунку её не прочесть. */
function zaOknom(
  x: number,
  y: number,
  w: { xmin: number; xmax: number; ymin: number; ymax: number },
) {
  return x < w.xmin || x > w.xmax || y < w.ymin || y > w.ymax;
}

/** Сцена параболы с отмеченными узлами. */
function stsenaParaboly(
  a: number,
  b: number,
  c: number,
  uzly: readonly T[],
  win: { xmin: number; xmax: number; ymin: number; ymax: number },
  uchitel: boolean,
) {
  return {
    window: win,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    labelRules: 'strict',
    axisLabels: 'minimal',
    curves: [{ type: 'quadratic', a, b, c, color: 'lineA', label: 'y = f(x)' }],
    points: uzly.map(([x, y]) => ({ x, y, style: 'solid', color: 'lineA', label: null })),
    shapes: uchitel ? napravlyayushchie(uzly) : [],
    alt: 'График параболы f(x) = ax² + bx + c с отмеченными точками в узлах сетки',
  };
}

/** Варианты кнопки без повторов: верный первым. */
function bezPovtorov(options: string[]): string[] {
  return [...new Set(options)];
}

export interface ParabolaB {
  /** Данный в условии коэффициент при x. */
  b: number;
  /** Пересечение с осью Oy: (0; c) — узел. */
  c: number;
  /** Ещё один узел графика. */
  Q: [number, number];
  /** Где спрашивают значение функции. */
  x0: number;
}

/**
 * f(x) = ax² + bx + c, b дано в условии; на рисунке отмечены узлы (0; c)
 * и Q. c читается по оси Oy, a — из f(x_Q) = y_Q. Подвох — вершина не в
 * узле, а f(x₀) — за рамкой: ответ только счётом.
 */
export function parabolaB(p: ParabolaB, pechat: Pechat = {}): GrafikTask {
  const { b, c, x0 } = p;
  const [qx, qy] = p.Q;
  if (qx === 0) throw new Error('parabolaB: Q на оси Oy');
  const a = round9((qy - c - b * qx) / (qx * qx));
  if (a === 0 || !celoe(a * 1e4)) throw new Error(`parabolaB: a = ${a}`);
  const f = (x: number) => round9(a * x * x + b * x + c);
  const otvet = f(x0);
  const xv = -b / (2 * a);
  const V: T = [xv, a * xv * xv + b * xv + c];
  const uzly: T[] = [[0, c], p.Q];
  const win = oknoPo([...uzly, V], a > 0);
  if (!zaOknom(x0, otvet, win)) throw new Error('parabolaB: f(x₀) читается по рисунку');
  /* Второй счёт: a — из разделённой разности, значение — схемой Горнера. */
  const aa = ((qy - c) / qx - b) / qx;
  const proverka = (aa * x0 + b) * x0 + c;
  const kv = (t: T) => `(${dec(t[0])};\\ ${dec(t[1])})`;
  const bx = round9(b * qx);
  const prava = round9(qy - c - bx);
  const fTex = mnogochlen(a, b, c);
  const podst = `${dec(a)}\\cdot${mn(x0)}^2${b < 0 ? '-' : '+'}${dec(Math.abs(b))}\\cdot${mn(x0)}${c < 0 ? '-' : '+'}${dec(Math.abs(c))}`;
  const shagi = [
    {
      title: 'Читаем точки',
      lines: [`График проходит через узлы сетки $${kv(uzly[0] as T)}$ и $${kv(p.Q)}$.`],
    },
    {
      title: 'Коэффициенты',
      lines: [
        `$f(0)=c$, а график пересекает ось $Oy$ в точке $${kv(uzly[0] as T)}$: $c=${dec(c)}$.`,
        `$f(${dec(qx)})=${dec(qy)}$: $a\\cdot${mn(qx)}^2${b < 0 ? '-' : '+'}${dec(Math.abs(b))}\\cdot${mn(qx)}${c < 0 ? '-' : '+'}${dec(Math.abs(c))}=${dec(qy)}$, то есть $${dec(qx * qx)}a${bx < 0 ? '' : '+'}${dec(bx)}${c < 0 ? '' : '+'}${dec(c)}=${dec(qy)}$, $${dec(qx * qx)}a=${dec(prava)}$, $a=${dec(a)}$.`,
      ],
    },
    {
      title: 'Значение функции',
      lines: [`$f(x)=${fTex}$, $f(${dec(x0)})=${podst}=${dec(otvet)}$.`],
    },
  ];
  const hints = [
    {
      question: 'Как найти $c$?',
      options: [
        `$c=f(0)=${dec(c)}$ — по точке на оси $Oy$`,
        'По ординате вершины',
        'По абсциссе вершины',
      ],
      correct: 0,
    },
    {
      question: 'Какое уравнение даёт $a$?',
      options: bezPovtorov([
        `$${dec(qx * qx)}a${bx < 0 ? '' : '+'}${dec(bx)}${c < 0 ? '' : '+'}${dec(c)}=${dec(qy)}$`,
        `$${dec(qx)}a${bx < 0 ? '' : '+'}${dec(bx)}${c < 0 ? '' : '+'}${dec(c)}=${dec(qy)}$`,
        `$${dec(qx * qx)}a${bx < 0 ? '+' : '-'}${dec(Math.abs(bx))}${c < 0 ? '' : '+'}${dec(c)}=${dec(qy)}$`,
      ]),
      correct: 0,
      comment: `Точка $${kv(p.Q)}$ лежит на графике: подставляем $x=${dec(qx)}$, $f(x)=${dec(qy)}$.`,
    },
    {
      question: `Можно ли прочитать $f(${dec(x0)})$ по рисунку?`,
      options: [
        'Нет: точка за рамкой — считаем по формуле',
        'Да: по ближайшему узлу сетки',
        'Да: оно равно ординате вершины',
      ],
      correct: 0,
      comment: `$f(${dec(x0)})=${podst}$.`,
    },
  ];
  return {
    uslovie: `На рисунке изображён график функции $f(x)=ax^2${b < 0 ? '-' : '+'}${dec(Math.abs(b))}x+c$. Найдите $f(${dec(x0)})$.`,
    otvet,
    proverka,
    svg: risuy(stsenaParaboly(a, b, c, uzly, win, false), pechat),
    svgUchitel: risuy(stsenaParaboly(a, b, c, uzly, win, true), pechat),
    points: uzly.map(([x, y]) => ({ x, y })),
    shagi,
    hints,
  };
}

export interface ParabolaKorni {
  /** Нули функции — узлы на оси Ox. */
  x1: number;
  x2: number;
  /** Пересечение с осью Oy: (0; c). */
  c: number;
  x0: number;
}

/**
 * f(x) = ax² + bx + c через нули x₁, x₂ и точку (0; c): f = a(x − x₁)(x − x₂),
 * a = c/(x₁x₂). Подвох — вершина не в узле, f(x₀) за рамкой.
 */
export function parabolaKorni(p: ParabolaKorni, pechat: Pechat = {}): GrafikTask {
  const { x1, x2, c, x0 } = p;
  if (x1 === x2 || x1 === 0 || x2 === 0 || c === 0) throw new Error('parabolaKorni: вырожденно');
  const pr = x1 * x2;
  const a = round9(c / pr);
  if (!celoe(a * 1e4)) throw new Error(`parabolaKorni: a = ${a}`);
  const b = round9(-a * (x1 + x2));
  const otvet = round9(a * (x0 - x1) * (x0 - x2));
  const xv = (x1 + x2) / 2;
  const V: T = [xv, a * (xv - x1) * (xv - x2)];
  const uzly: T[] = [
    [Math.min(x1, x2), 0],
    [Math.max(x1, x2), 0],
    [0, c],
  ];
  const win = oknoPo([...uzly, V], a > 0);
  if (!zaOknom(x0, otvet, win)) throw new Error('parabolaKorni: f(x₀) читается по рисунку');
  /* Второй счёт: коэффициенты общей формы из системы по трём точкам. */
  const proverka = (() => {
    const bb = -a * (x1 + x2);
    return a * x0 * x0 + bb * x0 + c;
  })();
  const kv = (t: T) => `(${dec(t[0])};\\ ${dec(t[1])})`;
  const [u1, u2] = [Math.min(x1, x2), Math.max(x1, x2)];
  const razl = `${skobka(u1)}${skobka(u2)}`;
  const podst = `${mn(a)}\\cdot${mn(round9(x0 - u1))}\\cdot${mn(round9(x0 - u2))}`;
  const shagi = [
    {
      title: 'Читаем точки',
      lines: [
        `График пересекает ось $Ox$ в узлах $${kv(uzly[0] as T)}$ и $${kv(uzly[1] as T)}$, ось $Oy$ — в узле $${kv(uzly[2] as T)}$.`,
      ],
    },
    {
      title: 'Формула через нули',
      lines: [
        `Нули функции $${dec(u1)}$ и $${dec(u2)}$, поэтому $f(x)=a${razl}$.`,
        `$f(0)=a\\cdot${mn(-u1)}\\cdot${mn(-u2)}=${dec(pr)}a=${dec(c)}$, откуда $a=${dec(a)}$.`,
      ],
    },
    {
      title: 'Значение функции',
      lines: [
        `$f(${dec(x0)})=${podst}=${dec(otvet)}$.`,
        `В общей форме $f(x)=${mnogochlen(a, b, c)}$ — то же значение.`,
      ],
    },
  ];
  const obr = `${skobka(-u1)}${skobka(-u2)}`;
  const hints = [
    {
      question: 'Как записать $f(x)$ через нули?',
      options: bezPovtorov([`$a${razl}$`, `$a${obr}$`, `$a${razl}+${dec(c)}$`]),
      correct: 0,
      comment: 'Множитель $(x-x_0)$ обращается в ноль при $x=x_0$.',
    },
    {
      question: 'Как найти $a$?',
      options: bezPovtorov([
        `$f(0)=${dec(pr)}a=${dec(c)}$`,
        `$a=${dec(c)}$ — по точке на оси $Oy$`,
        `$f(0)=${dec(-pr)}a=${dec(c)}$`,
      ]),
      correct: 0,
    },
    {
      question: `Чему равно $f(${dec(x0)})$?`,
      options: bezPovtorov([
        `$${dec(otvet)}$`,
        `$${dec(round9(a * (x0 + u1) * (x0 + u2)))}$`,
        `$${dec(-otvet)}$`,
      ]),
      correct: 0,
      comment: `$f(${dec(x0)})=${podst}$.`,
    },
  ];
  return {
    uslovie: `На рисунке изображён график функции $f(x)=ax^2+bx+c$. Найдите $f(${dec(x0)})$.`,
    otvet,
    proverka,
    svg: risuy(stsenaParaboly(a, b, c, uzly, win, false), pechat),
    svgUchitel: risuy(stsenaParaboly(a, b, c, uzly, win, true), pechat),
    points: uzly.map(([x, y]) => ({ x, y })),
    shagi,
    hints,
  };
}

export interface PokazatelnayaOtnoshenie {
  /** Узел графика кроме (0; 1): a^{P₀} = P₁. */
  P: [number, number];
  /** Спрашивают f(m) / f(n). */
  m: number;
  n: number;
}

/**
 * f(x) = aˣ через (0; 1) и узел P: a^{p} = y. Основание иррациональное
 * (y — не точная степень), но f(m)/f(n) = a^{m−n} = y^{(m−n)/p} — целое.
 * Подвох — не искать a приближённо, а свести к известной степени.
 */
export function pokazatelnayaOtnoshenie(
  p: PokazatelnayaOtnoshenie,
  pechat: Pechat = {},
): GrafikTask {
  const [px, py] = p.P;
  const { m, n } = p;
  const e = (m - n) / px;
  if (px === 0 || py <= 0 || py === 1 || !Number.isInteger(e) || e === 0)
    throw new Error('pokazatelnayaOtnoshenie: показатель не целый');
  const otvet = round9(py ** e);
  if (!celoe(otvet * 1e4)) throw new Error(`pokazatelnayaOtnoshenie: ${py}^${e}`);
  const a = py ** (1 / px);
  const proverka = a ** m / a ** n;
  const uzly: T[] = [
    [0, 1],
    [px, py],
  ];
  const rastet = a > 1;
  /* Хвост у асимптоты y = 0 обрезаем там, где кривая ещё отстоит от оси
     на CLEARANCE (то же правило, что у семейства exponential). */
  const hvost = Math.max(2, Math.floor(Exp.tailReach(a) + 1e-9));
  const shir = Math.max(Math.abs(px) + 2, 8 - hvost);
  const win = {
    xmin: rastet ? -hvost : -shir,
    xmax: rastet ? shir : hvost,
    ymin: -2,
    ymax: Math.max(py, 6) + 2,
  };
  const scene = (uchitel: boolean) => ({
    window: win,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    labelRules: 'strict',
    axisLabels: 'minimal',
    curves: [{ type: 'exponential', a, d: 0, color: 'lineA', label: 'y = f(x)' }],
    points: uzly.map(([x, y]) => ({ x, y, style: 'solid', color: 'lineA', label: null })),
    shapes: uchitel ? napravlyayushchie(uzly) : [],
    alt: 'График показательной функции f(x) = aˣ с отмеченными точками в узлах сетки',
  });
  const kv = (t: T) => `(${dec(t[0])};\\ ${dec(t[1])})`;
  const ap = `a^{${dec(px)}}`;
  const raz = round9(m - n);
  const shagi = [
    {
      title: 'Читаем точки',
      lines: [`График проходит через узлы $${kv(uzly[0] as T)}$ и $${kv(p.P)}$.`],
    },
    {
      title: 'Что дают точки',
      lines: [
        `$f(0)=a^0=1$ — эта точка есть у любой показательной функции. Из второй точки: $${ap}=${dec(py)}$.`,
        `Само $a$ находить не нужно: оно иррациональное, $a=${px > 0 ? '' : '\\dfrac{1}{'}${Math.abs(px) === 2 ? `\\sqrt{${py}}` : `\\sqrt[${Math.abs(px)}]{${py}}`}${px > 0 ? '' : '}'}$.`,
      ],
    },
    {
      title: 'Отношение',
      lines: [
        `$\\dfrac{f(${dec(m)})}{f(${dec(n)})}=\\dfrac{a^{${dec(m)}}}{a^{${dec(n)}}}=a^{${dec(m)}-${mn(n)}}=a^{${dec(raz)}}$.`,
        `$a^{${dec(raz)}}=\\left(${ap}\\right)^{${dec(e)}}=${dec(py)}^{${dec(e)}}=${dec(otvet)}$.`,
      ],
    },
  ];
  const hints = [
    {
      question: 'Что дают отмеченные точки?',
      options: [`$${ap}=${dec(py)}$`, `$a=${dec(py)}$`, `$${dec(px)}a=${dec(py)}$`],
      correct: 0,
      comment: `Точка $${kv(p.P)}$ лежит на графике: $f(${dec(px)})=${dec(py)}$.`,
    },
    {
      question: `Чему равно $\\dfrac{a^{${dec(m)}}}{a^{${dec(n)}}}$?`,
      options: bezPovtorov([
        `$a^{${dec(raz)}}$`,
        `$a^{${dec(round9(m + n))}}$`,
        `$a^{${dec(round9(n - m))}}$`,
      ]),
      correct: 0,
      comment: 'При делении степеней с одним основанием показатели вычитаются.',
    },
    {
      question: `Как выразить $a^{${dec(raz)}}$ через $${ap}$?`,
      options: [
        `$\\left(${ap}\\right)^{${dec(e)}}=${dec(py)}^{${dec(e)}}$`,
        `$${ap}\\cdot${dec(e)}=${dec(round9(py * e))}$`,
        `$${dec(py)}^{${dec(raz)}}$`,
      ],
      correct: 0,
    },
  ];
  return {
    uslovie: `На рисунке изображён график функции $f(x)=a^x$. Найдите $\\dfrac{f(${dec(m)})}{f(${dec(n)})}$.`,
    otvet,
    proverka,
    svg: risuy(scene(false), pechat),
    svgUchitel: risuy(scene(true), pechat),
    points: uzly.map(([x, y]) => ({ x, y })),
    shagi,
    hints,
  };
}

/* ── Партия 3 ───────────────────────────────────────────────────── */

export interface GiperbolaKB {
  /** Два узла графика f(x) = k/x + b по разные стороны асимптоты. */
  A: [number, number];
  B: [number, number];
  /** Где спрашивают значение функции (за рамкой). */
  x0: number;
}

/**
 * f(x) = k/x + b через два узла сетки; найти f(x₀) далеко за рамкой.
 * Подвох — асимптота y = b не проходит по оси, и k с b находятся только
 * вместе: система по двум точкам.
 */
export function giperbolaKB(p: GiperbolaKB, pechat: Pechat = {}): GrafikTask {
  const [ax, ay] = p.A;
  const [bx, by] = p.B;
  if (ax === 0 || bx === 0 || ax === bx) throw new Error('giperbolaKB: точки на асимптоте');
  /* k(1/x_A − 1/x_B) = y_A − y_B. */
  const k = round9(((ay - by) * ax * bx) / (bx - ax));
  const b = round9(ay - k / ax);
  if (k === 0 || !celoe(k) || !celoe(b)) throw new Error(`giperbolaKB: k = ${k}, b = ${b}`);
  const otvet = round9(k / p.x0 + b);
  if (!celoe(otvet * 1e4)) throw new Error(`giperbolaKB: f(x₀) = ${otvet}`);
  /* Второй счёт: система по Крамеру в неизвестных k и b. */
  const det = 1 / ax - 1 / bx;
  const kk = (ay - by) / det;
  const bb = (by / ax - ay / bx) / det;
  const proverka = kk / p.x0 + bb;
  const win = {
    xmin: Math.min(ax, bx, -4) - 1,
    xmax: Math.max(ax, bx, 4) + 1,
    ymin: Math.min(ay, by, b - 3, -2) - 1,
    ymax: Math.max(ay, by, b + 3, 2) + 1,
  };
  if (!zaOknom(p.x0, otvet, win))
    throw new Error('giperbolaKB: f(x₀) читается по рисунку');
  const scene = (uchitel: boolean) => ({
    window: win,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    labelRules: 'strict',
    axisLabels: 'minimal',
    curves: [{ type: 'rational', k, b, a: 0, color: 'lineA', label: 'y = f(x)' }],
    points: [p.A, p.B].map(([x, y]) => ({ x, y, style: 'solid', color: 'lineA', label: null })),
    shapes: asymptotes([verticalAsymptote(0, win), horizontalAsymptote(b, win)]).concat(
      uchitel ? napravlyayushchie([p.A, p.B]) : [],
    ),
    alt: 'График функции f(x) = k/x + b с отмеченными точками в узлах сетки',
  });
  const kv = (t: T) => `(${dec(t[0])};\\ ${dec(t[1])})`;
  const fTex = `\\dfrac{${dec(k)}}{x}${b < 0 ? '' : '+'}${dec(b)}`;
  const shagi = [
    {
      title: 'Читаем точки',
      lines: [`График проходит через узлы сетки $${kv(p.A)}$ и $${kv(p.B)}$.`],
    },
    {
      title: 'Система',
      lines: [
        `$\\dfrac{k}{${mn(ax)}}+b=${dec(ay)}$ и $\\dfrac{k}{${mn(bx)}}+b=${dec(by)}$.`,
        `Вычтем: $k\\left(\\dfrac{1}{${mn(ax)}}-\\dfrac{1}{${mn(bx)}}\\right)=${dec(round9(ay - by))}$, откуда $k=${dec(k)}$; тогда $b=${dec(ay)}-\\dfrac{${dec(k)}}{${mn(ax)}}=${dec(b)}$.`,
        `$f(x)=${fTex}$; горизонтальная асимптота $y=${dec(b)}$ — сходится с рисунком.`,
      ],
    },
    {
      title: 'Значение функции',
      lines: [`$f(${dec(p.x0)})=\\dfrac{${dec(k)}}{${mn(p.x0)}}${b < 0 ? '' : '+'}${dec(b)}=${dec(otvet)}$.`],
    },
  ];
  const hints = [
    {
      question: 'Что показывает горизонтальная асимптота?',
      options: [`$b=${dec(b)}$`, `$k=${dec(b)}$`, 'Ничего: асимптота — ось $Ox$'],
      correct: 0,
      comment: 'При больших $|x|$ дробь $\\dfrac{k}{x}$ близка к нулю, и $f(x)$ близка к $b$.',
    },
    {
      question: 'Как найти $k$?',
      options: [
        `Подставить точку: $\\dfrac{k}{${mn(ax)}}${b < 0 ? '' : '+'}${dec(b)}=${dec(ay)}$`,
        `$k=${dec(ax)}\\cdot${mn(ay)}$`,
        `$k=${dec(ay)}:${mn(ax)}$`,
      ],
      correct: 0,
      comment: '$k=xy$ было бы верно только при $b=0$.',
    },
  ];
  return {
    uslovie: `На рисунке изображён график функции $f(x)=\\dfrac{k}{x}+b$. Найдите $f(${dec(p.x0)})$.`,
    otvet,
    proverka,
    svg: risuy(scene(false), pechat),
    svgUchitel: risuy(scene(true), pechat),
    points: [p.A, p.B].map(([x, y]) => ({ x, y })),
    shagi,
    hints,
  };
}

export interface KorenPryamaya {
  /** Узел графика g(x) = p√x (x — точный квадрат). */
  G: [number, number];
  /** Узел прямой f(x) = kx + b, проходящей через начало координат. */
  L: [number, number];
}

/**
 * f(x) = kx + b и g(x) = p√x пересекаются в начале координат и в B вне
 * рисунка. p — по узлу G, k — по узлу L (b = 0: прямая проходит через
 * O); абсцисса B: p√x = kx, √x = p/k. Подвох — корень x = 0 — это O.
 */
export function korenPryamaya(par: KorenPryamaya, pechat: Pechat = {}): GrafikTask {
  const [gx, gy] = par.G;
  const [lx, ly] = par.L;
  const s = Math.sqrt(gx);
  if (!celoe(s) || gx <= 0 || lx === 0) throw new Error('korenPryamaya: узлы не годятся');
  const pp = round9(gy / s);
  const k = ly / lx;
  if (pp <= 0 || k <= 0) throw new Error('korenPryamaya: графики не пересекаются правее O');
  /* √x_B = p/k = y_G·x_L/(√x_G·y_L) — из целых, без деления по дороге. */
  const pkQ = (gy * lx) / (s * ly);
  const otvet = round9(pkQ ** 2);
  const g0 = nod(ly, lx);
  const kTex = celoe(k * 1e4) ? dec(round9(k)) : `\\dfrac{${ly / g0}}{${lx / g0}}`;
  if (!celoe(otvet * 1e4)) throw new Error(`korenPryamaya: x_B = ${otvet}`);
  /* Второй счёт: бисекция p√x − kx на (x_B/4; 1000) — левее неё только O. */
  const h = (x: number) => pp * Math.sqrt(x) - k * x;
  let lo = 1e-9 + ((pp / k) ** 2) / 4;
  let hi = 10000;
  for (let i = 0; i < 300; i += 1) {
    const c = (lo + hi) / 2;
    if (h(c) > 0) lo = c;
    else hi = c;
  }
  const proverka = (lo + hi) / 2;
  const win = oknoPo([par.G, par.L, [0, 0]], true);
  win.xmin = Math.min(win.xmin, -3);
  win.ymin = Math.min(win.ymin, -3);
  if (!zaOknom(otvet, k * otvet, win)) throw new Error('korenPryamaya: B читается по рисунку');
  const scene = (uchitel: boolean) => ({
    window: win,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    labelRules: 'strict',
    axisLabels: 'minimal',
    curves: [
      { type: 'line', k: round9(k), b: 0, color: 'lineB', label: 'y = f(x)' },
      { type: 'sqrt', a: pp, c: 0, d: 0, color: 'lineA', label: 'y = g(x)' },
    ],
    points: [
      { x: 0, y: 0, style: 'solid', color: 'lineA', label: null },
      { x: gx, y: gy, style: 'solid', color: 'lineA', label: null },
      { x: lx, y: ly, style: 'solid', color: 'lineB', label: null },
    ],
    shapes: uchitel ? napravlyayushchie([par.G, par.L]) : [],
    alt: 'Графики прямой f(x) = kx + b и функции g(x) = p√x, пересекающихся в начале координат',
  });
  const kv = (t: T) => `(${dec(t[0])};\\ ${dec(t[1])})`;
  const pk = round9(pkQ);
  const shagi = [
    {
      title: 'Читаем точки',
      lines: [
        `Оба графика проходят через $O(0;\\ 0)$; график $g$ — через $${kv(par.G)}$, прямая — через $${kv(par.L)}$.`,
      ],
    },
    {
      title: 'Коэффициенты',
      lines: [
        `$g(${dec(gx)})=p\\sqrt{${dec(gx)}}=${dec(s)}p=${dec(gy)}$, $p=${dec(pp)}$.`,
        `Прямая проходит через начало координат, поэтому $b=0$; $k=\\dfrac{${dec(ly)}}{${dec(lx)}}${celoe(k * 1e4) ? `=${kTex}` : ''}$.`,
      ],
    },
    {
      title: 'Точка пересечения',
      lines: [
        `$${dec(pp)}\\sqrt{x}=${kTex}x$. Корень $x=0$ — это точка $O$; при $x>0$ делим на $\\sqrt{x}$: $\\sqrt{x}=${dec(pp)}:${kTex}=${dec(pk)}$.`,
        `$x=${dec(pk)}^2=${dec(otvet)}$.`,
      ],
    },
  ];
  const hints = [
    {
      question: 'Чему равен $b$?',
      options: ['$0$: прямая проходит через начало координат', `$${kTex}$`, '$1$'],
      correct: 0,
    },
    {
      question: 'Как найти $p$?',
      options: [
        `По точке $${kv(par.G)}$: $p\\sqrt{${dec(gx)}}=${dec(gy)}$`,
        `$p=${dec(gy)}:${dec(gx)}$`,
        `$p=${dec(gy)}$`,
      ],
      correct: 0,
    },
    {
      question: 'Какое уравнение даёт абсциссу $B$?',
      options: [
        `$\\sqrt{x}=${dec(pp)}:${kTex}$`,
        `$x=${dec(pp)}:${kTex}$`,
        `$\\sqrt{x}=${kTex}:${dec(pp)}$`,
      ],
      correct: 0,
    },
  ];
  return {
    uslovie: `На рисунке изображены графики функций $f(x)=kx+b$ и $g(x)=p\\sqrt{x}$, которые пересекаются в начале координат и в точке $B$. Найдите абсциссу точки $B$.`,
    otvet,
    proverka,
    svg: risuy(scene(false), pechat),
    svgUchitel: risuy(scene(true), pechat),
    points: [[0, 0] as T, par.G, par.L].map(([x, y]) => ({ x, y })),
    shagi,
    hints,
  };
}

export interface ParabolaPryamaya {
  /** Второй нуль параболы g(x) = ax(x − r) (первый — начало координат). */
  r: number;
  /** Ещё один узел параболы (обычно вершина). */
  Q: [number, number];
  /** Узел прямой f(x) = kx + b через начало координат. */
  L: [number, number];
}

/**
 * f(x) = kx + b и g(x) = ax² + bx + c пересекаются в начале координат и
 * в A вне рисунка. Парабола — по нулям 0 и r и узлу Q, прямая — по O и
 * L; x_A — второй корень ax(x − r) = kx. Подвох — c = 0 и b прямой = 0
 * читаются по общей точке O, а A на рисунке нет.
 */
export function parabolaPryamaya(par: ParabolaPryamaya, pechat: Pechat = {}): GrafikTask {
  const { r } = par;
  const [qx, qy] = par.Q;
  const [lx, ly] = par.L;
  if (r === 0 || qx === 0 || qx === r || lx === 0) throw new Error('parabolaPryamaya: узлы');
  const a = round9(qy / (qx * (qx - r)));
  const k = round9(ly / lx);
  if (a === 0 || !celoe(a * 1e4) || !celoe(k * 1e4)) throw new Error(`parabolaPryamaya: a = ${a}`);
  const bb = round9(-a * r);
  const otvet = round9(r + k / a);
  if (otvet === 0 || !celoe(otvet * 1e4)) throw new Error(`parabolaPryamaya: x_A = ${otvet}`);
  /* Второй счёт: корни ax² + (b − k)x = 0 по формуле с дискриминантом. */
  const B2 = bb - k;
  const D = B2 * B2;
  const korni = [(-B2 - Math.sqrt(D)) / (2 * a), (-B2 + Math.sqrt(D)) / (2 * a)];
  const proverka = korni.reduce((x, y) => (Math.abs(x) > Math.abs(y) ? x : y));
  const uzly: T[] = [[0, 0], [r, 0], par.Q];
  const win = oknoPo([...uzly, par.L], a > 0);
  if (!zaOknom(otvet, k * otvet, win)) throw new Error('parabolaPryamaya: A читается по рисунку');
  const scene = (uchitel: boolean) => ({
    window: win,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    labelRules: 'strict',
    axisLabels: 'minimal',
    curves: [
      { type: 'quadratic', a, b: bb, c: 0, color: 'lineA', label: 'y = g(x)' },
      { type: 'line', k, b: 0, color: 'lineB', label: 'y = f(x)' },
    ],
    points: [
      ...uzly.map(([x, y]) => ({ x, y, style: 'solid', color: 'lineA', label: null })),
      { x: lx, y: ly, style: 'solid', color: 'lineB', label: null },
    ],
    shapes: uchitel ? napravlyayushchie([...uzly, par.L]) : [],
    alt: 'Графики прямой f(x) = kx + b и параболы g(x) = ax² + bx + c, пересекающихся в начале координат',
  });
  const kv = (t: T) => `(${dec(t[0])};\\ ${dec(t[1])})`;
  const gTex = mnogochlen(a, bb, 0);
  const shagi = [
    {
      title: 'Читаем точки',
      lines: [
        `Оба графика проходят через $O(0;\\ 0)$. Парабола — ещё через $${kv([r, 0])}$ и $${kv(par.Q)}$, прямая — через $${kv(par.L)}$.`,
      ],
    },
    {
      title: 'Прямая',
      lines: [`Прямая проходит через $O$: $b=0$, $k=\\dfrac{${dec(ly)}}{${dec(lx)}}=${dec(k)}$, $f(x)=${dec(k)}x$.`],
    },
    {
      title: 'Парабола',
      lines: [
        `Нули параболы $0$ и $${dec(r)}$: $g(x)=a\\,x${skobka(r)}$. По точке $${kv(par.Q)}$: $a\\cdot${mn(qx)}\\cdot${mn(round9(qx - r))}=${dec(qy)}$, $a=${dec(a)}$.`,
        `$g(x)=${gTex}$.`,
      ],
    },
    {
      title: 'Точка пересечения',
      lines: [
        `$${gTex}=${dec(k)}x$. Корень $x=0$ — это точка $O$; при $x\\ne0$ делим на $x$: $${dec(a)}x${bb < 0 ? '' : '+'}${dec(bb)}=${dec(k)}$, $x=${dec(otvet)}$.`,
      ],
    },
  ];
  const hints = [
    {
      question: 'Что даёт общая точка графиков в начале координат?',
      options: [
        'У прямой $b=0$, у параболы $c=0$',
        'Абсциссу точки $A$',
        'Вершину параболы',
      ],
      correct: 0,
    },
    {
      question: 'Как удобнее записать параболу?',
      options: [`$g(x)=a\\,x${skobka(r)}$ — через нули`, '$g(x)=ax^2$', `$g(x)=a(x-${mn(qx)})^2$`],
      correct: 0,
      comment: `Парабола пересекает ось $Ox$ в точках $0$ и $${dec(r)}$.`,
    },
    {
      question: 'Какое уравнение даёт абсциссу $A$?',
      options: [
        `$${dec(a)}x${bb < 0 ? '' : '+'}${dec(bb)}=${dec(k)}$`,
        `$${gTex}=0$`,
        `$${dec(k)}x=0$`,
      ],
      correct: 0,
    },
  ];
  return {
    uslovie: `На рисунке изображены графики функций $f(x)=kx+b$ и $g(x)=ax^2+bx+c$, которые пересекаются в начале координат и в точке $A$. Найдите абсциссу точки $A$.`,
    otvet,
    proverka,
    svg: risuy(scene(false), pechat),
    svgUchitel: risuy(scene(true), pechat),
    points: [...uzly, par.L].map(([x, y]) => ({ x, y })),
    shagi,
    hints,
  };
}

/* ── Партия 4 (варианты 19–24) ──────────────────────────────────── */

export interface DvaUzla {
  /**
   * pokazSdvig — f(x) = a^(x+b); logSdvig — f(x) = logₐ(x+b);
   * giperbolaA — f(x) = k/(x+a); pokazPlus — f(x) = aˣ + b;
   * logPlus — f(x) = c + logₐ x (узел A при x = 1); korenPlus —
   * f(x) = b + k√x (узел A при x = 0).
   */
  vid: 'pokazSdvig' | 'logSdvig' | 'giperbolaA' | 'pokazPlus' | 'logPlus' | 'korenPlus';
  A: [number, number];
  B: [number, number];
  /** Спрашивают f(x0) … */
  x0?: number;
  /** … или x, при котором f(x) = y0. */
  y0?: number;
}

interface Koef {
  a: number;
  b: number;
  k: number;
}

/** Коэффициенты по двум узлам; у logSdvig и pokazPlus один узел особый (y = 0 или x = 0). */
function koefDvaUzla(p: DvaUzla): Koef {
  const [ax, ay] = p.A;
  const [bx, by] = p.B;
  if (p.vid === 'pokazSdvig') {
    const a = (by / ay) ** (1 / (bx - ax));
    const b = Math.round((Math.log(ay) / Math.log(a) - ax) * 1e6) / 1e6;
    return { a, b, k: 1 };
  }
  if (p.vid === 'logSdvig') {
    /* Узел A на оси: logₐ(x_A + b) = 0 ⇒ b = 1 − x_A; a^(y_B) = x_B + b. */
    if (ay !== 0) throw new Error('dvaUzla: у логарифма узел A — на оси Ox');
    const b = 1 - ax;
    const a = (bx + b) ** (1 / by);
    return { a, b, k: 1 };
  }
  if (p.vid === 'giperbolaA') {
    const a = round9((by * bx - ay * ax) / (ay - by));
    return { a, b: 0, k: round9(ay * (ax + a)) };
  }
  if (p.vid === 'logPlus') {
    /* Узел A при x = 1: logₐ1 = 0 ⇒ c = y_A (хранится в b); logₐ x_B = y_B − c. */
    if (ax !== 1) throw new Error('dvaUzla: у c + logₐ x узел A — при x = 1');
    const a = bx ** (1 / (by - ay));
    return { a, b: ay, k: 1 };
  }
  if (p.vid === 'korenPlus') {
    /* Узел A при x = 0: b = y_A; k = (y_B − b)/√x_B. */
    if (ax !== 0) throw new Error('dvaUzla: у b + k√x узел A — при x = 0');
    return { a: 1, b: ay, k: round9((by - ay) / Math.sqrt(bx)) };
  }
  /* pokazPlus: узел A на оси Oy: a⁰ + b = y_A ⇒ b = y_A − 1; a^(x_B) = y_B − b. */
  if (ax !== 0) throw new Error('dvaUzla: у aˣ + b узел A — на оси Oy');
  const b = ay - 1;
  const a = (by - b) ** (1 / bx);
  return { a, b, k: 1 };
}

function znachenie(vid: DvaUzla['vid'], c: Koef, x: number): number {
  if (vid === 'pokazSdvig') return c.a ** (x + c.b);
  if (vid === 'logSdvig') return Math.log(x + c.b) / Math.log(c.a);
  if (vid === 'giperbolaA') return c.k / (x + c.a);
  if (vid === 'logPlus') return c.b + Math.log(x) / Math.log(c.a);
  if (vid === 'korenPlus') return x < 0 ? Number.NaN : c.b + c.k * Math.sqrt(x);
  return c.a ** x + c.b;
}

function argument(vid: DvaUzla['vid'], c: Koef, y: number): number {
  if (vid === 'pokazSdvig') return Math.log(y) / Math.log(c.a) - c.b;
  if (vid === 'logSdvig') return c.a ** y - c.b;
  if (vid === 'giperbolaA') return c.k / y - c.a;
  if (vid === 'logPlus') return c.a ** (y - c.b);
  if (vid === 'korenPlus') return ((y - c.b) / c.k) ** 2;
  return Math.log(y - c.b) / Math.log(c.a);
}

/** Основание в TeX: 2, 0,5, √2, 1/3. */
function osnTex(a: number): string {
  if (celoe(a)) return dec(a);
  if (celoe(a * a)) return `\\sqrt{${dec(round9(a * a))}}`;
  if (celoe(1 / a)) return `\\dfrac{1}{${dec(round9(1 / a))}}`;
  return dec(a);
}

/**
 * Функция заданного вида через два узла сетки: найти коэффициенты и
 * значение f(x₀) за рамкой или x, при котором f(x) = y₀. Подвох у
 * каждого вида свой: у показательной со сдвигом — делить значения, у
 * логарифма — узел на оси даёт сдвиг, у гиперболы — сдвиг в знаменателе,
 * у aˣ + b — узел на оси Oy даёт b.
 */
export function dvaUzla(p: DvaUzla, pechat: Pechat = {}): GrafikTask {
  const c = koefDvaUzla(p);
  const osnovanie = p.vid !== 'giperbolaA' && p.vid !== 'korenPlus';
  if (
    (osnovanie && (!(c.a > 0) || c.a === 1)) ||
    !Number.isFinite(c.a) ||
    !celoe(c.b) ||
    (p.vid === 'korenPlus' ? !celoe(c.k * 1e4) || c.k === 0 : !celoe(c.k)) ||
    (p.vid === 'giperbolaA' && (c.a === 0 || c.k === 0))
  )
    throw new Error(`dvaUzla: коэффициенты ${JSON.stringify(c)}`);
  for (const [x, y] of [p.A, p.B]) {
    if (Math.abs(znachenie(p.vid, c, x) - y) > 1e-7) throw new Error('dvaUzla: узел не на графике');
  }
  const poZnach = p.x0 !== undefined;
  const otvet = round9(
    Math.round(
      (poZnach ? znachenie(p.vid, c, p.x0 as number) : argument(p.vid, c, p.y0 as number)) * 1e6,
    ) / 1e6,
  );
  if (!Number.isFinite(otvet) || !celoe(otvet * 1e4)) throw new Error(`dvaUzla: ответ ${otvet}`);
  /* Второй счёт: бисекция по самой кривой между узлами и далеко за ними. */
  const f = (x: number) => znachenie(p.vid, c, x);
  let proverka: number;
  if (poZnach) {
    proverka = f(p.x0 as number);
  } else {
    const y0 = p.y0 as number;
    const lo0 =
      p.vid === 'logSdvig'
        ? -c.b + 1e-12
        : p.vid === 'logPlus' || p.vid === 'korenPlus'
          ? 1e-12
          : p.vid === 'giperbolaA'
            ? y0 * c.k > 0
              ? -c.a + 1e-12
              : -1e4
            : -60;
    const hi0 =
      p.vid === 'giperbolaA'
        ? y0 * c.k > 0
          ? 1e4
          : -c.a - 1e-12
        : p.vid === 'logSdvig' || p.vid === 'logPlus' || p.vid === 'korenPlus'
          ? 1e7
          : 60;
    let lo = lo0;
    let hi = hi0;
    const g = (x: number) => f(x) - y0;
    const rastet = g(hi) > g(lo);
    for (let i = 0; i < 300; i += 1) {
      const m = (lo + hi) / 2;
      if (g(m) < 0 === rastet) lo = m;
      else hi = m;
    }
    proverka = (lo + hi) / 2;
  }
  const xs = [p.A[0], p.B[0], 0];
  const ys = [p.A[1], p.B[1], 0];
  const win = {
    xmin: Math.min(...xs) - 3,
    xmax: Math.max(...xs) + 3,
    ymin: Math.min(...ys) - 2,
    ymax: Math.max(...ys) + 2,
  };
  if (p.vid === 'giperbolaA') {
    win.xmin = Math.min(win.xmin, -c.a - 3);
    win.xmax = Math.max(win.xmax, -c.a + 3);
    win.ymin = Math.min(win.ymin, -4);
    win.ymax = Math.max(win.ymax, 4);
  }
  if (p.vid === 'pokazPlus') {
    win.ymin = Math.min(win.ymin, c.b - 1);
    win.ymax = Math.max(win.ymax, c.b + 1);
  }
  if (poZnach ? !zaOknom(p.x0 as number, otvet, win) : !zaOknom(otvet, p.y0 as number, win))
    throw new Error('dvaUzla: ответ читается по рисунку');
  const kriv =
    p.vid === 'pokazSdvig'
      ? { type: 'expo', a: c.a, c: c.b, d: 0, k: 1 }
      : p.vid === 'logSdvig'
        ? { type: 'loga', a: c.a, c: c.b, d: 0, k: 1 }
        : p.vid === 'giperbolaA'
          ? { type: 'rational', k: c.k, a: c.a, b: 0 }
          : p.vid === 'logPlus'
            ? { type: 'loga', a: c.a, c: 0, d: c.b, k: 1 }
            : p.vid === 'korenPlus'
              ? { type: 'sqrt', a: c.k, c: 0, d: c.b }
              : { type: 'expo', a: c.a, c: 0, d: c.b, k: 1 };
  const scene = (uchitel: boolean) => ({
    window: win,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    labelRules: 'strict',
    axisLabels: 'minimal',
    curves: [{ ...kriv, color: 'lineA', label: 'y = f(x)' }],
    points: [p.A, p.B].map(([x, y]) => ({ x, y, style: 'solid', color: 'lineA', label: null })),
    shapes: uchitel ? napravlyayushchie([p.A, p.B]) : [],
    alt: 'График функции с двумя отмеченными точками в узлах сетки',
  });
  const kv = (t: T) => `(${dec(t[0])};\\ ${dec(t[1])})`;
  const [ax, ay] = p.A;
  const [bx, by] = p.B;
  const vidTex =
    p.vid === 'pokazSdvig'
      ? 'a^{x+b}'
      : p.vid === 'logSdvig'
        ? '\\log_a(x+b)'
        : p.vid === 'giperbolaA'
          ? '\\dfrac{k}{x+a}'
          : p.vid === 'logPlus'
            ? 'c+\\log_a x'
            : p.vid === 'korenPlus'
              ? 'b+k\\sqrt{x}'
              : 'a^x+b';
  const sdvig = (b: number) => (b === 0 ? '' : b < 0 ? `-${dec(-b)}` : `+${dec(b)}`);
  const fTex =
    p.vid === 'pokazSdvig'
      ? `${osnTex(c.a).includes('frac') || osnTex(c.a).includes('sqrt') ? `\\left(${osnTex(c.a)}\\right)` : osnTex(c.a)}^{x${sdvig(c.b)}}`
      : p.vid === 'logSdvig'
        ? `\\log_{${osnTex(c.a)}}(x${sdvig(c.b)})`
        : p.vid === 'giperbolaA'
          ? `\\dfrac{${dec(c.k)}}{x${sdvig(c.a)}}`
          : p.vid === 'logPlus'
            ? `${dec(c.b)}+\\log_{${osnTex(c.a)}} x`.replace(/^0\+/, '')
            : p.vid === 'korenPlus'
              ? `${dec(c.b)}${c.k < 0 ? '-' : '+'}${Math.abs(c.k) === 1 ? '' : dec(Math.abs(c.k))}\\sqrt{x}`
              : `${osnTex(c.a).includes('frac') || osnTex(c.a).includes('sqrt') ? `\\left(${osnTex(c.a)}\\right)` : osnTex(c.a)}^x${sdvig(c.b)}`;
  const sistema =
    p.vid === 'pokazSdvig'
      ? [
          `$a^{${dec(ax)}+b}=${dec(ay)}$ и $a^{${dec(bx)}+b}=${dec(by)}$. Делим второе на первое: $a^{${dec(round9(bx - ax))}}=${dec(round9(by / ay))}$, $a=${osnTex(c.a)}$.`,
          `Из первого: $${osnTex(c.a)}^{${dec(ax)}+b}=${dec(ay)}$, откуда $b=${dec(c.b)}$.`,
        ]
      : p.vid === 'logSdvig'
        ? [
            `Точка $${kv(p.A)}$ на оси: $\\log_a(${dec(ax)}+b)=0$, значит $${dec(ax)}+b=1$ и $b=${dec(c.b)}$.`,
            `Вторая точка: $\\log_a(${dec(bx)}${sdvig(c.b)})=${dec(by)}$, то есть $a^{${dec(by)}}=${dec(bx + c.b)}$ и $a=${osnTex(c.a)}$.`,
          ]
        : p.vid === 'giperbolaA'
          ? [
              `$\\dfrac{k}{${dec(ax)}+a}=${dec(ay)}$ и $\\dfrac{k}{${dec(bx)}+a}=${dec(by)}$, то есть $k=${mn(ay)}(${dec(ax)}+a)=${mn(by)}(${dec(bx)}+a)$.`,
              `Отсюда $a=${dec(c.a)}$, $k=${dec(c.k)}$.`,
            ]
          : p.vid === 'logPlus'
            ? [
                `Точка $${kv(p.A)}$: $\\log_a 1=0$, поэтому $c=${dec(c.b)}$.`,
                `Вторая точка: $${dec(c.b)}+\\log_a ${dec(bx)}=${dec(by)}$, то есть $\\log_a ${dec(bx)}=${dec(round9(by - c.b))}$ и $a=${osnTex(c.a)}$.`,
              ]
            : p.vid === 'korenPlus'
              ? [
                  `Точка $${kv(p.A)}$: $\\sqrt0=0$, поэтому $b=${dec(c.b)}$.`,
                  `Вторая точка: $${dec(c.b)}+k\\sqrt{${dec(bx)}}=${dec(by)}$, то есть $${dec(Math.sqrt(bx))}k=${dec(round9(by - c.b))}$ и $k=${dec(c.k)}$.`,
                ]
          : [
              `Точка $${kv(p.A)}$ на оси $Oy$: $a^0+b=${dec(ay)}$, значит $b=${dec(c.b)}$.`,
              `Вторая точка: $a^{${dec(bx)}}${sdvig(c.b)}=${dec(by)}$, то есть $a^{${dec(bx)}}=${dec(round9(by - c.b))}$ и $a=${osnTex(c.a)}$.`,
            ];
  const otvetStr = poZnach
    ? `$f(${dec(p.x0 as number)})=${dec(otvet)}$.`
    : `$${fTex}=${dec(p.y0 as number)}$ при $x=${dec(otvet)}$.`;
  const shagi = [
    { title: 'Читаем точки', lines: [`График проходит через узлы сетки $${kv(p.A)}$ и $${kv(p.B)}$.`] },
    { title: 'Коэффициенты', lines: [...sistema, `$f(x)=${fTex}$.`] },
    { title: poZnach ? 'Значение функции' : 'Решаем уравнение', lines: [otvetStr] },
  ];
  const hints = [
    {
      question: 'Что дают отмеченные точки?',
      options: [
        'Два уравнения на коэффициенты',
        'Сразу значение в нужной точке',
        'Только знак коэффициента',
      ],
      correct: 0,
      comment: 'Координаты узла подставляем в формулу функции.',
    },
    {
      question: 'Какая формула у функции?',
      options: bezPovtorov([`$f(x)=${fTex}$`, `$f(x)=${dec(c.a)}x${sdvig(c.b)}$`, `$f(x)=${vidTex}$ при $a=1$`]),
      correct: 0,
    },
  ];
  return {
    uslovie: `На рисунке изображён график функции $f(x)=${vidTex}$. ${poZnach ? `Найдите $f(${dec(p.x0 as number)})$.` : `Найдите значение $x$, при котором $f(x)=${dec(p.y0 as number)}$.`}`,
    otvet,
    proverka,
    svg: risuy(scene(false), pechat),
    svgUchitel: risuy(scene(true), pechat),
    points: [p.A, p.B].map(([x, y]) => ({ x, y })),
    shagi,
    hints,
  };
}

/* ── Партия 5 (варианты 25–30) ──────────────────────────────────── */

export interface DvePryamye {
  /** Две точки первой прямой — узлы сетки. */
  P1: [number, number];
  P2: [number, number];
  /** Две точки второй прямой — узлы сетки. */
  Q1: [number, number];
  Q2: [number, number];
  /** Что спрашивают: абсциссу или ординату точки пересечения. */
  ask: 'x0' | 'y0';
}

/**
 * Две прямые через узлы сетки пересекаются в точке A(x₀; y₀) вне узлов
 * (часто — за рамкой). Найти x₀ или y₀. Подвох — точку не прочитать по
 * рисунку: угловые коэффициенты по двум узлам, затем уравнение.
 */
export function dvePryamye(p: DvePryamye, pechat: Pechat = {}): GrafikTask {
  const pryamaya = (A: T, B: T) => {
    if (A[0] === B[0]) throw new Error('dvePryamye: вертикальная прямая');
    const k = round9((B[1] - A[1]) / (B[0] - A[0]));
    return { k, b: round9(A[1] - k * A[0]) };
  };
  const f = pryamaya(p.P1, p.P2);
  const g = pryamaya(p.Q1, p.Q2);
  if (Math.abs(f.k - g.k) < 1e-9) throw new Error('dvePryamye: прямые параллельны');
  const x0 = round9((g.b - f.b) / (f.k - g.k));
  const y0 = round9(f.k * x0 + f.b);
  const otvet = p.ask === 'x0' ? x0 : y0;
  if (!celoe(otvet * 1e4)) throw new Error(`dvePryamye: ответ ${otvet}`);
  if (celoe(x0) && celoe(y0)) throw new Error('dvePryamye: точка пересечения — узел, читается по рисунку');
  /* Второй счёт: бисекция по разности прямых. */
  const h = (x: number) => f.k * x + f.b - (g.k * x + g.b);
  let lo = -1e4;
  let hi = 1e4;
  for (let i = 0; i < 300; i += 1) {
    const m = (lo + hi) / 2;
    if (Math.sign(h(m)) === Math.sign(h(lo))) lo = m;
    else hi = m;
  }
  const xb = (lo + hi) / 2;
  const proverka = p.ask === 'x0' ? xb : f.k * xb + f.b;
  const pts = [p.P1, p.P2, p.Q1, p.Q2];
  const xs = [...pts.map((t) => t[0]), 0];
  const ys = [...pts.map((t) => t[1]), 0];
  const win = {
    xmin: Math.min(...xs) - 2,
    xmax: Math.max(...xs) + 2,
    ymin: Math.min(...ys) - 2,
    ymax: Math.max(...ys) + 2,
  };
  const scene = (uchitel: boolean) => ({
    window: win,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    labelRules: 'strict',
    axisLabels: 'minimal',
    curves: [
      { type: 'line', k: f.k, b: f.b, color: 'lineA', label: 'y = f(x)' },
      { type: 'line', k: g.k, b: g.b, color: 'lineB', label: 'y = g(x)' },
    ],
    points: [
      ...[p.P1, p.P2].map(([x, y]) => ({ x, y, style: 'solid', color: 'lineA', label: null })),
      ...[p.Q1, p.Q2].map(([x, y]) => ({ x, y, style: 'solid', color: 'lineB', label: null })),
    ],
    shapes: uchitel ? napravlyayushchie(pts) : [],
    alt: 'Графики двух линейных функций, на каждом отмечены две точки в узлах сетки',
  });
  const kv = (t: T) => `(${dec(t[0])};\\ ${dec(t[1])})`;
  const lin = (c: { k: number; b: number }) =>
    `${c.k === 1 ? '' : c.k === -1 ? '-' : dec(c.k)}x${c.b === 0 ? '' : c.b < 0 ? `-${dec(-c.b)}` : `+${dec(c.b)}`}`;
  const koef = (A: T, B: T, c: { k: number; b: number }, imya: string) =>
    `$k=\\dfrac{${dec(B[1])}-${mn(A[1])}}{${dec(B[0])}-${mn(A[0])}}=${dec(c.k)}$, $b=${dec(A[1])}-${mn(c.k)}\\cdot${mn(A[0])}=${dec(c.b)}$: $${imya}(x)=${lin(c)}$.`;
  const shagi = [
    {
      title: 'Читаем точки',
      lines: [`Первая прямая проходит через $${kv(p.P1)}$ и $${kv(p.P2)}$, вторая — через $${kv(p.Q1)}$ и $${kv(p.Q2)}$.`],
    },
    { title: 'Уравнения прямых', lines: [koef(p.P1, p.P2, f, 'f'), koef(p.Q1, p.Q2, g, 'g')] },
    {
      title: 'Точка пересечения',
      lines: [
        `$${lin(f)}=${lin(g)}$, откуда $x_0=${dec(x0)}$.`,
        ...(p.ask === 'y0' ? [`$y_0=f(${dec(x0)})=${dec(y0)}$.`] : []),
      ],
    },
  ];
  const hints = [
    {
      question: 'Как найти точку пересечения, если её не видно на рисунке?',
      options: ['Составить уравнения прямых и приравнять', 'Продолжить прямые на глаз', 'Взять ближайший узел'],
      correct: 0,
    },
    {
      question: 'Чему равен угловой коэффициент первой прямой?',
      options: bezPovtorov([`$${dec(f.k)}$`, `$${dec(round9(1 / f.k))}$`, `$${dec(-f.k)}$`]),
      correct: 0,
      comment: 'Отношение приращения ординаты к приращению абсциссы.',
    },
  ];
  return {
    uslovie:
      p.ask === 'y0'
        ? 'На рисунке изображены графики двух функций вида $f(x)=kx+b$, которые пересекаются в точке $A(x_0;\\ y_0)$. Найдите $y_0$.'
        : 'На рисунке изображены графики двух линейных функций. Найдите абсциссу точки пересечения графиков.',
    otvet,
    proverka,
    svg: risuy(scene(false), pechat),
    svgUchitel: risuy(scene(true), pechat),
    points: pts.map(([x, y]) => ({ x, y })),
    shagi,
    hints,
  };
}
