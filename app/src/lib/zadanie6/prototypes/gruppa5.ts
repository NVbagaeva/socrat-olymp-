/**
 * Группа V. Дисперсия.
 *
 *   6.12  выборка из n значений → несмещённая оценка дисперсии
 *         (сумма квадратов отклонений делится на n − 1);
 *   6.13  распределение с дробными вероятностями ($\frac35$, $\frac25$) → D;
 *   6.14  распределение таблицей или записью → D(X);
 *   6.15  распределение → стандартное отклонение $\sigma=\sqrt{D}$.
 */

import {
  arr,
  div,
  etapy,
  lovushki,
  mul,
  num,
  otvetLine,
  plus,
  q,
  schitaem,
  str,
  strOpt,
  sub,
  sumQ,
  tablica,
  tq,
  tx,
  vopros,
  type Q,
} from '../kit';
import {
  dispersiya,
  lovushkiD,
  ozhidanie,
  ozhidanieKv,
  qTex,
  raspr,
  shagiD,
  summyRaspr,
  tablicaRaspr,
  zapisTex,
  type Raspr,
} from '../raspredelenie';
import type { HintStep, Params, Prototype, Ris, Solved, Tema } from '../types';
import { velichina } from '../velichiny';

/* ════════════════════ 6.12: несмещённая оценка дисперсии ════════════════════ */

export interface SyuzhetVyborki {
  key: string;
  tema: Tema;
  plot: string;
  /** «Игрок записал время (в минутах), за которое проходил уровень, в n случайно выбранных попытках» */
  text(n: number): string;
  /** «дисперсии времени прохождения уровня» */
  chego: string;
  /** Центр и разброс значений (в десятых). */
  centr: [number, number];
  razbros: number;
}

export const SYUZHETY_P12: SyuzhetVyborki[] = [
  {
    key: 'uroven',
    tema: 'igry',
    plot: 'время прохождения уровня',
    text: (n) =>
      `Игрок записал время (в минутах), за которое проходил уровень игры в ${n} случайно выбранных попытках:`,
    chego: 'дисперсии времени прохождения уровня',
    centr: [6, 12],
    razbros: 3,
  },
  {
    key: 'sotka',
    tema: 'sport',
    plot: 'время на стометровке',
    text: (n) =>
      `На уроке физкультуры записали время (в секундах), за которое ${n} случайно выбранных учеников пробежали 100 метров:`,
    chego: 'дисперсии времени пробега',
    centr: [13, 17],
    razbros: 2,
  },
  {
    key: 'dostavka',
    tema: 'dostavka',
    plot: 'время доставки заказов',
    text: (n) =>
      `Служба доставки записала время (в минутах) доставки ${n} случайно выбранных заказов:`,
    chego: 'дисперсии времени доставки',
    centr: [25, 40],
    razbros: 6,
  },
  {
    key: 'aprel',
    tema: 'pogoda',
    plot: 'температура в апреле',
    text: (n) =>
      `Метеостанция записала температуру воздуха (в градусах Цельсия) в полдень в ${n} случайно выбранных дней апреля:`,
    chego: 'дисперсии полуденной температуры',
    centr: [6, 12],
    razbros: 4,
  },
  {
    key: 'socseti',
    tema: 'socseti',
    plot: 'время в соцсетях',
    text: (n) =>
      `В опросе ${n} случайно выбранных подростков записали, сколько часов в день каждый проводит в соцсетях:`,
    chego: 'дисперсии времени, проведённого в соцсетях',
    centr: [2, 5],
    razbros: 2,
  },
  {
    key: 'olimpiada',
    tema: 'ekzameny',
    plot: 'время решения задачи олимпиады',
    text: (n) =>
      `На олимпиаде записали время (в минутах), за которое ${n} случайно выбранных участников решили первую задачу:`,
    chego: 'дисперсии времени решения',
    centr: [10, 20],
    razbros: 4,
  },
  {
    key: 'arbuzy',
    tema: 'magaziny',
    plot: 'масса арбузов',
    text: (n) => `Продавец взвесил ${n} случайно выбранных арбузов; их массы (в килограммах):`,
    chego: 'дисперсии массы арбуза',
    centr: [5, 9],
    razbros: 2,
  },
  {
    key: 'elektrichka',
    tema: 'transport',
    plot: 'ожидание электрички',
    text: (n) =>
      `Записали время (в минутах), которое ${n} случайно выбранных пассажиров ждали электричку:`,
    chego: 'дисперсии времени ожидания',
    centr: [4, 12],
    razbros: 4,
  },
  {
    key: 'doroga',
    tema: 'shkola',
    plot: 'дорога до школы',
    text: (n) =>
      `Записали время (в минутах), за которое ${n} случайно выбранных учеников дошли от дома до школы:`,
    chego: 'дисперсии времени в пути',
    centr: [8, 20],
    razbros: 5,
  },
  {
    key: 'kofeynya',
    tema: 'kofeynya',
    plot: 'ожидание заказа в кофейне',
    text: (n) =>
      `В кофейне записали время (в минутах) ожидания заказа у ${n} случайно выбранных посетителей:`,
    chego: 'дисперсии времени ожидания заказа',
    centr: [3, 8],
    razbros: 2,
  },
];

