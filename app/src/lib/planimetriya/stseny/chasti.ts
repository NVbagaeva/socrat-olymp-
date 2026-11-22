/**
 * Параллелограмм, сторона которого поделена на равные части (прототип
 * 15 — середина стороны, прототип 76 — две или три точки деления).
 *
 * Роли вершин (пример: $ABCD$, $E$ на $CD$, отрезок $BE$):
 *   P — вершина, из которой идёт отрезок к точке деления ($B$);
 *   Q — вершина стороны, соседняя с P ($C$);
 *   R — другая вершина этой стороны ($D$);
 *   T — другая соседка P ($A$).
 * Точки деления стороны QR — d₁…dₙ₋₁ от Q; отрезок идёт в точку E = dₘ.
 * Отрезанный треугольник — PQE, трапеция — PTRE (в примере $ABED$).
 *
 * Площадь маленького треугольника с основанием в одну часть — S, весь
 * параллелограмм — 2nS, треугольник PQE — mS, трапеция — (2n − m)S.
 *
 * Здесь — сцена с построениями двух способов (способ 1 — прямые через
 * точки деления, параллельные PQ; способ 2 — диагональ PR и отрезки из
 * P), подсказка-сценарий с первым вопросом «какое построение сделать»
 * и решение по двум способам.
 */

import { projT } from '../geom';
import type { ShagResheniya, VoprosPodskazki } from '../reshenie/types';
import type { Scenariy, ShagScenariya } from '../scenariy';
import type { Element, Scena, T2 } from '../types';
import { chislo, mn, oblast, otr, shtrih, tex, vysota } from './dsl';

export type VidChastey = 'trap' | 'treug' | 'obr-trap' | 'obr-treug';

export interface Chasti {
  /** На сколько равных частей поделена сторона: 2, 3, 4. */
  n: number;
  /** Сколько частей от Q до E: треугольник PQE опирается на m частей. */
  m: number;
  P: string;
  Q: string;
  R: string;
  T: string;
  /** Точки деления от Q к R; E — под номером m. */
  deleniya: readonly string[];
  /** Точки на стороне PT — концы прямых способа 1 (по одной на точку деления). */
  peresecheniya: readonly string[];
  /** Основание высоты из P (способ 2): на чертеже без подписи. */
  osnovanie: string;
  vid: VidChastey;
  /** Число условия: площадь параллелограмма (прямая задача) или части (обратная). */
  s: number;
}

/* ── Числа ───────────────────────────────────────────────────────── */

export function ploshchadParallelogramma(c: Chasti): number {
  if (c.vid === 'trap' || c.vid === 'treug') return c.s;
  const doli = c.vid === 'obr-trap' ? 2 * c.n - c.m : c.m;
  return (c.s * 2 * c.n) / doli;
}

/** Площадь маленького треугольника S. */
export function edinica(c: Chasti): number {
  return ploshchadParallelogramma(c) / (2 * c.n);
}

export function otvetChastey(c: Chasti): number {
  const S = edinica(c);
  if (c.vid === 'trap') return (2 * c.n - c.m) * S;
  if (c.vid === 'treug') return c.m * S;
  return ploshchadParallelogramma(c);
}

/* ── Буквы ───────────────────────────────────────────────────────── */

const E = (c: Chasti) => c.deleniya[c.m - 1]!;
/** Точки стороны QR по порядку: Q, d₁…, R. */
const naStorone = (c: Chasti) => [c.Q, ...c.deleniya, c.R];
/** Точки стороны PT: P, концы прямых…, T. */
const naPT = (c: Chasti) => [c.P, ...c.peresecheniya, c.T];
const trap = (c: Chasti) => [c.T, c.P, E(c), c.R];
const treug = (c: Chasti) => [c.P, c.Q, E(c)];
const nazv = (t: readonly string[]) => t.join('');
const $ = (t: string) => `$${t}$`;
/** k·S в TeX: S, 2S, 5S. */
const kS = (k: number) => (k === 1 ? 'S' : `${k}S`);
const ABCD = (c: Chasti) => {
  /* Имя параллелограмма — вершины в порядке обхода от A. */
  const vse = [c.P, c.Q, c.R, c.T];
  return ['A', 'B', 'C', 'D'].every((b) => vse.includes(b)) ? 'ABCD' : nazv([c.T, c.P, c.Q, c.R]);
};

