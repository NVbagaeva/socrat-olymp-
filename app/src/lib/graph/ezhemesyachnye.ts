/**
 * Шаблоны раздела «Ежемесячные варианты» для задания №12: те же
 * рисунки движка №12 и тот же разбор (точки в узлах сетки →
 * коэффициенты → ответ), что у шаблонов вариантов повышенной
 * сложности (povyshennye.ts). В наборы, тренажёр и генератор №12 не
 * входят.
 *
 * Модуль-кривая |ax² + bx + c| регистрируется здесь же штатным
 * registerCurve — тело рендерера не меняется.
 */

import { registerCurve } from './renderer.js';
import './families/loga.js';
import './families/quadratic.js';
import './families/sqrt.js';
import { asymptotes, sample, verticalAsymptote } from './families/shared.js';
import {
  celoe,
  dec,
  mn,
  mnogochlen,
  napravlyayushchie,
  nod,
  oknoPo,
  risuy,
  round9,
  skobka,
  zaOknom,
  type GrafikTask,
  type Pechat,
  type T,
} from './povyshennye';

registerCurve(
  'absQuadratic',
  (curve: { a: number; b: number; c: number }, win: { xmin: number; xmax: number }) =>
    sample(
      (x: number) => Math.abs(curve.a * x * x + curve.b * x + curve.c),
      win.xmin,
      win.xmax,
      900,
    ),
);

const kv = (t: T) => `(${dec(t[0])};\\ ${dec(t[1])})`;
const OSI = { labelX: 'x', labelY: 'y', origin: '0' };

/* ── Парабола и прямая y = kx: вторая точка пересечения ─────────── */

export interface ParabolaKx {
  /** Три узла параболы g(x) = ax² + bx + c. */
  uzly: [T, T, T];
  /** Узел прямой f(x) = kx (через начало координат); он же — точка A на параболе. */
  A: T;
}

/**
 * f(x) = ax² + bx + c и g(x) = kx пересекаются в A (узел сетки) и B не в
 * узле. a, b, c — по трём узлам; k — по A; x_B = c/(a·x_A) по теореме
 * Виета. Подвох — B по клеткам не прочесть, а A — не ответ.
 */