const VYBORKI = new Map(SYUZHETY_P12.map((s) => [s.key, s]));

export function syuzhetVyborki(key: string): SyuzhetVyborki {
  const s = VYBORKI.get(key);
  if (s === undefined) {
    throw new Error(`нет сюжета выборки ${key}`);
  }
  return s;
}

/** Значения выборки — числа с десятыми; считаем в десятых, чтобы не было хвостов. */
function vyborka(p: Params): Q[] {
  return arr(p, 'xs').map((x) => q(Math.round(x * 10), 10));
}

function znachenij(n: number): string {
  return n < 5 ? 'значения' : 'значений';
}

const P12: Prototype = {
  id: 'P12',
  no: 12,
  group: 'V',
  title: 'Выборка: несмещённая оценка дисперсии',
  formula: '$S^2=\\dfrac{\\sum(x_i-\\overline{x})^2}{n-1}$',
  skills: ['otkloneniya', 'kvadrat-e'],
  istochnik: 'Дисперсия, №1',
  ris: () => undefined,
  uslovie(p) {
    const xs = arr(p, 'xs');
    const n = xs.length;
    const spisok = xs.map((x) => tx(x)).join('; ');
    const sj = strOpt(p, 'sj');
    if (sj === undefined) {
      return {
        text: `Случайная выборка из некоторой генеральной совокупности содержит ${n} ${znachenij(n)}: ${spisok}. По этой выборке найдите несмещённую оценку дисперсии генеральной совокупности.`,
      };
    }
    const s = syuzhetVyborki(sj);
    return {
      text: `${s.text(n)} ${spisok}. Считая эти данные случайной выборкой, найдите несмещённую оценку ${s.chego}.`,
    };
  },
  solve(p) {
    const x = vyborka(p);
    const n = x.length;
    const sum = sumQ(x);
    const sr = div(sum, q(n));
    const otkl = x.map((xi) => sub(xi, sr));
    const kv = otkl.map((o) => mul(o, o));
    const sKv = sumQ(kv);
    const S2 = div(sKv, q(n - 1));
    const answer = S2.n / S2.m;
    const naN = div(sKv, q(n));
    const tab = tablica(
      [
        { zag: '$x_i$', yach: x.map((xi) => `$${tq(xi)}$`) },
        { zag: '$x_i-\\overline{x}$', yach: otkl.map((o) => `$${tq(o)}$`) },
        { zag: '$(x_i-\\overline{x})^2$', yach: kv.map((k) => `$${tq(k)}$`) },
      ],
      undefined,
      [2],
    );
    return {
      answer,
      etapy: etapy(
        {
          t: 'Находим выборочное среднее',
          lines: [
            `$\\overline{x}=\\dfrac{${plus(x.map(tq))}}{${n}}=\\dfrac{${tq(sum)}}{${n}}=${tq(sr)}$.`,
          ],
        },
        {
          t: 'Отклонения от среднего и их квадраты',
          lines: ['Из каждого значения вычитаем среднее и возводим разность в квадрат:'],
          tablica: tab,
        },
        {
          t: 'Складываем квадраты отклонений',
          lines: [`$\\sum(x_i-\\overline{x})^2=${plus(kv.map(tq))}=${tq(sKv)}$.`],
        },
        {
          t: 'Делим на $n-1$, а не на $n$',
          lines: [
            `Среднее уже «подогнано» под эту выборку, поэтому разброс вокруг него получается чуть меньше настоящего. Деление на $n-1=${n - 1}$ это исправляет:`,
            `$S^2=\\dfrac{${tq(sKv)}}{${n - 1}}=${tq(S2)}$.`,
            otvetLine(answer),
          ],
        },
      ),
      vychisleniya: [],
      hints: [
        vopros('Чему равно выборочное среднее?', `$${tq(sr)}$`, [
          `$${tq(sum)}$`,
          `$${tq(div(sum, q(n - 1)))}$`,
        ]),
        vopros(
          'На что делим сумму квадратов отклонений?',
          `на $n-1=${n - 1}$`,
          [`на $n=${n}$`, `на $n+1=${n + 1}$`],
          'Несмещённая оценка — деление на $n-1$.',
        ),
        vopros('Чему равна несмещённая оценка дисперсии?', `$${tq(S2)}$`, [
          `$${tq(naN)}$`,
          `$${tq(sKv)}$`,
        ]),
      ],
    };
  },
  pereschet(p) {
    const xs = arr(p, 'xs');
    const n = xs.length;
    const m = xs.reduce((s, x) => s + x, 0) / n;
    const s = xs.reduce((acc, x) => acc + (x - m) ** 2, 0);
    return Math.round((s / (n - 1)) * 1e9) / 1e9;
  },
  summy() {
    return [];
  },
};

