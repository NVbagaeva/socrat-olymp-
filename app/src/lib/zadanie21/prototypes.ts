/**
 * Прототипы задания «Наибольшее и наименьшее значение функции, точки
 * экстремума». Классификация — types.ts. Список типов сверен с
 * подборкой из 51 задачи открытого банка (docs/ege-2027-struktura-
 * shag-0.md, раздел 8): каждая её задача — один из прототипов ниже.
 *
 * Каждый прототип сам подбирает числа так, чтобы ответ был целым или
 * конечной десятичной дробью, и сам строит разбор. Самотест
 * (selftest.ts) проверяет ответ численно — по графику функции.
 */

import type { Rng } from '@/lib/veroyatnost/generator';
import { chislo, num, otrezokTex, summa, trehchlen, xMinus, znaki } from './tex';
import type { Etap, HintStep, Params, Prototype, Solved } from './types';

type Cel = 'max' | 'min';

const N = (p: Params, k: string): number => Number(p[k]);
const S = (p: Params, k: string): string => String(p[k]);

/* ── Тексты ──────────────────────────────────────────────────────── */

const SLOVO_TOCHKI: Record<Cel, string> = { max: 'максимума', min: 'минимума' };
const SLOVO_ZNACH: Record<Cel, string> = { max: 'наибольшее', min: 'наименьшее' };

function uslovieTochki(cel: Cel, fn: string, promezhutok?: string): string {
  const prom = promezhutok === undefined ? '' : `, принадлежащую промежутку $${promezhutok}$`;
  return `Найдите точку ${SLOVO_TOCHKI[cel]} функции $${fn}$${prom}.`;
}

function uslovieOtrezka(cel: Cel, fn: string, a: string, b: string, slovo = 'отрезке'): string {
  return `Найдите ${SLOVO_ZNACH[cel]} значение функции $${fn}$ на ${slovo} $${otrezokTex(a, b)}$.`;
}

function uslovieBezOtrezka(cel: Cel, fn: string): string {
  return `Найдите ${SLOVO_ZNACH[cel]} значение функции $${fn}$.`;
}

/** Варианты ответа подсказки: верный и три других, без повторов. */
function varianty(
  verno: number,
  drugie: readonly number[],
): { options: string[]; correct: number } {
  const set: number[] = [verno];
  for (const d of drugie) if (!set.some((x) => Math.abs(x - d) < 1e-9)) set.push(d);
  const options = set.slice(0, 4).map(chislo);
  /* Верный — не всегда первый: место от самого ответа, без случайности. */
  const mesto = Math.abs(Math.round(verno * 7)) % options.length;
  const [v] = options.splice(0, 1);
  options.splice(mesto, 0, v as string);
  return { options, correct: mesto };
}

const HINT_CHTO_TOCHKA: HintStep = {
  question: 'Что нужно записать в ответ?',
  options: ['Точку — значение $x$', 'Значение функции $y$'],
  correct: 0,
  comment: 'Спрашивают точку, поэтому в ответе $x$, а не $y$.',
};

const HINT_CHTO_ZNACH: HintStep = {
  question: 'Что нужно записать в ответ?',
  options: ['Точку — значение $x$', 'Значение функции $y$'],
  correct: 1,
  comment: 'Спрашивают значение, поэтому в ответе $y$, а не $x$.',
};

/* ── Общие схемы разбора ─────────────────────────────────────────── */

interface TochkaOpts {
  cel: Cel;
  fn: string;
  d: string;
  /** Строки этапа «нули производной». */
  nuli: string[];
  /** Нули производной по возрастанию. */
  korni: number[];
  /** Границы интервалов знакопостоянства (нули и выколотые точки). */
  tochki: number[];
  znakiZ: ('+' | '-')[];
  /** Строка об области определения; нет — область вся прямая. */
  odz?: string;
}

/** Точка экстремума по смене знака производной. */
function poZnakam(o: TochkaOpts): Solved {
  const iskat = o.cel === 'max' ? ['+', '-'] : ['-', '+'];
  const i = o.tochki.findIndex((_, j) => o.znakiZ[j] === iskat[0] && o.znakiZ[j + 1] === iskat[1]);
  const answer = o.tochki[i];
  if (answer === undefined) throw new Error(`№21: нет точки ${o.cel} у ${o.fn}`);
  const etapy: Etap[] = [
    {
      title: 'Шаг 1. Производная',
      lines: [...(o.odz === undefined ? [] : [o.odz]), `$y' = ${o.d}$`],
    },
    { title: 'Шаг 2. Нули производной', lines: o.nuli },
    {
      title: 'Шаг 3. Знаки производной',
      lines: [
        `${znaki(o.tochki, o.znakiZ)}.`,
        `В точке $x = ${num(answer)}$ производная меняет знак с «${iskat[0] === '+' ? '+' : '−'}» на «${iskat[1] === '+' ? '+' : '−'}» — это точка ${SLOVO_TOCHKI[o.cel]}.`,
      ],
    },
    { title: 'Ответ', lines: [`$${num(answer)}$`] },
  ];
  const v = varianty(answer, [...o.korni, ...o.korni.map((k) => -k), answer + 1]);
  const hints: HintStep[] = [
    HINT_CHTO_TOCHKA,
    {
      question: 'С чего начать?',
      options: ['Найти производную и её нули', 'Подставить $x = 0$', 'Решить уравнение $y = 0$'],
      correct: 0,
      comment: `$y' = ${o.d}$.`,
    },
    {
      question: `Где производная меняет знак с «${iskat[0] === '+' ? '+' : '−'}» на «${iskat[1] === '+' ? '+' : '−'}»?`,
      options: v.options.map((x) => `$x = ${x.replace(',', '{,}')}$`),
      correct: v.correct,
    },
  ];
  return { answer, funkciya: o.fn, proizvodnaya: o.d, etapy, hints };
}

/** Область поиска для самотеста у двух точек экстремума: искомая — внутри. */
function oblastDvuh(
  p1: number,
  p2: number,
  answer: number,
  levaya = p1 - 3 * (p2 - p1),
  pravaya = p2 + 3 * (p2 - p1),
): [number, number] {
  return answer === p1 ? [levaya, p2] : [p1, pravaya];
}

interface OtrezokOpts {
  cel: Cel;
  fn: string;
  d: string;
  nuli: string[];
  /** Строки этапа «где больше / меньше»: монотонность или сравнение. */
  vybor: string[];
  /** Точка, где достигается ответ. */
  gde: number | string;
  answer: number;
  /** Строки подсчёта значения. */
  schet: string[];
  odz?: string;
  /** Варианты подсказки «в какой точке». */
  tochkiPodskazki: string[];
}

function naOtrezke(o: OtrezokOpts): Solved {
  const etapy: Etap[] = [
    {
      title: 'Шаг 1. Производная',
      lines: [...(o.odz === undefined ? [] : [o.odz]), `$y' = ${o.d}$`],
    },
    { title: 'Шаг 2. Нули производной на отрезке', lines: o.nuli },
    { title: `Шаг 3. Где ${SLOVO_ZNACH[o.cel]} значение`, lines: o.vybor },
    { title: 'Шаг 4. Значение', lines: o.schet },
    { title: 'Ответ', lines: [`$${num(o.answer)}$`] },
  ];
  const gde = typeof o.gde === 'number' ? num(o.gde) : o.gde;
  const opts = [...new Set([gde, ...o.tochkiPodskazki])].slice(0, 4);
  const mesto = Math.abs(Math.round(o.answer * 3)) % opts.length;
  opts.splice(0, 1);
  opts.splice(mesto, 0, gde);
  const hints: HintStep[] = [
    HINT_CHTO_ZNACH,
    {
      question: 'С чего начать?',
      options: [
        'Найти производную и её нули на отрезке',
        'Сразу подставить концы отрезка',
        'Решить уравнение $y = 0$',
      ],
      correct: 0,
      comment: `$y' = ${o.d}$.`,
    },
    {
      question: `В какой точке отрезка функция принимает ${SLOVO_ZNACH[o.cel]} значение?`,
      options: opts.map((t) => `$x = ${t}$`),
      correct: mesto,
    },
  ];
  return { answer: o.answer, funkciya: o.fn, proizvodnaya: o.d, etapy, hints };
}