export function parabolaKx(par: ParabolaKx, pechat: Pechat = {}): GrafikTask {
  const [[x1, y1], [x2, y2], [x3, y3]] = par.uzly;
  /* Коэффициенты по трём точкам (интерполяция Лагранжа). */
  const a = round9(
    y1 / ((x1 - x2) * (x1 - x3)) + y2 / ((x2 - x1) * (x2 - x3)) + y3 / ((x3 - x1) * (x3 - x2)),
  );
  const b = round9((y2 - y1) / (x2 - x1) - a * (x1 + x2));
  const c = round9(y1 - a * x1 * x1 - b * x1);
  const [ax, ay] = par.A;
  const k = round9(ay / ax);
  if (Math.abs(a * ax * ax + b * ax + c - ay) > 1e-9)
    throw new Error('parabolaKx: A не на параболе');
  const otvet = round9(c / (a * ax));
  if (!celoe(otvet * 1e4) || otvet === ax) throw new Error(`parabolaKx: x_B = ${otvet}`);
  /* Второй счёт: корни ax² + (b − k)x + c = 0 по дискриминанту. */
  const B2 = b - k;
  const D = B2 * B2 - 4 * a * c;
  const korni = [(-B2 - Math.sqrt(D)) / (2 * a), (-B2 + Math.sqrt(D)) / (2 * a)];
  const proverka = korni.reduce((s, x) => (Math.abs(x - ax) > Math.abs(s - ax) ? x : s));
  const win = oknoPo([...par.uzly, par.A], a > 0);
  /* B может быть на рисунке, но не в узле сетки: по клеткам его не прочесть. */
  if (celoe(otvet)) throw new Error('parabolaKx: B в узле сетки');
  const scene = (uchitel: boolean) => ({
    window: win,
    grid: { step: 1, show: true },
    axes: OSI,
    labelRules: 'strict',
    axisLabels: 'minimal',
    curves: [
      { type: 'quadratic', a, b, c, color: 'lineA', label: 'y = f(x)' },
      { type: 'line', k, b: 0, color: 'lineB', label: 'y = g(x)' },
    ],
    points: [
      ...par.uzly.map(([x, y]) => ({ x, y, style: 'solid', color: 'lineA', label: null })),
      { x: ax, y: ay, style: 'solid', color: 'lineB', label: 'A' },
      { x: otvet, y: k * otvet, style: 'solid', color: 'lineB', label: 'B' },
    ],
    shapes: uchitel ? napravlyayushchie([...par.uzly, par.A]) : [],
    alt: 'Графики параболы f(x) = ax² + bx + c и прямой g(x) = kx, пересекающихся в точке A',
  });
  const fTex = mnogochlen(a, b, c);
  const shagi = [
    {
      title: 'Читаем точки',
      lines: [
        `Парабола проходит через $${par.uzly.map(kv).join('$, $')}$; прямая — через начало координат и $A${kv(par.A)}$.`,
      ],
    },
    {
      title: 'Прямая',
      lines: [`$g(x)=kx$, $k=\\dfrac{${dec(ay)}}{${dec(ax)}}=${dec(k)}$.`],
    },
    {
      title: 'Парабола',
      lines: [
        `$f(0)=c$, ${par.uzly.some(([x]) => x === 0) ? `по точке на оси $Oy$: $c=${dec(c)}$` : `$c=${dec(c)}$`}. По двум другим точкам — система на $a$ и $b$: $a=${dec(a)}$, $b=${dec(b)}$, $f(x)=${fTex}$.`,
      ],
    },
    {
      title: 'Вторая точка пересечения',
      lines: [
        `$${fTex}=${dec(k)}x$, то есть $${mnogochlen(a, round9(b - k), c)}=0$.`,
        `Один корень известен — $x_A=${dec(ax)}$. По теореме Виета $x_A\\cdot x_B=\\dfrac{${dec(c)}}{${dec(a)}}$, откуда $x_B=\\dfrac{${dec(c)}}{${dec(a)}\\cdot${mn(ax)}}=${dec(otvet)}$.`,
      ],
    },
  ];
  const hints = [
    {
      question: 'Чему равен $c$?',
      options: [`$${dec(c)}$ — значение $f(0)$`, `$${dec(k)}$`, '$0$'],
      correct: 0,
    },
    {
      question: 'Какое уравнение задаёт точки пересечения?',
      options: [
        `$${mnogochlen(a, round9(b - k), c)}=0$`,
        `$${fTex}=0$`,
        `$${mnogochlen(a, round9(b + k), c)}=0$`,
      ],
      correct: 0,
    },
    {
      question: 'Как быстро найти второй корень?',
      options: [
        `По теореме Виета: $x_A\\cdot x_B=\\dfrac{c}{a}$`,
        'Он равен абсциссе вершины',
        `Он равен $${dec(ax)}$`,
      ],
      correct: 0,
    },
  ];
  return {
    uslovie: `На рисунке изображены графики функций $f(x)=ax^2+bx+c$ и $g(x)=kx$, которые пересекаются в точках $A$ и $B$. Найдите абсциссу точки $B$.`,
    otvet,
    proverka,
    svg: risuy(scene(false), pechat),
    svgUchitel: risuy(scene(true), pechat),
    points: [...par.uzly, par.A].map(([x, y]) => ({ x, y })),
    shagi,
    hints,
  };
}

/* ── Модуль квадратного трёхчлена: найти c ──────────────────────── */

export interface ModulParaboly {
  /** Нули трёхчлена — узлы на оси Ox. */
  x1: number;
  x2: number;
  /** Высота «перевёрнутой» вершины |f(m)| — узел (m; h), m = (x₁ + x₂)/2. */
  h: number;
}

/**
 * y = |ax² + bx + c|: по нулям x₁, x₂ и вершине (m; h) модуль |a|, а знак
 * a — по условию c > 0: c = a·x₁x₂. Подвох — знак a по рисунку не
 * виден (кривая всегда выше оси), и f(0) за рамкой.
 */