/* ════════════════════ 6.13–6.15: дисперсия распределения ════════════════════ */

function vstuplenie(p: Params): { kontekst: string; velichina: string } | null {
  const sj = strOpt(p, 'sj');
  return sj === undefined ? null : velichina(sj);
}

/** Подсказки о дисперсии; у 6.15 добавляется шаг «корень». */
function podskazkiD(r: Raspr, sigma: boolean): HintStep[] {
  const E = ozhidanie(r);
  const E2 = ozhidanieKv(r);
  const D = dispersiya(r);
  const v = r.v;
  const out: HintStep[] = [
    vopros(
      `Как найти $\\mathrm{D}(${v})$?`,
      `$\\mathrm{D}(${v})=\\mathrm{M}(${v}^2)-\\left(\\mathrm{M}(${v})\\right)^2$`,
      [
        `$\\mathrm{D}(${v})=\\mathrm{M}(${v}^2)-\\mathrm{M}(${v})$`,
        `$\\mathrm{D}(${v})=\\left(\\mathrm{M}(${v})\\right)^2-\\mathrm{M}(${v}^2)$`,
        `$\\mathrm{D}(${v})=\\mathrm{M}(${v}^2)$`,
      ],
      'Среднее квадрата минус квадрат среднего.',
    ),
    vopros(
      `Чему равно $\\mathrm{M}(${v})$?`,
      `$${qTex(r, E)}$`,
      lovushki(
        E,
        [
          q(
            r.xs.reduce((s, x) => s + x, 0),
            r.xs.length,
          ),
          E2,
        ],
        (x) => qTex(r, x),
      ),
    ),
    vopros(
      `Чему равно $\\mathrm{M}(${v}^2)$?`,
      `$${qTex(r, E2)}$`,
      lovushki(E2, [mul(E, E), E], (x) => qTex(r, x)),
    ),
  ];
  if (sigma) {
    const s = koren(D);
    out.push(
      vopros(
        'Что нужно дать в ответе?',
        `$\\sigma=\\sqrt{\\mathrm{D}}=\\sqrt{${tq(D)}}=${tq(s as Q)}$`,
        [`$\\mathrm{D}=${tq(D)}$`, `$\\mathrm{D}^2$`],
        'Стандартное отклонение — корень из дисперсии.',
      ),
    );
  } else {
    out.push(vopros(`Чему равна $\\mathrm{D}(${v})$?`, `$${tq(D)}$`, lovushki(D, lovushkiD(r))));
  }
  return out;
}