/** Монотонная внешняя функция: экстремум — в вершине параболы. */
function bezProizvodnoy(o: {
  cel: Cel;
  chto: 'tochka' | 'znachenie';
  fn: string;
  vneshnyaya: string;
  vozrastaet: boolean;
  vnutrennyaya: string;
  h: number;
  /** Значение внутренней функции в вершине, TeX. */
  vVershine: string;
  /** Значение функции, TeX. */
  znachenie: string;
  answer: number;
}): Solved {
  const vnutri = o.vozrastaet === (o.cel === 'max') ? 'наибольшее' : 'наименьшее';
  const etapy: Etap[] = [
    {
      title: 'Шаг 1. Внешняя функция',
      lines: [
        `Функция $${o.vneshnyaya}$ ${o.vozrastaet ? 'возрастает' : 'убывает'}, поэтому $y$ ${SLOVO_ZNACH[o.cel]} там, где ${vnutri} значение выражения $${o.vnutrennyaya}$. Производная не нужна.`,
      ],
    },
    {
      title: 'Шаг 2. Вершина параболы',
      lines: [`Квадратный трёхчлен принимает ${vnutri} значение в вершине: $x_0 = ${num(o.h)}$.`],
    },
    ...(o.chto === 'znachenie'
      ? [
          {
            title: 'Шаг 3. Значение',
            lines: [`$${o.vVershine}$, $y(${num(o.h)}) = ${o.znachenie}$.`],
          },
        ]
      : []),
    { title: 'Ответ', lines: [`$${num(o.answer)}$`] },
  ];
  const v = varianty(o.h, [-o.h, 2 * o.h, o.h + 1]);
  const hints: HintStep[] = [
    o.chto === 'tochka' ? HINT_CHTO_TOCHKA : HINT_CHTO_ZNACH,
    {
      question: 'Как быстрее всего решить?',
      options: [
        'Найти вершину параболы под знаком функции',
        'Подставить $x = 0$',
        'Найти производную сложной функции',
      ],
      correct: 0,
      comment: `Функция $${o.vneshnyaya}$ ${o.vozrastaet ? 'возрастает' : 'убывает'}: экстремум там же, где у трёхчлена.`,
    },
    {
      question: 'Где вершина параболы?',
      options: v.options.map((x) => `$x = ${x.replace(',', '{,}')}$`),
      correct: v.correct,
    },
  ];
  return { answer: o.answer, funkciya: o.fn, proizvodnaya: null, etapy, hints };
}

/** «+5», «-3» или ничего: свободный член в конце формулы. */
const plusC = (c: number): string => (c === 0 ? '' : c < 0 ? `-${num(-c)}` : `+${num(c)}`);

const cel = (r: Rng): Cel => r.pick(['max', 'min'] as const);
const znakOt = (r: Rng, a: number, b: number): number => r.pick([-1, 1]) * r.int(a, b);

/* ── 1. Многочлен ────────────────────────────────────────────────── */

/** Кубический многочлен: формы a (x³ − 3a²x + c), b (c + 3a²x − x³), c (x³ − 3kx² + c). */
function kub(p: Params) {
  const forma = S(p, 'forma');
  const c = N(p, 'c');
  if (forma === 'c') {
    const k = N(p, 'k');
    const t = [Math.min(0, 2 * k), Math.max(0, 2 * k)] as [number, number];
    return {
      fn: `y = ${summa([
        [1, 'x^3'],
        [-3 * k, 'x^2'],
        [c, ''],
      ])}`,
      d: `${summa([
        [3, 'x^2'],
        [-6 * k, 'x'],
      ])} = 3x(${xMinus(2 * k)})`,
      nuli: [`$3x(${xMinus(2 * k)}) = 0$, $x = 0$ или $x = ${num(2 * k)}$.`],
      t,
      z: ['+', '-', '+'] as ('+' | '-')[],
      f: (x: number) => x ** 3 - 3 * k * x * x + c,
    };
  }
  const a = N(p, 'a');
  const a2 = a * a;
  const t = [-a, a] as [number, number];
  const nuli = [`$x^2 = ${a2}$, $x = ${-a}$ или $x = ${a}$.`];
  if (forma === 'a') {
    return {
      fn: `y = ${summa([
        [1, 'x^3'],
        [-3 * a2, 'x'],
        [c, ''],
      ])}`,
      d: summa([
        [3, 'x^2'],
        [-3 * a2, ''],
      ]),
      nuli,
      t,
      z: ['+', '-', '+'] as ('+' | '-')[],
      f: (x: number) => x ** 3 - 3 * a2 * x + c,
    };
  }
  return {
    fn: `y = ${summa([
      [c, ''],
      [3 * a2, 'x'],
      [-1, 'x^3'],
    ])}`,
    d: summa([
      [3 * a2, ''],
      [-3, 'x^2'],
    ]),
    nuli,
    t,
    z: ['-', '+', '-'] as ('+' | '-')[],
    f: (x: number) => c + 3 * a2 * x - x ** 3,
  };
}

const P01: Prototype = {
  id: 'P01',
  vid: 1,
  vopros: 'A',
  title: 'Точка экстремума многочлена',
  primer: 'y = x^3 - 75x + 19',
  gen: (r): Params => {
    const forma = r.pick(['a', 'b', 'c'] as const);
    return forma === 'c'
      ? { forma, k: znakOt(r, 1, 6), c: r.int(-20, 30), cel: cel(r) }
      : { forma, a: r.int(2, 9), c: r.int(-20, 30), cel: cel(r) };
  },
  uslovie: (p) => uslovieTochki(S(p, 'cel') as Cel, kub(p).fn),
  solve: (p) => {
    const k = kub(p);
    return poZnakam({
      cel: S(p, 'cel') as Cel,
      fn: k.fn,
      d: k.d,
      nuli: k.nuli,
      korni: k.t,
      tochki: k.t,
      znakiZ: k.z,
    });
  },
  chisla: (p) => {
    const k = kub(p);
    const s = solveCache(P01, p).answer;
    return {
      f: k.f,
      otrezok: oblastDvuh(k.t[0], k.t[1], s),
      cel: S(p, 'cel') as Cel,
      chto: 'tochka',
    };
  },
};

const P02: Prototype = {
  id: 'P02',
  vid: 1,
  vopros: 'B',
  title: 'Наибольшее и наименьшее значение многочлена на отрезке',
  primer: 'y = 7 + 12x - x^3,\\ [-2;\\,2]',
  gen: (r): Params => {
    const a = r.int(2, 5);
    return {
      forma: r.pick(['a', 'b'] as const),
      a,
      b: r.int(a, 2 * a - 1),
      c: r.int(-15, 25),
      cel: cel(r),
    };
  },
  uslovie: (p) => uslovieOtrezka(S(p, 'cel') as Cel, kub(p).fn, num(-N(p, 'b')), num(N(p, 'b'))),
  solve: (p) => {
    const k = kub(p);
    const a = N(p, 'a');
    const b = N(p, 'b');
    const ce = S(p, 'cel') as Cel;
    /* Форма a: максимум в −a, минимум в a; форма b — наоборот. */
    const vMax = S(p, 'forma') === 'a' ? -a : a;
    const gde = ce === 'max' ? vMax : -vMax;
    const answer = k.f(gde);
    /* Соперник — конец отрезка с той же стороны, где функция уходит дальше. */
    const konec = ce === 'max' ? (S(p, 'forma') === 'a' ? b : -b) : S(p, 'forma') === 'a' ? -b : b;
    return naOtrezke({
      cel: ce,
      fn: k.fn,
      d: k.d,
      nuli: [...k.nuli, `Обе точки лежат на отрезке $${otrezokTex(num(-b), num(b))}$.`],
      vybor: [
        `${znaki(k.t, k.z)}.`,
        `${ce === 'max' ? 'Наибольшее' : 'Наименьшее'} значение — в точке ${ce === 'max' ? 'максимума' : 'минимума'} $x = ${num(gde)}$ или на конце $x = ${num(konec)}$. Сравним: $y(${num(gde)}) = ${num(answer)}$, $y(${num(konec)}) = ${num(k.f(konec))}$.`,
      ],
      gde,
      answer,
      schet: [`$y(${num(gde)}) = ${num(answer)}$.`],
      tochkiPodskazki: [num(-gde), num(konec), num(-konec)],
    });
  },
  chisla: (p) => ({
    f: kub(p).f,
    otrezok: [-N(p, 'b'), N(p, 'b')],
    cel: S(p, 'cel') as Cel,
    chto: 'znachenie',
  }),
};

/* ── 2. Степенная с корнем ───────────────────────────────────────── */

