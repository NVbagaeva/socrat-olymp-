/**
 * Опорные задачи раздела «Наибольшее и наименьшее значение функции»:
 * короткие задачи на одно умение, из которых складывается любая задача
 * раздела. Семь блоков по десять задач. Числа подобраны генератором с
 * постоянным зерном — задачи одни и те же на каждой сборке.
 *
 * У каждой задачи — независимый пересчёт ответа (proverka): численная
 * производная, перебор знаков, подстановка. Самотест сверяет его с
 * ответом (selftest.ts → pnpm test:naibolshee).
 */

import type { Rng } from '@/lib/veroyatnost/generator';
import { rngOf } from '@/lib/vychisleniya/rng';
import { sealAnswer, sealText } from './secret';
import { num, summa, xMinus } from './tex';

export interface MikroZadacha {
  id: string;
  uslovie: string;
  answer: number;
  podskazka: string;
  razbor: string[];
  /** Независимый пересчёт ответа (только для самотеста). */
  proverka: () => number;
}

export interface BlokOpornyh {
  slug: string;
  nazvanie: string;
  zapomni: string;
  /** Прототипы, где умение нужно. */
  prototipy: string[];
  zadachi: MikroZadacha[];
}

/** Численная производная: симметричная разность. */
function dChislo(f: (x: number) => number, x: number): number {
  const h = 1e-5;
  return (f(x + h) - f(x - h)) / (2 * h);
}

const okr = (v: number): number => Math.round(v * 1e6) / 1e6;

function desyat(
  prefix: string,
  gen: (r: Rng, i: number) => Omit<MikroZadacha, 'id'>,
): MikroZadacha[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `${prefix}-${i + 1}`,
    ...gen(rngOf(`z21-op-${prefix}-${i}`), i),
  }));
}

const znakR = (r: Rng, a: number, b: number) => r.pick([-1, 1]) * r.int(a, b);

/* ── 1. Производная многочлена ─────────────────────────────────── */

const MNOGOCHLEN = desyat('mn', (r) => {
  const a = znakR(r, 1, 4);
  const b = r.int(-6, 6);
  const c = r.int(-20, 20);
  const d = r.int(-10, 10);
  const x0 = r.int(-3, 3);
  const fn = summa([
    [a, 'x^3'],
    [b, 'x^2'],
    [c, 'x'],
    [d, ''],
  ]);
  const dfn = summa([
    [3 * a, 'x^2'],
    [2 * b, 'x'],
    [c, ''],
  ]);
  const answer = 3 * a * x0 * x0 + 2 * b * x0 + c;
  return {
    uslovie: `Найдите значение производной функции $y = ${fn}$ в точке $x_0 = ${num(x0)}$.`,
    answer,
    podskazka: "$(x^n)' = nx^{n-1}$, производная числа — ноль.",
    razbor: [`$y' = ${dfn}$`, `$y'(${num(x0)}) = ${num(answer)}$`],
    proverka: () => okr(dChislo((x) => a * x ** 3 + b * x * x + c * x + d, x0)),
  };
});

/* ── 2. Производная произведения ────────────────────────────────── */