/** Точный корень из конечной дроби или null. */
export function koren(x: Q): Q | null {
  const a = Math.round(Math.sqrt(x.n));
  const b = Math.round(Math.sqrt(x.m));
  return a * a === x.n && b * b === x.m ? q(a, b) : null;
}

function reshenieD(p: Params, obyk: boolean, sigma: boolean): Solved {
  const r = raspr(p, obyk);
  const sh = shagiD(r);
  const D = sh.D;
  const etapyD = [...sh.etapy];
  let answer = D.n / D.m;
  if (r.xs.length === 2 && r.xs[0] === 0 && r.xs[1] === 1) {
    const last = etapyD.at(-1);
    if (last) {
      last.lines.push(
        `Для величины со значениями $0$ и $1$ то же самое даёт формула $\\mathrm{D}=p(1-p)=${qTex(r, r.p[1] as Q)}\\cdot${qTex(r, r.p[0] as Q)}$.`,
      );
    }
  }
  if (sigma) {
    const s = koren(D);
    if (s === null) {
      throw new Error('дисперсия — не точный квадрат');
    }
    answer = s.n / s.m;
    etapyD.push({
      title: `Шаг ${etapyD.length + 1}. Стандартное отклонение — корень из дисперсии`,
      lines: [`$\\sigma(${r.v})=\\sqrt{\\mathrm{D}(${r.v})}=\\sqrt{${tq(D)}}=${tq(s)}$.`, otvetLine(answer)],
    });
  } else {
    etapyD.at(-1)?.lines.push(otvetLine(answer));
  }
  return {
    answer,
    etapy: etapyD,
    vychisleniya: obyk ? schitaemDrobi(r) : [],
    hints: podskazkiD(r, sigma),
  };
}

/** Панель для 6.13: приводим к общему знаменателю. */
function schitaemDrobi(r: Raspr) {
  const D = dispersiya(r);
  return D.m === 1 ? [] : schitaem(D.n, D.m, `\\mathrm{D}(${r.v})`);
}

const P13: Prototype = {
  id: 'P13',
  no: 13,
  group: 'V',
  title: 'Дисперсия: вероятности — обыкновенные дроби',
  formula: '$\\mathrm{D}(X)=\\mathrm{M}(X^2)-\\left(\\mathrm{M}(X)\\right)^2$',
  skills: ['kvadrat-e'],
  istochnik: 'Дисперсия, №2',
  ris: (p) => ({ vid: 'zapis', tex: zapisTex(raspr(p, true)) }),
  uslovie(p) {
    const r = raspr(p, true);
    const ris: Ris = { vid: 'zapis', tex: zapisTex(r) };
    const s = vstuplenie(p);
    if (s === null) {
      return {
        text: `Случайная величина $${r.v}$ распределена по закону:`,
        ris,
        posle: `Найдите дисперсию случайной величины $${r.v}$.`,
      };
    }
    return {
      text: `${s.kontekst} Случайная величина $${r.v}$ — ${s.velichina} — распределена по закону`,
      ris,
      posle: `Найдите дисперсию случайной величины $${r.v}$.`,
    };
  },
  solve: (p) => reshenieD(p, true, false),
  pereschet: (p) => pereschetD(p, false),
  summy: (p) => summyRaspr(raspr(p, true)),
};

