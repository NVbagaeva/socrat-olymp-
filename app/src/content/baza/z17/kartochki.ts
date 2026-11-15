/**
 * База, №17: карточки «Знаю / Не знаю» — правила и формулы уравнений.
 * `source` — якорь раздела вкладки «Теория» (teoriya-<id> из
 * content/baza/z17/teoriya.ts). Ответы карточек-вычислений сверяет
 * pnpm test:baza по полю proverka: корень ищется перебором.
 */

import type { Kartochka, Koloda } from '@/lib/kartochki/tipy';

const B = 'база' as const;
const E = 'важно для ЕГЭ' as const;
const T = (id: string) => `teoriya-${id}`;

/** Все x вида k/20 на [−200; 200], при которых обе части равны. */
const korni = (levaya: (x: number) => number, pravaya: (x: number) => number): number[] => {
  const naydeno: number[] = [];
  for (let k = -4000; k <= 4000; k += 1) {
    const x = k / 20;
    const l = levaya(x);
    const p = pravaya(x);
    if (Number.isFinite(l) && Number.isFinite(p) && Math.abs(l - p) < 1e-9 * (1 + Math.abs(p))) {
      naydeno.push(x);
    }
  }
  return naydeno;
};

const odin = (levaya: (x: number) => number, pravaya: (x: number) => number): number => {
  const r = korni(levaya, pravaya);
  return r.length === 1 ? (r[0] ?? NaN) : NaN;
};