const PROIZVEDENIE = desyat('pr', (r, i) => {
  const x0 = r.int(-6, 6);
  if (i % 2 === 0) {
    /* (x − a)e^{x − x0}: y' = (x − a + 1)e^{x − x0}, в x0: x0 − a + 1. */
    const a = r.int(-8, 8);
    const pok = xMinus(x0);
    return {
      uslovie: `Найдите значение производной функции $y = (${xMinus(a)})e^{${pok}}$ в точке $x_0 = ${num(x0)}$.`,
      answer: x0 - a + 1,
      podskazka:
        "$(uv)' = u'v + uv'$, $(e^{x-c})' = e^{x-c}$; в точке $x_0$ показатель равен нулю.",
      razbor: [
        `$y' = e^{${pok}} + (${xMinus(a)})e^{${pok}} = (${xMinus(a - 1)})e^{${pok}}$`,
        `$y'(${num(x0)}) = (${num(x0 - a + 1)})\\cdot e^0 = ${num(x0 - a + 1)}$`,
      ],
      proverka: () => okr(dChislo((x) => (x - a) * Math.exp(x - x0), x0)),
    };
  }
  /* (x + a)(x + b)²: производная по правилу произведения. */
  const a = r.int(-5, 5);
  const b = r.int(-5, 5);
  const xa = summa([
    [1, 'x'],
    [a, ''],
  ]);
  const xb = summa([
    [1, 'x'],
    [b, ''],
  ]);
  const answer = (x0 + b) ** 2 + 2 * (x0 + a) * (x0 + b);
  return {
    uslovie: `Найдите значение производной функции $y = (${xa})(${xb})^2$ в точке $x_0 = ${num(x0)}$.`,
    answer,
    podskazka: "$(uv)' = u'v + uv'$, $((x + b)^2)' = 2(x + b)$.",
    razbor: [
      `$y' = (${xb})^2 + 2(${xa})(${xb})$`,
      `$y'(${num(x0)}) = ${num((x0 + b) ** 2)} + ${num(2 * (x0 + a) * (x0 + b))} = ${num(answer)}$`.replace(
        '+ -',
        '- ',
      ),
    ],
    proverka: () => okr(dChislo((x) => (x + a) * (x + b) ** 2, x0)),
  };
});

/* ── 3. Производная логарифма ───────────────────────────────────── */

const LOGARIFM = desyat('ln', (r) => {
  const t = r.pick([1, 2, 4, 5]);
  const m = r.int(1, 9);
  const k = t * r.int(1, 6);
  const a = r.int(1, 9);
  const x0 = t - a;
  const xa = summa([
    [1, 'x'],
    [a, ''],
  ]);
  const answer = k / t - m;
  return {
    uslovie: `Найдите значение производной функции $y = ${summa([
      [k, `\\ln(${xa})`],
      [-m, 'x'],
    ])}$ в точке $x_0 = ${num(x0)}$.`,
    answer,
    podskazka: "$(\\ln(x + a))' = \\dfrac{1}{x + a}$.",
    razbor: [
      `$y' = \\dfrac{${k}}{${xa}} - ${m}$`,
      `$y'(${num(x0)}) = \\dfrac{${k}}{${t}} - ${m} = ${num(answer)}$`,
    ],
    proverka: () => okr(dChislo((x) => k * Math.log(x + a) - m * x, x0)),
  };
});

/* ── 4. Нули производной ────────────────────────────────────────── */

const NULI = desyat('nu', (r, i) => {
  /* y' = 3(x − r1)(x − r2): y = x³ − 1,5(r1 + r2)x² + 3r1r2x. r1 + r2 — чётное. */
  const r1 = r.int(-7, 5);
  const r2 = r1 + 2 * r.int(1, 5);
  const s = (3 * (r1 + r2)) / 2;
  const fn = summa([
    [1, 'x^3'],
    [-s, 'x^2'],
    [3 * r1 * r2, 'x'],
    [r.int(-9, 9), ''],
  ]);
  const bolshiy = i % 2 === 0;
  const answer = bolshiy ? r2 : r1;
  return {
    uslovie: `Найдите ${bolshiy ? 'больший' : 'меньший'} корень уравнения $y' = 0$ для функции $y = ${fn}$.`,
    answer,
    podskazka: "Найди $y'$, вынеси $3$ и реши квадратное уравнение.",
    razbor: [
      `$y' = ${summa([
        [3, 'x^2'],
        [-2 * s, 'x'],
        [3 * r1 * r2, ''],
      ])} = 3(${summa([
        [1, 'x^2'],
        [-(r1 + r2), 'x'],
        [r1 * r2, ''],
      ])})$`,
      `Корни: $x = ${num(r1)}$ и $x = ${num(r2)}$.`,
    ],
    proverka: () => {
      /* Перебор: где производная меняет знак. */
      const korni: number[] = [];
      const dy = (x: number) => 3 * x * x - 2 * s * x + 3 * r1 * r2;
      for (let x = -20; x < 20; x += 0.25) {
        if (dy(x) === 0) korni.push(x);
        else if (dy(x) * dy(x + 0.25) < 0) korni.push(okr(x + 0.125));
      }
      return Math.round(bolshiy ? Math.max(...korni) : Math.min(...korni));
    },
  };
});

