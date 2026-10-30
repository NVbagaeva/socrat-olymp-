/**
 * «Опорные задачи» задания №6: семь блоков навыков по 10 коротких
 * задач — то, из чего складывается любая задача №6: сложить вероятности,
 * перевести частоты в вероятности, умножить по дереву, строка $x_ip_i$,
 * $\mathrm{M}(X^2)$ и квадрат $\mathrm{M}$, отклонения от среднего, значения в промежутке.
 *
 * Задачи свои (не из открытого банка), ответ — целое или конечная
 * десятичная дробь. Числа считаются в целых долях (сотых), поэтому
 * ответ точный. У каждой задачи — подсказка, короткий разбор и
 * `proverka`: тот же ответ, посчитанный другим путём обычной
 * арифметикой, — самотест сверяет его с записанным. В браузер ответ
 * уходит отпечатком (opornyeDlyaBrauzera).
 */

import { d } from '../zadanie11/num';
import { sealAnswer, sealText } from './secret';
import type { SkillId } from './types';

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
  id: SkillId;
  slug: string;
  no: number;
  nazvanie: string;
  /** Короткое описание для карточки — без формул (правило раздела). */
  opisanie: string;
  /** «Запомни»: правило блока, с формулами. */
  zapomni: string;
  /** Прототипы, где навык нужен. */
  prototipy: string[];
  zadachi: MikroZadacha[];
}

const okr = (x: number) => Math.round(x * 1e9) / 1e9;
/** Сотые → TeX: 35 → 0{,}35. */
const s = (n: number) => d(okr(n / 100));
const sumTex = (ps: readonly number[]) => ps.map(s).join('+');
const sk = (x: number) => (x < 0 ? `(${d(x)})` : d(x));

/* ── 1. Сложить вероятности ────────────────────────────────────── */

const SLOZHIT_DANNYE: { ps: number[]; vybor: number[] }[] = [
  { ps: [10, 35, 20, 35], vybor: [1, 2] },
  { ps: [25, 15, 40, 20], vybor: [0, 3] },
  { ps: [5, 30, 45, 20], vybor: [0, 1, 3] },
  { ps: [12, 28, 33, 27], vybor: [1, 3] },
  { ps: [40, 6, 24, 30], vybor: [0, 2] },
  { ps: [15, 15, 50, 20], vybor: [2, 3] },
];

const PROPUSK_DANNYE: number[][] = [
  [20, 35, 45],
  [15, 25, 10, 50],
  [5, 40, 25, 30],
  [62, 18, 20],
];

const BUKVY = ['a', 'b', 'c', 'd'];

const SLOZHIT: MikroZadacha[] = [
  ...SLOZHIT_DANNYE.map(({ ps, vybor }, i) => {
    const otvet = vybor.reduce((acc, j) => acc + (ps[j] as number), 0);
    const spisok = ps.map((p, j) => `$P(${BUKVY[j]})=${s(p)}$`).join(', ');
    const imena = vybor.map((j) => `$${BUKVY[j]}$`).join(', ');
    return {
      id: `sl-${i + 1}`,
      uslovie: `Элементарные события опыта: ${spisok}. Событию $A$ благоприятствуют ${imena}. Найдите $P(A)$.`,
      answer: okr(otvet / 100),
      podskazka:
        'Вероятность события — сумма вероятностей элементарных событий, которые ему благоприятствуют.',
      razbor: [`$P(A)=${sumTex(vybor.map((j) => ps[j] as number))}=${s(otvet)}$.`],
      proverka: () => 1 - ps.reduce((acc, p, j) => (vybor.includes(j) ? acc : acc + p / 100), 0),
    };
  }),
  ...PROPUSK_DANNYE.map((ps, i) => {
    const izv = ps.slice(0, -1);
    const otvet = ps.at(-1) as number;
    const vals = ps.map((_, j) => j + 1);
    return {
      id: `sl-${SLOZHIT_DANNYE.length + i + 1}`,
      uslovie: `Случайная величина принимает значения ${vals.map((v) => `$${v}$`).join(', ')}. Вероятности первых: ${izv.map((p) => `$${s(p)}$`).join(', ')}. Найдите вероятность последнего значения.`,
      answer: okr(otvet / 100),
      podskazka: 'Сумма вероятностей распределения равна $1$.',
      razbor: [`$1-(${sumTex(izv)})=1-${s(izv.reduce((a, b) => a + b, 0))}=${s(otvet)}$.`],
      proverka: () => okr(1 - izv.reduce((a, b) => a + b, 0) / 100),
    };
  }),
];