const kartochki: Kartochka[] = [
  /* ── Линейные ── */
  {
    id: 'b17-perenos',
    task: 17,
    topic: 'lineynye',
    type: 'svoystvo',
    front: 'Что происходит со слагаемым, когда его переносят в другую часть уравнения?',
    back: 'Его знак меняется на противоположный',
    pochemu: '$5x - 3 = 7$ равносильно $5x = 7 + 3$.',
    level: B,
    source: T('lineynye'),
  },
  {
    id: 'b17-minus-skobka',
    task: 17,
    topic: 'lineynye',
    type: 'verno',
    front: '$-2(x - 5) = -2x - 10$',
    verno: false,
    back: 'Неверно',
    pochemu: 'Минус меняет знак каждого слагаемого: $-2(x - 5) = -2x + 10$.',
    level: E,
    source: T('lineynye'),
  },
  {
    id: 'b17-lin',
    task: 17,
    topic: 'lineynye',
    type: 'vychislenie',
    front: 'Корень уравнения $7x - 4 = 3x + 16$',
    otvet: '5',
    proverka: () =>
      odin(
        (x) => 7 * x - 4,
        (x) => 3 * x + 16,
      ),
    back: '$4x = 20$, $x = 5$',
    level: B,
    source: T('lineynye'),
  },
  {
    id: 'b17-lin-drob',
    task: 17,
    topic: 'lineynye',
    type: 'vychislenie',
    front: 'Корень уравнения $3 + 2(x + 4) = 6$',
    otvet: '−2,5',
    proverka: () =>
      odin(
        (x) => 3 + 2 * (x + 4),
        () => 6,
      ),
    back: '$3 + 2x + 8 = 6$, $2x = -5$, $x = -2{,}5$',
    level: B,
    source: T('lineynye'),
  },
  {
    id: 'b17-kvadrat-raznosti',
    task: 17,
    topic: 'lineynye',
    type: 'formula',
    front: 'Квадрат разности $(a - b)^2$',
    back: '$a^2 - 2ab + b^2$',
    pochemu: 'Нужен, чтобы раскрыть $(x - c)^2$: квадраты $x^2$ потом сокращаются.',
    level: B,
    source: T('lineynye'),
  },
  {
    id: 'b17-kvadraty',
    task: 17,
    topic: 'lineynye',
    type: 'vychislenie',
    front: 'Корень уравнения $(x - 5)^2 = x^2$',
    otvet: '2,5',
    proverka: () =>
      odin(
        (x) => (x - 5) ** 2,
        (x) => x ** 2,
      ),
    back: '$x^2 - 10x + 25 = x^2$, $-10x = -25$, $x = 2{,}5$',
    level: E,
    source: T('lineynye'),
  },
  /* ── Квадратные ── */
  {
    id: 'b17-nepolnoe',
    task: 17,
    topic: 'kvadratnye',
    type: 'svoystvo',
    front: 'Как решить уравнение $x^2 + bx = 0$?',
    back: 'Вынести $x$: $x(x + b) = 0$, корни $0$ и $-b$',
    pochemu: 'Произведение равно нулю, когда один из множителей равен нулю.',
    level: B,
    source: T('nepolnye'),
  },
  {
    id: 'b17-delit-na-x',
    task: 17,
    topic: 'kvadratnye',
    type: 'verno',
    front: 'Уравнение $x^2 = 6x$ имеет единственный корень $x = 6$',
    verno: false,
    back: 'Неверно',
    pochemu: '$x(x - 6) = 0$: корни $0$ и $6$. Делить на $x$ нельзя — теряется $x = 0$.',
    level: E,
    source: T('nepolnye'),
  },
  {
    id: 'b17-nepolnoe-menshiy',
    task: 17,
    topic: 'kvadratnye',
    type: 'vychislenie',
    front: 'Меньший корень уравнения $x^2 + 11x = 0$',
    otvet: '−11',
    proverka: () =>
      Math.min(
        ...korni(
          (x) => x * x + 11 * x,
          () => 0,
        ),
      ),
    back: '$x(x + 11) = 0$, корни $0$ и $-11$; меньший $-11$',
    level: B,
    source: T('nepolnye'),
  },
  {
    id: 'b17-diskriminant',
    task: 17,
    topic: 'kvadratnye',
    type: 'formula',
    front: 'Дискриминант уравнения $ax^2 + bx + c = 0$',
    back: '$D = b^2 - 4ac$',
    level: B,
    source: T('diskriminant'),
  },
  {
    id: 'b17-korni',
    task: 17,
    topic: 'kvadratnye',
    type: 'formula',
    front: 'Корни квадратного уравнения через дискриминант',
    back: '$x_{1,2} = \\dfrac{-b \\pm \\sqrt{D}}{2a}$',
    level: B,
    source: T('diskriminant'),
  },
  {
    id: 'b17-d-znak',
    task: 17,
    topic: 'kvadratnye',
    type: 'svoystvo',
    front: 'Сколько корней у квадратного уравнения при $D > 0$, $D = 0$, $D < 0$?',
    back: 'Два, один, ни одного',
    level: B,
    source: T('diskriminant'),
  },
  {
    id: 'b17-d-vych',
    task: 17,
    topic: 'kvadratnye',
    type: 'vychislenie',
    front: 'Дискриминант уравнения $x^2 - 4x - 12 = 0$',
    otvet: '64',
    proverka: () => {
      /* Через корни: D = (x₁ − x₂)² при a = 1. */
      const [x1 = NaN, x2 = NaN] = korni(
        (x) => x * x - 4 * x - 12,
        () => 0,
      );
      return (x1 - x2) ** 2;
    },
    back: '$D = (-4)^2 - 4 \\cdot 1 \\cdot (-12) = 16 + 48 = 64$',
    level: B,
    source: T('diskriminant'),
  },
  {
    id: 'b17-vieta',
    task: 17,
    topic: 'kvadratnye',
    type: 'svoystvo',
    front: 'Теорема Виета для $x^2 + bx + c = 0$',
    back: '$x_1 + x_2 = -b$, $x_1 \\cdot x_2 = c$',
    pochemu: 'Помогает угадать целые корни без дискриминанта.',
    level: E,
    source: T('diskriminant'),
  },
  {
    id: 'b17-bolshiy',
    task: 17,
    topic: 'kvadratnye',
    type: 'vychislenie',
    front: 'Больший корень уравнения $x^2 + 3x - 10 = 0$',
    otvet: '2',
    proverka: () =>
      Math.max(
        ...korni(
          (x) => x * x + 3 * x - 10,
          () => 0,
        ),
      ),
    back: '$D = 9 + 40 = 49$, корни $\\dfrac{-3 \\pm 7}{2}$: $2$ и $-5$; больший $2$',
    level: B,
    source: T('diskriminant'),
  },
  {
    id: 'b17-menshiy-verno',
    task: 17,
    topic: 'kvadratnye',
    type: 'verno',
    front: 'Из корней $-6$ и $-1$ меньший — это $-1$',
    verno: false,
    back: 'Неверно',
    pochemu: 'На числовой прямой $-6$ левее: $-6 < -1$.',
    level: E,
    source: T('otvet'),
  },
  /* ── С корнем ── */
  {
    id: 'b17-koren',
    task: 17,
    topic: 'koren',
    type: 'svoystvo',
    front: 'Как избавиться от корня в уравнении $\\sqrt{f(x)} = c$?',
    back: 'Возвести обе части в квадрат: $f(x) = c^2$',
    pochemu: 'Так можно, только если $c \\ge 0$.',
    level: B,
    source: T('koren'),
  },
  {
    id: 'b17-koren-minus',
    task: 17,
    topic: 'koren',
    type: 'verno',
    front: 'Уравнение $\\sqrt{x + 2} = -4$ имеет корень $x = 14$',
    verno: false,
    back: 'Неверно',
    pochemu: 'Корень не бывает отрицательным: $\\sqrt{16} = 4 \\ne -4$. Корней нет.',
    level: E,
    source: T('koren'),
  },
  {
    id: 'b17-koren-vych',
    task: 17,
    topic: 'koren',
    type: 'vychislenie',
    front: 'Корень уравнения $\\sqrt{x - 3} = 5$',
    otvet: '28',
    proverka: () =>
      odin(
        (x) => (x >= 3 ? Math.sqrt(x - 3) : NaN),
        () => 5,
      ),
    back: '$x - 3 = 25$, $x = 28$',
    level: B,
    source: T('koren'),
  },
  {
    id: 'b17-koren-minus-x',
    task: 17,
    topic: 'koren',
    type: 'vychislenie',
    front: 'Корень уравнения $\\sqrt{10 - x} = 3$',
    otvet: '1',
    proverka: () =>
      odin(
        (x) => (x <= 10 ? Math.sqrt(10 - x) : NaN),
        () => 3,
      ),
    back: '$10 - x = 9$, $x = 1$',
    level: B,
    source: T('koren'),
  },
  /* ── Показательные ── */
  {
    id: 'b17-osnovanie',
    task: 17,
    topic: 'pokazatelnye',
    type: 'svoystvo',
    front: 'Степени с одним основанием равны: $a^{f(x)} = a^{g(x)}$. Что дальше?',
    back: 'Приравнять показатели: $f(x) = g(x)$',
    level: B,
    source: T('pokazatelnye'),
  },
  {
    id: 'b17-proizvedenie',
    task: 17,
    topic: 'pokazatelnye',
    type: 'formula',
    front: 'Произведение степеней $a^m \\cdot a^n$',
    back: '$a^{m+n}$',
    pochemu: 'Частное: $a^m : a^n = a^{m-n}$.',
    level: B,
    source: T('pokazatelnye'),
  },
  {
    id: 'b17-drob-stepen',
    task: 17,
    topic: 'pokazatelnye',
    type: 'formula',
    front: 'Дробь $\\dfrac{1}{a^n}$ как степень $a$',
    back: '$a^{-n}$',
    pochemu: 'Например, $\\dfrac{1}{27} = 3^{-3}$.',
    level: B,
    source: T('pokazatelnye'),
  },
  {
    id: 'b17-perevernut',
    task: 17,
    topic: 'pokazatelnye',
    type: 'svoystvo',
    front: 'Как записать $\\left(\\dfrac{1}{a}\\right)^{x-k}$ с основанием $a$?',
    back: '$a^{-(x-k)} = a^{k-x}$',
    pochemu: 'Минус относится ко всему показателю.',
    level: E,
    source: T('pokazatelnye'),
  },
  {
    id: 'b17-nol',
    task: 17,
    topic: 'pokazatelnye',
    type: 'verno',
    front: '$5^0 = 0$',
    verno: false,
    back: 'Неверно',
    pochemu: 'Любое число, кроме нуля, в нулевой степени равно $1$.',
    level: B,
    source: T('pokazatelnye'),
  },
  {
    id: 'b17-pok',
    task: 17,
    topic: 'pokazatelnye',
    type: 'vychislenie',
    front: 'Корень уравнения $3^{x-1} = 81$',
    otvet: '5',
    proverka: () =>
      odin(
        (x) => 3 ** (x - 1),
        () => 81,
      ),
    back: '$81 = 3^4$, $x - 1 = 4$, $x = 5$',
    level: B,
    source: T('pokazatelnye'),
  },
  {
    id: 'b17-pok-drob',
    task: 17,
    topic: 'pokazatelnye',
    type: 'vychislenie',
    front: 'Корень уравнения $2^{x+1} = \\dfrac{1}{8}$',
    otvet: '−4',
    proverka: () =>
      odin(
        (x) => 2 ** (x + 1),
        () => 1 / 8,
      ),
    back: '$\\dfrac{1}{8} = 2^{-3}$, $x + 1 = -3$, $x = -4$',
    level: B,
    source: T('pokazatelnye'),
  },
  {
    id: 'b17-pok-mnozhitel',
    task: 17,
    topic: 'pokazatelnye',
    type: 'vychislenie',
    front: 'Корень уравнения $2^x + 3 \\cdot 2^x = 32$',
    otvet: '3',
    proverka: () =>
      odin(
        (x) => 2 ** x + 3 * 2 ** x,
        () => 32,
      ),
    back: '$4 \\cdot 2^x = 32$, $2^x = 8$, $x = 3$',
    level: E,
    source: T('pokazatelnye'),
  },
  /* ── Логарифмические ── */
  {
    id: 'b17-log-opr',
    task: 17,
    topic: 'logarifmy',
    type: 'formula',
    front: 'Определение логарифма: $\\log_a b = c$ означает…',
    back: '$a^c = b$',
    pochemu: 'Логарифм — показатель степени, в которую возводят основание.',
    level: B,
    source: T('logarifmy'),
  },
  {
    id: 'b17-log-odz',
    task: 17,
    topic: 'logarifmy',
    type: 'svoystvo',
    front: 'ОДЗ логарифма $\\log_a f(x)$',
    back: '$f(x) > 0$; основание $a > 0$, $a \\ne 1$',
    pochemu: 'Найденный корень подставляют и проверяют, что под логарифмом положительное число.',
    level: E,
    source: T('logarifmy'),
  },
  {
    id: 'b17-log-ravny',
    task: 17,
    topic: 'logarifmy',
    type: 'svoystvo',
    front: 'Как решить $\\log_a f(x) = \\log_a g(x)$?',
    back: 'Приравнять аргументы: $f(x) = g(x)$',
    pochemu: 'И проверить, что они положительны.',
    level: B,
    source: T('logarifmy'),
  },
  {
    id: 'b17-log-summa',
    task: 17,
    topic: 'logarifmy',
    type: 'formula',
    front: 'Сумма логарифмов $\\log_a m + \\log_a n$',
    back: '$\\log_a (mn)$',
    level: B,
    source: T('logarifmy'),
  },
  {
    id: 'b17-log-raznost',
    task: 17,
    topic: 'logarifmy',
    type: 'formula',
    front: 'Разность логарифмов $\\log_a m - \\log_a n$',
    back: '$\\log_a \\dfrac{m}{n}$',
    level: B,
    source: T('logarifmy'),
  },
  {
    id: 'b17-lg',
    task: 17,
    topic: 'logarifmy',
    type: 'svoystvo',
    front: 'Что означает запись $\\lg x$?',
    back: '$\\log_{10} x$ — десятичный логарифм',
    level: B,
    source: T('logarifmy'),
  },
  {
    id: 'b17-log-verno',
    task: 17,
    topic: 'logarifmy',
    type: 'verno',
    front: 'Из $\\log_2(x + 1) = 3$ следует $x + 1 = 6$',
    verno: false,
    back: 'Неверно',
    pochemu: 'Справа показатель степени: $x + 1 = 2^3 = 8$.',
    level: E,
    source: T('logarifmy'),
  },
  {
    id: 'b17-log-vych',
    task: 17,
    topic: 'logarifmy',
    type: 'vychislenie',
    front: 'Корень уравнения $\\log_3(x - 2) = 2$',
    otvet: '11',
    proverka: () =>
      odin(
        (x) => (x > 2 ? Math.log(x - 2) / Math.log(3) : NaN),
        () => 2,
      ),
    back: '$x - 2 = 3^2 = 9$, $x = 11$',
    level: B,
    source: T('logarifmy'),
  },
  {
    id: 'b17-lg-vych',
    task: 17,
    topic: 'logarifmy',
    type: 'vychislenie',
    front: 'Корень уравнения $\\lg(x + 4) = 2$',
    otvet: '96',
    proverka: () =>
      odin(
        (x) => (x > -4 ? Math.log10(x + 4) : NaN),
        () => 2,
      ),
    back: '$x + 4 = 10^2 = 100$, $x = 96$',
    level: B,
    source: T('logarifmy'),
  },
  {
    id: 'b17-stepen-minus-1',
    task: 17,
    topic: 'logarifmy',
    type: 'vychislenie',
    front: 'Вычислите $\\left(\\dfrac{2}{5}\\right)^{-1}$',
    otvet: '2,5',
    proverka: () => 1 / (2 / 5),
    back: '$\\dfrac{5}{2} = 2{,}5$',
    pochemu: 'Нужно для логарифма с основанием-дробью и правой частью $-1$.',
    level: E,
    source: T('logarifmy'),
  },
];

export const KOLODA_17: Koloda = {
  task: 17,
  level: 'base',
  slug: '17',
  title: 'Уравнения',
  teoriya: 'teoriya/',
  podtemy: [
    { id: 'lineynye', title: 'Линейные уравнения' },
    { id: 'kvadratnye', title: 'Квадратные уравнения' },
    { id: 'koren', title: 'Уравнения с корнем' },
    { id: 'pokazatelnye', title: 'Показательные уравнения' },
    { id: 'logarifmy', title: 'Логарифмические уравнения' },
  ],
  kartochki,
};