/* ── 5. Знак производной ────────────────────────────────────────── */

const ZNAK = desyat('zn', (r, i) => {
  /* f'(x) = (x − a)(x − b)²(x − c), a < b < c или b вне — кратный корень знак не меняет. */
  const a = r.int(-8, -1);
  const b = r.int(0, 3);
  const c = b + r.int(2, 6);
  const dvoynoy = r.pick(['a', 'b', 'c'] as const);
  const mn = (t: number, k: 'a' | 'b' | 'c') => `(${xMinus(t)})${dvoynoy === k ? '^2' : ''}`;
  const proizv = `${mn(a, 'a')}${mn(b, 'b')}${mn(c, 'c')}`;
  const f = (x: number) =>
    (x - a) ** (dvoynoy === 'a' ? 2 : 1) *
    (x - b) ** (dvoynoy === 'b' ? 2 : 1) *
    (x - c) ** (dvoynoy === 'c' ? 2 : 1);
  const tochki = [a, b, c];
  const smena = tochki.filter((t) => f(t - 0.5) * f(t + 0.5) < 0);
  const max = smena.filter((t) => f(t - 0.5) > 0);
  const min = smena.filter((t) => f(t - 0.5) < 0);
  const ishchem: 'max' | 'min' =
    i % 2 === 0 && max.length > 0 ? 'max' : min.length > 0 ? 'min' : 'max';
  const otvety = ishchem === 'max' ? max : min;
  const answer = otvety[0] ?? 0;
  return {
    uslovie: `Производная функции $f$ равна $f'(x) = ${proizv}$. Найдите точку ${ishchem === 'max' ? 'максимума' : 'минимума'} функции $f$.`,
    answer,
    podskazka:
      'Расставь знаки производной на интервалах между нулями. В квадрате знак не меняется.',
    razbor: [
      `Нули: $${num(a)}$, $${num(b)}$, $${num(c)}$; $${dvoynoy === 'a' ? num(a) : dvoynoy === 'b' ? num(b) : num(c)}$ — корень в квадрате, там знак не меняется.`,
      `Знак меняется с «${ishchem === 'max' ? '+' : '−'}» на «${ishchem === 'max' ? '−' : '+'}» в точке $x = ${num(answer)}$.`,
    ],
    proverka: () => {
      for (let x = -12; x < 12; x += 0.5) {
        const l = f(x - 0.25);
        const p = f(x + 0.25);
        if ((ishchem === 'max' ? l > 0 && p < 0 : l < 0 && p > 0) && Math.abs(f(x)) < 1e-9)
          return x;
      }
      return Number.NaN;
    },
  };
});

/* ── 6. Значение в точке ────────────────────────────────────────── */

