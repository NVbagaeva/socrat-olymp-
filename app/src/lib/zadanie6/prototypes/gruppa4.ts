/**
 * Группа IV. Оценка вероятности.
 *
 *   6.10  неравенство Чебышёва: $E(X)$, $D(X)$, событие «$X\leqslant E-\varepsilon$
 *         или $X\geqslant E+\varepsilon$» → оценка $\dfrac{D}{\varepsilon^2}$;
 *   6.11  распределение → $P(a<Y<b)$ со строгими и нестрогими знаками,
 *         в том числе с границами, не совпадающими ни с одним значением.
 */

import {
  arr,
  div,
  etapy,
  iSpisok,
  mul,
  num,
  otvetLine,
  plus,
  q,
  str,
  strOpt,
  sumQ,
  t,
  tablica,
  tq,
  vopros,
  type Q,
} from '../kit';
import { pTex, raspr, summyRaspr, zapisTex } from '../raspredelenie';
import type { Params, Prototype, Ris, Tema } from '../types';
import { velichina } from '../velichiny';

/* ════════════════════ 6.10: неравенство Чебышёва ════════════════════ */

export interface SyuzhetChebysheva {
  key: string;
  tema: Tema;
  plot: string;
  kontekst: string;
  velichina: string;
  Es: number[];
  /** Правдоподобные пределы дисперсии. */
  Ds: [number, number];
  epss: number[];
}

export const SYUZHETY_P10: SyuzhetChebysheva[] = [
  {
    key: 'uroven',
    tema: 'igry',
    plot: 'время прохождения уровня',
    kontekst: 'Игрок проходит уровень в мобильной игре.',
    velichina: 'время прохождения уровня в минутах',
    Es: [12, 14, 15, 16, 18, 20],
    Ds: [2.25, 9],
    epss: [3, 4, 5, 6],
  },
  {
    key: 'beg',
    tema: 'sport',
    plot: 'время забега на 400 м',
    kontekst: 'Бегун тренируется на дистанции 400 метров.',
    velichina: 'время забега в секундах',
    Es: [58, 60, 62, 64, 65, 68, 70],
    Ds: [1, 4],
    epss: [2, 2.5, 3, 4, 5],
  },
  {
    key: 'picca',
    tema: 'dostavka',
    plot: 'время доставки пиццы',
    kontekst: 'Пиццерия доставляет заказы по городу.',
    velichina: 'время доставки в минутах',
    Es: [30, 32, 35, 36, 38, 40],
    Ds: [9, 25],
    epss: [5, 6, 8, 10],
  },
  {
    key: 'may',
    tema: 'pogoda',
    plot: 'температура в мае',
    kontekst: 'Метеостанция измеряет температуру воздуха в полдень в мае.',
    velichina: 'температура в градусах Цельсия',
    Es: [14, 15, 16, 17, 18, 20],
    Ds: [2.25, 9],
    epss: [3, 4, 5, 6],
  },
  {
    key: 'laiki',
    tema: 'socseti',
    plot: 'лайки за первый час',
    kontekst: 'Блогер выкладывает новое видео.',
    velichina: 'число лайков за первый час',
    Es: [120, 150, 180, 200, 240],
    Ds: [100, 400],
    epss: [20, 25, 30, 40, 50],
  },
  {
    key: 'probnik',
    tema: 'ekzameny',
    plot: 'балл за пробник',
    kontekst: 'Школьник пишет пробный вариант ЕГЭ.',
    velichina: 'тестовый балл',
    Es: [60, 64, 65, 70, 72, 75],
    Ds: [16, 64],
    epss: [10, 12, 14, 15, 16, 20],
  },
  {
    key: 'chek',
    tema: 'magaziny',
    plot: 'сумма чека',
    kontekst: 'Покупатели заходят в магазин у дома.',
    velichina: 'сумма чека в сотнях рублей',
    Es: [8, 9, 10, 12, 15],
    Ds: [2.25, 9],
    epss: [3, 4, 5, 6],
  },
  {
    key: 'marshrut',
    tema: 'transport',
    plot: 'время в пути на автобусе',
    kontekst: 'Автобус проходит свой маршрут.',
    velichina: 'время в пути в минутах',
    Es: [25, 28, 30, 32, 35, 40],
    Ds: [4, 16],
    epss: [4, 5, 6, 8],
  },
  {
    key: 'doroga',
    tema: 'shkola',
    plot: 'дорога до школы',
    kontekst: 'Ученик каждое утро идёт пешком от дома до школы.',
    velichina: 'время в пути в минутах',
    Es: [10, 12, 14, 15, 18],
    Ds: [0.81, 2.25],
    epss: [2, 2.5, 3, 4],
  },
  {
    key: 'kapuchino',
    tema: 'kofeynya',
    plot: 'приготовление капучино',
    kontekst: 'Бариста готовит капучино.',
    velichina: 'время приготовления в секундах',
    Es: [90, 100, 105, 110, 120],
    Ds: [64, 144],
    epss: [15, 18, 20, 25, 30],
  },
];