function koren(p: Params) {
  const c = N(p, 'c');
  if (S(p, 'forma') === 'max') {
    const m = N(p, 'm');
    const t = N(p, 't');
    const k = (3 * m * t) / 2;
    return {
      fn: `y = ${summa([
        [c, ''],
        [k, 'x'],
        [-m, 'x\\sqrt{x}'],
      ])}`,
      d: summa([
        [k, ''],
        [-1.5 * m, '\\sqrt{x}'],
      ]),
      x0: t * t,
      f: (x: number) => c + k * x - m * x * Math.sqrt(x),
      z: ['+', '-'] as ('+' | '-')[],
      kor: `$\\sqrt{x} = ${num(t)}$, $x = ${num(t * t)}$.`,
    };
  }
  const k = N(p, 'k');
  return {
    fn: `y = ${summa([
      [1, '\\frac{2}{3}x\\sqrt{x}'],
      [-k, 'x'],
      [c, ''],
    ])}`,
    d: summa([
      [1, '\\sqrt{x}'],
      [-k, ''],
    ]),
    x0: k * k,
    f: (x: number) => (2 / 3) * x * Math.sqrt(x) - k * x + c,
    z: ['-', '+'] as ('+' | '-')[],
    kor: `$\\sqrt{x} = ${num(k)}$, $x = ${num(k * k)}$.`,
  };
}

const P03: Prototype = {
  id: 'P03',
  vid: 2,
  vopros: 'B',
  title: 'Функция с корнем на отрезке',
  primer: 'y = 13 + 30x - 4x\\sqrt{x},\\ [23;\\,33]',
  gen: (r): Params => {
    const forma = r.pick(['max', 'min'] as const);
    if (forma === 'max') {
      const t = r.int(2, 6);
      return { forma, m: r.pick([2, 4]), t, c: r.int(-10, 20), d1: r.int(1, 3), d2: r.int(2, 8) };
    }
    const k = r.pick([3, 6]);
    return { forma, k, c: r.int(-10, 20), d1: r.int(1, 5), d2: r.int(3, 20) };
  },
  uslovie: (p) => {
    const k = koren(p);
    return uslovieOtrezka(
      S(p, 'forma') as Cel,
      k.fn,
      num(Math.max(0, k.x0 - N(p, 'd1'))),
      num(k.x0 + N(p, 'd2')),
    );
  },
  solve: (p) => {
    const k = koren(p);
    const ce = S(p, 'forma') as Cel;
    const a = Math.max(0, k.x0 - N(p, 'd1'));
    const b = k.x0 + N(p, 'd2');
    const answer = k.f(k.x0);
    return naOtrezke({
      cel: ce,
      fn: k.fn,
      d: k.d,
      odz: 'Область определения: $x \\ge 0$.',
      nuli: [k.kor, `Точка лежит на отрезке $${otrezokTex(num(a), num(b))}$.`],
      vybor: [
        `${znaki([k.x0], k.z).replace(/\(-\\infty;\\,/, '(0;\\,')}.`,
        `Единственная точка ${ce === 'max' ? 'максимума' : 'минимума'} на отрезке — в ней и ${SLOVO_ZNACH[ce]} значение.`,
      ],
      gde: k.x0,
      answer,
      schet: [
        `$y(${num(k.x0)}) = ${num(answer)}$ ($x\\sqrt{x} = ${num(k.x0 * Math.sqrt(k.x0))}$).`,
      ],
      tochkiPodskazki: [num(a), num(b), num(Math.sqrt(k.x0))],
    });
  },
  chisla: (p) => {
    const k = koren(p);
    return {
      f: k.f,
      otrezok: [Math.max(0, k.x0 - N(p, 'd1')), k.x0 + N(p, 'd2')],
      cel: S(p, 'forma') as Cel,
      chto: 'znachenie',
    };
  },
};

/* ── 3. Дробно-рациональная ─────────────────────────────────────── */

function drob(p: Params) {
  const a = N(p, 'a');
  const a2 = a * a;
  const c = N(p, 'c');
  switch (S(p, 'forma')) {
    case 'a':
      return {
        fn: `y = ${summa([
          [1, 'x'],
          [1, `\\frac{${a2}}{x}`],
          [c, ''],
        ])}`,
        d: `1-\\frac{${a2}}{x^2} = \\frac{x^2-${a2}}{x^2}`,
        t: [-a, 0, a],
        z: ['+', '-', '-', '+'] as ('+' | '-')[],
        f: (x: number) => x + a2 / x + c,
        odz: 'Область определения: $x \\ne 0$.',
      };
    case 'b':
      return {
        fn: `y = -\\frac{x^2+${a2}}{x}`,
        d: `-1+\\frac{${a2}}{x^2} = \\frac{${a2}-x^2}{x^2}`,
        t: [-a, 0, a],
        z: ['-', '+', '+', '-'] as ('+' | '-')[],
        f: (x: number) => -(x * x + a2) / x,
        odz: 'Область определения: $x \\ne 0$. Удобно записать $y = -x - \\frac{' + a2 + '}{x}$.',
      };
    case 'c':
      return {
        fn: `y = -\\frac{x}{x^2+${a2}}`,
        d: `-\\frac{(x^2+${a2})-x\\cdot 2x}{(x^2+${a2})^2} = \\frac{x^2-${a2}}{(x^2+${a2})^2}`,
        t: [-a, a],
        z: ['+', '-', '+'] as ('+' | '-')[],
        f: (x: number) => -x / (x * x + a2),
        odz: undefined,
      };
    default:
      return {
        fn: `y = \\frac{x}{x^2+${a2}}`,
        d: `\\frac{(x^2+${a2})-x\\cdot 2x}{(x^2+${a2})^2} = \\frac{${a2}-x^2}{(x^2+${a2})^2}`,
        t: [-a, a],
        z: ['-', '+', '-'] as ('+' | '-')[],
        f: (x: number) => x / (x * x + a2),
        odz: undefined,
      };
  }
}

const P04: Prototype = {
  id: 'P04',
  vid: 3,
  vopros: 'A',
  title: 'Точка экстремума дробной функции',
  primer: 'y = \\frac{49}{x} + x + 11',
  gen: (r): Params => {
    const forma = r.pick(['a', 'b', 'c', 'd'] as const);
    return {
      forma,
      a: forma === 'a' || forma === 'b' ? r.int(2, 13) : r.int(3, 21),
      c: forma === 'a' ? r.int(-5, 15) : 0,
      cel: cel(r),
    };
  },
  uslovie: (p) => uslovieTochki(S(p, 'cel') as Cel, drob(p).fn),
  solve: (p) => {
    const d = drob(p);
    const a = N(p, 'a');
    return poZnakam({
      cel: S(p, 'cel') as Cel,
      fn: d.fn,
      d: d.d,
      odz: d.odz,
      nuli: [`$x^2 = ${a * a}$, $x = ${-a}$ или $x = ${a}$.`],
      korni: [-a, a],
      tochki: d.t,
      znakiZ: d.z,
    });
  },
  chisla: (p) => {
    const d = drob(p);
    const a = N(p, 'a');
    const s = solveCache(P04, p).answer;
    const razryv = d.t.length === 3;
    return {
      f: d.f,
      otrezok: razryv ? (s < 0 ? [-5 * a, -0.2 * a] : [0.2 * a, 5 * a]) : [-5 * a, 5 * a],
      cel: S(p, 'cel') as Cel,
      chto: 'tochka',
    };
  },
};

const P05: Prototype = {
  id: 'P05',
  vid: 3,
  vopros: 'B',
  title: 'Дробная функция на отрезке',
  primer: 'y = x + \\frac{64}{x} + 13,\\ [0{,}5;\\,19]',
  gen: (r): Params => {
    const a = r.int(2, 10);
    return {
      forma: r.pick(['summa', 'drob'] as const),
      a,
      c: r.pick([0, 0, r.int(-5, 15)]),
      p: r.pick([1, Math.max(1, a - r.int(1, 3)), a / 2]),
      q: a + r.int(1, a + 6),
      cel: cel(r),
    };
  },
  uslovie: (p) => {
    const { fn, a, b } = drob5(p);
    return uslovieOtrezka(S(p, 'cel') as Cel, fn, num(a), num(b));
  },
  solve: (p) => {
    const { fn, a, b, x0, f } = drob5(p);
    const ce = S(p, 'cel') as Cel;
    const aa = N(p, 'a');
    const answer = f(x0);
    return naOtrezke({
      cel: ce,
      fn,
      d: `1-\\frac{${aa * aa}}{x^2} = \\frac{x^2-${aa * aa}}{x^2}`,
      odz: 'Область определения: $x \\ne 0$; отрезок в неё входит.',
      nuli: [
        `$x = ${-aa}$ или $x = ${aa}$. На отрезке $${otrezokTex(num(a), num(b))}$ — только $x = ${num(x0)}$.`,
      ],
      vybor: [
        ce === 'min'
          ? `Слева от $x = ${num(x0)}$ $y'<0$, справа $y'>0$: это точка минимума, единственная на отрезке.`
          : `Слева от $x = ${num(x0)}$ $y'>0$, справа $y'<0$: это точка максимума, единственная на отрезке.`,
      ],
      gde: x0,
      answer,
      schet: [`$y(${num(x0)}) = ${num(answer)}$.`],
      tochkiPodskazki: [num(a), num(b), num(-x0)],
    });
  },
  chisla: (p) => {
    const { a, b, f } = drob5(p);
    return { f, otrezok: [a, b], cel: S(p, 'cel') as Cel, chto: 'znachenie' };
  },
};