/* ── Слои сцены ──────────────────────────────────────────────────── */

/** Слои способа 1 и способа 2 (номера шагов чертежа). */
export const SLOI = {
  pryamye: 1,
  parallelogrammy: 2,
  diagonal: 3,
  bukvy: 4,
  otrezki: 11,
  vysota: 12,
  polovina: 13,
} as const;

/**
 * Элементы сцены: условие (штрихи частей, отрезок, искомое со знаком
 * «?»), построения способа 1 и способа 2. tochki — вершины и точки
 * деления; точки пересечения и основание высоты строятся здесь.
 */
export function stsenaChastey(c: Chasti, tochki: Record<string, T2>): Scena {
  const st = naStorone(c);
  const pt = naPT(c);
  const e = E(c);
  const S1 = { sposob: 1 } as const;
  const S2 = { sposob: 2 } as const;
  const el: Element[] = [mn(['A', 'B', 'C', 'D'])];
  /* Условие: равные части — одинаковыми штрихами, отрезок PE. */
  for (let i = 0; i < c.n; i += 1) el.push(shtrih(st[i]!, st[i + 1]!, 1));
  el.push(otr(c.P, e, { podsvetka: [SLOI.diagonal] }));
  /* Искомое — другим цветом со знаком «?». */
  const iskomoe = c.vid === 'trap' ? trap(c) : c.vid === 'treug' ? treug(c) : ['A', 'B', 'C', 'D'];
  el.push(oblast(iskomoe, { vydelit: 'iskomoe', znachenie: '?', tolkoUslovie: true }));
  if (c.vid === 'obr-trap' || c.vid === 'obr-treug') {
    const dano = c.vid === 'obr-trap' ? trap(c) : treug(c);
    el.push(oblast(dano, { vydelit: 'dano', znachenie: chislo(c.s), cvet: 2 }));
  }

  /* Способ 1: прямые через точки деления, параллельные PQ. */
  for (let i = 1; i < c.n; i += 1) el.push(otr(st[i]!, pt[i]!, { sloy: SLOI.pryamye, ...S1 }));
  for (let i = 0; i < c.n; i += 1)
    el.push(
      oblast([st[i]!, st[i + 1]!, pt[i + 1]!, pt[i]!], {
        sloy: SLOI.parallelogrammy,
        cvet: 1,
        ...S1,
      }),
    );
  /* Диагональ PE делит параллелограмм P…Q…E на два равных треугольника. */
  const fm = pt[c.m]!;
  el.push(oblast([c.P, c.Q, e], { sloy: SLOI.diagonal, cvet: 2, ...S1 }));
  el.push(oblast([c.P, fm, e], { sloy: SLOI.diagonal, cvet: 2, ...S1 }));
  el.push(
    oblast([c.P, c.Q, e], { sloy: SLOI.bukvy, tolkoZnachenie: true, znachenie: kS(c.m), ...S1 }),
  );
  el.push(
    oblast([c.P, fm, e], { sloy: SLOI.bukvy, tolkoZnachenie: true, znachenie: kS(c.m), ...S1 }),
  );
  for (let i = c.m; i < c.n; i += 1)
    el.push(
      oblast([st[i]!, st[i + 1]!, pt[i + 1]!, pt[i]!], {
        sloy: SLOI.bukvy,
        tolkoZnachenie: true,
        znachenie: '2S',
        ...S1,
      }),
    );

  /* Способ 2: диагональ PR и отрезки из P в точки деления. */
  el.push(otr(c.P, c.R, { sloy: SLOI.otrezki, ...S2 }));
  for (let i = 1; i < c.n; i += 1)
    if (i !== c.m) el.push(otr(c.P, st[i]!, { sloy: SLOI.otrezki, ...S2 }));
  for (let i = 0; i < c.n; i += 1) {
    el.push(oblast([c.P, st[i]!, st[i + 1]!], { sloy: SLOI.vysota, cvet: 2, ...S2 }));
    el.push(
      oblast([c.P, st[i]!, st[i + 1]!], {
        sloy: SLOI.vysota,
        tolkoZnachenie: true,
        znachenie: 'S',
        ...S2,
      }),
    );
  }
  /* Общая высота из P на прямую QR. */
  const t = projT(tochki[c.P]!, tochki[c.Q]!, tochki[c.R]!);
  const vne = t < -1e-9 ? 'a' : t > 1 + 1e-9 ? 'b' : null;
  for (const x of vysota(c.P, c.Q, c.R, c.osnovanie, vne, { sloy: SLOI.vysota })) {
    if (x.tip === 'otrezok') el.push({ ...x, stil: 'punktir', ...S2 });
    else el.push({ ...x, ...S2 });
  }
  el.push(oblast([c.P, c.T, c.R], { sloy: SLOI.polovina, cvet: 1, ...S2 }));
  el.push(
    oblast([c.P, c.T, c.R], {
      sloy: SLOI.polovina,
      tolkoZnachenie: true,
      znachenie: kS(c.n),
      ...S2,
    }),
  );

  const dop: Record<string, Scena['tochki'][string]> = {};
  for (let i = 1; i < c.n; i += 1) dop[pt[i]!] = { naPryamoy: [c.P, c.T, i / c.n] };
  dop[c.osnovanie] = { osnovanie: [c.P, c.Q, c.R] };
  return {
    tochki: { ...tochki, ...dop },
    elementy: el,
    /* Основание высоты не подписано, но правило «точки на прямой не
       слипаются» его видит: подбор формы разводит его с точками деления. */
    podpisi: Object.keys({ ...tochki, ...dop }).filter((x) => x !== c.osnovanie),
    shagov: SLOI.polovina,
    proverki: [
      {
        parallelny: [
          ['A', 'B'],
          ['D', 'C'],
        ],
      },
      ...Array.from({ length: c.n - 1 }, (_, i) => ({
        parallelny: [
          [st[i + 1]!, pt[i + 1]!],
          [c.Q, c.P],
        ] as const,
      })),
    ],
    otvet: chislo(otvetChastey(c)),
  };
}