const CHEB = new Map(SYUZHETY_P10.map((s) => [s.key, s]));

function sobytieCheb(v: string, E: number, eps: number): string {
  return `${v}\\leqslant${t(E - eps)}$ или $${v}\\geqslant${t(E + eps)}`;
}

const P10: Prototype = {
  id: 'P10',
  no: 10,
  group: 'IV',
  title: 'Неравенство Чебышёва',
  formula:
    '$P\\left(|X-E(X)|\\geqslant\\varepsilon\\right)\\leqslant\\dfrac{D(X)}{\\varepsilon^2}$',
  skills: ['otkloneniya'],
  istochnik: 'Оценка вероятности, №1',
  ris: () => undefined,
  uslovie(p) {
    const E = num(p, 'E');
    const D = num(p, 'D');
    const eps = num(p, 'eps');
    const v = str(p, 'v', ['X', 'Y', 'Z'] as const);
    const sj = strOpt(p, 'sj');
    const sob = `«$${sobytieCheb(v, E, eps)}$»`;
    const vopr = `Найдите оценку вероятности события ${sob}, которую даёт неравенство Чебышёва.`;
    if (sj === undefined) {
      return {
        text: `Про случайную величину $${v}$ известно, что $E(${v})=${t(E)}$ и $D(${v})=${t(D)}$. ${vopr}`,
      };
    }
    const s = CHEB.get(sj) as SyuzhetChebysheva;
    return {
      text: `${s.kontekst} Случайная величина $${v}$ — ${s.velichina}; известно, что $E(${v})=${t(E)}$ и $D(${v})=${t(D)}$. ${vopr}`,
    };
  },
  solve(p) {
    const E = num(p, 'E');
    const D = num(p, 'D');
    const eps = num(p, 'eps');
    const v = str(p, 'v', ['X', 'Y', 'Z'] as const);
    const Dq = q(D);
    const e = q(eps);
    const e2 = mul(e, e);
    const otv = div(Dq, e2);
    const answer = otv.n / otv.m;
    const epsTex = `${t(eps)}^2`;
    return {
      answer,
      etapy: etapy(
        {
          t: 'Переписываем событие через отклонение от среднего',
          lines: [
            `$${t(E - eps)}=${t(E)}-${t(eps)}$ и $${t(E + eps)}=${t(E)}+${t(eps)}$: обе границы отстоят от $E(${v})=${t(E)}$ на одно и то же число $${t(eps)}$.`,
            `Значит, «$${sobytieCheb(v, E, eps)}$» — это событие $|${v}-${t(E)}|\\geqslant${t(eps)}$: величина отклонится от среднего не меньше чем на $\\varepsilon=${t(eps)}$.`,
          ],
        },
        {
          t: 'Применяем неравенство Чебышёва',
          lines: [
            `$P\\left(|${v}-E(${v})|\\geqslant\\varepsilon\\right)\\leqslant\\dfrac{D(${v})}{\\varepsilon^2}=\\dfrac{${t(D)}}{${epsTex}}=\\dfrac{${t(D)}}{${tq(e2)}}=${tq(otv)}$.`,
            `Это **оценка сверху**: вероятность события не больше $${tq(otv)}$.`,
            otvetLine(answer),
          ],
        },
      ),
      vychisleniya: [],
      hints: [
        vopros(
          `Что значит «$${sobytieCheb(v, E, eps)}$» при $E(${v})=${t(E)}$?`,
          `$|${v}-${t(E)}|\\geqslant${t(eps)}$`,
          [
            `$|${v}-${t(E)}|\\leqslant${t(eps)}$`,
            `$${t(E - eps)}\\leqslant ${v}\\leqslant${t(E + eps)}$`,
            `$|${v}-${t(E)}|\\geqslant${t(2 * eps)}$`,
          ],
          'Обе границы — на одном расстоянии от среднего, а «или» — значит, величина ушла далеко в любую сторону.',
        ),
        vopros('Чему равно $\\varepsilon$?', `$${t(eps)}$`, [
          `$${t(2 * eps)}$`,
          `$${t(E + eps)}$`,
          `$${t(D)}$`,
        ]),
        vopros(
          'Какую оценку даёт неравенство Чебышёва?',
          `$\\dfrac{${t(D)}}{${tq(e2)}}=${tq(otv)}$`,
          [`$\\dfrac{${t(D)}}{${t(eps)}}$`, `$\\dfrac{${tq(e2)}}{${t(D)}}$`],
          'Дисперсию делим на квадрат отклонения.',
        ),
      ],
    };
  },
  pereschet(p) {
    const eps = num(p, 'eps');
    return Math.round((num(p, 'D') / (eps * eps)) * 1e9) / 1e9;
  },
  summy() {
    return [];
  },
};