/* ── 2. Частоты → вероятности ──────────────────────────────────── */

const CHASTOTY_DANNYE: { n: number; iz: number; kto: string; mnogo: string; odin: string }[] = [
  {
    n: 37,
    iz: 100,
    kto: 'покупателей',
    mnogo: 'берут кофе с собой',
    odin: 'покупатель возьмёт кофе с собой',
  },
  {
    n: 8,
    iz: 100,
    kto: 'зрителей',
    mnogo: 'покупают два билета',
    odin: 'зритель купит два билета',
  },
  {
    n: 12,
    iz: 50,
    kto: 'учеников',
    mnogo: 'опаздывают на первый урок',
    odin: 'ученик опоздает на первый урок',
  },
  {
    n: 45,
    iz: 200,
    kto: 'заказов',
    mnogo: 'доставляют быстрее чем за 20 минут',
    odin: 'заказ будет доставлен быстрее чем за 20 минут',
  },
  {
    n: 3,
    iz: 20,
    kto: 'игроков',
    mnogo: 'открывают лутбокс каждый день',
    odin: 'игрок открывает лутбокс каждый день',
  },
  {
    n: 18,
    iz: 40,
    kto: 'подписчиков',
    mnogo: 'ставят лайк под новым видео',
    odin: 'подписчик поставит лайк под новым видео',
  },
  {
    n: 150,
    iz: 1000,
    kto: 'пассажиров',
    mnogo: 'едут с пересадкой',
    odin: 'пассажир едет с пересадкой',
  },
  { n: 27, iz: 300, kto: 'чеков', mnogo: 'дают кэшбэк', odin: 'чек даст кэшбэк' },
  {
    n: 7,
    iz: 25,
    kto: 'дней апреля',
    mnogo: 'оказываются дождливыми',
    odin: 'день окажется дождливым',
  },
  {
    n: 64,
    iz: 400,
    kto: 'участников',
    mnogo: 'проходят во второй тур олимпиады',
    odin: 'участник пройдёт во второй тур',
  },
];

const CHASTOTY: MikroZadacha[] = CHASTOTY_DANNYE.map((c, i) => ({
  id: `ch-${i + 1}`,
  uslovie: `В среднем ${c.n} из ${c.iz} ${c.kto} ${c.mnogo}. Найдите вероятность того, что случайный ${c.odin}.`,
  answer: okr(c.n / c.iz),
  podskazka: 'Частота — это доля: число подходящих делим на число всех.',
  razbor: [`$\\dfrac{${c.n}}{${c.iz}}=${d(okr(c.n / c.iz))}$.`],
  proverka: () => (c.n * (1000 / c.iz)) / 1000,
}));

/* ── 3. Умножение по дереву ────────────────────────────────────── */

const DEREVO_DANNYE: number[][] = [
  [60, 40],
  [30, 50],
  [75, 20],
  [90, 15],
  [45, 60],
  [50, 50, 40],
  [80, 25, 50],
  [70, 30, 20],
  [25, 40],
  [35, 80],
];

const DEREVO: MikroZadacha[] = DEREVO_DANNYE.map((ps, i) => {
  const otvet = ps.reduce((acc, p) => acc * (p / 100), 1);
  return {
    id: `dr-${i + 1}`,
    uslovie: `На пути от корня дерева к исходу $c$ — рёбра с вероятностями ${ps.map((p) => `$${s(p)}$`).join(', ')}. Найдите $P(c)$.`,
    answer: okr(otvet),
    podskazka: 'Вдоль ветки вероятности перемножают.',
    razbor: [`$P(c)=${ps.map(s).join('\\cdot')}=${d(okr(otvet))}$.`],
    proverka: () => Math.exp(ps.reduce((acc, p) => acc + Math.log(p / 100), 0)),
  };
});