const ZNACHENIE = desyat('zv', (r, i) => {
  const x0 = r.int(-6, 6);
  if (i % 3 === 0) {
    const k = r.int(2, 9);
    const m = r.int(1, 9);
    const c = r.int(-10, 10);
    const a = 1 - x0;
    const xa = summa([
      [1, 'x'],
      [a, ''],
    ]);
    const answer = k * 0 - m * x0 + c;
    return {
      uslovie: `Найдите значение функции $y = ${summa([
        [k, `\\ln(${xa})`],
        [-m, 'x'],
        [c, ''],
      ])}$ в точке $x = ${num(x0)}$.`,
      answer,
      podskazka: '$\\ln 1 = 0$.',
      razbor: [
        `$${num(x0)} ${a < 0 ? '-' : '+'} ${Math.abs(a)} = 1$, $\\ln 1 = 0$.`,
        `$y = ${num(answer)}$`,
      ],
      proverka: () => okr(k * Math.log(x0 + a) - m * x0 + c),
    };
  }
  if (i % 3 === 1) {
    const a = r.int(-6, 6);
    const c = r.int(-8, 8);
    const answer = x0 - a + c;
    return {
      uslovie: `Найдите значение функции $y = (${xMinus(a)})e^{${xMinus(x0)}}${c === 0 ? '' : c < 0 ? c : `+${c}`}$ в точке $x = ${num(x0)}$.`,
      answer,
      podskazka: '$e^0 = 1$.',
      razbor: [
        `Показатель $${num(x0)} - ${num(x0)}`.replace('- -', '+ ') + ` = 0$, $e^0 = 1$.`,
        `$y = ${num(x0 - a)}\\cdot 1 ${c < 0 ? '-' : '+'} ${Math.abs(c)} = ${num(answer)}$`,
      ],
      proverka: () => okr((x0 - a) * Math.exp(0) + c),
    };
  }
  const a = znakR(r, 1, 2);
  const b = r.int(-9, 9);
  const c = r.int(-20, 20);
  const answer = a * x0 ** 3 + b * x0 + c;
  return {
    uslovie: `Найдите значение функции $y = ${summa([
      [a, 'x^3'],
      [b, 'x'],
      [c, ''],
    ])}$ в точке $x = ${num(x0)}$.`,
    answer,
    podskazka: 'Подставь число в каждое слагаемое; куб отрицательного числа отрицателен.',
    razbor: [
      `$y(${num(x0)}) = ${num(a * x0 ** 3)} ${b * x0 < 0 ? '-' : '+'} ${Math.abs(b * x0)} ${c < 0 ? '-' : '+'} ${Math.abs(c)} = ${num(answer)}$`,
    ],
    proverka: () => okr(a * x0 ** 3 + b * x0 + c),
  };
});

/* ── 7. Вершина параболы ────────────────────────────────────────── */

const VERSHINA = desyat('vp', (r, i) => {
  const h = znakR(r, 1, 11);
  const d = r.int(-9, 20);
  const tri = summa([
    [1, 'x^2'],
    [-2 * h, 'x'],
    [h * h + d, ''],
  ]);
  if (i % 2 === 0) {
    return {
      uslovie: `Найдите абсциссу вершины параболы $y = ${tri}$.`,
      answer: h,
      podskazka: '$x_0 = -\\dfrac{b}{2a}$.',
      razbor: [`$x_0 = -\\dfrac{${num(-2 * h)}}{2} = ${num(h)}$`],
      proverka: () => {
        let best = -100;
        for (let x = -30; x <= 30; x += 1) if ((x - h) ** 2 + d < (best - h) ** 2 + d) best = x;
        return best;
      },
    };
  }
  return {
    uslovie: `Найдите наименьшее значение выражения $${tri}$.`,
    answer: d,
    podskazka: 'Наименьшее значение — в вершине: $x_0 = -\\dfrac{b}{2a}$, подставь его.',
    razbor: [
      `$x_0 = ${num(h)}$`,
      `$${num(h * h)} ${-2 * h * h < 0 ? '-' : '+'} ${Math.abs(2 * h * h)} + ${num(h * h + d)} = ${num(d)}$`.replace(
        '+ -',
        '- ',
      ),
    ],
    proverka: () => {
      let best = Infinity;
      for (let x = -40; x <= 40; x += 0.5) best = Math.min(best, x * x - 2 * h * x + h * h + d);
      return okr(best);
    },
  };
});