/* ════════════════════ 6.11: вероятность попадания в промежуток ════════════════════ */

type Znak = 'lt' | 'le';

const ZNAK_TEX: Record<Znak, string> = { lt: '<', le: '\\leqslant ' };

function promezhutok(p: Params): { a: number; b: number; zl: Znak; zr: Znak; v: string } {
  return {
    a: num(p, 'a'),
    b: num(p, 'b'),
    zl: str(p, 'zl', ['lt', 'le'] as const),
    zr: str(p, 'zr', ['lt', 'le'] as const),
    v: str(p, 'v', ['X', 'Y', 'Z'] as const),
  };
}

function sobytieTex(p: Params): string {
  const { a, b, zl, zr, v } = promezhutok(p);
  return `${t(a)}${ZNAK_TEX[zl]}${v}${ZNAK_TEX[zr]}${t(b)}`;
}

function vhodit(x: number, p: Params): boolean {
  const { a, b, zl, zr } = promezhutok(p);
  const levo = zl === 'lt' ? x > a : x >= a;
  const pravo = zr === 'lt' ? x < b : x <= b;
  return levo && pravo;
}

/** Слова о границе: входит ли она и почему. */
function slovaOGranice(gr: number, znak: Znak, xs: readonly number[]): string {
  if (!xs.includes(gr)) {
    return `Граница $${t(gr)}$ не совпадает ни с одним значением — о знаке у неё думать не нужно.`;
  }
  return znak === 'lt'
    ? `Значение $${t(gr)}$ **не входит**: знак строгий.`
    : `Значение $${t(gr)}$ **входит**: знак нестрогий.`;
}