/* ── Подсказка-сценарий ───────────────────────────────────────────── */

/** Дробь k/n в TeX без сокращения смысла: \tfrac56. */
const dolya = (k: number, n: number) => `\\tfrac{${k}}{${n}}`;

function chisla(c: Chasti, sposob: 1 | 2): ShagScenariya[] {
  const S = edinica(c);
  const vse = 2 * c.n;
  const tr = 2 * c.n - c.m;
  const T_ = nazv(trap(c));
  const TR = nazv(treug(c));
  const P_ = ABCD(c);
  const dano =
    c.vid === 'trap' || c.vid === 'treug'
      ? { kto: P_, k: vse }
      : c.vid === 'obr-trap'
        ? { kto: T_, k: tr }
        : { kto: TR, k: c.m };
  const iskomoe =
    c.vid === 'trap'
      ? { kto: `трапеции $${T_}$`, k: tr }
      : c.vid === 'treug'
        ? { kto: `треугольника $${TR}$`, k: c.m }
        : { kto: `параллелограмма $${P_}$`, k: vse };
  const neverno = (x: number) =>
    [x * 2, x / 2, x + S, vse * S - x].filter((y) => y > 0 && Math.abs(y - x) > 1e-9);
  const knopkiS = [S, ...neverno(S)].slice(0, 3).map((y) => $(`S = ${tex(y)}`));
  const otvet = otvetChastey(c);
  const zachem =
    sposob === 1
      ? 'части параллелограмма — маленькие параллелограммы'
      : 'части треугольника — треугольники с общей высотой';
  return [
    {
      vopros: `Дано: площадь $${dano.kto}$ равна $${tex(c.s)}$. Чему равно $S$?`,
      knopki: knopkiS,
      verno: 0,
      da: `$${dano.kto}$ — это $${kS(dano.k)}$, а по условию её площадь $${tex(c.s)}$: делим на $${dano.k}$.`,
      formuly: [`${kS(dano.k)} = ${tex(c.s)}`, `S = ${tex(c.s)} : ${dano.k} = ${tex(S)}`],
      utochnenie: `Сначала запиши данную площадь через $S$: из скольких $S$ складывается $${dano.kto}$? Потом раздели.`,
      fakt: null,
    },
    {
      vopros: `Это уже ответ?`,
      knopki: ['Нет: нужна площадь ' + iskomoe.kto, 'Да, ответ — $S$'],
      verno: 0,
      da: `$S$ — площадь маленького треугольника, а нужна площадь ${iskomoe.kto} — это $${kS(iskomoe.k)}$.`,
      formuly: [`${kS(iskomoe.k)} = ${iskomoe.k} \\cdot ${tex(S)} = ${tex(otvet)}`],
      utochnenie: `Посмотри на чертёж: искомая фигура отмечена знаком «?». Сколько в ней $S$?`,
      fakt: null,
    },
    {
      vopros: 'Проверка по чертежу: какую часть параллелограмма занимает искомая фигура?',
      knopki: [
        $(dolya(iskomoe.k, vse)),
        $(dolya(Math.max(1, vse - iskomoe.k), vse)),
        $(dolya(1, 2)),
      ],
      verno: 0,
      da: `${iskomoe.k === vse ? 'Это весь параллелограмм' : `$${kS(iskomoe.k)}$ из $${kS(vse)}$`} — на чертеже ${
        iskomoe.k * 2 > vse
          ? 'фигура занимает большую часть параллелограмма'
          : 'фигура занимает меньшую часть'
      }, ${zachem}: сходится.`,
      utochnenie: `Раздели число $S$ в искомой фигуре на число $S$ во всём параллелограмме.`,
      fakt: null,
    },
  ];
}