/* ── 4. Строка xp ──────────────────────────────────────────────── */

const XP_DANNYE: { xs: number[]; ps: number[] }[] = [
  { xs: [1, 2, 3], ps: [20, 50, 30] },
  { xs: [0, 2, 5], ps: [40, 35, 25] },
  { xs: [-2, 1, 4], ps: [25, 50, 25] },
  { xs: [-1, 0, 3, 6], ps: [10, 30, 40, 20] },
  { xs: [10, 20, 50], ps: [60, 30, 10] },
  { xs: [-3, 2, 6, 8], ps: [10, 45, 15, 30] },
  { xs: [0, 1, 2, 3], ps: [5, 15, 50, 30] },
  { xs: [100, 200, 500], ps: [70, 25, 5] },
  { xs: [-4, -1, 2], ps: [15, 35, 50] },
  { xs: [2, 4, 6, 8], ps: [25, 25, 25, 25] },
];

const STROKA_XP: MikroZadacha[] = XP_DANNYE.map(({ xs, ps }, i) => {
  const sum = xs.reduce((acc, x, j) => acc + x * (ps[j] as number), 0);
  return {
    id: `xp-${i + 1}`,
    uslovie: `$X\\sim\\begin{pmatrix}${xs.map(d).join('&')}\\\\${ps.map(s).join('&')}\\end{pmatrix}$. Найдите $\\mathrm{M}(X)$.`,
    answer: okr(sum / 100),
    podskazka: 'Строка $x_ip_i$: каждое значение умножаем на его вероятность, потом складываем.',
    razbor: [
      `$\\mathrm{M}(X)=${xs.map((x, j) => (x === 1 ? s(ps[j] as number) : `${sk(x)}\\cdot${s(ps[j] as number)}`)).join('+')}=${s(sum)}$.`,
    ],
    proverka: () => xs.map((x, j) => (x * (ps[j] as number)) / 100).reduce((a, b) => a + b, 0),
  };
});

/* ── 5. M(X²) и квадрат M ──────────────────────────────────────── */

const KV_DANNYE: { xs: number[]; ps: number[]; chto: 'E2' | 'D' }[] = [
  { xs: [0, 1, 2], ps: [30, 40, 30], chto: 'E2' },
  { xs: [1, 3], ps: [50, 50], chto: 'E2' },
  { xs: [-1, 2], ps: [40, 60], chto: 'E2' },
  { xs: [0, 3], ps: [50, 50], chto: 'D' },
  { xs: [1, 3, 5], ps: [10, 80, 10], chto: 'D' },
  { xs: [0, 1], ps: [60, 40], chto: 'D' },
  { xs: [2, 4], ps: [25, 75], chto: 'D' },
  { xs: [-2, 0, 2], ps: [25, 50, 25], chto: 'E2' },
  { xs: [1, 2, 3], ps: [20, 60, 20], chto: 'D' },
  { xs: [0, 10], ps: [90, 10], chto: 'D' },
];

const KVADRAT_E: MikroZadacha[] = KV_DANNYE.map(({ xs, ps, chto }, i) => {
  const e = xs.reduce((acc, x, j) => acc + x * (ps[j] as number), 0) / 100;
  const e2 = xs.reduce((acc, x, j) => acc + x * x * (ps[j] as number), 0) / 100;
  const otvet = chto === 'E2' ? e2 : e2 - e * e;
  const zapis = `$X\\sim\\begin{pmatrix}${xs.map(d).join('&')}\\\\${ps.map(s).join('&')}\\end{pmatrix}$`;
  return {
    id: `kv-${i + 1}`,
    uslovie: chto === 'E2' ? `${zapis}. Найдите $\\mathrm{M}(X^2)$.` : `${zapis}. Найдите $\\mathrm{D}(X)$.`,
    answer: okr(otvet),
    podskazka:
      chto === 'E2'
        ? 'Квадраты значений умножаем на вероятности и складываем: $\\mathrm{M}(X^2)=\\sum x_i^2p_i$.'
        : 'Сначала $\\mathrm{M}(X)$ и $\\mathrm{M}(X^2)$, потом $\\mathrm{D}=\\mathrm{M}(X^2)-\\left(\\mathrm{M}(X)\\right)^2$.',
    razbor:
      chto === 'E2'
        ? [
            `$\\mathrm{M}(X^2)=${xs.map((x, j) => `${d(x * x)}\\cdot${s(ps[j] as number)}`).join('+')}=${d(okr(e2))}$.`,
          ]
        : [
            `$\\mathrm{M}(X)=${d(okr(e))}$, $\\mathrm{M}(X^2)=${d(okr(e2))}$.`,
            `$\\mathrm{D}(X)=${d(okr(e2))}-${e < 0 ? `(${d(okr(e))})` : d(okr(e))}^2=${d(okr(otvet))}$.`,
          ],
    proverka: () =>
      chto === 'E2'
        ? e2
        : xs.reduce((acc, x, j) => acc + (x - e) ** 2 * ((ps[j] as number) / 100), 0),
  };
});