function pereschetD(p: Params, sigma: boolean): number {
  const xs = arr(p, 'xs');
  const ps = arr(p, 'ps');
  const d0 = num(p, 'den');
  const E = xs.reduce((s, x, i) => s + (x * (ps[i] as number)) / d0, 0);
  /* Через отклонения — другим путём, чем решатель (M(X²) − M²). */
  const D = xs.reduce((s, x, i) => s + ((x - E) ** 2 * (ps[i] as number)) / d0, 0);
  return Math.round((sigma ? Math.sqrt(D) : D) * 1e9) / 1e9;
}

const P14: Prototype = {
  id: 'P14',
  no: 14,
  group: 'V',
  title: 'Дисперсия по распределению',
  formula: '$\\mathrm{D}(X)=\\mathrm{M}(X^2)-\\left(\\mathrm{M}(X)\\right)^2$',
  skills: ['kvadrat-e', 'stroka-xp'],
  istochnik: 'Дисперсия, №3',
  ris(p) {
    const r = raspr(p);
    return str(p, 'forma', ['zapis', 'tablica'] as const) === 'tablica'
      ? { vid: 'tablica', tablica: tablicaRaspr(r) }
      : { vid: 'zapis', tex: zapisTex(r) };
  },
  uslovie(p) {
    const r = raspr(p);
    const forma = str(p, 'forma', ['zapis', 'tablica'] as const);
    const ris = P14.ris(p) as Ris;
    const s = vstuplenie(p);
    if (forma === 'tablica') {
      return s === null
        ? {
            text: `В таблице показано распределение случайной величины $${r.v}$. Найдите $\\mathrm{D}(${r.v})$ — дисперсию этой случайной величины.`,
            ris,
          }
        : {
            text: `${s.kontekst} В таблице показано распределение случайной величины $${r.v}$ — ${s.velichina}.`,
            ris,
            posle: `Найдите $\\mathrm{D}(${r.v})$ — дисперсию этой случайной величины.`,
          };
    }
    return s === null
      ? {
          text: `Найдите дисперсию случайной величины $${r.v}$, если известно её распределение:`,
          ris,
        }
      : {
          text: `${s.kontekst} Случайная величина $${r.v}$ — ${s.velichina} — имеет распределение`,
          ris,
          posle: `Найдите дисперсию случайной величины $${r.v}$.`,
        };
  },
  solve: (p) => reshenieD(p, false, false),
  pereschet: (p) => pereschetD(p, false),
  summy: (p) => summyRaspr(raspr(p)),
};

const P15: Prototype = {
  id: 'P15',
  no: 15,
  group: 'V',
  title: 'Стандартное отклонение',
  formula: '$\\sigma(X)=\\sqrt{\\mathrm{D}(X)}$',
  skills: ['kvadrat-e'],
  istochnik: 'Дисперсия, №4',
  ris: (p) => ({ vid: 'zapis', tex: zapisTex(raspr(p)) }),
  uslovie(p) {
    const r = raspr(p);
    const ris: Ris = { vid: 'zapis', tex: zapisTex(r) };
    const s = vstuplenie(p);
    if (s === null) {
      return {
        text: `Вычислите стандартное отклонение случайной величины $${r.v}$, которая подчиняется распределению:`,
        ris,
      };
    }
    return {
      text: `${s.kontekst} Случайная величина $${r.v}$ — ${s.velichina} — подчиняется распределению`,
      ris,
      posle: `Вычислите стандартное отклонение случайной величины $${r.v}$.`,
    };
  },
  solve: (p) => reshenieD(p, false, true),
  pereschet: (p) => pereschetD(p, true),
  summy: (p) => summyRaspr(raspr(p)),
};

export const GRUPPA_V: Prototype[] = [P12, P13, P14, P15];
