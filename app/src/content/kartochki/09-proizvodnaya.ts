/**
 * Карточки по теории задания №9 «Производная и первообразная».
 *
 * Колода идёт по семи разделам вкладки «Теория» №9
 * (content/theoryProizvodnaya.ts и блок «Понятие производной»
 * content/theoryPonyatie9.ts): понятие производной, геометрический
 * смысл, знак и монотонность, экстремумы, физический смысл, касательная
 * и параллельность, первообразная. `source` — якорь страницы
 * (lib/proizvodnaya/teoriya-yakorya.ts): рамка, таблица или плашка
 * #t9-…, подраздел #z9-…. Всё, что спрашивает колода, в теории №9
 * написано — карточек «добавлено» нет.
 *
 * Рисунки — движок графиков №9 (lib/proizvodnaya/render.ts) в режиме
 * ученика: свои узлы на целой сетке, не задачи банка. Ответ каждой
 * карточки с рисунком scripts/verify_cards пересчитывает по самой
 * кривой — сплайну тех же узлов (знак, нули, смена знака, наклон в
 * точке касания, площадь), а формулы проверяет на случайных функциях.
 */

import type { Kartochka, Koloda, ProverkaFormuly } from '@/lib/kartochki/tipy';
import { figura } from '@/lib/proizvodnaya/krivye';
import { lomanayaY, postroit, type Splayn } from '@/lib/proizvodnaya/spline';
import { stsena } from '@/lib/proizvodnaya/stseny';
import { YAKOR_9 } from '@/lib/proizvodnaya/teoriya-yakorya';
import type { Figura, Uzel } from '@/lib/proizvodnaya/types';

const B = 'база' as const;
const E = 'важно для ЕГЭ' as const;

const R = YAKOR_9.blok;
const TG = '\\operatorname{tg}';

/* ── Счёт для проверок ── */

/** Производная по симметричной разности: для многочленов до 3-й степени — точно до округления. */
const cd = (f: (x: number) => number, x: number, h = 1e-3) => (f(x + h) - f(x - h)) / (2 * h);

/** Вторая производная по второй разности. */
const cd2 = (f: (x: number) => number, x: number, h = 1e-2) =>
  (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);