/** Подсказка: первый вопрос — какое построение сделать; два способа. */
export function scenariyChastey(c: Chasti): Scenariy {
  const e = E(c);
  const st = naStorone(c);
  const pt = naPT(c);
  const fm = pt[c.m]!;
  const P_ = ABCD(c);
  const tochkiTekst =
    c.n === 2
      ? `$${e}$ — середина $${c.Q}${c.R}$`
      : `точки ${c.deleniya.map($).join(' и ')} делят $${c.Q}${c.R}$ на равные части`;
  const novye = c.peresecheniya;
  const pryamye = c.deleniya.map((d, i) => `$${d}${novye[i]}$`).join(' и ');
  const sm = c.m === 1 ? '' : `${c.m}`;
  const iskomoeTr = c.vid === 'treug' || c.vid === 'obr-treug';

  const sposob1: ShagScenariya[] = [
    {
      vvod: `Обозначим ${c.n === 2 ? 'точку' : 'точки'} пересечения с $${c.P}${c.T}$ ${
        c.n === 2 ? `буквой $${novye[0]}$` : `буквами ${novye.map($).join(' и ')}`
      }.`,
      vopros: 'Какие фигуры получились?',
      knopki: [`${c.n} параллелограмма`, `${c.n} треугольника`, 'трапеция и треугольник'],
      verno: 0,
      da: `у каждой фигуры противоположные стороны параллельны: $${c.Q}${c.R} \\parallel ${c.P}${c.T}$ — стороны параллелограмма, а ${pryamye} мы провели параллельно $${c.P}${c.Q}$.`,
      utochnenie: `Посмотри на одну из частей: какие у неё стороны параллельны?`,
      sloy: 1,
      pokazatDo: true,
      fakt: null,
    },
    {
      vopros: 'Почему площади этих параллелограммов равны?',
      knopki: ['Равные основания и общая высота', 'Равные углы', 'Они равны по построению'],
      verno: 0,
      da: `площадь параллелограмма — основание на высоту. Основания $${st
        .slice(0, c.n + 1)
        .map((x, i, a) => (i === 0 ? '' : `${a[i - 1]}${x}`))
        .filter(Boolean)
        .join(
          ' = ',
        )}$ — равные части стороны, а высота у всех одна: расстояние между $${c.P}${c.T}$ и $${c.Q}${c.R}$.`,
      formuly: ['S_{\\text{пар}} = a \\cdot h'],
      utochnenie:
        'Вспомни формулу площади параллелограмма: что в неё входит? Сравни эти величины у частей.',
      sloy: SLOI.parallelogrammy,
      fakt: 'ploshchad-parallelogramma',
    },
    {
      vopros: `Что делает отрезок $${c.P}${e}$ с параллелограммом $${fm}${c.P}${c.Q}${e}$?`,
      knopki: [
        'Это его диагональ: делит его на два равных треугольника',
        'Это его средняя линия',
        'Делит его на треугольник и трапецию',
      ],
      verno: 0,
      da: `$${c.P}${e}$ соединяет противоположные вершины — это диагональ. Диагональ делит параллелограмм на два равных треугольника: $\\triangle ${c.P}${c.Q}${e} = \\triangle ${e}${fm}${c.P}$, их площади равны.`,
      utochnenie: `Какие вершины параллелограмма $${fm}${c.P}${c.Q}${e}$ соединяет отрезок $${c.P}${e}$ — соседние или противоположные?`,
      sloy: SLOI.diagonal,
      fakt: 'diagonal-parallelogramma',
    },
    {
      vopros: 'Как обозначить равные площади?',
      knopki: [
        `Одной буквой: $S_{${c.P}${c.Q}${e}} = S_{${c.P}${fm}${e}}$`,
        'Разными буквами $S_1$ и $S_2$',
        'Сразу числами',
      ],
      verno: 0,
      da: `равные площади — одной буквой. Пусть площадь маленького треугольника с основанием в одну часть — $S$. Тогда ${
        c.m === 1
          ? `$S_{${c.P}${c.Q}${e}} = S_{${c.P}${fm}${e}} = S$, а каждый маленький параллелограмм — $2S$`
          : `в $${c.Q}${e}$ ${c.m} части, $S_{${c.P}${c.Q}${e}} = S_{${c.P}${fm}${e}} = ${sm}S$, каждый маленький параллелограмм — $2S$`
      }.`,
      formuly: [`S_{${P_}} = ${c.n} \\cdot 2S = ${kS(2 * c.n)}`],
      utochnenie: 'Равные площади удобно назвать одной буквой: так останется одна неизвестная.',
      sloy: SLOI.bukvy,
      fakt: 'priem-ravnye-ploshchadi',
    },
    {
      vopros:
        c.vid === 'trap' || c.vid === 'obr-trap'
          ? `Как выразить трапецию $${nazv(trap(c))}$ через $S$?`
          : `Как выразить треугольник $${nazv(treug(c))}$ через $S$?`,
      knopki: iskomoeTr
        ? /* Неверные варианты — без повторов: при 3m = 2n «2m» и «2n − m» совпадают. */
          [...new Set([c.m, 2 * c.m, 2 * c.n - c.m, c.m + 1, c.n, 2 * c.n])]
            .slice(0, 3)
            .map((k) => $(`${kS(k)}`))
        : [
            `Весь параллелограмм без треугольника $${nazv(treug(c))}$: $${kS(2 * c.n)} - ${kS(c.m)} = ${kS(2 * c.n - c.m)}$`,
            `Половина параллелограмма: $${kS(c.n)}$`,
            `$${kS(2 * c.n - 1 - c.m)}$`,
          ],
      verno: 0,
      da: iskomoeTr
        ? `треугольник $${nazv(treug(c))}$ опирается на ${c.m === 1 ? 'одну часть' : `${c.m} части`} стороны — это $${kS(c.m)}$.`
        : `трапеция $${nazv(trap(c))}$ — это весь параллелограмм без треугольника $${nazv(treug(c))}$.`,
      formuly: iskomoeTr
        ? [`S_{${nazv(treug(c))}} = ${kS(c.m)}`]
        : [`S_{${nazv(trap(c))}} = ${kS(2 * c.n)} - ${kS(c.m)} = ${kS(2 * c.n - c.m)}`],
      utochnenie: 'Посмотри на чертёж: из каких частей с подписями $S$ и $2S$ складывается фигура?',
      fakt: null,
    },
    ...chisla(c, 1),
  ];

  const sposob2: ShagScenariya[] = [
    {
      vopros: `На какие треугольники разбит треугольник $${c.P}${c.Q}${c.R}$?`,
      knopki: [
        st
          .slice(0, c.n)
          .map((x, i) => `$${c.P}${x}${st[i + 1]}$`)
          .join(', '),
        `$${c.P}${c.Q}${e}$ и $${c.P}${c.T}${c.R}$`,
        'на два треугольника',
      ],
      verno: 0,
      da: `отрезки из $${c.P}$ в точки деления режут треугольник $${c.P}${c.Q}${c.R}$ на ${c.n} треугольника с вершиной $${c.P}$.`,
      utochnenie: `Пройди по стороне $${c.Q}${c.R}$ от $${c.Q}$ до $${c.R}$: каждый кусок вместе с вершиной $${c.P}$ — треугольник.`,
      sloy: SLOI.otrezki,
      pokazatDo: true,
      fakt: null,
    },
    {
      vopros: 'Что у этих треугольников общее?',
      knopki: [
        `Высота из вершины $${c.P}$ на прямую $${c.Q}${c.R}$`,
        'Общая сторона',
        'Равные углы',
      ],
      verno: 0,
      da: `вершина $${c.P}$ общая, а основания лежат на одной прямой $${c.Q}${c.R}$ — высота из $${c.P}$ общая. Основания равны (${
        c.n === 2 ? `$${e}$ — середина` : 'равные части'
      }), значит, площади равны: обозначим каждую $S$.${c.n === 2 ? ` Это и есть свойство медианы: $${c.P}${e}$ — медиана треугольника $${c.P}${c.Q}${c.R}$.` : ''}`,
      formuly: [
        st
          .slice(0, c.n)
          .map((x, i) => `S_{${c.P}${x}${st[i + 1]}}`)
          .join(' = ') + ' = S',
      ],
      utochnenie:
        'Площадь треугольника — половина основания на высоту. Сравни основания и высоты этих треугольников.',
      sloy: SLOI.vysota,
      fakt: c.n === 2 ? 'mediana-ploshchad' : 'obshchaya-vysota',
    },
    {
      vopros: `Что делает диагональ $${c.P}${c.R}$ с параллелограммом?`,
      knopki: [
        'Делит его на два равных треугольника',
        'Делит его пополам по периметру',
        'Ничего особенного',
      ],
      verno: 0,
      da: `треугольники $${c.P}${c.T}${c.R}$ и $${c.R}${c.Q}${c.P}$ равны по трём сторонам: противоположные стороны параллелограмма равны, $${c.P}${c.R}$ — общая. Их площади равны.`,
      formuly: [
        `S_{${c.P}${c.Q}${c.R}} = ${kS(c.n)}`,
        `S_{${c.P}${c.T}${c.R}} = ${kS(c.n)}`,
        `S_{${P_}} = ${kS(2 * c.n)}`,
      ],
      utochnenie: `Сравни стороны треугольников $${c.P}${c.T}${c.R}$ и $${c.R}${c.Q}${c.P}$.`,
      sloy: SLOI.polovina,
      fakt: 'diagonal-parallelogramma',
    },
    {
      vopros: iskomoeTr
        ? `Чему равна площадь треугольника $${nazv(treug(c))}$?`
        : `Из каких частей складывается трапеция $${nazv(trap(c))}$?`,
      knopki: iskomoeTr
        ? [$(kS(c.m)), $(kS(c.n)), $(kS(2 * c.m))]
        : [
            `$${c.P}${c.T}${c.R}$ и ${c.n - c.m === 1 ? 'треугольник' : 'треугольники'} ${st
              .slice(c.m, c.n)
              .map((x, i) => `$${c.P}${x}${st[c.m + i + 1]}$`)
              .join(', ')}`,
            `$${c.P}${c.T}${c.R}$ и $${c.P}${c.Q}${e}$`,
            'только треугольник $' + `${c.P}${c.T}${c.R}` + '$',
          ],
      verno: 0,
      da: iskomoeTr
        ? `треугольник $${nazv(treug(c))}$ складывается из ${c.m === 1 ? 'одного маленького треугольника' : `${c.m} маленьких треугольников`}.`
        : `трапеция — это треугольник $${c.P}${c.T}${c.R}$ и маленькие треугольники между $${e}$ и $${c.R}$.`,
      formuly: iskomoeTr
        ? [`S_{${nazv(treug(c))}} = ${kS(c.m)}`]
        : [`S_{${nazv(trap(c))}} = ${kS(c.n)} + ${kS(c.n - c.m)} = ${kS(2 * c.n - c.m)}`],
      utochnenie: 'Посмотри на чертёж: какие закрашенные части попадают внутрь искомой фигуры?',
      fakt: null,
    },
    ...chisla(c, 2),
  ];

  const nevernye =
    c.n === 2
      ? [
          {
            knopka: `Опустить высоту из $${c.P}$ на $${c.Q}${c.R}$`,
            pochemu:
              'Высота нужна для формулы площади, но длин в задаче нет — части так не сравнить. Нужно построение, которое режет фигуру на части с равными площадями.',
          },
          {
            knopka: `Соединить $${e}$ с $${c.T}$`,
            pochemu: `Отрезок $${e}${c.T}$ режет фигуру на части, отношение площадей которых снова неизвестно. Ищем построение, после которого части станут равными.`,
          },
        ]
      : [
          {
            knopka: `Опустить высоту из $${c.P}$ на $${c.Q}${c.R}$`,
            pochemu:
              'Высота нужна для формулы площади, но длин в задаче нет — части так не сравнить. Нужно построение, которое режет фигуру на части с равными площадями.',
          },
          {
            knopka: `Провести диагональ $${c.Q}${c.T}$`,
            pochemu: `Диагональ $${c.Q}${c.T}$ не проходит через точки деления — она их не использует. Построение должно опираться на ${tochkiTekst.replace(/^точки /, 'точки ')}.`,
          },
        ];

  return {
    vybor: {
      vopros: `${c.n === 2 ? `Как использовать то, что ${tochkiTekst}?` : 'Как использовать точки деления?'} Какое дополнительное построение поможет?`,
      nevernye,
    },
    sposoby: [
      {
        nazvanie: 'Дополнительное построение',
        knopka: `Провести через ${c.n === 2 ? `$${e}$ прямую` : `${c.deleniya.map($).join(' и ')} прямые`}, параллельные $${c.T}${c.R}$`,
        zachem: `параллельные прямые режут параллелограмм на ${c.n} маленьких параллелограмма с равными основаниями — их площади легко сравнить.`,
        shagi: sposob1,
      },
      {
        nazvanie: c.n === 2 ? 'Диагональ и медиана' : 'Диагональ и треугольники с общей высотой',
        knopka: `Провести диагональ $${c.P}${c.R}$${c.n === 2 ? '' : ' и отрезки из $' + c.P + '$ в точки деления'}`,
        zachem: `диагональ делит параллелограмм пополам, а отрезки из $${c.P}$ режут треугольник $${c.P}${c.Q}${c.R}$ на треугольники с общей высотой.`,
        shagi: sposob2,
        vyvod: `Если у треугольников общая высота, их площади относятся как основания. Здесь $${c.Q}${e} : ${c.Q}${c.R} = ${c.m} : ${c.n}$, поэтому $S_{${c.P}${c.Q}${e}} : S_{${c.P}${c.Q}${c.R}} = ${c.m} : ${c.n}$.`,
      },
    ],
    priem: {
      nazvanie: 'Равные площади обозначаем одной буквой $S$',
      fakt: 'priem-ravnye-ploshchadi',
    },
  };
}