/** P05: при поиске максимума отрезок — отрицательный, зеркально. */
function drob5(p: Params) {
  const aa = N(p, 'a');
  const a2 = aa * aa;
  const c = N(p, 'c');
  const fn =
    S(p, 'forma') === 'drob' && c === 0
      ? `y = \\frac{x^2+${a2}}{x}`
      : `y = ${summa([
          [1, 'x'],
          [1, `\\frac{${a2}}{x}`],
          [c, ''],
        ])}`;
  const f = (x: number) => x + a2 / x + c;
  const lo = N(p, 'p');
  const hi = N(p, 'q');
  return S(p, 'cel') === 'min'
    ? { fn, a: lo, b: hi, x0: aa, f }
    : { fn, a: -hi, b: -lo, x0: -aa, f };
}

/* ── 4. Произведение с e^x ──────────────────────────────────────── */

function expPokaz(b: number, minusX: boolean): string {
  return minusX
    ? summa([
        [b, ''],
        [-1, 'x'],
      ])
    : summa([
        [1, 'x'],
        [b, ''],
      ]);
}

function proizv(p: Params) {
  const forma = S(p, 'forma');
  const b = N(p, 'b');
  if (forma === 'lin') {
    /* (a − x)e^{x+b}: максимум в a − 1; (x − a)e^{x+b}: минимум в a − 1. */
    const a = N(p, 'a');
    const max = S(p, 'cel') === 'max';
    const mnozh = max
      ? summa([
          [a, ''],
          [-1, 'x'],
        ])
      : xMinus(a);
    return {
      fn: `y = (${mnozh})e^{${expPokaz(b, false)}}`,
      d: `${max ? '-' : ''}e^{${expPokaz(b, false)}}+(${mnozh})e^{${expPokaz(b, false)}} = (${
        max
          ? summa([
              [a - 1, ''],
              [-1, 'x'],
            ])
          : xMinus(a - 1)
      })e^{${expPokaz(b, false)}}`,
      t: [a - 1],
      z: (max ? ['+', '-'] : ['-', '+']) as ('+' | '-')[],
      f: (x: number) => (max ? a - x : x - a) * Math.exp(x + b),
      nuli: [`$e^{${expPokaz(b, false)}} > 0$, поэтому $y' = 0$ при $x = ${num(a - 1)}$.`],
    };
  }
  if (forma === 'kv') {
    /* (x + a)²e^{x+b}: нули −a−2 (max), −a (min). */
    const a = N(p, 'a');
    const xa = summa([
      [1, 'x'],
      [a, ''],
    ]);
    return {
      fn: `y = (${xa})^2e^{${expPokaz(b, false)}}`,
      d: `2(${xa})e^{${expPokaz(b, false)}}+(${xa})^2e^{${expPokaz(b, false)}} = (${xa})(${summa([
        [1, 'x'],
        [a + 2, ''],
      ])})e^{${expPokaz(b, false)}}`,
      t: [-a - 2, -a],
      z: ['+', '-', '+'] as ('+' | '-')[],
      f: (x: number) => (x + a) ** 2 * Math.exp(x + b),
      nuli: [
        `$e^{${expPokaz(b, false)}} > 0$, поэтому $y' = 0$ при $x = ${num(-a - 2)}$ или $x = ${num(-a)}$.`,
      ],
    };
  }
  /* (x² + px + q)e^{b−x}: y' = −(x − r1)(x − r2)e^{b−x}. */
  const r1 = N(p, 'r1');
  const r2 = N(p, 'r2');
  const pp = 2 - r1 - r2;
  const q = pp + r1 * r2;
  return {
    fn: `y = (${summa([
      [1, 'x^2'],
      [pp, 'x'],
      [q, ''],
    ])})e^{${expPokaz(b, true)}}`,
    d: `(${summa([
      [2, 'x'],
      [pp, ''],
    ])})e^{${expPokaz(b, true)}}-(${summa([
      [1, 'x^2'],
      [pp, 'x'],
      [q, ''],
    ])})e^{${expPokaz(b, true)}} = -(${summa([
      [1, 'x^2'],
      [-(r1 + r2), 'x'],
      [r1 * r2, ''],
    ])})e^{${expPokaz(b, true)}}`,
    t: [r1, r2],
    z: ['-', '+', '-'] as ('+' | '-')[],
    f: (x: number) => (x * x + pp * x + q) * Math.exp(b - x),
    nuli: [
      `$e^{${expPokaz(b, true)}} > 0$, поэтому $${summa([
        [1, 'x^2'],
        [-(r1 + r2), 'x'],
        [r1 * r2, ''],
      ])} = 0$: $x = ${num(r1)}$ или $x = ${num(r2)}$.`,
    ],
  };
}

const P06: Prototype = {
  id: 'P06',
  vid: 4,
  vopros: 'A',
  title: 'Точка экстремума произведения с $e^x$',
  primer: 'y = (x^2 - 10x + 10)e^{5 - x}',
  gen: (r): Params => {
    const forma = r.pick(['lin', 'kv', 'tri'] as const);
    if (forma === 'lin') return { forma, a: znakOt(r, 1, 60), b: znakOt(r, 1, 60), cel: cel(r) };
    if (forma === 'kv') return { forma, a: znakOt(r, 1, 20), b: znakOt(r, 1, 20), cel: cel(r) };
    const r1 = r.int(-8, 8);
    return { forma, r1, r2: r1 + r.int(2, 12), b: r.int(-10, 10), cel: cel(r) };
  },
  uslovie: (p) => uslovieTochki(S(p, 'cel') as Cel, proizv(p).fn),
  solve: (p) => {
    const e = proizv(p);
    return poZnakam({
      cel: S(p, 'cel') as Cel,
      fn: e.fn,
      d: e.d,
      nuli: e.nuli,
      korni: e.t,
      tochki: e.t,
      znakiZ: e.z,
    });
  },
  chisla: (p) => {
    const e = proizv(p);
    const s = solveCache(P06, p).answer;
    const [t0 = 0, t1] = e.t;
    return {
      f: e.f,
      otrezok: t1 === undefined ? [t0 - 6, t0 + 6] : oblastDvuh(t0, t1, s, t0 - 4, t1 + 4),
      cel: S(p, 'cel') as Cel,
      chto: 'tochka',
    };
  },
};

function proizv7(p: Params) {
  const a = N(p, 'a');
  const c = N(p, 'c');
  if (S(p, 'forma') === 'kv') {
    /* (x + a)²e^{2 − a − x} + c: максимум в 2 − a, значение 4 + c. */
    const xa = summa([
      [1, 'x'],
      [a, ''],
    ]);
    const pok = summa([
      [2 - a, ''],
      [-1, 'x'],
    ]);
    return {
      fn: `y = (${xa})^2e^{${pok}}${plusC(c)}`,
      d: `2(${xa})e^{${pok}}-(${xa})^2e^{${pok}} = (${xa})(${summa([
        [2 - a, ''],
        [-1, 'x'],
      ])})e^{${pok}}`,
      x0: 2 - a,
      lo: -a,
      hi: -a + N(p, 'd'),
      f: (x: number) => (x + a) ** 2 * Math.exp(2 - a - x) + c,
      cel: 'max' as Cel,
      nuli: `$x = ${num(-a)}$ или $x = ${num(2 - a)}$.`,
    };
  }
  const max = S(p, 'forma') === 'max';
  const pok = summa([
    [1, 'x'],
    [1 - a, ''],
  ]);
  const mnozh = max
    ? summa([
        [a, ''],
        [-1, 'x'],
      ])
    : xMinus(a);
  return {
    fn: `y = (${mnozh})e^{${pok}}${plusC(c)}`,
    d: `(${
      max
        ? summa([
            [a - 1, ''],
            [-1, 'x'],
          ])
        : xMinus(a - 1)
    })e^{${pok}}`,
    x0: a - 1,
    lo: a - 1 - N(p, 'd'),
    hi: a + 1,
    f: (x: number) => (max ? a - x : x - a) * Math.exp(x + 1 - a) + c,
    cel: (max ? 'max' : 'min') as Cel,
    nuli: `$x = ${num(a - 1)}$.`,
  };
}