/* ── 6. Отклонения от среднего ─────────────────────────────────── */

const OTKL_DANNYE: { xs: number[]; chto: 'srednee' | 'kvadrat' | 'summa' | 'S2' }[] = [
  { xs: [2, 4, 6, 8], chto: 'srednee' },
  { xs: [1.5, 2.5, 3, 5], chto: 'srednee' },
  { xs: [3, 5, 7], chto: 'kvadrat' },
  { xs: [2, 4.9, 1, 3.1], chto: 'kvadrat' },
  { xs: [1, 2, 3, 6], chto: 'summa' },
  { xs: [4, 4, 5, 7], chto: 'summa' },
  { xs: [2, 4, 6], chto: 'S2' },
  { xs: [1, 3, 5, 7, 9], chto: 'S2' },
  { xs: [10, 12, 14, 16, 18], chto: 'S2' },
  { xs: [0.5, 1.5, 2.5, 3.5], chto: 'srednee' },
];

const OTKLONENIYA: MikroZadacha[] = OTKL_DANNYE.map(({ xs, chto }, i) => {
  const n = xs.length;
  const sr = okr(xs.reduce((a, b) => a + b, 0) / n);
  const posl = xs.at(-1) as number;
  const kv = okr((posl - sr) ** 2);
  const sKv = okr(xs.reduce((a, x) => a + (x - sr) ** 2, 0));
  const S2 = okr(sKv / (n - 1));
  const vyborka = `$${xs.map(d).join(';\\ ')}$`;
  const otvet = chto === 'srednee' ? sr : chto === 'kvadrat' ? kv : chto === 'summa' ? sKv : S2;
  const uslovie = {
    srednee: `Выборка: ${vyborka}. Найдите выборочное среднее.`,
    kvadrat: `Выборка: ${vyborka}. Найдите квадрат отклонения последнего значения от выборочного среднего.`,
    summa: `Выборка: ${vyborka}. Найдите сумму квадратов отклонений значений от выборочного среднего.`,
    S2: `Выборка: ${vyborka}. Найдите несмещённую оценку дисперсии.`,
  }[chto];
  const razbor =
    chto === 'srednee'
      ? [`$\\overline{x}=\\dfrac{${d(okr(sr * n))}}{${n}}=${d(sr)}$.`]
      : chto === 'kvadrat'
        ? [`$\\overline{x}=${d(sr)}$; $(${d(posl)}-${d(sr)})^2=${d(okr(posl - sr))}^2=${d(kv)}$.`]
        : chto === 'summa'
          ? [
              `$\\overline{x}=${d(sr)}$; ${xs.map((x) => `$(${d(x)}-${d(sr)})^2$`).join(' + ')} $=${d(sKv)}$.`,
            ]
          : [
              `$\\overline{x}=${d(sr)}$, сумма квадратов отклонений $${d(sKv)}$.`,
              `$S^2=\\dfrac{${d(sKv)}}{${n - 1}}=${d(S2)}$.`,
            ];
  return {
    id: `ot-${i + 1}`,
    uslovie,
    answer: otvet,
    podskazka: {
      srednee: 'Сумму значений делим на их число.',
      kvadrat: 'Сначала среднее, потом разность и её квадрат.',
      summa: 'Из каждого значения вычитаем среднее, возводим в квадрат и складываем.',
      S2: 'Сумму квадратов отклонений делим на $n-1$.',
    }[chto],
    razbor,
    proverka: () => {
      const m = xs.reduce((a, b) => a + b, 0) / n;
      if (chto === 'srednee') return m;
      if (chto === 'kvadrat') return (posl - m) * (posl - m);
      /* Сумма квадратов отклонений = сумма квадратов − n·среднее². */
      const sk2 = xs.reduce((a, x) => a + x * x, 0) - n * m * m;
      return chto === 'summa' ? sk2 : sk2 / (n - 1);
    },
  };
});