export const BLOKI_OPORNYH21: BlokOpornyh[] = [
  {
    slug: 'proizvodnaya-mnogochlena',
    nazvanie: 'Производная многочлена',
    zapomni: "$(x^n)' = nx^{n-1}$, $(kx)' = k$, $(c)' = 0$.",
    prototipy: ['P01', 'P02', 'P03'],
    zadachi: MNOGOCHLEN,
  },
  {
    slug: 'proizvodnaya-proizvedeniya',
    nazvanie: 'Производная произведения',
    zapomni: "$(uv)' = u'v + uv'$, $(e^{x+b})' = e^{x+b}$.",
    prototipy: ['P06', 'P07', 'P15'],
    zadachi: PROIZVEDENIE,
  },
  {
    slug: 'proizvodnaya-logarifma',
    nazvanie: 'Производная логарифма',
    zapomni:
      "$(\\ln x)' = \\dfrac1x$, $(\\ln(x + a))' = \\dfrac{1}{x + a}$, $(\\ln(kx))' = \\dfrac1x$.",
    prototipy: ['P08', 'P09', 'P10', 'P11', 'P12'],
    zadachi: LOGARIFM,
  },
  {
    slug: 'nuli-proizvodnoy',
    nazvanie: 'Нули производной',
    zapomni:
      "Точки, где $y' = 0$, — кандидаты в экстремумы. Квадратное уравнение решай по теореме Виета.",
    prototipy: ['P01', 'P02', 'P04', 'P05', 'P10'],
    zadachi: NULI,
  },
  {
    slug: 'znak-proizvodnoy',
    nazvanie: 'Знак производной',
    zapomni:
      "$y'$: «+» → «−» — максимум, «−» → «+» — минимум. В множителе-квадрате знак не меняется.",
    prototipy: ['P01', 'P04', 'P06', 'P10', 'P15'],
    zadachi: ZNAK,
  },
  {
    slug: 'znachenie-v-tochke',
    nazvanie: 'Значение функции в точке',
    zapomni: '$\\ln 1 = 0$, $e^0 = 1$: в точке экстремума они обычно и появляются.',
    prototipy: ['P02', 'P03', 'P05', 'P07', 'P08', 'P09', 'P12', 'P13', 'P14'],
    zadachi: ZNACHENIE,
  },
  {
    slug: 'vershina-parabol',
    nazvanie: 'Вершина параболы',
    zapomni:
      '$y = ax^2 + bx + c$: вершина в $x_0 = -\\dfrac{b}{2a}$; при $a > 0$ там наименьшее значение.',
    prototipy: ['P16', 'P17', 'P18', 'P19', 'P20', 'P21'],
    zadachi: VERSHINA,
  },
];

/** Блок опорных задач у каждого типа — для кнопки «Опорные задачи» на карте задания. */
export const BLOK_TIPA21: Record<string, string> = {
  P01: 'znak-proizvodnoy',
  P02: 'znachenie-v-tochke',
  P03: 'proizvodnaya-mnogochlena',
  P04: 'znak-proizvodnoy',
  P05: 'nuli-proizvodnoy',
  P06: 'proizvodnaya-proizvedeniya',
  P07: 'proizvodnaya-proizvedeniya',
  P08: 'proizvodnaya-logarifma',
  P09: 'proizvodnaya-logarifma',
  P10: 'proizvodnaya-logarifma',
  P11: 'proizvodnaya-logarifma',
  P12: 'znachenie-v-tochke',
  P13: 'znachenie-v-tochke',
  P14: 'znachenie-v-tochke',
  P15: 'proizvodnaya-proizvedeniya',
  P16: 'vershina-parabol',
  P17: 'vershina-parabol',
  P18: 'vershina-parabol',
  P19: 'vershina-parabol',
  P20: 'vershina-parabol',
  P21: 'vershina-parabol',
};

export function blokPoSlugu21(slug: string): BlokOpornyh | undefined {
  return BLOKI_OPORNYH21.find((b) => b.slug === slug);
}

/** Задача для браузера: ответ — отпечатком, разбор (в нём есть ответ) — закрыт. */
export function opornyeDlyaBrauzera21(b: BlokOpornyh) {
  return b.zadachi.map(({ id, uslovie, podskazka, razbor, answer }) => ({
    id,
    uslovie,
    podskazka,
    razbor: sealText(JSON.stringify(razbor), id),
    seal: sealAnswer(answer),
  }));
}