const P07: Prototype = {
  id: 'P07',
  vid: 4,
  vopros: 'B',
  title: 'Произведение с $e^x$ на отрезке',
  primer: 'y = (x + 6)^2e^{-4 - x},\\ [-6;\\,-1]',
  gen: (r): Params => {
    const forma = r.pick(['kv', 'max', 'min'] as const);
    return { forma, a: znakOt(r, 1, 15), c: r.pick([0, 0, r.int(-6, 10)]), d: r.int(3, 6) };
  },
  uslovie: (p) => {
    const e = proizv7(p);
    return uslovieOtrezka(e.cel, e.fn, num(e.lo), num(e.hi));
  },
  solve: (p) => {
    const e = proizv7(p);
    const answer = e.f(e.x0);
    return naOtrezke({
      cel: e.cel,
      fn: e.fn,
      d: e.d,
      nuli: [`Показательный множитель больше нуля, поэтому ${e.nuli}`],
      vybor: [
        `Слева от $x = ${num(e.x0)}$ $y'${e.cel === 'max' ? '>' : '<'}0$, справа $y'${e.cel === 'max' ? '<' : '>'}0$: это точка ${e.cel === 'max' ? 'максимума' : 'минимума'}, единственная внутри отрезка.`,
      ],
      gde: e.x0,
      answer,
      schet: [
        `Показатель степени в этой точке равен нулю, $e^0 = 1$: $y(${num(e.x0)}) = ${num(answer)}$.`,
      ],
      tochkiPodskazki: [num(e.lo), num(e.hi), num(-e.x0)],
    });
  },
  chisla: (p) => {
    const e = proizv7(p);
    return { f: e.f, otrezok: [e.lo, e.hi], cel: e.cel, chto: 'znachenie' };
  },
};

/* ── 5. Логарифм ─────────────────────────────────────────────────── */

const lnx = (a: number): string =>
  `\\ln(${summa([
    [1, 'x'],
    [a, ''],
  ])})`;

const P08: Prototype = {
  id: 'P08',
  vid: 5,
  vopros: 'B',
  title: 'Линейная функция и $\\ln(x + a)$ на отрезке',
  primer: 'y = 10x - 10\\ln(x + 4) + 23,\\ [-3{,}5;\\,0]',
  gen: (r): Params => ({
    forma: r.pick(['min', 'max'] as const),
    k: r.int(2, 12),
    a: r.int(2, 9),
    c: r.int(-10, 25),
    d: r.int(1, 4),
  }),
  uslovie: (p) => {
    const l = log8(p);
    return uslovieOtrezka(l.cel, l.fn, num(l.lo), num(l.hi));
  },
  solve: (p) => {
    const l = log8(p);
    const answer = l.f(l.x0);
    return naOtrezke({
      cel: l.cel,
      fn: l.fn,
      d: l.d,
      odz: `Область определения: $x > ${num(-N(p, 'a'))}$; отрезок в неё входит.`,
      nuli: [
        `$\\frac{1}{${summa([
          [1, 'x'],
          [N(p, 'a'), ''],
        ])}} = 1$, $x = ${num(l.x0)}$ — на отрезке.`,
      ],
      vybor: [
        `Слева от $x = ${num(l.x0)}$ $y'${l.cel === 'max' ? '>' : '<'}0$, справа $y'${l.cel === 'max' ? '<' : '>'}0$: точка ${l.cel === 'max' ? 'максимума' : 'минимума'}.`,
      ],
      gde: l.x0,
      answer,
      schet: [`$\\ln 1 = 0$: $y(${num(l.x0)}) = ${num(answer)}$.`],
      tochkiPodskazki: [num(l.lo), num(l.hi), num(-N(p, 'a'))],
    });
  },
  chisla: (p) => {
    const l = log8(p);
    return { f: l.f, otrezok: [l.lo, l.hi], cel: l.cel, chto: 'znachenie' };
  },
};

function log8(p: Params) {
  const k = N(p, 'k');
  const a = N(p, 'a');
  const c = N(p, 'c');
  const min = S(p, 'forma') === 'min';
  const xa = summa([
    [1, 'x'],
    [a, ''],
  ]);
  return {
    cel: (min ? 'min' : 'max') as Cel,
    fn: min
      ? `y = ${summa([
          [k, 'x'],
          [-k, lnx(a)],
          [c, ''],
        ])}`
      : `y = ${summa([
          [k, lnx(a)],
          [-k, 'x'],
          [c, ''],
        ])}`,
    d: min ? `${k}-\\frac{${k}}{${xa}}` : `\\frac{${k}}{${xa}}-${k}`,
    x0: 1 - a,
    lo: -a + 0.5,
    hi: 1 - a + N(p, 'd'),
    f: (x: number) => (min ? k * x - k * Math.log(x + a) + c : k * Math.log(x + a) - k * x + c),
  };
}

const P09: Prototype = {
  id: 'P09',
  vid: 5,
  vopros: 'B',
  title: 'Линейная функция и $\\ln(kx)$ на отрезке',
  primer: 'y = \\ln(12x) - 12x + 16,\\ \\left[\\frac{1}{24};\\,\\frac{5}{24}\\right]',
  gen: (r): Params => ({
    forma: r.pick(['min', 'max'] as const),
    k: r.int(2, 18),
    c: r.int(-10, 25),
  }),
  uslovie: (p) => {
    const k = N(p, 'k');
    const l = log9(p);
    return uslovieOtrezka(
      l.cel,
      l.fn,
      `\\frac{1}{${2 * k}}`,
      `\\frac{5}{${2 * k}}`,
      l.cel === 'min' ? 'промежутке' : 'отрезке',
    );
  },
  solve: (p) => {
    const k = N(p, 'k');
    const l = log9(p);
    const answer = l.f(1 / k);
    return naOtrezke({
      cel: l.cel,
      fn: l.fn,
      d: l.d,
      odz: 'Область определения: $x > 0$; отрезок в неё входит.',
      nuli: [
        `$\\frac{1}{x} = ${k}$, $x = \\frac{1}{${k}}$ — на отрезке: $\\frac{1}{${2 * k}} < \\frac{2}{${2 * k}} < \\frac{5}{${2 * k}}$.`,
      ],
      vybor: [
        `Слева от $x = \\frac{1}{${k}}$ $y'${l.cel === 'max' ? '>' : '<'}0$, справа $y'${l.cel === 'max' ? '<' : '>'}0$: точка ${l.cel === 'max' ? 'максимума' : 'минимума'}.`,
      ],
      gde: `\\frac{1}{${k}}`,
      answer,
      schet: [`$${k}\\cdot\\frac{1}{${k}} = 1$, $\\ln 1 = 0$: $y = ${num(answer)}$.`],
      tochkiPodskazki: [`\\frac{1}{${2 * k}}`, `\\frac{5}{${2 * k}}`, `${k}`],
    });
  },
  chisla: (p) => {
    const k = N(p, 'k');
    const l = log9(p);
    return { f: l.f, otrezok: [1 / (2 * k), 5 / (2 * k)], cel: l.cel, chto: 'znachenie' };
  },
};

function log9(p: Params) {
  const k = N(p, 'k');
  const c = N(p, 'c');
  const min = S(p, 'forma') === 'min';
  return {
    cel: (min ? 'min' : 'max') as Cel,
    fn: min
      ? `y = ${summa([
          [k, 'x'],
          [-1, `\\ln(${k}x)`],
          [c, ''],
        ])}`
      : `y = ${summa([
          [1, `\\ln(${k}x)`],
          [-k, 'x'],
          [c, ''],
        ])}`,
    d: min ? `${k}-\\frac{1}{x}` : `\\frac{1}{x}-${k}`,
    f: (x: number) => (min ? k * x - Math.log(k * x) + c : Math.log(k * x) - k * x + c),
  };
}