/* ── Решение по двум способам ─────────────────────────────────────── */

export function resheniyeChastey(c: Chasti): ShagResheniya[] {
  const e = E(c);
  const pt = naPT(c);
  const st = naStorone(c);
  const fm = pt[c.m]!;
  const P_ = ABCD(c);
  const S = edinica(c);
  const otvet = otvetChastey(c);
  const tr = 2 * c.n - c.m;
  const dano =
    c.vid === 'trap' || c.vid === 'treug'
      ? { kto: P_, k: 2 * c.n }
      : c.vid === 'obr-trap'
        ? { kto: nazv(trap(c)), k: tr }
        : { kto: nazv(treug(c)), k: c.m };
  const isk =
    c.vid === 'trap'
      ? { kto: nazv(trap(c)), k: tr }
      : c.vid === 'treug'
        ? { kto: nazv(treug(c)), k: c.m }
        : { kto: P_, k: 2 * c.n };
  const schet = (sposob: 1 | 2): ShagResheniya => ({
    zagolovok: 'Подставляем числа',
    tekst: [`Площадь $${dano.kto}$ равна $${tex(c.s)}$, а это $${kS(dano.k)}$.`],
    formuly: [
      `${kS(dano.k)} = ${tex(c.s)},\\quad S = ${tex(S)}`,
      `S_{${isk.kto}} = ${kS(isk.k)} = ${tex(otvet)}`,
    ],
    sposob,
  });
  return [
    {
      zagolovok: 'Проводим прямые',
      sposobNazvanie: 'Способ 1. Дополнительное построение',
      tekst: [
        `Через ${c.deleniya.map($).join(' и ')} проведём ${c.n === 2 ? 'прямую' : 'прямые'}, параллельные $${c.T}${c.R}$; ${
          c.n === 2 ? 'точку' : 'точки'
        } пересечения с $${c.P}${c.T}$ обозначим ${c.peresecheniya.map($).join(' и ')}. Получились ${c.n} параллелограмма с равными основаниями (равные части стороны) и общей высотой — их площади равны.`,
      ],
      sloy: SLOI.parallelogrammy,
      sposob: 1,
      fakty: ['ploshchad-parallelogramma'],
    },
    {
      zagolovok: 'Диагональ маленького параллелограмма',
      tekst: [
        `$${c.P}${e}$ — диагональ параллелограмма $${fm}${c.P}${c.Q}${e}$: она делит его на два равных треугольника. Обозначим площадь маленького треугольника с основанием в одну часть буквой $S$: каждый маленький параллелограмм — $2S$.`,
      ],
      formuly: [`S_{${c.P}${c.Q}${e}} = ${kS(c.m)},\\quad S_{${P_}} = ${kS(2 * c.n)}`],
      sloy: SLOI.bukvy,
      sposob: 1,
      fakty: ['diagonal-parallelogramma', 'priem-ravnye-ploshchadi'],
    },
    {
      zagolovok: 'Искомая площадь через $S$',
      tekst: [
        c.vid === 'treug' || c.vid === 'obr-treug'
          ? `Треугольник $${nazv(treug(c))}$ — это $${kS(c.m)}$.`
          : `Трапеция $${nazv(trap(c))}$ — весь параллелограмм без треугольника $${nazv(treug(c))}$.`,
      ],
      formuly: [`S_{${nazv(trap(c))}} = ${kS(2 * c.n)} - ${kS(c.m)} = ${kS(tr)}`],
      sposob: 1,
    },
    schet(1),
    {
      zagolovok: 'Диагональ и отрезки из вершины',
      sposobNazvanie:
        c.n === 2
          ? 'Способ 2. Диагональ и медиана'
          : 'Способ 2. Диагональ и треугольники с общей высотой',
      tekst: [
        `Проведём диагональ $${c.P}${c.R}$. Треугольники ${st
          .slice(0, c.n)
          .map((x, i) => `$${c.P}${x}${st[i + 1]}$`)
          .join(
            ', ',
          )} имеют общую высоту из $${c.P}$ и равные основания — их площади равны: по $S$.`,
      ],
      sloy: SLOI.vysota,
      sposob: 2,
      fakty: [c.n === 2 ? 'mediana-ploshchad' : 'obshchaya-vysota'],
    },
    {
      zagolovok: 'Диагональ делит параллелограмм пополам',
      tekst: [
        `Треугольники $${c.P}${c.T}${c.R}$ и $${c.R}${c.Q}${c.P}$ равны по трём сторонам, поэтому их площади равны.`,
      ],
      formuly: [
        `S_{${c.P}${c.Q}${c.R}} = S_{${c.P}${c.T}${c.R}} = ${kS(c.n)},\\quad S_{${P_}} = ${kS(2 * c.n)}`,
        `S_{${nazv(trap(c))}} = ${kS(c.n)} + ${kS(c.n - c.m)} = ${kS(tr)}`,
      ],
      sloy: SLOI.polovina,
      sposob: 2,
      fakty: ['diagonal-parallelogramma'],
    },
    schet(2),
  ];
}