export function modulParaboly(p: ModulParaboly, pechat: Pechat = {}): GrafikTask {
  const { x1, x2, h } = p;
  const m = (x1 + x2) / 2;
  if (!celoe(m) || x1 * x2 <= 0) throw new Error('modulParaboly: узлы');
  const proizv = (m - x1) * (m - x2);
  const absA = Math.abs(h / proizv);
  const a = Math.sign(x1 * x2) * absA;
  const b = round9(-a * (x1 + x2));
  const c = round9(a * x1 * x2);
  const otvet = c;
  if (!(c > 0) || !celoe(c * 1e4)) throw new Error(`modulParaboly: c = ${c}`);
  /* Второй счёт: |f| в вершине и нулях по формуле с a, b, c; c = f(0) с a > 0 или a < 0. */
  const proverka = [absA, -absA]
    .map((aa) => aa * x1 * x2)
    .find((cc) => cc > 0 && Math.abs(Math.abs((cc / (x1 * x2)) * (m - x1) * (m - x2)) - h) < 1e-9)!;
  const uzly: T[] = [
    [x1, 0],
    [x2, 0],
    [m, h],
  ];
  /* Окно по узлам, но по высоте — только до h + 3: |f(0)| = c за рамкой. */
  const win = { ...oknoPo(uzly, true), ymin: -2, ymax: h + 3 };
  if (!zaOknom(0, c, win)) throw new Error('modulParaboly: |f(0)| читается по рисунку');
  const scene = (uchitel: boolean) => ({
    window: win,
    grid: { step: 1, show: true },
    axes: OSI,
    labelRules: 'strict',
    axisLabels: 'minimal',
    curves: [{ type: 'absQuadratic', a, b, c, color: 'lineA', label: 'y = |f(x)|' }],
    points: uzly.map(([x, y]) => ({ x, y, style: 'solid', color: 'lineA', label: null })),
    shapes: uchitel ? napravlyayushchie(uzly) : [],
    alt: 'График функции y = |ax² + bx + c| с нулями и «перевёрнутой» вершиной в узлах сетки',
  });
  const shagi = [
    {
      title: 'Читаем точки',
      lines: [
        `График касается оси $Ox$ в точках $${dec(x1)}$ и $${dec(x2)}$ — это нули трёхчлена; между ними часть параболы отражена вверх, её вершина — $${kv([m, h])}$.`,
      ],
    },
    {
      title: 'Трёхчлен через нули',
      lines: [
        `$f(x)=a${skobka(x1)}${skobka(x2)}$. В вершине $|f(${dec(m)})|=|a|\\cdot|${mn(m - x1)}\\cdot${mn(m - x2)}|=${dec(Math.abs(proizv))}|a|=${dec(h)}$, $|a|=${dec(absA)}$.`,
      ],
    },
    {
      title: 'Знак и c',
      lines: [
        `$c=f(0)=a\\cdot${mn(-x1)}\\cdot${mn(-x2)}=${dec(x1 * x2)}a$. По условию $c>0$, значит, $a=${dec(a)}$ и $c=${dec(x1 * x2)}\\cdot${mn(a)}=${dec(c)}$.`,
      ],
    },
  ];
  const hints = [
    {
      question: 'Где нули трёхчлена $ax^2+bx+c$?',
      options: [`$${dec(x1)}$ и $${dec(x2)}$`, `$${dec(m)}$`, 'Их нет: график выше оси'],
      correct: 0,
    },
    {
      question: 'Чему равен $|a|$?',
      options: [`$${dec(absA)}$`, `$${dec(h)}$`, `$${dec(h * Math.abs(proizv))}$`],
      correct: 0,
      comment: `$|a|\\cdot${dec(Math.abs(proizv))}=${dec(h)}$.`,
    },
    {
      question: 'Как выбрать знак $a$?',
      options: [
        `По условию $c>0$: $c=${dec(x1 * x2)}a$`,
        'По рисунку: ветви вверх',
        'Знак не важен',
      ],
      correct: 0,
    },
  ];
  return {
    uslovie: `На рисунке изображён график функции $y=|ax^2+bx+c|$. Найдите $c$, если известно, что $c>0$.`,
    otvet,
    proverka,
    svg: risuy(scene(false), pechat),
    svgUchitel: risuy(scene(true), pechat),
    points: uzly.map(([x, y]) => ({ x, y })),
    shagi,
    hints,
  };
}