const P10: Prototype = {
  id: 'P10',
  vid: 5,
  vopros: 'A',
  title: 'Точка экстремума: многочлен и $\\ln x$',
  primer: 'y = x^2 - 22x + 48\\ln x - 10',
  gen: (r): Params => {
    const r1 = r.int(1, 8);
    return { r1, r2: r1 + r.int(1, 9), c: r.int(-15, 15), cel: cel(r) };
  },
  uslovie: (p) => uslovieTochki(S(p, 'cel') as Cel, log10(p).fn),
  solve: (p) => {
    const r1 = N(p, 'r1');
    const r2 = N(p, 'r2');
    const l = log10(p);
    return poZnakam({
      cel: S(p, 'cel') as Cel,
      fn: l.fn,
      d: l.d,
      odz: 'Область определения: $x > 0$.',
      nuli: [
        `$x^2 - ${r1 + r2}x + ${r1 * r2} = 0$: $x = ${r1}$ или $x = ${r2}$ — оба больше нуля.`,
      ],
      korni: [r1, r2],
      tochki: [r1, r2],
      znakiZ: ['+', '-', '+'],
    });
  },
  chisla: (p) => {
    const r1 = N(p, 'r1');
    const r2 = N(p, 'r2');
    return {
      f: log10(p).f,
      otrezok: oblastDvuh(r1, r2, solveCache(P10, p).answer, r1 / 4, r2 + 3 * (r2 - r1)),
      cel: S(p, 'cel') as Cel,
      chto: 'tochka',
    };
  },
};

function log10(p: Params) {
  const r1 = N(p, 'r1');
  const r2 = N(p, 'r2');
  const c = N(p, 'c');
  return {
    fn: `y = ${summa([
      [1, 'x^2'],
      [-2 * (r1 + r2), 'x'],
      [2 * r1 * r2, '\\ln x'],
      [c, ''],
    ])}`,
    d: `2x - ${2 * (r1 + r2)} + \\frac{${2 * r1 * r2}}{x} = \\frac{2(x^2 - ${r1 + r2}x + ${r1 * r2})}{x}`,
    f: (x: number) => x * x - 2 * (r1 + r2) * x + 2 * r1 * r2 * Math.log(x) + c,
  };
}

function lnStep(p: Params) {
  const n = N(p, 'n');
  const a = N(p, 'a');
  const c = N(p, 'c');
  const xa = summa([
    [1, 'x'],
    [a, ''],
  ]);
  return {
    fn: `y = ${summa([
      [1, `\\ln(${xa})^{${n}}`],
      [-n, 'x'],
      [c, ''],
    ])}`,
    d: `\\frac{${n}}{${xa}}-${n}`,
    x0: 1 - a,
    f: (x: number) => n * Math.log(Math.abs(x + a)) - n * x + c,
    a,
    n,
  };
}

const P11: Prototype = {
  id: 'P11',
  vid: 5,
  vopros: 'A',
  title: 'Точка максимума: $\\ln(x + a)^n$ и линейная функция',
  primer: 'y = \\ln(x + 9)^8 - 8x + 5',
  gen: (r): Params => ({ n: r.int(2, 11), a: znakOt(r, 1, 15), c: r.int(-10, 15) }),
  uslovie: (p) => uslovieTochki('max', lnStep(p).fn),
  solve: (p) => {
    const l = lnStep(p);
    return poZnakam({
      cel: 'max',
      fn: l.fn,
      d: l.d,
      odz: `$\\ln(x + a)^{n} = n\\ln|x + a|$; рассматриваем $x > ${num(-l.a)}$ — левее функция только убывает.`,
      nuli: [
        `$\\frac{1}{${summa([
          [1, 'x'],
          [l.a, ''],
        ])}} = 1$, $x = ${num(l.x0)}$.`,
      ],
      korni: [l.x0],
      tochki: [l.x0],
      znakiZ: ['+', '-'],
    });
  },
  chisla: (p) => {
    const l = lnStep(p);
    return { f: l.f, otrezok: [-l.a + 0.05, l.x0 + 6], cel: 'max', chto: 'tochka' };
  },
};

const P12: Prototype = {
  id: 'P12',
  vid: 5,
  vopros: 'B',
  title: 'Наибольшее значение: $\\ln(x + a)^n$ и линейная функция',
  primer: 'y = \\ln(x + 5)^5 - 5x,\\ [-4{,}5;\\,0]',
  gen: (r): Params => ({ n: r.int(2, 11), a: r.int(2, 12), c: r.int(-10, 15), d: r.int(1, 4) }),
  uslovie: (p) => {
    const l = lnStep(p);
    return uslovieOtrezka('max', l.fn, num(-l.a + 0.5), num(l.x0 + N(p, 'd')));
  },
  solve: (p) => {
    const l = lnStep(p);
    const answer = l.f(l.x0);
    const lo = -l.a + 0.5;
    const hi = l.x0 + N(p, 'd');
    return naOtrezke({
      cel: 'max',
      fn: l.fn,
      d: l.d,
      odz: `На отрезке $x + ${l.a} > 0$, и $\\ln(x + ${l.a})^{${l.n}} = ${l.n}\\ln(x + ${l.a})$.`,
      nuli: [
        `$\\frac{1}{${summa([
          [1, 'x'],
          [l.a, ''],
        ])}} = 1$, $x = ${num(l.x0)}$ — на отрезке.`,
      ],
      vybor: [`Слева от $x = ${num(l.x0)}$ $y'>0$, справа $y'<0$: точка максимума.`],
      gde: l.x0,
      answer,
      schet: [`$\\ln 1 = 0$: $y(${num(l.x0)}) = ${num(answer)}$.`],
      tochkiPodskazki: [num(lo), num(hi), num(-l.a)],
    });
  },
  chisla: (p) => {
    const l = lnStep(p);
    return { f: l.f, otrezok: [-l.a + 0.5, l.x0 + N(p, 'd')], cel: 'max', chto: 'znachenie' };
  },
};

/* ── 6. Тригонометрическая ──────────────────────────────────────── */

const P13: Prototype = {
  id: 'P13',
  vid: 6,
  vopros: 'B',
  title: 'Косинус и линейная функция на отрезке',
  primer: 'y = 8\\cos x + 9x - 11,\\ \\left[-\\frac{3\\pi}{2};\\,0\\right]',
  gen: (r): Params => {
    const forma = r.pick(['vozr', 'pi'] as const);
    if (forma === 'vozr') {
      const A = r.int(2, 12);
      return { forma, A, B: A + r.int(1, 6), c: r.int(-15, 15) };
    }
    const A = r.pick([2, 4, 6, 8]);
    return {
      forma,
      A,
      K: 3 * r.int(Math.ceil((4 * A) / 3) + 1, 3 * A),
      c: r.int(-15, 15),
      cel: cel(r),
    };
  },
  uslovie: (p) => {
    const t = trig13(p);
    return uslovieOtrezka(t.cel, t.fn, t.lo, t.hi);
  },
  solve: (p) => {
    const t = trig13(p);
    return naOtrezke({
      cel: t.cel,
      fn: t.fn,
      d: t.d,
      nuli: t.nuli,
      vybor: t.vybor,
      gde: t.gde,
      answer: t.answer,
      schet: t.schet,
      tochkiPodskazki: t.drugie,
    });
  },
  chisla: (p) => {
    const t = trig13(p);
    return { f: t.f, otrezok: t.otr, cel: t.cel, chto: 'znachenie' };
  },
};