/* ── 7. Значения в промежутке ──────────────────────────────────── */

const PROM_DANNYE: {
  xs: number[];
  ps: number[];
  a: number;
  b: number;
  zl: '<' | '≤';
  zr: '<' | '≤';
}[] = [
  { xs: [1, 2, 3, 4, 5], ps: [10, 20, 30, 25, 15], a: 2, b: 5, zl: '<', zr: '<' },
  { xs: [1, 2, 3, 4, 5], ps: [10, 20, 30, 25, 15], a: 2, b: 5, zl: '≤', zr: '≤' },
  { xs: [0, 1, 2, 3], ps: [25, 35, 30, 10], a: 0, b: 2, zl: '<', zr: '≤' },
  { xs: [3, 4, 5, 6, 7, 8], ps: [25, 25, 20, 15, 10, 5], a: -1, b: 7, zl: '≤', zr: '<' },
  { xs: [2, 4, 6, 8], ps: [15, 35, 30, 20], a: 3, b: 7, zl: '<', zr: '<' },
  { xs: [-2, -1, 0, 1, 2], ps: [10, 20, 40, 20, 10], a: -1, b: 1, zl: '≤', zr: '≤' },
  { xs: [10, 20, 30, 40], ps: [40, 30, 20, 10], a: 15, b: 40, zl: '<', zr: '<' },
  { xs: [1, 3, 5, 7, 9], ps: [5, 25, 40, 25, 5], a: 3, b: 9, zl: '<', zr: '≤' },
  { xs: [0, 5, 10, 15], ps: [30, 30, 25, 15], a: 5, b: 20, zl: '≤', zr: '<' },
  { xs: [1, 2, 3, 4, 5, 6], ps: [20, 15, 5, 25, 10, 25], a: 3, b: 6, zl: '<', zr: '<' },
];

const ZNAK = { '<': '<', '≤': '\\leqslant ' } as const;

const PROMEZHUTOK: MikroZadacha[] = PROM_DANNYE.map(({ xs, ps, a, b, zl, zr }, i) => {
  const vh = (x: number) => (zl === '<' ? x > a : x >= a) && (zr === '<' ? x < b : x <= b);
  const idx = xs.map((x, j) => (vh(x) ? j : -1)).filter((j) => j >= 0);
  const otvet = idx.reduce((acc, j) => acc + (ps[j] as number), 0);
  const sob = `${d(a)}${ZNAK[zl]}X${ZNAK[zr]}${d(b)}`;
  return {
    id: `pr-${i + 1}`,
    uslovie: `$X\\sim\\begin{pmatrix}${xs.map(d).join('&')}\\\\${ps.map(s).join('&')}\\end{pmatrix}$. Найдите $P(${sob})$.`,
    answer: okr(otvet / 100),
    podskazka:
      'Выпишите значения из промежутка: при знаке $<$ граница не входит, при $\\leqslant$ — входит.',
    razbor: [
      `Подходят ${idx.map((j) => `$${d(xs[j] as number)}$`).join(', ')}: $P=${sumTex(idx.map((j) => ps[j] as number))}=${s(otvet)}$.`,
    ],
    proverka: () =>
      xs.reduce((acc, x, j) => {
        const lev = zl === '<' ? a < x : a <= x;
        const prav = zr === '<' ? x < b : x <= b;
        return lev && prav ? acc + (ps[j] as number) / 100 : acc;
      }, 0),
  };
});

/* ── Блоки ─────────────────────────────────────────────────────── */