/* ── Корень и прямая общего вида: ордината точки пересечения ────── */

export interface KorenObshchayaPryamaya {
  /** Узел графика f(x) = p√x (x — точный квадрат). */
  G: T;
  /** Два узла прямой g(x) = kx + b. */
  L1: T;
  L2: T;
}

/**
 * f(x) = p√x и g(x) = kx + b пересекаются в A вне рисунка. Замена t = √x:
 * kt² − pt + b = 0, положительный корень t, ордината A = p·t. Подвох —
 * ответ — ордината, а не абсцисса, и корень t < 0 посторонний.
 */
export function korenObshchayaPryamaya(
  par: KorenObshchayaPryamaya,
  pechat: Pechat = {},
): GrafikTask {
  const [gx, gy] = par.G;
  const s = Math.sqrt(gx);
  if (!celoe(s) || gx <= 0) throw new Error('korenObshchayaPryamaya: узел G');
  const pp = round9(gy / s);
  const [x1, y1] = par.L1;
  const [x2, y2] = par.L2;
  const k = (y2 - y1) / (x2 - x1);
  const b = y1 - k * x1;
  /* k t² − p t + b = 0. */
  const D = pp * pp - 4 * k * b;
  if (D < 0) throw new Error('korenObshchayaPryamaya: не пересекаются');
  const ts = [(pp - Math.sqrt(D)) / (2 * k), (pp + Math.sqrt(D)) / (2 * k)].filter((t) => t > 0);
  if (ts.length !== 1) throw new Error('korenObshchayaPryamaya: нужен ровно один положительный t');
  /* Дроби вроде 2/3 в double не точные — округляем до миллионных. */
  const r6 = (x: number) => Math.round(x * 1e6) / 1e6;
  const t = r6(ts[0]!);
  const otvet = r6(pp * t);
  if (!celoe(otvet * 1e4)) throw new Error(`korenObshchayaPryamaya: y_A = ${otvet}`);
  /* Второй счёт: бисекция p√x − kx − b на (0; 10000). */
  const hf = (x: number) => pp * Math.sqrt(x) - k * x - b;
  let lo = 1e-9;
  let hi = 10000;
  const znak0 = Math.sign(hf(lo));
  for (let i = 0; i < 300; i += 1) {
    const c = (lo + hi) / 2;
    if (Math.sign(hf(c)) === znak0) lo = c;
    else hi = c;
  }
  const proverka = round9(pp * Math.sqrt((lo + hi) / 2));
  const win = oknoPo([par.G, par.L1, par.L2, [0, 0]], true);
  if (!zaOknom(t * t, otvet, win)) throw new Error('korenObshchayaPryamaya: A читается по рисунку');
  const drob = (ch: number, zn: number) => {
    const g = nod(Math.abs(ch), Math.abs(zn)) || 1;
    const [c0, z0] = [ch / g, zn / g];
    return z0 === 1 ? dec(c0) : `${c0 < 0 ? '-' : ''}\\dfrac{${Math.abs(c0)}}{${z0}}`;
  };
  const kTex = celoe(k * 1e4) ? dec(round9(k)) : drob(y2 - y1, x2 - x1);
  /* b = (y₁(x₂ − x₁) − (y₂ − y₁)x₁)/(x₂ − x₁) — дробью, если не конечная десятичная. */
  const bCh = y1 * (x2 - x1) - (y2 - y1) * x1;
  const bTex = celoe(b * 1e4) ? dec(round9(b)) : drob(bCh, x2 - x1);
  const scene = (uchitel: boolean) => ({
    window: win,
    grid: { step: 1, show: true },
    axes: OSI,
    labelRules: 'strict',
    axisLabels: 'minimal',
    curves: [
      { type: 'sqrt', a: pp, c: 0, d: 0, color: 'lineA', label: 'y = f(x)' },
      { type: 'line', k: round9(k), b: round9(b), color: 'lineB', label: 'y = g(x)' },
    ],
    points: [
      { x: 0, y: 0, style: 'solid', color: 'lineA', label: null },
      { x: gx, y: gy, style: 'solid', color: 'lineA', label: null },
      { x: x1, y: y1, style: 'solid', color: 'lineB', label: null },
      { x: x2, y: y2, style: 'solid', color: 'lineB', label: null },
    ],
    shapes: uchitel ? napravlyayushchie([par.G, par.L1, par.L2]) : [],
    alt: 'Графики функции f(x) = a√x и прямой g(x) = kx + b, пересекающихся в точке A за рамкой рисунка',
  });
  const shagi = [
    {
      title: 'Читаем точки',
      lines: [
        `График $f$ проходит через $(0;\\ 0)$ и $${kv(par.G)}$, прямая — через $${kv(par.L1)}$ и $${kv(par.L2)}$.`,
      ],
    },
    {
      title: 'Коэффициенты',
      lines: [
        `$a\\sqrt{${dec(gx)}}=${dec(gy)}$, $a=${dec(pp)}$, $f(x)=${pp === 1 ? '' : dec(pp)}\\sqrt{x}$.`,
        `$k=\\dfrac{${dec(y2)}-${mn(y1)}}{${dec(x2)}-${mn(x1)}}=${kTex}$, $b=${dec(y1)}-${kTex}\\cdot${mn(x1)}=${bTex}$.`,
      ],
    },
    {
      title: 'Точка пересечения',
      lines: [
        `$${pp === 1 ? '' : dec(pp)}\\sqrt{x}=${kTex}x${b < 0 ? '' : '+'}${bTex}$. Обозначим $t=\\sqrt{x}\\ge0$: $${kTex}t^2-${pp === 1 ? '' : dec(pp)}t${b < 0 ? '' : '+'}${bTex}=0$.`,
        `Корни: $t=${dec(t)}$ и $t=${dec(r6((pp - Math.sqrt(D)) / (2 * k)))}<0$ — посторонний.`,
        pp === 1
          ? `Ордината точки $A$: $f(x_A)=\\sqrt{x_A}=t=${dec(otvet)}$.`
          : `Ордината точки $A$: $f(x_A)=${dec(pp)}\\cdot${dec(t)}=${dec(otvet)}$.`,
      ],
    },
  ];
  const hints = [
    {
      question: 'Какая замена удобна в уравнении $f(x)=g(x)$?',
      options: ['$t=\\sqrt{x}$', '$t=x^2$', '$t=kx$'],
      correct: 0,
    },
    {
      question: 'Какой корень $t$ подходит?',
      options: [`$${dec(t)}$`, `$${dec(r6((pp - Math.sqrt(D)) / (2 * k)))}$`, 'оба'],
      correct: 0,
      comment: '$t=\\sqrt{x}$ не бывает отрицательным.',
    },
    {
      question: 'Что спрашивают?',
      options: ['Ординату точки $A$', 'Абсциссу точки $A$', 'Значение $t$'],
      correct: 0,
      comment: `Ордината — значение функции: $f(x_A)=${pp === 1 ? '' : dec(pp)}t$.`,
    },
  ];
  return {
    uslovie: `На рисунке изображены графики функций $f(x)=a\\sqrt{x}$ и $g(x)=kx+b$, которые пересекаются в точке $A$. Найдите ординату точки $A$.`,
    otvet,
    proverka,
    svg: risuy(scene(false), pechat),
    svgUchitel: risuy(scene(true), pechat),
    points: [[0, 0] as T, par.G, par.L1, par.L2].map(([x, y]) => ({ x, y })),
    shagi,
    hints,
  };
}