function trig13(p: Params) {
  const A = N(p, 'A');
  const c = N(p, 'c');
  if (S(p, 'forma') === 'vozr') {
    const B = N(p, 'B');
    return {
      cel: 'max' as Cel,
      fn: `y = ${summa([
        [A, '\\cos x'],
        [B, 'x'],
        [c, ''],
      ])}`,
      lo: '-\\frac{3\\pi}{2}',
      hi: '0',
      d: `${B}-${A}\\sin x`,
      nuli: [`$|${A}\\sin x| \\le ${A} < ${B}$, поэтому $y' > 0$ везде: нулей нет.`],
      vybor: ['Функция возрастает на всём отрезке: наибольшее значение — на правом конце.'],
      gde: 0,
      answer: A + c,
      schet: [`$y(0) = ${A}\\cos 0 + 0 ${c < 0 ? '-' : '+'} ${Math.abs(c)} = ${num(A + c)}$.`],
      drugie: ['-\\frac{3\\pi}{2}', '-\\frac{\\pi}{2}', '-\\pi'],
      f: (x: number) => A * Math.cos(x) + B * x + c,
      otr: [(-3 * Math.PI) / 2, 0] as [number, number],
    };
  }
  const K = N(p, 'K');
  const ce = S(p, 'cel') as Cel;
  const vLevom = -A / 2 + (2 * K) / 3 + c;
  return {
    cel: ce,
    fn: `y = ${summa([
      [A, '\\cos x'],
      [-1, `\\frac{${K}}{\\pi}x`],
      [c, ''],
    ])}`,
    lo: '-\\frac{2\\pi}{3}',
    hi: '0',
    d: `-${A}\\sin x-\\frac{${K}}{\\pi}`,
    nuli: [
      `$|${A}\\sin x| \\le ${A}$, а $\\frac{${K}}{\\pi} > ${num(Math.floor((K / Math.PI) * 10) / 10)} > ${A}$: $y' < 0$ везде, нулей нет.`,
    ],
    vybor: [
      `Функция убывает на всём отрезке: ${ce === 'max' ? 'наибольшее значение — на левом конце' : 'наименьшее значение — на правом конце'}.`,
    ],
    gde: ce === 'max' ? '-\\frac{2\\pi}{3}' : '0',
    answer: ce === 'max' ? vLevom : A + c,
    schet:
      ce === 'max'
        ? [
            `$\\cos\\left(-\\frac{2\\pi}{3}\\right) = -\\frac12$: $y = -${num(A / 2)} + \\frac{${K}}{\\pi}\\cdot\\frac{2\\pi}{3} ${c < 0 ? '-' : '+'} ${Math.abs(c)} = ${num(vLevom)}$.`,
          ]
        : [`$y(0) = ${A} ${c < 0 ? '-' : '+'} ${Math.abs(c)} = ${num(A + c)}$.`],
    drugie:
      ce === 'max'
        ? ['0', '-\\frac{\\pi}{3}', '-\\frac{\\pi}{2}']
        : ['-\\frac{2\\pi}{3}', '-\\frac{\\pi}{3}', '-\\frac{\\pi}{2}'],
    f: (x: number) => A * Math.cos(x) - (K / Math.PI) * x + c,
    otr: [(-2 * Math.PI) / 3, 0] as [number, number],
  };
}

const P14: Prototype = {
  id: 'P14',
  vid: 6,
  vopros: 'B',
  title: 'Тангенс и линейная функция на отрезке',
  primer:
    'y = 12\\operatorname{tg} x - 12x + 3\\pi + 5,\\ \\left[-\\frac{\\pi}{4};\\,\\frac{\\pi}{4}\\right]',
  gen: (r): Params => {
    const forma = r.pick(['max0', 'min0', 'maxPi', 'minPi'] as const);
    return { forma, k: forma.endsWith('Pi') ? 4 * r.int(1, 5) : r.int(2, 15), c: r.int(-10, 20) };
  },
  uslovie: (p) => {
    const t = tg14(p);
    return uslovieOtrezka(t.cel, t.fn, t.lo, t.hi);
  },
  solve: (p) => {
    const t = tg14(p);
    return naOtrezke({
      cel: t.cel,
      fn: t.fn,
      d: t.d,
      nuli: [
        `$\\cos^2 x \\le 1$, поэтому $\\frac{${N(p, 'k')}}{\\cos^2 x} \\ge ${N(p, 'k')}$: производная ${t.vozr ? 'не меньше' : 'не больше'} нуля и обращается в ноль только при $x = 0$ — знак не меняется.`,
      ],
      vybor: [
        `Функция ${t.vozr ? 'возрастает' : 'убывает'} на отрезке: ${SLOVO_ZNACH[t.cel]} значение — на ${t.konec === 'prav' ? 'правом' : 'левом'} конце.`,
      ],
      gde: t.gde,
      answer: t.answer,
      schet: t.schet,
      tochkiPodskazki: ['0', '-\\frac{\\pi}{4}', '\\frac{\\pi}{4}', '\\frac{\\pi}{2}'],
    });
  },
  chisla: (p) => {
    const t = tg14(p);
    return { f: t.f, otrezok: t.otr, cel: t.cel, chto: 'znachenie' };
  },
};

function tg14(p: Params) {
  const k = N(p, 'k');
  const c = N(p, 'c');
  const forma = S(p, 'forma');
  const tg = '\\operatorname{tg} x';
  const sc = (v: number) => `${v < 0 ? '-' : '+'} ${Math.abs(v)}`;
  if (forma === 'max0' || forma === 'min0') {
    const vozr = forma === 'max0';
    return {
      cel: (vozr ? 'max' : 'min') as Cel,
      vozr,
      konec: 'prav',
      fn: vozr
        ? `y = ${summa([
            [k, tg],
            [-k, 'x'],
            [c, ''],
          ])}`
        : `y = ${summa([
            [k, 'x'],
            [-k, tg],
            [c, ''],
          ])}`,
      lo: '-\\frac{\\pi}{4}',
      hi: '0',
      d: vozr ? `\\frac{${k}}{\\cos^2 x}-${k}` : `${k}-\\frac{${k}}{\\cos^2 x}`,
      gde: '0',
      answer: c,
      schet: [`$\\operatorname{tg} 0 = 0$: $y(0) = ${num(c)}$.`],
      f: (x: number) => (vozr ? k * Math.tan(x) - k * x + c : k * x - k * Math.tan(x) + c),
      otr: [-Math.PI / 4, 0] as [number, number],
    };
  }
  /* Слагаемое ±(k/4)π сокращает π в ответе на конце ±π/4. */
  const m = k / 4;
  const piTerm = m === 1 ? '\\pi' : `${m}\\pi`;
  const max = forma === 'maxPi';
  return {
    cel: (max ? 'max' : 'min') as Cel,
    vozr: true,
    konec: max ? 'prav' : 'lev',
    fn: `y = ${summa([
      [k, tg],
      [-k, 'x'],
    ])} ${max ? '+' : '-'} ${piTerm} ${sc(c)}`,
    lo: '-\\frac{\\pi}{4}',
    hi: '\\frac{\\pi}{4}',
    d: `\\frac{${k}}{\\cos^2 x}-${k}`,
    gde: max ? '\\frac{\\pi}{4}' : '-\\frac{\\pi}{4}',
    answer: max ? k + c : c - k,
    schet: max
      ? [
          `$\\operatorname{tg}\\frac{\\pi}{4} = 1$: $y = ${k} - ${piTerm} + ${piTerm} ${sc(c)} = ${num(k + c)}$.`,
        ]
      : [
          `$\\operatorname{tg}\\left(-\\frac{\\pi}{4}\\right) = -1$: $y = -${k} + ${piTerm} - ${piTerm} ${sc(c)} = ${num(c - k)}$.`,
        ],
    f: (x: number) => k * Math.tan(x) - k * x + (max ? 1 : -1) * m * Math.PI + c,
    otr: [-Math.PI / 4, Math.PI / 4] as [number, number],
  };
}

const P15: Prototype = {
  id: 'P15',
  vid: 6,
  vopros: 'A',
  title: 'Точка экстремума на промежутке $\\left(0;\\,\\frac{\\pi}{2}\\right)$',
  primer: 'y = (2x - 3)\\cos x - 2\\sin x + 5',
  gen: (r): Params => {
    const k = r.pick([1, 2, 4]);
    const x0 = r.pick([0.25, 0.5, 0.75, 1, 1.25, 1.5].filter((v) => Number.isInteger(v * k * 2)));
    return { k, x0, c: r.pick([0, 0, r.int(-5, 10)]), cel: cel(r) };
  },
  uslovie: (p) =>
    uslovieTochki(S(p, 'cel') as Cel, trig15(p).fn, '\\left(0;\\,\\frac{\\pi}{2}\\right)'),
  solve: (p) => {
    const t = trig15(p);
    const x0 = N(p, 'x0');
    const max = S(p, 'cel') === 'max';
    const s = poZnakam({
      cel: max ? 'max' : 'min',
      fn: t.fn,
      d: t.d,
      odz: "Производная произведения: $(uv)' = u'v + uv'$.",
      nuli: [
        `На $\\left(0;\\,\\frac{\\pi}{2}\\right)$ $\\sin x > 0$, поэтому $y' = 0$ только при $x = ${num(x0)}$; $${num(x0)} < \\frac{\\pi}{2} \\approx 1{,}57$.`,
      ],
      korni: [x0],
      tochki: [x0],
      znakiZ: max ? ['+', '-'] : ['-', '+'],
    });
    /* Интервалы — в пределах промежутка. */
    const st = s.etapy[2];
    if (st !== undefined) {
      st.lines[0] = `на $(0;\\,${num(x0)})$ $y'${max ? '>' : '<'}0$, на $\\left(${num(x0)};\\,\\frac{\\pi}{2}\\right)$ $y'${max ? '<' : '>'}0$.`;
    }
    return s;
  },
  chisla: (p) => ({
    f: trig15(p).f,
    otrezok: [0.001, Math.PI / 2 - 0.001],
    cel: S(p, 'cel') as Cel,
    chto: 'tochka',
  }),
};