/**
 * Вопросы подсказки в прежнем виде (листы, автопроверка подсказок):
 * шаги способа 1 после выбора построения.
 */
export function voprosyChastey(c: Chasti): VoprosPodskazki[] {
  const sc = scenariyChastey(c);
  const s1 = sc.sposoby[0]!;
  return s1.shagi.map((s) => ({
    vopros: s.vopros,
    knopki: [...s.knopki],
    verno: s.verno,
    poyasnenie: `Да: ${s.da}`,
    ...(s.sloy === undefined ? {} : { sloy: s.sloy }),
    ...(s.vvod === undefined ? {} : { vvod: s.vvod }),
    ...(s.utochnenie === undefined ? {} : { utochnenie: s.utochnenie }),
    fakt: s.fakt ?? null,
  }));
}

/** Сверка ответа с чертежом. */
export function sverkaChastey(c: Chasti): string {
  const otvet = otvetChastey(c);
  if (c.vid === 'obr-trap' || c.vid === 'obr-treug')
    return `Сверяем с рисунком: параллелограмм больше своей части: $${tex(otvet)} > ${tex(c.s)}$ — сходится.`;
  const vse = 2 * c.n;
  const k = c.vid === 'trap' ? vse - c.m : c.m;
  const bolshe = 2 * k > vse;
  return `Сверяем с рисунком: искомая фигура — $\\tfrac{${k}}{${vse}}$ параллелограмма, ${
    bolshe ? 'большая его часть' : 'меньшая его часть'
  }: $${tex(otvet)} ${bolshe ? '>' : '<'} ${tex(c.s / 2)}$ — сходится.`;
}