/* ── b + log_a x: значение в далёкой точке ──────────────────────── */

export interface BLog {
  a: number;
  b: number;
  /** Абсциссы отмеченных узлов — степени a. */
  marks: number[];
  /** Где спрашивают значение. */
  x0: number;
}

/**
 * f(x) = b + log_a x: по точке (1; b) — сдвиг b, по точке (a; b + 1) —
 * основание. Подвох — точка x₀ за рамкой.
 */
export function bLog(p: BLog, pechat: Pechat = {}): GrafikTask {
  const L = (x: number) => Math.log(x) / Math.log(p.a);
  const points: T[] = p.marks.map((x) => [x, round9(p.b + L(x))]);
  if (!points.every(([x, y]) => celoe(x) && celoe(y))) throw new Error('bLog: точки не в узлах');
  const otvet = round9(p.b + L(p.x0));
  const proverka = p.b + Math.log10(p.x0) / Math.log10(p.a);
  const win = {
    xmin: -2,
    xmax: Math.max(...p.marks) + 2,
    ymin: Math.min(-3, Math.min(...points.map((t) => t[1])) - 2),
    ymax: Math.max(...points.map((t) => t[1])) + 2,
  };
  if (!zaOknom(p.x0, otvet, win)) throw new Error('bLog: ответ читается по рисунку');
  const scene = (uchitel: boolean) => ({
    window: win,
    grid: { step: 1, show: true },
    axes: OSI,
    labelRules: 'strict',
    axisLabels: 'minimal',
    curves: [{ type: 'loga', a: p.a, k: 1, c: 0, d: p.b, color: 'lineA', label: 'y = f(x)' }],
    points: points.map(([x, y]) => ({ x, y, style: 'solid', color: 'lineA', label: null })),
    shapes: asymptotes([verticalAsymptote(0, win)]).concat(
      uchitel ? napravlyayushchie(points) : [],
    ),
    alt: 'График функции f(x) = b + logₐ x с отмеченными точками в узлах сетки',
  });
  const n0 = round9(L(p.x0));
  const shagi = [
    {
      title: 'Читаем точки',
      lines: [`На графике отмечены узлы ${points.map((t) => `$${kv(t)}$`).join(', ')}.`],
    },
    {
      title: 'Коэффициенты',
      lines: [
        `$f(1)=b+\\log_a1=b$, по точке $(1;\\ ${dec(p.b)})$: $b=${dec(p.b)}$.`,
        `По точке $(${dec(p.a)};\\ ${dec(p.b + 1)})$: $${dec(p.b)}+\\log_a ${dec(p.a)}=${dec(p.b + 1)}$, $\\log_a ${dec(p.a)}=1$, $a=${dec(p.a)}$.`,
      ],
    },
    {
      title: 'Значение',
      lines: [
        `$f(${dec(p.x0)})=${dec(p.b)}+\\log_{${dec(p.a)}}${dec(p.x0)}=${dec(p.b)}+${dec(n0)}=${dec(otvet)}$.`,
      ],
    },
  ];
  const hints = [
    {
      question: 'Какая точка сразу даёт $b$?',
      options: ['$(1;\\ b)$: $\\log_a 1=0$', 'Точка пересечения с осью $Ox$', 'Любая'],
      correct: 0,
    },
    {
      question: 'Чему равно основание $a$?',
      options: [`$${dec(p.a)}$`, `$${dec(p.a + 1)}$`, `$${dec(p.b + 1)}$`],
      correct: 0,
      comment: `$f(${dec(p.a)})=${dec(p.b)}+1$.`,
    },
    {
      question: `Чему равен $\\log_{${dec(p.a)}}${dec(p.x0)}$?`,
      options: [`$${dec(n0)}$`, `$${dec(n0 + 1)}$`, `$${dec(round9(p.x0 / p.a))}$`],
      correct: 0,
    },
  ];
  return {
    uslovie: `На рисунке изображён график функции $f(x)=b+\\log_a x$. Найдите $f(${dec(p.x0)})$.`,
    otvet,
    proverka,
    svg: risuy(scene(false), pechat),
    svgUchitel: risuy(scene(true), pechat),
    points: points.map(([x, y]) => ({ x, y })),
    shagi,
    hints,
  };
}