function trig15(p: Params) {
  const k = N(p, 'k');
  const x0 = N(p, 'x0');
  const m = k * x0;
  const c = N(p, 'c');
  const max = S(p, 'cel') === 'max';
  /* max: (kx − m)cos x − k sin x + c, y' = (m − kx)sin x;
     min: (m − kx)cos x + k sin x + c, y' = (kx − m)sin x. */
  const mnozh = max
    ? summa([
        [k, 'x'],
        [-m, ''],
      ])
    : summa([
        [m, ''],
        [-k, 'x'],
      ]);
  const mnozh0 = max
    ? summa([
        [m, ''],
        [-k, 'x'],
      ])
    : summa([
        [k, 'x'],
        [-m, ''],
      ]);
  return {
    fn: `y = (${mnozh})\\cos x ${max ? '-' : '+'} ${k === 1 ? '' : k}\\sin x${c === 0 ? '' : ` ${c < 0 ? '-' : '+'} ${Math.abs(c)}`}`,
    d: `(${mnozh0})\\sin x`,
    f: (x: number) =>
      (max
        ? (k * x - m) * Math.cos(x) - k * Math.sin(x)
        : (m - k * x) * Math.cos(x) + k * Math.sin(x)) + c,
  };
}

/* ── 7. Сложная функция: монотонная внешняя ─────────────────────── */

function slozh(p: Params) {
  const vid = S(p, 'vid');
  const h = N(p, 'h');
  const max = S(p, 'cel') === 'max';
  if (vid === 'koren') {
    const s = N(p, 's');
    const t = max ? trehchlen(h, s * s, -1) : trehchlen(h, s * s);
    return {
      fn: `y = \\sqrt{${t}}`,
      vneshnyaya: '\\sqrt{t}',
      vozrastaet: true,
      vnutr: t,
      vVershine: `${t.replace(/x/g, `(${num(h)})`)} = ${s * s}`,
      znachenie: `\\sqrt{${s * s}} = ${s}`,
      znach: s,
      f: (x: number) => Math.sqrt(max ? -((x - h) ** 2) + s * s : (x - h) ** 2 + s * s),
      oblast: max
        ? ([h - s + 1e-6, h + s - 1e-6] as [number, number])
        : ([h - 8, h + 8] as [number, number]),
    };
  }
  if (vid === 'log') {
    const b = N(p, 'b');
    const k = N(p, 'k');
    const c = N(p, 'c');
    const bk = b ** k;
    const t = max ? trehchlen(h, bk, -1) : trehchlen(h, bk);
    return {
      fn: `y = ${summa([
        [1, `\\log_{${b}}(${t})`],
        [c, ''],
      ])}`,
      vneshnyaya: `\\log_{${b}} t`,
      vozrastaet: true,
      vnutr: t,
      vVershine: `${t.replace(/x/g, `(${num(h)})`)} = ${bk}`,
      znachenie: `\\log_{${b}} ${bk}${c === 0 ? '' : c < 0 ? ` - ${-c}` : ` + ${c}`} = ${k + c}`,
      znach: k + c,
      f: (x: number) => Math.log(max ? -((x - h) ** 2) + bk : (x - h) ** 2 + bk) / Math.log(b) + c,
      oblast: max
        ? ([h - Math.sqrt(bk) + 1e-6, h + Math.sqrt(bk) - 1e-6] as [number, number])
        : ([h - 8, h + 8] as [number, number]),
    };
  }
  const b = N(p, 'b');
  const k = N(p, 'k');
  const t = max ? trehchlen(h, k, -1) : trehchlen(h, k);
  return {
    fn: `y = ${b}^{${t}}`,
    vneshnyaya: `${b}^{t}`,
    vozrastaet: true,
    vnutr: t,
    vVershine: `${t.replace(/x/g, `(${num(h)})`)} = ${k}`,
    znachenie: `${b}^{${k}} = ${b ** k}`,
    znach: b ** k,
    f: (x: number) => b ** (max ? -((x - h) ** 2) + k : (x - h) ** 2 + k),
    oblast: [h - 4, h + 4] as [number, number],
  };
}

function protoSlozh(
  id: string,
  vopros: 'A' | 'V',
  vid: 'koren' | 'log' | 'pokaz',
  title: string,
  primer: string,
): Prototype {
  const self: Prototype = {
    id,
    vid: 7,
    vopros,
    title,
    primer,
    gen: (r): Params => {
      /* Наибольшее значение показательной — не бывает целым при k > 0
         без больших степеней: в V у показательной только минимум. */
      const ce: Cel = vopros === 'V' && vid === 'pokaz' ? 'min' : cel(r);
      const h = znakOt(r, 1, 11);
      if (vid === 'koren') return { vid, h, s: r.int(1, 9), cel: ce };
      if (vid === 'log')
        return {
          vid,
          h,
          b: r.pick([2, 3, 4, 5, 7, 8]),
          k: r.int(0, 2),
          c: r.int(-12, 10),
          cel: ce,
        };
      return {
        vid,
        h,
        b: r.pick([2, 3, 5, 6, 7]),
        k: vopros === 'V' ? r.int(0, 3) : r.int(-80, 30),
        cel: ce,
      };
    },
    uslovie: (p) => {
      const s = slozh(p);
      return vopros === 'A'
        ? uslovieTochki(S(p, 'cel') as Cel, s.fn)
        : uslovieBezOtrezka(S(p, 'cel') as Cel, s.fn);
    },
    solve: (p) => {
      const s = slozh(p);
      const h = N(p, 'h');
      return bezProizvodnoy({
        cel: S(p, 'cel') as Cel,
        chto: vopros === 'A' ? 'tochka' : 'znachenie',
        fn: s.fn,
        vneshnyaya: s.vneshnyaya,
        vozrastaet: s.vozrastaet,
        vnutrennyaya: s.vnutr,
        h,
        vVershine: s.vVershine,
        znachenie: s.znachenie,
        answer: vopros === 'A' ? h : s.znach,
      });
    },
    chisla: (p) => {
      const s = slozh(p);
      return {
        f: s.f,
        otrezok: s.oblast,
        cel: S(p, 'cel') as Cel,
        chto: vopros === 'A' ? 'tochka' : 'znachenie',
      };
    },
  };
  return self;
}

const P16 = protoSlozh(
  'P16',
  'A',
  'koren',
  'Точка экстремума: корень из трёхчлена',
  'y = \\sqrt{x^2 + 6x + 29}',
);
const P17 = protoSlozh(
  'P17',
  'V',
  'koren',
  'Наименьшее и наибольшее значение: корень из трёхчлена',
  'y = \\sqrt{x^2 + 22x + 122}',
);
const P18 = protoSlozh(
  'P18',
  'A',
  'log',
  'Точка экстремума: логарифм трёхчлена',
  'y = \\log_2(-21 - 14x - x^2) - 2',
);
const P19 = protoSlozh(
  'P19',
  'V',
  'log',
  'Наименьшее и наибольшее значение: логарифм трёхчлена',
  'y = \\log_5(x^2 - 12x + 61) - 10',
);
const P20 = protoSlozh(
  'P20',
  'A',
  'pokaz',
  'Точка экстремума: показательная функция от трёхчлена',
  'y = 7^{x^2 + 2x + 3}',
);
const P21 = protoSlozh(
  'P21',
  'V',
  'pokaz',
  'Наименьшее значение: показательная функция от трёхчлена',
  'y = 7^{x^2 - 2x + 3}',
);

/* ── Список ──────────────────────────────────────────────────────── */

export const PROTOTYPES: readonly Prototype[] = [
  P01,
  P02,
  P03,
  P04,
  P05,
  P06,
  P07,
  P08,
  P09,
  P10,
  P11,
  P12,
  P13,
  P14,
  P15,
  P16,
  P17,
  P18,
  P19,
  P20,
  P21,
];

export function prototype(id: string): Prototype {
  const p = PROTOTYPES.find((x) => x.id === id);
  if (p === undefined) throw new Error(`№21: нет прототипа ${id}`);
  return p;
}

/** Решение по параметрам: прототипы зовут его из chisla(), чтобы знать, какую из двух точек проверять. */
function solveCache(proto: Prototype, p: Params): Solved {
  return proto.solve(p);
}