export const BLOKI_OPORNYH: BlokOpornyh[] = [
  {
    id: 'slozhit',
    slug: 'slozhit-veroyatnosti',
    no: 1,
    nazvanie: 'Сложить вероятности',
    opisanie: 'Вероятность события по его исходам и пропущенная вероятность распределения.',
    zapomni:
      '$P(A)$ — сумма вероятностей исходов события; сумма вероятностей распределения равна $1$.',
    prototipy: ['P01', 'P02', 'P11'],
    zadachi: SLOZHIT,
  },
  {
    id: 'chastoty',
    slug: 'chastoty',
    no: 2,
    nazvanie: 'Частоты → вероятности',
    opisanie: '«В среднем столько-то из ста» — это вероятность.',
    zapomni: '«$n$ из $N$» — вероятность $\\dfrac{n}{N}$; «из $100$» — делим на $100$.',
    prototipy: ['P04', 'P05', 'P08'],
    zadachi: CHASTOTY,
  },
  {
    id: 'derevo',
    slug: 'umnozhenie-po-derevu',
    no: 3,
    nazvanie: 'Умножение по дереву',
    opisanie: 'Вероятность исхода — по рёбрам пути от корня к листу.',
    zapomni:
      'Вероятность исхода — произведение вероятностей на рёбрах его пути: $P=p_1\\cdot p_2\\cdot\\ldots$',
    prototipy: ['P03'],
    zadachi: DEREVO,
  },
  {
    id: 'stroka-xp',
    slug: 'stroka-xp',
    no: 4,
    nazvanie: 'Строка «значение на вероятность»',
    opisanie: 'Математическое ожидание по таблице распределения.',
    zapomni: '$\\mathrm{M}(X)=x_1p_1+x_2p_2+\\ldots$ — добавляем строку $x_ip_i$ и складываем.',
    prototipy: ['P06', 'P07', 'P09'],
    zadachi: STROKA_XP,
  },
  {
    id: 'kvadrat-e',
    slug: 'kvadraty',
    no: 5,
    nazvanie: 'Среднее квадрата и квадрат среднего',
    opisanie: 'Дисперсия по распределению в два шага.',
    zapomni: '$\\mathrm{M}(X^2)=\\sum x_i^2p_i$, $\\mathrm{D}(X)=\\mathrm{M}(X^2)-\\left(\\mathrm{M}(X)\\right)^2$.',
    prototipy: ['P13', 'P14', 'P15'],
    zadachi: KVADRAT_E,
  },
  {
    id: 'otkloneniya',
    slug: 'otkloneniya',
    no: 6,
    nazvanie: 'Отклонения от среднего',
    opisanie: 'Среднее выборки, отклонения, их квадраты и несмещённая оценка.',
    zapomni:
      '$\\overline{x}=\\dfrac{\\sum x_i}{n}$, $S^2=\\dfrac{\\sum(x_i-\\overline{x})^2}{n-1}$.',
    prototipy: ['P12', 'P10'],
    zadachi: OTKLONENIYA,
  },
  {
    id: 'promezhutok',
    slug: 'promezhutok',
    no: 7,
    nazvanie: 'Какие значения в промежутке',
    opisanie: 'Строгие и нестрогие знаки, границы вне значений.',
    zapomni:
      '$<$ — граница не входит, $\\leqslant$ — входит; граница не из значений ни на что не влияет.',
    prototipy: ['P11'],
    zadachi: PROMEZHUTOK,
  },
];

export function blokPoSlugu(slug: string): BlokOpornyh | undefined {
  return BLOKI_OPORNYH.find((b) => b.slug === slug);
}

/** Задача для браузера: ответ — отпечатком, разбор (в нём есть ответ) — закрыт. */
export interface MikroDlyaBrauzera {
  id: string;
  uslovie: string;
  podskazka: string;
  /** Строки разбора JSON-ом, закрытые sealText с seed = id задачи. */
  razbor: string;
  seal: string;
}

export function opornyeDlyaBrauzera(b: BlokOpornyh): MikroDlyaBrauzera[] {
  return b.zadachi.map(({ id, uslovie, podskazka, razbor, answer }) => ({
    id,
    uslovie,
    podskazka,
    razbor: sealText(JSON.stringify(razbor), id),
    seal: sealAnswer(answer),
  }));
}