const P11: Prototype = {
  id: 'P11',
  no: 11,
  group: 'IV',
  title: 'Вероятность попадания в промежуток',
  formula: '$P(a<X\\leqslant b)$ — сумма вероятностей значений из промежутка',
  skills: ['promezhutok', 'slozhit'],
  istochnik: 'Оценка вероятности, №2, 3',
  ris: (p) => ({ vid: 'zapis', tex: zapisTex(raspr(p)) }),
  uslovie(p) {
    const r = raspr(p);
    const ris: Ris = { vid: 'zapis', tex: zapisTex(r) };
    const posle = `Найдите вероятность события $${sobytieTex(p)}$.`;
    const sj = strOpt(p, 'sj');
    if (sj === undefined) {
      return {
        text: `Известно, что случайная величина $${r.v}$ подчиняется распределению:`,
        ris,
        posle,
      };
    }
    const s = velichina(sj);
    return {
      text: `${s.kontekst} Случайная величина $${r.v}$ — ${s.velichina} — подчиняется распределению`,
      ris,
      posle,
    };
  },
  solve(p) {
    const r = raspr(p);
    const { a, b, zl, zr } = promezhutok(p);
    const idx = r.xs.map((x, i) => (vhodit(x, p) ? i : -1)).filter((i) => i >= 0);
    const otv = sumQ(idx.map((i) => r.p[i] as Q));
    const answer = otv.n / otv.m;
    const tab = tablica(
      [
        { zag: `Значения $${r.v}$`, yach: r.xs.map((x) => `$${t(x)}$`) },
        { zag: 'Вероятности', yach: r.xs.map((_, i) => `$${pTex(r, i)}$`) },
      ],
      idx,
    );
    /* Ловушки: включить строгие границы или выкинуть нестрогие. */
    const vseGranicy = r.xs.map((x, i) => (x >= a && x <= b ? i : -1)).filter((i) => i >= 0);
    const bezGranic = r.xs.map((x, i) => (x > a && x < b ? i : -1)).filter((i) => i >= 0);
    const sum = (js: number[]) => sumQ(js.map((i) => r.p[i] as Q));
    const granica = r.xs.includes(b)
      ? { gr: b, z: zr }
      : r.xs.includes(a)
        ? { gr: a, z: zl }
        : null;
    const vnutri = r.xs.find((x) => x > a && x < b);
    return {
      answer,
      etapy: etapy(
        {
          t: 'Выписываем значения, которые попадают в промежуток',
          lines: [
            `Событие $${sobytieTex(p)}$ — значения ${zl === 'lt' ? 'больше' : 'не меньше'} $${t(a)}$ и ${zr === 'lt' ? 'меньше' : 'не больше'} $${t(b)}$.`,
            slovaOGranice(a, zl, r.xs),
            slovaOGranice(b, zr, r.xs),
            `Подходят значения ${iSpisok(idx.map((i) => `$${t(r.xs[i] as number)}$`))}.`,
          ],
          tablica: tab,
        },
        {
          t: 'Складываем их вероятности',
          lines: [
            `$P(${sobytieTex(p)})=${plus(idx.map((i) => pTex(r, i)))}=${tq(otv)}$.`,
            otvetLine(answer),
          ],
        },
      ),
      vychisleniya: [],
      hints: [
        granica
          ? vopros(
              `Входит ли значение $${t(granica.gr)}$ в промежуток $${sobytieTex(p)}$?`,
              granica.z === 'lt' ? 'нет — знак строгий' : 'да — знак нестрогий',
              [
                granica.z === 'lt' ? 'да — это граница' : 'нет — это граница',
                'зависит от вероятности',
              ],
            )
          : vopros(
              `Входит ли значение $${t(vnutri ?? a)}$ в промежуток $${sobytieTex(p)}$?`,
              vhodit(vnutri ?? a, p) ? 'да' : 'нет',
              [vhodit(vnutri ?? a, p) ? 'нет' : 'да', 'зависит от вероятности'],
              'Границы не совпадают ни с одним значением — знак у них ни на что не влияет.',
            ),
        vopros(
          'Какие значения попадают в промежуток?',
          iSpisok(idx.map((i) => `$${t(r.xs[i] as number)}$`)),
          [
            iSpisok(vseGranicy.map((i) => `$${t(r.xs[i] as number)}$`)),
            iSpisok(bezGranic.map((i) => `$${t(r.xs[i] as number)}$`)),
            iSpisok(r.xs.map((x) => `$${t(x)}$`)),
          ],
        ),
        vopros('Чему равна вероятность?', `$${tq(otv)}$`, [
          `$${tq(sum(vseGranicy))}$`,
          `$${tq(sum(bezGranic))}$`,
          `$${tq(q(idx.length, r.xs.length))}$`,
        ]),
      ],
    };
  },
  pereschet(p) {
    const xs = arr(p, 'xs');
    const ps = arr(p, 'ps');
    const den = num(p, 'den');
    let s = 0;
    xs.forEach((x, i) => {
      if (vhodit(x, p)) {
        s += (ps[i] as number) / den;
      }
    });
    return Math.round(s * 1e9) / 1e9;
  },
  summy: (p) => summyRaspr(raspr(p)),
};

export const GRUPPA_IV: Prototype[] = [P10, P11];