/** Интеграл по формуле Симпсона: для многочленов до 3-й степени — точно. */
function simpson(f: (x: number) => number, a: number, b: number, n = 200): number {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i += 1) s += (i % 2 === 1 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

/** Случайное число из [lo; hi). */
const ot = (rnd: () => number, lo: number, hi: number) => lo + rnd() * (hi - lo);
/** Ненулевое число из ±[lo; hi). */
const neNol = (rnd: () => number, lo: number, hi: number) =>
  ot(rnd, lo, hi) * (rnd() < 0.5 ? -1 : 1);

/** Кубический многочлен с коэффициентами [a, b, c, d]: ax³ + bx² + cx + d. */
const kub =
  ([a, b, c, d]: readonly number[]) =>
  (x: number) =>
    (a ?? 0) * x ** 3 + (b ?? 0) * x ** 2 + (c ?? 0) * x + (d ?? 0);
const sluchKub = (rnd: () => number) => [0, 0, 0, 0].map(() => ot(rnd, -5, 5));

/* ── Чтение кривой рисунка: по сплайну, а не по замыслу узлов ── */

const ZNAK_EPS = 1e-9;
const znak = (v: number) => (v > ZNAK_EPS ? 1 : v < -ZNAK_EPS ? -1 : 0);

/** Целые точки внутри (a; b), где кривая v(x) меняет знак: «+→−» или «−→+». */
function smenyZnaka(
  v: (x: number) => number,
  a: number,
  b: number,
): { x: number; tip: 'pm' | 'mp' }[] {
  const out: { x: number; tip: 'pm' | 'mp' }[] = [];
  for (let x = Math.ceil(a + 1e-9); x < b - 1e-9; x += 1) {
    if (znak(v(x)) !== 0) continue;
    const l = znak(v(x - 0.25));
    const r = znak(v(x + 0.25));
    if (l > 0 && r < 0) out.push({ x, tip: 'pm' });
    if (l < 0 && r > 0) out.push({ x, tip: 'mp' });
  }
  return out;
}

/** Сколько раз кривая v(x) пересекает уровень c на [a; b] (выборка 1/200 клетки). */
function peresecheniya(v: (x: number) => number, c: number, a: number, b: number): number {
  let n = 0;
  let pred = znak(v(a) - c);
  for (let x = a; x <= b; x += 1 / 200) {
    const z = znak(v(x) - c);
    if (z !== 0 && pred !== 0 && z !== pred) n += 1;
    if (z !== 0) pred = z;
  }
  return n;
}

const krayL = (s: Splayn) => s.xmin;
const krayP = (s: Splayn) => s.xmax;

/* ── Рисунки карточек: свои узлы на целой сетке ── */

/** Касательная вверх: наклон 6/4 в точке 0; кривая выпукла вверх и лежит под касательной. */
const UZLY_VVERH: Uzel[] = [
  { x: -4, y: -6 },
  { x: 0, y: 2, m: 1.5 },
  { x: 4, y: 6 },
];
const KAS_VVERH = { a: [-2, -1] as [number, number], b: [2, 5] as [number, number], x0: 0 };

/** Касательная вниз: наклон −2/8 в точке 0; кривая выпукла вниз и лежит над касательной. */
const UZLY_VNIZ: Uzel[] = [
  { x: -4, y: 2 },
  { x: 0, y: 0, m: -0.25 },
  { x: 4, y: 0 },
];
const KAS_VNIZ = { a: [-4, 1] as [number, number], b: [4, -1] as [number, number], x0: 0 };

/** График f: горка в −2, ямка в 2; отмеченные точки — на подъёмах и на спуске. */
const UZLY_F_METKI: Uzel[] = [
  { x: -6, y: -2 },
  { x: -2, y: 3, m: 0 },
  { x: 2, y: -1, m: 0 },
  { x: 6, y: 4 },
];
const METKI_F = [-5, -3, 0, 1, 4];

/** График f′: нули −4 и 2, между ними ниже оси. */
const UZLY_FP_METKI: Uzel[] = [
  { x: -6, y: 3 },
  { x: -4, y: 0 },
  { x: -1, y: -2, m: 0 },
  { x: 2, y: 0 },
  { x: 6, y: 3 },
];
const METKI_FP = [-5, -3, -2, 1, 4];

/** График f′: нули −3 (−→+), 2 (+→−), 6 (−→+). */
const UZLY_MAX: Uzel[] = [
  { x: -6, y: -2 },
  { x: -3, y: 0 },
  { x: -1, y: 2, m: 0 },
  { x: 2, y: 0 },
  { x: 4, y: -2, m: 0 },
  { x: 6, y: 0 },
  { x: 7, y: 1 },
];

/** График f′: пересекает ось в −4 и 4, в 0 касается оси снизу. */
const UZLY_KASANIE: Uzel[] = [
  { x: -6, y: 2 },
  { x: -4, y: 0 },
  { x: -2, y: -2, m: 0 },
  { x: 0, y: 0, m: 0 },
  { x: 2, y: -2, m: 0 },
  { x: 4, y: 0 },
  { x: 6, y: 2 },
];

/** График f′ на (−7; 7): минимумы f в −5 и 3, максимум в −1. */
const UZLY_OTREZOK: Uzel[] = [
  { x: -7, y: -2 },
  { x: -5, y: 0 },
  { x: -3, y: 2, m: 0 },
  { x: -1, y: 0 },
  { x: 1, y: -2, m: 0 },
  { x: 3, y: 0 },
  { x: 5, y: 2, m: 0 },
  { x: 7, y: 1 },
];
const OTREZOK: [number, number] = [-2, 6];

/** График f′, который четырежды пересекает горизонталь y = 2. */
const UZLY_PARALLEL: Uzel[] = [
  { x: -6, y: -1 },
  { x: -3, y: 4, m: 0 },
  { x: 0, y: 0, m: 0 },
  { x: 3, y: 3, m: 0 },
  { x: 6, y: -2 },
];
const K_PARALLEL = 2;

/** График f с четырьмя вершинами — горками и ямками. */
const UZLY_OX: Uzel[] = [
  { x: -6, y: 1 },
  { x: -4, y: 4, m: 0 },
  { x: -1, y: -1, m: 0 },
  { x: 2, y: 3, m: 0 },
  { x: 5, y: -2, m: 0 },
  { x: 7, y: 0 },
];

/** График F: растёт до −3, убывает до 1, растёт до 5, затем убывает; частью ниже оси. */
const UZLY_F_ZNAK: Uzel[] = [
  { x: -6, y: -1 },
  { x: -3, y: 3, m: 0 },
  { x: 1, y: -2, m: 0 },
  { x: 5, y: 2, m: 0 },
  { x: 7, y: 1 },
];
const METKI_F_ZNAK = [-5, -2, 0, 3, 6];

/** График F с горизонтальными касательными в −4, −1, 2 и 5. */
const UZLY_F_NULI: Uzel[] = [
  { x: -6, y: 2 },
  { x: -4, y: -1, m: 0 },
  { x: -1, y: 3, m: 0 },
  { x: 2, y: 0, m: 0 },
  { x: 5, y: 4, m: 0 },
  { x: 7, y: 2 },
];
const OTREZOK_F: [number, number] = [-3, 6];

/** Ломаная f: прямоугольник над осью, треугольник над осью, треугольник под осью. */
const UZLY_LOMANAYA: Uzel[] = [
  { x: -2, y: 2 },
  { x: 1, y: 2 },
  { x: 3, y: 0 },
  { x: 5, y: -1 },
];

/** Рисунок f′ или F: тот же вид, что у рисунков теории. */
const ris =
  (rezhim: Figura['rezhim'], podpis: string, uzly: Uzel[], extra: Partial<Figura>) => () =>
    figura(rezhim, podpis, uzly, { teoriya: true, ...extra });

/** Наклон касательной по рисунку — и проверка, что прямая и правда касается кривой. */
function naklonKasatelnoy(
  uzly: Uzel[],
  kas: { a: [number, number]; b: [number, number]; x0: number },
): number {
  const s = postroit(uzly);
  const k = (kas.b[1] - kas.a[1]) / (kas.b[0] - kas.a[0]);
  const naPryamoy = kas.a[1] + k * (kas.x0 - kas.a[0]);
  return Math.abs(s.dy(kas.x0) - k) < 1e-9 && Math.abs(s.y(kas.x0) - naPryamoy) < 1e-9 ? k : NaN;
}

const kartochki: Kartochka[] = [
  /* ── Понятие производной ── */
  {
    id: '9-srednyaya-skorost',
    task: 9,
    topic: 'ponyatie',
    type: 'formula',
    front:
      'Закон движения $s=s(t)$. Чему равна **средняя скорость** за время от $t$ до $t+\\Delta t$?',
    back: '$v_{\\text{ср}}=\\dfrac{\\Delta s}{\\Delta t}$, где $\\Delta s=s(t+\\Delta t)-s(t)$ — путь за время $\\Delta t$.',
    level: B,
    source: 'z9-0-1',
  },
  {
    id: '9-mgnovennaya',
    task: 9,
    topic: 'ponyatie',
    type: 'formula',
    front: 'Что такое **мгновенная скорость** точки в момент $t$?',
    back: '$v=\\lim\\limits_{\\Delta t\\to 0}\\dfrac{\\Delta s}{\\Delta t}$ — предел средней скорости, когда промежуток времени стремится к нулю.',
    level: B,
    source: R('skorost'),
  },
  {
    id: '9-kasatelnaya-opr',
    task: 9,
    topic: 'ponyatie',
    type: 'svoystvo',
    front: 'Что называют **касательной** к кривой в точке $M$?',
    back: 'Предельное положение $MT$ секущей $MM_1$, когда точка $M_1$, двигаясь по кривой, неограниченно приближается к $M$.',
    level: B,
    source: R('kasatelnaya-opr'),
  },
  {
    id: '9-uglovoy',
    task: 9,
    topic: 'ponyatie',
    type: 'formula',
    front: 'Прямая $y=kx+b$. Как угловой коэффициент $k$ связан с углом наклона прямой?',
    back: `$k=${TG}\\beta$, где $\\beta$ — угол между прямой и положительным направлением оси $Ox$.`,
    level: B,
    source: R('uglovoy'),
  },
  {
    id: '9-opredelenie',
    task: 9,
    topic: 'ponyatie',
    type: 'formula',
    front: 'Определение **производной** функции $f$ в точке $x_0$.',
    back: "$f'(x_0)=\\lim\\limits_{\\Delta x\\to 0}\\dfrac{\\Delta y}{\\Delta x}$, где $\\Delta y=f(x_0+\\Delta x)-f(x_0)$ — если этот предел существует.",
    level: B,
    source: R('opredelenie'),
  },
  {
    id: '9-smysl',
    task: 9,
    topic: 'ponyatie',
    type: 'svoystvo',
    front: 'Физический и геометрический смысл производной — по одной формуле.',
    back: `Физический: $v(t)=s'(t)$ — мгновенная скорость.\nГеометрический: $k=${TG}\\alpha=f'(x_0)$ — угловой коэффициент касательной.`,
    pochemu: 'Это одна и та же формула: меняются только названия величин.',
    level: B,
    source: R('smysl'),
  },
  {
    id: '9-algoritm',
    task: 9,
    topic: 'ponyatie',
    type: 'svoystvo',
    front: 'Алгоритм: как найти производную **по определению**?',
    back: "1) Даём приращение $\\Delta x$.\n2) Находим $\\Delta y=f(x_0+\\Delta x)-f(x_0)$.\n3) Составляем и упрощаем $\\dfrac{\\Delta y}{\\Delta x}$.\n4) Находим предел при $\\Delta x\\to 0$ — это $f'(x_0)$.",
    level: B,
    source: R('algoritm'),
  },
  {
    id: '9-otnoshenie-v',
    task: 9,
    topic: 'ponyatie',
    type: 'vychislenie',
    front:
      'Для $f(x)=x^2$, $x_0=3$ и $\\Delta x=0{,}5$ найдите отношение $\\dfrac{\\Delta y}{\\Delta x}$.',
    back: '$\\Delta y=3{,}5^2-3^2=12{,}25-9=3{,}25$, $\\dfrac{\\Delta y}{\\Delta x}=\\dfrac{3{,}25}{0{,}5}=6{,}5$',
    pochemu:
      'В общем виде $\\dfrac{\\Delta y}{\\Delta x}=6+\\Delta x$: при $\\Delta x\\to 0$ остаётся $6$.',
    otvet: '6,5',
    proverka: () => {
      const f = (x: number) => x * x;
      return (f(3 + 0.5) - f(3)) / 0.5;
    },
    level: B,
    source: R('algoritm'),
  },
  {
    id: '9-po-opredeleniyu-v',
    task: 9,
    topic: 'ponyatie',
    type: 'vychislenie',
    front: "По определению найдите $f'(-4)$ для $f(x)=x^2$.",
    back: "$\\Delta y=(-4+\\Delta x)^2-16=-8\\Delta x+(\\Delta x)^2$, $\\dfrac{\\Delta y}{\\Delta x}=-8+\\Delta x$, $f'(-4)=\\lim\\limits_{\\Delta x\\to0}(-8+\\Delta x)=-8$",
    otvet: '-8',
    proverka: () => cd((x) => x * x, -4),
    level: B,
    source: R('primer-x2'),
  },
  {
    id: '9-modul-l',
    task: 9,
    topic: 'ponyatie',
    type: 'verno',
    front: 'Производная функции $y=|x|$ в точке $0$ равна нулю.',
    verno: false,
    back: 'Неверно: $\\dfrac{\\Delta y}{\\Delta x}=\\dfrac{|\\Delta x|}{\\Delta x}$ — это $1$ справа и $-1$ слева. Пределы разные, производной в нуле **нет**.',
    level: E,
    source: R('modul'),
  },
  {
    id: '9-odnostoronnie',
    task: 9,
    topic: 'ponyatie',
    type: 'svoystvo',
    front: 'Что такое **односторонние производные**? Чему они равны у $y=|x|$ в нуле?',
    back: 'Пределы $\\dfrac{\\Delta y}{\\Delta x}$ при $\\Delta x\\to 0$ справа и слева. У $|x|$ в нуле: справа $1$, слева $-1$ — не совпадают, поэтому самой производной нет.',
    level: B,
    source: R('odnostoronnie'),
  },
  {
    id: '9-net-proizvodnoy',
    task: 9,
    topic: 'ponyatie',
    type: 'svoystvo',
    front: 'В каких точках графика у функции **нет** производной?',
    back: 'Где касательная вертикальна или где у графика излом — острие, «галочка».',
    level: B,
    source: R('net-vyvod'),
  },
  {
    id: '9-galochka-ch',
    task: 9,
    topic: 'ponyatie',
    type: 'chertezh',
    front: 'На рисунке — график $y=|x|$. Есть ли у функции производная в точке $0$? Почему?',
    back: 'Нет. Справа от нуля наклон $1$, слева $-1$: односторонние производные не совпадают — в нуле излом.',
    figure: { dvizhok: 'proizvodnaya', fig: () => stsena('ponyatie-galochka').fig },
    level: B,
    source: R('modul'),
  },

  /* ── Геометрический смысл ── */
  {
    id: '9-glavnaya',
    task: 9,
    topic: 'geometriya',
    type: 'formula',
    front: "Геометрический смысл производной: чему равно $f'(x_0)$?",
    back: `$f'(x_0)=k=${TG}\\,\\alpha$ — угловой коэффициент касательной в точке $x_0$; $\\alpha$ — угол между касательной и положительным направлением оси $Ox$.`,
    level: B,
    source: R('glavnaya'),
  },
  {
    id: '9-treugolnik',
    task: 9,
    topic: 'geometriya',
    type: 'formula',
    front: "Касательная нарисована на клетчатой бумаге. Как найти $f'(x_0)$?",
    back: `Берём два узла сетки на прямой, строим прямоугольный треугольник с катетами по линиям сетки.\n$${TG}\\,\\alpha=\\dfrac{\\text{противолежащий катет}}{\\text{прилежащий катет}}$; прямая убывает — ставим минус.`,
    level: E,
    source: R('treugolnik'),
  },
  {
    id: '9-tupoy',
    task: 9,
    topic: 'geometriya',
    type: 'formula',
    front:
      'Касательная идёт вниз, угол $\\alpha$ тупой. Как выразить $\\operatorname{tg}\\alpha$ через треугольник?',
    back: `$${TG}\\,\\alpha=-${TG}(180^\\circ-\\alpha)=-\\dfrac{\\text{противолежащий катет}}{\\text{прилежащий катет}}$`,
    pochemu:
      'Острый угол треугольника — смежный с $\\alpha$; тангенсы смежных углов отличаются знаком.',
    level: E,
    source: R('tupoy'),
  },
  {
    id: '9-znak-chislo',
    task: 9,
    topic: 'geometriya',
    type: 'svoystvo',
    front: "В каком порядке находить $f'(x_0)$ по касательной на рисунке?",
    back: 'Сначала **знак** — по направлению прямой, потом **число** — по катетам. Катеты — положительные длины, минус ставится отдельно.',
    level: E,
    source: R('znak-chislo'),
  },
  {
    id: '9-katety-l',
    task: 9,
    topic: 'geometriya',
    type: 'verno',
    front: 'Чтобы найти наклон касательной, горизонтальный катет делят на вертикальный.',
    verno: false,
    back: 'Неверно: вертикальный катет — в числителе, горизонтальный — в знаменателе.',
    level: E,
    source: R('znak-chislo'),
  },
  {
    id: '9-kas-vverh-v',
    task: 9,
    topic: 'geometriya',
    type: 'vychislenie',
    front:
      "На рисунке — график $y=f(x)$ и касательная к нему в точке с абсциссой $x_0=0$. Найдите $f'(x_0)$.",
    back: 'Узлы $(-2;\\ -1)$ и $(2;\\ 5)$: вертикальный катет $6$, горизонтальный $4$. Прямая возрастает: $\\dfrac{6}{4}=1{,}5$',
    figure: {
      dvizhok: 'proizvodnaya',
      fig: ris('f', 'f(x)', UZLY_VVERH, {
        kasatelnaya: KAS_VVERH,
        alt: 'График функции и возрастающая касательная в точке с абсциссой ноль',
      }),
    },
    otvet: '1,5',
    proverka: () => naklonKasatelnoy(UZLY_VVERH, KAS_VVERH),
    level: E,
    source: 'z9-1-1',
  },
  {
    id: '9-kas-vniz-v',
    task: 9,
    topic: 'geometriya',
    type: 'vychislenie',
    front:
      "На рисунке — график $y=f(x)$ и касательная к нему в точке с абсциссой $x_0=0$. Найдите $f'(x_0)$.",
    back: 'Узлы $(-4;\\ 1)$ и $(4;\\ -1)$: вертикальный катет $2$, горизонтальный $8$. Прямая убывает: $-\\dfrac{2}{8}=-0{,}25$',
    figure: {
      dvizhok: 'proizvodnaya',
      fig: ris('f', 'f(x)', UZLY_VNIZ, {
        kasatelnaya: KAS_VNIZ,
        alt: 'График функции и убывающая касательная в точке с абсциссой ноль',
      }),
    },
    otvet: '-0,25',
    proverka: () => naklonKasatelnoy(UZLY_VNIZ, KAS_VNIZ),
    level: E,
    source: 'z9-1-2',
  },
  {
    id: '9-katety-v',
    task: 9,
    topic: 'geometriya',
    type: 'vychislenie',
    front:
      "Касательная к графику $f$ в точке $x_0$ убывает. В треугольнике под ней вертикальный катет $3$ клетки, горизонтальный — $4$. Найдите $f'(x_0)$.",
    back: '$-\\dfrac{3}{4}=-0{,}75$',
    otvet: '-0,75',
    proverka: () => {
      /* Прямая через (0; 3) и (4; 0): наклон по координатам. */
      const [x1, y1, x2, y2] = [0, 3, 4, 0];
      return (y2 - y1) / (x2 - x1);
    },
    level: B,
    source: R('tupoy'),
  },
  {
    id: '9-kas-vniz-ch',
    task: 9,
    topic: 'geometriya',
    type: 'chertezh',
    front: "Касательная на рисунке. Какой знак у $f'(x_0)$? Острый или тупой угол $\\alpha$?",
    back: "$f'(x_0)<0$: прямая убывает, угол $\\alpha$ с положительным направлением $Ox$ — тупой.",
    figure: {
      dvizhok: 'proizvodnaya',
      fig: ris('f', 'f(x)', UZLY_VNIZ, {
        kasatelnaya: KAS_VNIZ,
        alt: 'График функции и убывающая касательная к нему',
      }),
    },
    level: B,
    source: R('tupoy'),
  },

  /* ── Знак производной и монотонность ── */
  {
    id: '9-znak',
    task: 9,
    topic: 'monotonnost',
    type: 'formula',
    front:
      "Знак производной и поведение функции: что следует из $f'(x)>0$ и из $f'(x)<0$ на промежутке?",
    back: "$f'(x)>0\\ \\Rightarrow\\ f$ возрастает.\n$f'(x)<0\\ \\Rightarrow\\ f$ убывает.",
    pochemu: "Если $f'(x)=0$, касательная горизонтальна.",
    level: B,
    source: R('znak'),
  },
  {
    id: '9-vyshe-osi-l',
    task: 9,
    topic: 'monotonnost',
    type: 'verno',
    front: "Нарисован график $y=f'(x)$. Там, где он выше оси $Ox$, сам график $f'$ идёт вверх.",
    verno: false,
    back: "Неверно: выше оси означает $f'>0$, то есть растёт **функция $f$**. Сам график $f'$ при этом может идти и вниз.",
    level: E,
    source: R('vyshe-osi'),
  },
  {
    id: '9-chey-grafik',
    task: 9,
    topic: 'monotonnost',
    type: 'svoystvo',
    front: 'С чего начинать любую задачу №9 по рисунку?',
    back: "Найти подпись: нарисован $y=f(x)$, $y=f'(x)$ или $y=F(x)$ — и понять, о какой функции вопрос.",
    pochemu: 'Главная ловушка задания — спутать, чей график нарисован.',
    level: E,
    source: 'z9-2-2',
  },
  {
    id: '9-tablica-max',
    task: 9,
    topic: 'monotonnost',
    type: 'svoystvo',
    front: "Как выглядит **точка максимума** на графике $f$ и на графике $f'$?",
    back: "На графике $f$ — вершина горки.\nНа графике $f'$ — точка, где $f'$ пересекает ось сверху вниз.",
    pochemu: "Минимум — дно ямки; $f'$ пересекает ось снизу вверх.",
    level: E,
    source: R('tablica'),
  },
  {
    id: '9-gorka-ch',
    task: 9,
    topic: 'monotonnost',
    type: 'chertezh',
    front: "На рисунке — график $y=f(x)$. Где $f'(x)=0$? Какой знак у $f'$ между этими точками?",
    back: "$f'=0$ в вершине горки ($x=-2$) и на дне ямки ($x=2$). Между ними $f$ убывает: $f'<0$.",
    figure: {
      dvizhok: 'proizvodnaya',
      fig: ris('f', 'f(x)', UZLY_F_METKI, {
        chisla: 'vse',
        alt: 'График функции: горка в точке минус два, ямка в точке два',
      }),
    },
    level: B,
    source: R('tablica'),
  },
  {
    id: '9-metki-f-v',
    task: 9,
    topic: 'monotonnost',
    type: 'vychislenie',
    front:
      "На рисунке — график $y=f(x)$ и отмечены точки $x_1,\\ \\ldots,\\ x_5$. В скольких из них $f'(x)>0$?",
    back: "$f'>0$ там, где график идёт вверх: $x_1$, $x_2$ и $x_5$. В $x_3$ и $x_4$ он идёт вниз. Ответ: $3$",
    figure: {
      dvizhok: 'proizvodnaya',
      fig: ris('f', 'f(x)', UZLY_F_METKI, {
        metki: METKI_F,
        alt: 'График функции с горкой и ямкой и пять отмеченных точек на оси абсцисс',
      }),
    },
    otvet: '3',
    proverka: () => {
      const s = postroit(UZLY_F_METKI);
      return METKI_F.filter((x) => s.dy(x) > ZNAK_EPS).length;
    },
    level: E,
    source: 'z9-2-3',
  },
  {
    id: '9-metki-fp-v',
    task: 9,
    topic: 'monotonnost',
    type: 'vychislenie',
    front:
      "На рисунке — график $y=f'(x)$ и отмечены точки $x_1,\\ \\ldots,\\ x_5$. В скольких из них функция $f$ возрастает?",
    back: "$f$ возрастает там, где график $f'$ выше оси: в $x_1$ и $x_5$. Ответ: $2$",
    figure: {
      dvizhok: 'proizvodnaya',
      fig: ris('fprime', "f'(x)", UZLY_FP_METKI, {
        metki: METKI_FP,
        alt: 'График производной и пять отмеченных точек на оси абсцисс',
      }),
    },
    otvet: '2',
    proverka: () => {
      const s = postroit(UZLY_FP_METKI);
      return METKI_FP.filter((x) => s.y(x) > ZNAK_EPS).length;
    },
    level: E,
    source: R('tablica'),
  },
  {
    id: '9-vershina-l',
    task: 9,
    topic: 'monotonnost',
    type: 'verno',
    front:
      "Отмеченная точка — вершина горки графика $f$. Её засчитывают в ответ на вопрос «в скольких точках $f'(x)>0$».",
    verno: false,
    back: "Неверно: в вершине горки $f'=0$ — она не идёт ни в «$f'>0$», ни в «$f'<0$».",
    level: E,
    source: 'z9-2-3',
  },
  {
    id: '9-koncy-l',
    task: 9,
    topic: 'monotonnost',
    type: 'verno',
    front: 'Концы интервала, на котором нарисован график, в подсчёт точек не входят.',
    verno: true,
    back: 'Верно: концы интервала выколоты и не считаются.',
    level: B,
    source: 'z9-2-3',
  },

  /* ── Экстремумы ── */
  {
    id: '9-max-min',
    task: 9,
    topic: 'ekstremumy',
    type: 'formula',
    front: 'Как по смене знака производной узнать максимум и минимум?',
    back: "$f'$: $+\\to-$ — максимум.\n$f'$: $-\\to+$ — минимум.",
    pochemu: 'Функция шла вверх, потом вниз — на стыке горка; вниз, потом вверх — ямка.',
    level: B,
    source: R('max-min'),
  },
  {
    id: '9-ekstr-shagi',
    task: 9,
    topic: 'ekstremumy',
    type: 'svoystvo',
    front: "Как найти точки экстремума по графику $f'$? Три шага.",
    back: "1) Нули $f'$ — где график пересекает ось или касается её.\n2) Знаки: над осью $+$, под осью $-$.\n3) Смена знака: $+\\to-$ — максимум, $-\\to+$ — минимум.",
    level: E,
    source: R('ekstr-shagi'),
  },
  {
    id: '9-nol-l',
    task: 9,
    topic: 'ekstremumy',
    type: 'verno',
    front: "Если $f'(x_0)=0$, то $x_0$ — точка экстремума.",
    verno: false,
    back: "Неверно: нужна ещё смена знака. Если график $f'$ только касается оси, знак не меняется — экстремума нет.",
    level: E,
    source: R('kasanie-osi'),
  },
  {
    id: '9-max-v',
    task: 9,
    topic: 'ekstremumy',
    type: 'vychislenie',
    front:
      "На рисунке — график $y=f'(x)$ на интервале $(-6;\\ 7)$. Найдите точку максимума функции $f$.",
    back: "Нули $f'$: $-3$, $2$, $6$. Переход $+\\to-$ только в точке $2$ — это максимум; в $-3$ и $6$ минимумы.",
    figure: {
      dvizhok: 'proizvodnaya',
      fig: ris('fprime', "f'(x)", UZLY_MAX, {
        chisla: 'vse',
        alt: 'График производной: пересекает ось абсцисс в трёх точках',
      }),
    },
    otvet: '2',
    proverka: () => {
      const s = postroit(UZLY_MAX);
      const max = smenyZnaka(s.y, krayL(s), krayP(s)).filter((t) => t.tip === 'pm');
      return max.length === 1 ? (max[0]?.x ?? NaN) : NaN;
    },
    level: E,
    source: 'z9-3-1',
  },
  {
    id: '9-kasanie-v',
    task: 9,
    topic: 'ekstremumy',
    type: 'vychislenie',
    front: "На рисунке — график $y=f'(x)$. Сколько точек экстремума у функции $f$?",
    back: "Нули $f'$: $-4$, $0$, $4$. В $0$ график только касается оси — знак не меняется. Экстремумы в $-4$ и $4$: их $2$",
    figure: {
      dvizhok: 'proizvodnaya',
      fig: ris('fprime', "f'(x)", UZLY_KASANIE, {
        chisla: 'vse',
        alt: 'График производной: пересекает ось абсцисс в двух точках и касается её в нуле',
      }),
    },
    otvet: '2',
    proverka: () => {
      const s = postroit(UZLY_KASANIE);
      return smenyZnaka(s.y, krayL(s), krayP(s)).length;
    },
    level: E,
    source: R('kasanie-osi'),
  },
  {
    id: '9-otrezok-v',
    task: 9,
    topic: 'ekstremumy',
    type: 'vychislenie',
    front:
      "На рисунке — график $y=f'(x)$ на интервале $(-7;\\ 7)$. Найдите количество точек минимума функции $f$ на отрезке $[-2;\\ 6]$.",
    back: 'На всём интервале $-\\to+$ в точках $-5$ и $3$. Отрезку $[-2;\\ 6]$ принадлежит только $3$. Ответ: $1$',
    figure: {
      dvizhok: 'proizvodnaya',
      fig: ris('fprime', "f'(x)", UZLY_OTREZOK, {
        chisla: 'vse',
        alt: 'График производной на интервале от минус семи до семи',
      }),
    },
    otvet: '1',
    proverka: () => {
      const s = postroit(UZLY_OTREZOK);
      return smenyZnaka(s.y, krayL(s), krayP(s)).filter(
        (t) => t.tip === 'mp' && t.x >= OTREZOK[0] && t.x <= OTREZOK[1],
      ).length;
    },
    level: E,
    source: 'z9-3-3',
  },
  {
    id: '9-otrezok-l',
    task: 9,
    topic: 'ekstremumy',
    type: 'verno',
    front:
      'Рисунок дан на интервале, а вопрос — про отрезок внутри него. Считать нужно экстремумы на всём рисунке.',
    verno: false,
    back: 'Неверно: сначала вычеркните всё, что вне отрезка, и только потом считайте.',
    level: E,
    source: 'z9-3-3',
  },
  {
    id: '9-naib-konec',
    task: 9,
    topic: 'ekstremumy',
    type: 'svoystvo',
    front: "На отрезке $f'>0$ везде. Где функция $f$ принимает наибольшее и наименьшее значение?",
    back: 'Наибольшее — в правом конце, наименьшее — в левом: функция всё время растёт.',
    pochemu: "При $f'<0$ наоборот.",
    level: E,
    source: 'z9-3-4',
  },
  {
    id: '9-naib-smena-l',
    task: 9,
    topic: 'ekstremumy',
    type: 'verno',
    front:
      "На отрезке знак $f'$ меняется один раз — с $+$ на $-$. Наибольшее значение $f$ на отрезке — в точке смены знака.",
    verno: true,
    back: 'Верно: до этой точки функция растёт, после — убывает.',
    level: E,
    source: 'z9-3-4',
  },

  /* ── Физический смысл ── */
  {
    id: '9-v-a',
    task: 9,
    topic: 'fizika',
    type: 'formula',
    front: 'Закон движения $x(t)$. Как найти скорость и ускорение?',
    back: "$v(t)=x'(t)$, $a(t)=v'(t)=x''(t)$",
    pochemu: 'Ускорение — производная скорости.',
    level: B,
    source: R('skorost-uskorenie'),
  },
  {
    id: '9-stepen',
    task: 9,
    topic: 'fizika',
    type: 'formula',
    front: "Производная степени: $(t^n)'=\\ ?$",
    back: "$(t^n)'=n\\,t^{n-1}$",
    pochemu: "Например, $\\left(\\dfrac{t^3}{3}\\right)'=t^2$.",
    level: B,
    source: R('pravila'),
  },
  {
    id: '9-pravila',
    task: 9,
    topic: 'fizika',
    type: 'formula',
    front: 'Три правила для многочлена: производная суммы, постоянного множителя и числа.',
    back: "$(u+w)'=u'+w'$, $(c\\,u)'=c\\,u'$, $(c)'=0$",
    pochemu: "Например, $(4t)'=4$.",
    level: B,
    source: R('pravila'),
  },
  {
    id: '9-fiz-shagi',
    task: 9,
    topic: 'fizika',
    type: 'svoystvo',
    front: 'Алгоритм задачи о движении: дан $x(t)$, спрашивают о скорости.',
    back: "1) $v(t)=x'(t)$.\n2) Подставить $t_0$ или решить $v(t)=v_0$.\n3) Учесть $t\\geqslant 0$.\n4) Отобрать корень.",
    level: E,
    source: R('fiz-shagi'),
  },
  {
    id: '9-ne-v-zakon-l',
    task: 9,
    topic: 'fizika',
    type: 'verno',
    front:
      'Чтобы найти скорость в момент $t_0$, достаточно подставить $t_0$ в закон движения $x(t)$.',
    verno: false,
    back: "Неверно: $x(t_0)$ — положение, а не скорость. Скорость — только после дифференцирования: $v(t_0)=x'(t_0)$.",
    level: E,
    source: R('ne-v-zakon'),
  },
  {
    id: '9-otricatelnyy-l',
    task: 9,
    topic: 'fizika',
    type: 'verno',
    front: 'Уравнение $v(t)=v_0$ дало корни $-2$ и $6$. Ответ задачи о движении — $6$.',
    verno: true,
    back: 'Верно: время не бывает отрицательным, $t\\geqslant 0$ — корень $-2$ отбрасываем.',
    level: B,
    source: R('fiz-shagi'),
  },
  {
    id: '9-skorost-v',
    task: 9,
    topic: 'fizika',
    type: 'vychislenie',
    front:
      'Точка движется по закону $x(t)=t^3-4t^2+3t+7$ ($x$ — в метрах, $t$ — в секундах). Найдите её скорость в момент $t=3$ с.',
    back: '$v(t)=3t^2-8t+3$, $v(3)=27-24+3=6$ м/с',
    otvet: '6',
    proverka: () => cd(kub([1, -4, 3, 7]), 3),
    level: E,
    source: 'z9-4-2',
  },
  {
    id: '9-moment-v',
    task: 9,
    topic: 'fizika',
    type: 'vychislenie',
    front:
      'Точка движется по закону $x(t)=\\dfrac13t^3-2t^2+3t-5$. В какой момент времени её скорость равна $15$?',
    back: '$v(t)=t^2-4t+3=15$, $t^2-4t-12=0$, $t=6$ или $t=-2$. Время неотрицательно: $t=6$',
    otvet: '6',
    proverka: () => {
      /* Момент ищем делением отрезка пополам по скорости — производной закона. */
      const v = (t: number) => cd(kub([1 / 3, -2, 3, -5]), t) - 15;
      let [a, b] = [2, 50];
      if (v(a) * v(b) > 0) return NaN;
      for (let i = 0; i < 100; i += 1) {
        const m = (a + b) / 2;
        if (v(a) * v(m) <= 0) b = m;
        else a = m;
      }
      return (a + b) / 2;
    },
    level: E,
    source: 'z9-4-2',
  },
  {
    id: '9-uskorenie-v',
    task: 9,
    topic: 'fizika',
    type: 'vychislenie',
    front: 'Точка движется по закону $x(t)=t^3-2t^2+5$. Найдите её ускорение в момент $t=2$.',
    back: "$v(t)=3t^2-4t$, $a(t)=v'(t)=6t-4$, $a(2)=8$",
    otvet: '8',
    proverka: () => cd2(kub([1, -2, 0, 5]), 2),
    level: B,
    source: R('skorost-uskorenie'),
  },

  /* ── Касательная и параллельность ── */
  {
    id: '9-parallel',
    task: 9,
    topic: 'kasatelnaya',
    type: 'formula',
    front: 'Когда касательная к графику $f$ в точке $x_0$ параллельна прямой $y=kx+m$?',
    back: "Когда $f'(x_0)=k$.",
    pochemu: 'Параллельные прямые имеют равные угловые коэффициенты; число $m$ значения не имеет.',
    level: B,
    source: R('parallel'),
  },
  {
    id: '9-m-l',
    task: 9,
    topic: 'kasatelnaya',
    type: 'verno',
    front: 'Касательная параллельна прямой $y=2x+5$ в тех же точках, что и прямой $y=2x-3$.',
    verno: true,
    back: "Верно: обе прямые имеют $k=2$, условие одно — $f'(x_0)=2$. Число $m$ не влияет.",
    level: B,
    source: R('parallel'),
  },
  {
    id: '9-os-ox',
    task: 9,
    topic: 'kasatelnaya',
    type: 'svoystvo',
    front:
      "«Касательная параллельна оси абсцисс» — что это значит для производной и что искать на графике $f'$?",
    back: "$f'(x_0)=0$, ведь у оси $Ox$ $k=0$. На графике $f'$ — его пересечения с осью $Ox$.",
    level: E,
    source: 'z9-5-1',
  },
  {
    id: '9-gorizontal',
    task: 9,
    topic: 'kasatelnaya',
    type: 'svoystvo',
    front:
      "Нарисован график $f'$. Как найти точки, где касательная к $f$ параллельна прямой $y=kx+m$?",
    back: "Провести горизонталь $y=k$ и сосчитать её пересечения с графиком $f'$.",
    level: E,
    source: 'z9-5-1',
  },
  {
    id: '9-parallel-v',
    task: 9,
    topic: 'kasatelnaya',
    type: 'vychislenie',
    front:
      "На рисунке — график $y=f'(x)$. Сколько на нём точек, в которых касательная к графику $f$ параллельна прямой $y=2x-7$?",
    back: "$k=2$: ищем $f'(x)=2$. Горизонталь $y=2$ пересекает график $f'$ в $4$ точках.",
    figure: {
      dvizhok: 'proizvodnaya',
      fig: ris('fprime', "f'(x)", UZLY_PARALLEL, {
        chislaY: 'vse',
        alt: 'График производной с двумя горками и ямкой между ними',
      }),
    },
    otvet: '4',
    proverka: () => {
      const s = postroit(UZLY_PARALLEL);
      return peresecheniya(s.y, K_PARALLEL, krayL(s), krayP(s));
    },
    level: E,
    source: 'z9-5-1',
  },
  {
    id: '9-ox-v',
    task: 9,
    topic: 'kasatelnaya',
    type: 'vychislenie',
    front:
      'На рисунке — график $y=f(x)$. В скольких точках касательная к нему параллельна оси абсцисс?',
    back: "Касательная горизонтальна, где $f'=0$: в вершинах горок и на дне ямок. Их $4$",
    figure: {
      dvizhok: 'proizvodnaya',
      fig: ris('f', 'f(x)', UZLY_OX, {
        alt: 'График функции с двумя горками и двумя ямками',
      }),
    },
    otvet: '4',
    proverka: () => {
      const s = postroit(UZLY_OX);
      return smenyZnaka(s.dy, krayL(s), krayP(s)).length;
    },
    level: B,
    source: 'z9-5-1',
  },
  {
    id: '9-usloviya',
    task: 9,
    topic: 'kasatelnaya',
    type: 'formula',
    front: 'Прямая $y=kx+m$ касается графика $y=f(x)$ в точке $x_0$. Какие два условия выполнены?',
    back: "$f(x_0)=kx_0+m$ — общая точка;\n$f'(x_0)=k$ — одинаковый наклон.",
    level: E,
    source: R('usloviya'),
  },
  {
    id: '9-proverka-l',
    task: 9,
    topic: 'kasatelnaya',
    type: 'verno',
    front: "Чтобы прямая $y=kx+m$ касалась графика в точке $x_0$, достаточно условия $f'(x_0)=k$.",
    verno: false,
    back: 'Неверно: нужна ещё общая точка $f(x_0)=kx_0+m$. Каждый корень $x_0$ проверяется вторым условием.',
    level: E,
    source: R('proverka-kasaniya'),
  },
  {
    id: '9-parametr-v',
    task: 9,
    topic: 'kasatelnaya',
    type: 'vychislenie',
    front: 'Прямая $y=3x+c$ является касательной к графику $y=x^2+x$. Найдите $c$.',
    back: "$f'(x)=2x+1=3$, $x_0=1$; $f(1)=2=3\\cdot1+c$, $c=-1$",
    otvet: '-1',
    proverka: () => {
      /* Касание — общая точка без пересечения: x² + x − 3x − c ≥ 0 и равно нулю
         в одной точке, т. е. c — наименьшее значение x² − 2x. */
      let min = Infinity;
      for (let x = -10; x <= 10; x += 1 / 1000) min = Math.min(min, x * x + x - 3 * x);
      return min;
    },
    level: E,
    source: R('usloviya'),
  },

  /* ── Первообразная ── */
  {
    id: '9-F-opr',
    task: 9,
    topic: 'pervoobraznaya',
    type: 'formula',
    front: 'Что такое **первообразная** $F$ функции $f$?',
    back: "Функция, производная которой равна $f$: $F'(x)=f(x)$.",
    level: B,
    source: R('F-opredelenie'),
  },
  {
    id: '9-F-znak',
    task: 9,
    topic: 'pervoobraznaya',
    type: 'svoystvo',
    front: 'Нарисован график первообразной $F$. Где $f>0$, где $f<0$?',
    back: '$f>0$ там, где $F$ возрастает, $f<0$ — где $F$ убывает.',
    pochemu:
      'Положение графика $F$ над осью или под ней роли не играет: $F$ можно сдвинуть вверх и вниз.',
    level: E,
    source: 'z9-6-1',
  },
  {
    id: '9-F-os-l',
    task: 9,
    topic: 'pervoobraznaya',
    type: 'verno',
    front: 'На промежутке график первообразной $F$ лежит ниже оси $Ox$. Значит, там $f(x)<0$.',
    verno: false,
    back: 'Неверно: знак $f$ — это рост или убывание $F$, а не положение её графика относительно оси.',
    level: E,
    source: 'z9-6-1',
  },
  {
    id: '9-F-nuli',
    task: 9,
    topic: 'pervoobraznaya',
    type: 'svoystvo',
    front: 'Что означает уравнение $f(x)=0$ на графике первообразной $F$?',
    back: 'Горизонтальную касательную к графику $F$: вершины горок и дно ям.',
    level: E,
    source: 'z9-6-2',
  },
  {
    id: '9-nyuton',
    task: 9,
    topic: 'pervoobraznaya',
    type: 'formula',
    front: 'Формула Ньютона—Лейбница: площадь под графиком $f\\geqslant 0$ на отрезке $[a;\\ b]$.',
    back: '$S=F(b)-F(a)$',
    pochemu: 'Приращение первообразной равно площади под графиком $f$.',
    level: B,
    source: R('nyuton'),
  },
  {
    id: '9-so-znakom',
    task: 9,
    topic: 'pervoobraznaya',
    type: 'svoystvo',
    front: 'Часть графика $f$ на $[a;\\ b]$ лежит под осью. Что тогда даёт $F(b)-F(a)$?',
    back: '«Площадь со знаком»: части над осью идут с плюсом, под осью — с минусом.',
    level: E,
    source: R('nyuton'),
  },
  {
    id: '9-F-znak-v',
    task: 9,
    topic: 'pervoobraznaya',
    type: 'vychislenie',
    front:
      'На рисунке — график $y=F(x)$, одной из первообразных функции $f$, и отмечены точки $x_1,\\ \\ldots,\\ x_5$. В скольких из них $f(x)<0$?',
    back: '$f<0$ там, где $F$ убывает: в $x_2$, $x_3$ и $x_5$. Ответ: $3$',
    figure: {
      dvizhok: 'proizvodnaya',
      fig: ris('F', 'F(x)', UZLY_F_ZNAK, {
        metki: METKI_F_ZNAK,
        alt: 'График первообразной, частью ниже оси абсцисс, и пять отмеченных точек',
      }),
    },
    otvet: '3',
    proverka: () => {
      const s = postroit(UZLY_F_ZNAK);
      return METKI_F_ZNAK.filter((x) => s.dy(x) < -ZNAK_EPS).length;
    },
    level: E,
    source: 'z9-6-1',
  },
  {
    id: '9-F-nuli-v',
    task: 9,
    topic: 'pervoobraznaya',
    type: 'vychislenie',
    front:
      'На рисунке — график $y=F(x)$, одной из первообразных функции $f$. Сколько решений имеет уравнение $f(x)=0$ на отрезке $[-3;\\ 6]$?',
    back: 'Горизонтальные касательные к $F$ — в точках $-4$, $-1$, $2$, $5$. На $[-3;\\ 6]$ — три из них. Ответ: $3$',
    figure: {
      dvizhok: 'proizvodnaya',
      fig: ris('F', 'F(x)', UZLY_F_NULI, {
        chisla: 'vse',
        alt: 'График первообразной с двумя горками и двумя ямками',
      }),
    },
    otvet: '3',
    proverka: () => {
      const s = postroit(UZLY_F_NULI);
      return smenyZnaka(s.dy, krayL(s), krayP(s)).filter(
        (t) => t.x >= OTREZOK_F[0] && t.x <= OTREZOK_F[1],
      ).length;
    },
    level: E,
    source: 'z9-6-2',
  },
  {
    id: '9-lomanaya-v',
    task: 9,
    topic: 'pervoobraznaya',
    type: 'vychislenie',
    front:
      'На рисунке — график функции $y=f(x)$ из отрезков, $F$ — одна из её первообразных. Найдите $F(5)-F(-2)$.',
    back: 'Прямоугольник $3\\times2=6$, треугольник над осью $\\dfrac12\\cdot2\\cdot2=2$, треугольник под осью $-\\dfrac12\\cdot2\\cdot1=-1$. Итого $6+2-1=7$',
    figure: {
      dvizhok: 'proizvodnaya',
      fig: ris('lomanaya', 'f(x)', UZLY_LOMANAYA, {
        zalivka: { a: -2, b: 5 },
        levyy: 'closed',
        pravyy: 'closed',
        chisla: 'vse',
        chislaY: 'vse',
        alt: 'График функции из отрезков: над осью абсцисс от минус двух до трёх, под осью от трёх до пяти; площади закрашены',
      }),
    },
    otvet: '7',
    proverka: () => simpson((x) => lomanayaY(UZLY_LOMANAYA, x), -2, 5, 7000),
    level: E,
    source: 'z9-6-3',
  },
  {
    id: '9-ploshchad-v',
    task: 9,
    topic: 'pervoobraznaya',
    type: 'vychislenie',
    front:
      'Найдите площадь фигуры под графиком $f(x)=6x-x^2$ на отрезке $[0;\\ 3]$, если $F(x)=3x^2-\\dfrac{x^3}{3}$ — первообразная $f$.',
    back: '$f\\geqslant0$ на $[0;\\ 3]$, $S=F(3)-F(0)=27-9-0=18$',
    otvet: '18',
    proverka: () => simpson((x) => 6 * x - x * x, 0, 3),
    level: E,
    source: R('nyuton'),
  },
  {
    id: '9-pamyatka',
    task: 9,
    topic: 'pervoobraznaya',
    type: 'svoystvo',
    front: 'Памятка: как одна логика производной работает для первообразной?',
    back: "$F'=f$: знак $f$ — это рост или убывание $F$, нули $f$ — экстремумы $F$.",
    level: E,
    source: R('pamyatka'),
  },
];

const proverki: ProverkaFormuly[] = [
  {
    /* Средняя скорость Δs/Δt для s = at² + bt + c равна 2at + b + aΔt. */
    kartochka: '9-srednyaya-skorost',
    sluchay: (rnd) => {
      const [a, b, c] = [ot(rnd, -5, 5), ot(rnd, -5, 5), ot(rnd, -5, 5)];
      const s = (t: number) => a * t * t + b * t + c;
      const t = ot(rnd, 0, 10);
      const dt = ot(rnd, 0.1, 3);
      return { poFormule: (s(t + dt) - s(t)) / dt, pryamo: 2 * a * t + b + a * dt };
    },
  },
  {
    /* Предел средней скорости — скорость: малые Δt по обе стороны от t. */
    kartochka: '9-mgnovennaya',
    sluchay: (rnd) => {
      const k = sluchKub(rnd);
      const t = ot(rnd, 0, 5);
      const [a = 0, b = 0, c = 0] = k;
      return { poFormule: cd(kub(k), t, 1e-4), pryamo: 3 * a * t * t + 2 * b * t + c };
    },
  },
  {
    /* k = tg β: прямая через две случайные точки, β — её угол с осью Ox. */
    kartochka: '9-uglovoy',
    sluchay: (rnd) => {
      const dx = ot(rnd, 0.5, 10);
      const dy = ot(rnd, -10, 10);
      let beta = Math.atan2(dy, dx);
      if (beta < 0) beta += Math.PI;
      return { poFormule: Math.tan(beta), pryamo: dy / dx };
    },
  },
  {
    kartochka: '9-opredelenie',
    sluchay: (rnd) => {
      const k = sluchKub(rnd);
      const x0 = ot(rnd, -3, 3);
      const [a = 0, b = 0, c = 0] = k;
      return { poFormule: cd(kub(k), x0, 1e-4), pryamo: 3 * a * x0 * x0 + 2 * b * x0 + c };
    },
  },
  {
    /* f′(x₀) = tg α: касательная к параболе, α — её угол с осью Ox. */
    kartochka: '9-glavnaya',
    sluchay: (rnd) => {
      const [a, b] = [neNol(rnd, 0.2, 3), ot(rnd, -5, 5)];
      const x0 = ot(rnd, -4, 4);
      const k = 2 * a * x0 + b;
      let alpha = Math.atan(k);
      if (alpha < 0) alpha += Math.PI;
      return { poFormule: Math.tan(alpha), pryamo: cd((x) => a * x * x + b * x, x0) };
    },
  },
  {
    /* Катеты по сетке и знак по направлению — то же, что разность координат. */
    kartochka: '9-treugolnik',
    sluchay: (rnd) => {
      const x1 = Math.floor(ot(rnd, -8, 0));
      const x2 = x1 + 1 + Math.floor(ot(rnd, 0, 8));
      const y1 = Math.floor(ot(rnd, -8, 8));
      const y2 = Math.floor(ot(rnd, -8, 8));
      const protiv = Math.abs(y2 - y1);
      const prilezh = Math.abs(x2 - x1);
      const znakPryamoy = y2 >= y1 ? 1 : -1;
      return { poFormule: (znakPryamoy * protiv) / prilezh, pryamo: (y2 - y1) / (x2 - x1) };
    },
  },
  {
    kartochka: '9-tupoy',
    sluchay: (rnd) => {
      const alpha = ot(rnd, 91, 179) * (Math.PI / 180);
      /* Треугольник под убывающей прямой: катеты cos и sin острого угла. */
      const beta = Math.PI - alpha;
      return { poFormule: -(Math.sin(beta) / Math.cos(beta)), pryamo: Math.tan(alpha) };
    },
  },
  {
    /* Парабола a(x − p)² на промежутке [u; w] правее вершины: знак f′ в
       случайной точке промежутка против того, выросла ли функция от u до w. */
    kartochka: '9-znak',
    sluchay: (rnd) => {
      const [a, p] = [neNol(rnd, 0.2, 5), ot(rnd, -5, 5)];
      const f = (x: number) => a * (x - p) ** 2;
      const u = p + ot(rnd, 0.1, 2);
      const w = u + ot(rnd, 0.5, 4);
      const x = ot(rnd, u, w);
      return { poFormule: Math.sign(2 * a * (x - p)), pryamo: Math.sign(f(w) - f(u)) };
    },
  },
  {
    /* Парабола a(x − x₀)² + y₀: смена знака f′ у вершины — максимум при a < 0. */
    kartochka: '9-max-min',
    sluchay: (rnd) => {
      const a = neNol(rnd, 0.2, 5);
      const x0 = ot(rnd, -5, 5);
      const f = (x: number) => a * (x - x0) ** 2 + 3;
      const h = 0.1;
      const sleva = cd(f, x0 - h);
      const sprava = cd(f, x0 + h);
      const poZnaku = sleva > 0 && sprava < 0 ? 1 : sleva < 0 && sprava > 0 ? -1 : 0;
      const pryamo = f(x0) > f(x0 - h) && f(x0) > f(x0 + h) ? 1 : -1;
      return { poFormule: poZnaku, pryamo };
    },
  },
  {
    /* a = x″: формула 6at + 2b против второй разности закона. */
    kartochka: '9-v-a',
    sluchay: (rnd) => {
      const k = sluchKub(rnd);
      const t = ot(rnd, 0, 5);
      const [a = 0, b = 0] = k;
      return { poFormule: 6 * a * t + 2 * b, pryamo: cd2(kub(k), t, 1e-3) };
    },
  },
  {
    kartochka: '9-stepen',
    sluchay: (rnd) => {
      const n = 1 + Math.floor(rnd() * 5);
      const t = ot(rnd, 0.5, 3);
      return { poFormule: n * t ** (n - 1), pryamo: cd((x) => x ** n, t, 1e-5) };
    },
  },
  {
    /* (u + w)′ = u′ + w′ и (cu)′ = cu′ на u = t³, w = t², плюс число. */
    kartochka: '9-pravila',
    sluchay: (rnd) => {
      const [c, c2, d] = [ot(rnd, -5, 5), ot(rnd, -5, 5), ot(rnd, -9, 9)];
      const t = ot(rnd, -3, 3);
      const f = (x: number) => c * x ** 3 + c2 * x ** 2 + d;
      return { poFormule: c * 3 * t * t + c2 * 2 * t + 0, pryamo: cd(f, t, 1e-4) };
    },
  },
  {
    /* x₀ из f′(x₀) = k: наклон касательной к параболе там — k. */
    kartochka: '9-parallel',
    sluchay: (rnd) => {
      const [a, b] = [neNol(rnd, 0.2, 3), ot(rnd, -5, 5)];
      const k = ot(rnd, -10, 10);
      const x0 = (k - b) / (2 * a);
      return { poFormule: k, pryamo: cd((x) => a * x * x + b * x + 1, x0) };
    },
  },
  {
    /* Оба условия касания дают прямую, которая касается параболы:
       f(x) − (kx + m) = a(x − x₀)² — двойной корень в x₀. */
    kartochka: '9-usloviya',
    sluchay: (rnd) => {
      const [a, b, c] = [neNol(rnd, 0.2, 3), ot(rnd, -5, 5), ot(rnd, -5, 5)];
      const f = (x: number) => a * x * x + b * x + c;
      const x0 = ot(rnd, -4, 4);
      const k = cd(f, x0);
      const m = f(x0) - k * x0;
      const x = ot(rnd, -6, 6);
      return { poFormule: f(x) - (k * x + m), pryamo: a * (x - x0) ** 2 };
    },
  },
  {
    kartochka: '9-F-opr',
    sluchay: (rnd) => {
      const k = sluchKub(rnd);
      const x = ot(rnd, -3, 3);
      const [a = 0, b = 0, c = 0] = k;
      const f = (t: number) => 3 * a * t * t + 2 * b * t + c;
      return { poFormule: cd(kub(k), x, 1e-4), pryamo: f(x) };
    },
  },
  {
    /* F(b) − F(a) — площадь под графиком f ≥ 0: f = (x − p)² + q, q > 0. */
    kartochka: '9-nyuton',
    sluchay: (rnd) => {
      const [p, q] = [ot(rnd, -3, 3), ot(rnd, 0.1, 4)];
      const f = (x: number) => (x - p) ** 2 + q;
      const F = (x: number) => (x - p) ** 3 / 3 + q * x;
      const a = ot(rnd, -4, 2);
      const b = a + ot(rnd, 0.5, 4);
      return { poFormule: F(b) - F(a), pryamo: simpson(f, a, b) };
    },
  },
];

const KOLODA_9: Koloda = {
  task: 9,
  slug: '9',
  title: 'Производная и первообразная',
  teoriya: 'teoriya/',
  podtemy: [
    { id: 'ponyatie', title: 'Понятие производной' },
    { id: 'geometriya', title: 'Геометрический смысл' },
    { id: 'monotonnost', title: 'Знак и монотонность' },
    { id: 'ekstremumy', title: 'Экстремумы' },
    { id: 'fizika', title: 'Физический смысл' },
    { id: 'kasatelnaya', title: 'Касательная и параллельность' },
    { id: 'pervoobraznaya', title: 'Первообразная' },
  ],
  kartochki,
  proverki,
};

export default KOLODA_9;
