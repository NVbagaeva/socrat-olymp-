/**
 * Чертежи справочника по планиметрии (content/spravochnik1) — по
 * якорю карточки и по своему примеру. Только данные: рисует движок
 * (render.ts), подписи раскладывает он же — без наложений.
 *
 * Правила чертежей теории:
 *   — никаких чисел, только обозначения: точки, углы (дуги, номера
 *     углов 1–8 там, где они нужны), засечки равенства, значок
 *     прямого угла, буквы сторон a, b, c, h, R;
 *   — ключевой элемент карточки — `vydelit: 'iskomoe'`: на странице
 *     справочника он золотисто-оранжевый (spravochnik1-web.css, spravochnik1-pdf.css);
 *   — карточка из двух картинок («было/стало», «внутри/снаружи») —
 *     массив рисунков, они стоят рядом.
 *
 * Числа — только в чертежах примеров. Пример из банка или аналог
 * рисует сцена его прототипа с числами условия (так чертёж примера и
 * чертёж задачи в тренажёре — один и тот же); свои примеры — сцены
 * ниже по ключу «якорь:номер».
 */

import { analogi } from './bank/analogi';
import { BANK_FIPI } from './bank/fipi';
import {
  POROG,
  opisannyy,
  parallelogramm,
  poStoronam,
  poUglam,
  pravilnyy,
  pryamougolnyy,
  ravnobedrennyy,
  romb,
  trapeciya,
} from './figury';
import { add, intersect, mid, mul, polar, sub } from './geom';
import { prototip } from './stseny';
import { duga, mn, oblast, okr, otr, pryam, pryamaya, shtrih, tochka, tri, ug } from './stseny/dsl';
import type { Params } from './stseny/dsl';
import type { EOtrezok, Optsii, Scena, T2 } from './types';
import type { Primer } from '../../content/spravochnik1/tipy';

export interface RisunokSpravochnika {
  scena: Scena;
  optsii: Optsii;
}

/** Чертёж карточки: один рисунок или несколько рядом. */
export type ChertezhSpravochnika = RisunokSpravochnika | RisunokSpravochnika[];

/* Все слои видны, подписи-обозначения выводятся (chisla — это любое
   значение у элемента, в теории это буквы). */
const OPTS: Optsii = { rezhim: { rezhim: 'uchitel' }, chisla: true };
const r = (scena: Scena): RisunokSpravochnika => ({ scena, optsii: OPTS });

/** Подпись отрезка (буква или число) без повторной линии. */
const bk = (a: string, b: string, znachenie: string, o: Partial<EOtrezok> = {}): EOtrezok => ({
  tip: 'otrezok',
  a,
  b,
  tolkoShtrihi: true,
  vydelit: 'dano',
  znachenie,
  ...o,
});
const ISK = { vydelit: 'iskomoe' } as const;

/** Две параллельные прямые a (сверху), b (снизу) и секущая под углом teta к оси x. */
function parallelnye(teta: number): Scena['tochki'] {
  const dir = polar(teta, 1);
  const X1: T2 = [dir[0] * (4 / dir[1]), 4];
  const X2: T2 = [0, 0];
  return {
    P: [-6, 4],
    Q: [7, 4],
    R: [-6, 0],
    S: [7, 0],
    X1,
    X2,
    U: add(X1, mul(dir, 2.4)),
    W: sub(X2, mul(dir, 2.4)),
  };
}

/** Углы 1–8 при параллельных прямых. Номера — подписи, равные углы одного вида. */
function uglyParallelnyh(
  nomera: Partial<Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, string>>,
  vydelit: readonly number[],
): Scena['elementy'] {
  const u = (n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, a: string, v: string, b: string) =>
    nomera[n] === undefined
      ? []
      : [
          ug(a, v, b, {
            znachenie: nomera[n],
            dugi: n % 2 === 1 ? 1 : 2,
            ...(vydelit.includes(n) ? ISK : {}),
          }),
        ];
  return [
    ...u(1, 'U', 'X1', 'P'),
    ...u(2, 'Q', 'X1', 'U'),
    ...u(3, 'X2', 'X1', 'Q'),
    ...u(4, 'P', 'X1', 'X2'),
    ...u(5, 'X1', 'X2', 'R'),
    ...u(6, 'S', 'X2', 'X1'),
    ...u(7, 'W', 'X2', 'S'),
    ...u(8, 'R', 'X2', 'W'),
  ];
}

const VSE_UGLY = { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8' } as const;
const PARALLELNYE_LINII: Scena['elementy'] = [
  otr('P', 'Q'),
  otr('R', 'S'),
  otr('W', 'U', ISK),
  bk('P', 'Q', 'a', { a: 'P', b: 'X1' }),
  bk('R', 'S', 'b', { a: 'R', b: 'X2' }),
];

/* ── Чертежи карточек ─────────────────────────────────────────── */

const TEORIYA: Record<string, () => ChertezhSpravochnika> = {
  /* 1. Углы и прямые */
  'vidy-uglov': () => {
    /* Развёрнутый угол — дуга от луча до луча чуть меньше 180°: ровно
       полуокружность движок рисует как две точки. */
    const ugol = (gradus: number, slovo: string, pryamoy = false, razv = false) =>
      r({
        tochki: razv
          ? { O: [0, 0], A: [-3, 0], B: [3, 0], K1: polar(0.5, 1.1), K2: polar(179.5, 1.1) }
          : { O: [0, 0], A: [3, 0], B: polar(gradus, 3) },
        okruzhnosti: razv ? { k: { centr: 'O', radius: 1.1 } } : {},
        elementy: razv
          ? [otr('A', 'B'), tochka('O'), duga('k', 'K1', 'K2', { ...ISK, znachenie: slovo })]
          : [
              otr('O', 'A'),
              otr('O', 'B'),
              pryamoy
                ? pryam('A', 'O', 'B', { ...ISK, znachenie: slovo })
                : ug('A', 'O', 'B', { ...ISK, znachenie: slovo }),
            ],
        podpisi: false,
      });
    return [
      ugol(50, 'острый'),
      ugol(90, 'прямой', true),
      ugol(130, 'тупой'),
      ugol(180, 'развёрнутый', false, true),
    ];
  },
  smezhnye: () =>
    r({
      tochki: { A: [-5, 0], O: [0, 0], B: [5, 0], C: polar(58, 5) },
      elementy: [
        otr('A', 'B'),
        otr('O', 'C', ISK),
        ug('A', 'O', 'C', { znachenie: '1', dugi: 2 }),
        ug('C', 'O', 'B', { znachenie: '2' }),
      ],
    }),
  vertikalnye: () =>
    r({
      tochki: {
        O: [0, 0],
        A: polar(145, 5),
        B: polar(-35, 5),
        C: polar(35, 5),
        D: polar(215, 5),
      },
      elementy: [
        otr('A', 'B'),
        otr('C', 'D'),
        ug('C', 'O', 'A', { znachenie: '1', ...ISK }),
        ug('B', 'O', 'C', { znachenie: '2', dugi: 2 }),
        ug('D', 'O', 'B', { znachenie: '3', ...ISK }),
        ug('A', 'O', 'D', { znachenie: '4', dugi: 2 }),
      ],
      podpisi: false,
    }),
  'bissektrisa-ugla': () => [
    r({
      tochki: { O: [0, 0], M: [6, 0], N: polar(70, 6), L: polar(35, 7.2) },
      elementy: [
        otr('O', 'M'),
        otr('O', 'N'),
        otr('O', 'L', ISK),
        ug('M', 'O', 'L'),
        ug('L', 'O', 'N'),
      ],
    }),
    r({
      tochki: { ...poUglam(64, 48), D: { bissektrisa: ['A', 'B', 'C'] } },
      elementy: [tri('A', 'B', 'C'), otr('A', 'D', ISK), ug('B', 'A', 'D'), ug('D', 'A', 'C')],
    }),
  ],
  parallelnye: () =>
    r({
      tochki: parallelnye(62),
      elementy: [...PARALLELNYE_LINII, ...uglyParallelnyh(VSE_UGLY, [1, 3, 5, 7])],
      podpisi: false,
    }),
  'svoystvo-ili-priznak': () =>
    r({
      tochki: parallelnye(62),
      elementy: [...PARALLELNYE_LINII, ...uglyParallelnyh({ 3: '3', 5: '5' }, [3, 5])],
      podpisi: false,
    }),

  /* 2. Треугольник */
  'summa-uglov': () =>
    r({
      tochki: poUglam(52, 63),
      elementy: [
        tri('A', 'B', 'C'),
        ug('C', 'A', 'B', { znachenie: 'α', ...ISK }),
        ug('A', 'B', 'C', { dugi: 2, znachenie: 'β', ...ISK }),
        ug('B', 'C', 'A', { dugi: 3, znachenie: 'γ', ...ISK }),
      ],
    }),
  'vneshniy-ugol': () =>
    r({
      tochki: { ...poUglam(50, 70), D: { naPryamoy: ['A', 'B', 1.45] } },
      elementy: [
        tri('A', 'B', 'C'),
        otr('B', 'D'),
        ug('C', 'B', 'D', ISK),
        ug('C', 'A', 'B', { dugi: 2 }),
        ug('B', 'C', 'A', { dugi: 3 }),
      ],
    }),
  neravenstvo: () =>
    r({
      tochki: poStoronam(6, 7, 10),
      elementy: [tri('A', 'B', 'C'), bk('B', 'C', 'a'), bk('A', 'C', 'b'), bk('A', 'B', 'c', ISK)],
    }),
  'storony-i-ugly': () =>
    r({
      tochki: poStoronam(7, 9, 5),
      elementy: [
        tri('A', 'B', 'C'),
        otr('A', 'C', ISK),
        ug('A', 'B', 'C', { ...ISK, dugi: 2 }),
        ug('C', 'A', 'B'),
        ug('B', 'C', 'A'),
      ],
    }),
  ravnobedrennyy: () =>
    r({
      tochki: { ...ravnobedrennyy(44), H: { seredina: ['A', 'B'] } },
      elementy: [
        tri('A', 'B', 'C'),
        shtrih('A', 'C', 1),
        shtrih('B', 'C', 1),
        ug('C', 'A', 'B', { dugi: 2 }),
        ug('A', 'B', 'C', { dugi: 2 }),
        otr('C', 'H', ISK),
        pryam('C', 'H', 'B'),
      ],
    }),
  ravnostoronniy: () =>
    r({
      tochki: {
        ...ravnobedrennyy(60),
        H: { seredina: ['A', 'B'] },
        O: { centrOpisannoy: ['A', 'B', 'C'] },
      },
      elementy: [
        tri('A', 'B', 'C'),
        shtrih('A', 'C', 1),
        shtrih('B', 'C', 1),
        bk('A', 'B', 'a', { shtrihi: 1 }),
        otr('C', 'H', ISK),
        bk('C', 'H', 'h', { a: 'H', b: 'O' }),
        pryam('C', 'H', 'B'),
        tochka('O'),
      ],
    }),

  /* 3. Элементы треугольника */
  mediana: () =>
    r({
      tochki: {
        ...poUglam(58, 46),
        M: { seredina: ['A', 'C'] },
        N: { seredina: ['B', 'C'] },
        K: { seredina: ['A', 'B'] },
        O: {
          peresechenie: [
            ['B', 'M'],
            ['A', 'N'],
          ],
        },
      },
      elementy: [
        tri('A', 'B', 'C'),
        otr('B', 'M', ISK),
        otr('A', 'N'),
        otr('C', 'K'),
        shtrih('A', 'M', 1),
        shtrih('M', 'C', 1),
        tochka('O'),
      ],
      bezPodpisi: ['N', 'K'],
    }),
  vysota: () => [
    r({
      tochki: { ...poUglam(62, 54), H: { osnovanie: ['C', 'A', 'B'] } },
      elementy: [tri('A', 'B', 'C'), otr('C', 'H'), pryam('C', 'H', 'B')],
      podpisi: ['A', 'B', 'C', 'H'],
    }),
    r({
      tochki: { A: [0, 0], C: [8, 0], B: [-3, 4.2], H: { osnovanie: ['B', 'C', 'A'] } },
      elementy: [
        tri('A', 'B', 'C'),
        { tip: 'prodolzhenie', a: 'C', b: 'A', doTochki: 'H' },
        otr('B', 'H', ISK),
        pryam('B', 'H', 'C'),
      ],
    }),
  ],
  'srednyaya-liniya-treugolnika': () =>
    r({
      tochki: {
        ...poUglam(55, 62),
        D: { seredina: ['A', 'C'] },
        E: { seredina: ['B', 'C'] },
      },
      elementy: [
        tri('A', 'B', 'C'),
        otr('D', 'E', ISK),
        shtrih('A', 'D', 1),
        shtrih('D', 'C', 1),
        shtrih('B', 'E', 2),
        shtrih('E', 'C', 2),
      ],
    }),
  'seredinnyy-perpendikulyar': () =>
    r({
      tochki: { A: [-4, 0], B: [4, 0], M: [0, 0], P: [0, 4.5], Q: [0, -1.6] },
      elementy: [
        otr('A', 'B'),
        otr('Q', 'P', ISK),
        pryam('B', 'M', 'P'),
        shtrih('A', 'M', 1),
        shtrih('M', 'B', 1),
        otr('P', 'A', { shtrihi: 2 }),
        otr('P', 'B', { shtrihi: 2 }),
      ],
      bezPodpisi: ['Q'],
    }),
  'tochki-peresecheniya': () =>
    r({
      tochki: {
        ...poUglam(62, 56),
        D: { osnovanie: ['B', 'A', 'C'] },
        E: { osnovanie: ['C', 'A', 'B'] },
        O: {
          peresechenie: [
            ['B', 'D'],
            ['C', 'E'],
          ],
        },
      },
      elementy: [
        tri('A', 'B', 'C'),
        otr('B', 'D'),
        otr('C', 'E'),
        pryam('B', 'D', 'C'),
        pryam('C', 'E', 'B'),
        ug('C', 'A', 'B'),
        ug('D', 'O', 'E', { ...ISK, dugi: 2 }),
      ],
    }),

  /* 4. Прямоугольный треугольник */
  pryamougolnyy: () =>
    r({
      tochki: pryamougolnyy(37, 'katety'),
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        bk('C', 'B', 'a'),
        bk('A', 'C', 'b'),
        bk('A', 'B', 'c', ISK),
        ug('C', 'A', 'B'),
        ug('A', 'B', 'C', { dugi: 2 }),
      ],
    }),
  pifagor: () =>
    r({
      tochki: pryamougolnyy(37, 'katety'),
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        bk('C', 'B', 'a'),
        bk('A', 'C', 'b'),
        otr('A', 'B', ISK),
        bk('A', 'B', 'c'),
      ],
    }),
  trig: () =>
    r({
      tochki: pryamougolnyy(37, 'katety'),
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        ug('C', 'A', 'B', ISK),
        bk('C', 'B', 'противолежащий'),
        bk('A', 'C', 'прилежащий'),
        bk('A', 'B', 'гипотенуза'),
      ],
    }),
  znacheniya: () => [
    r({
      tochki: pryamougolnyy(45, 'katety'),
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        ug('C', 'A', 'B', { znachenie: '45°' }),
        ug('A', 'B', 'C', { znachenie: '45°' }),
        bk('C', 'B', 'a'),
        bk('A', 'C', 'a'),
        bk('A', 'B', 'a√2', ISK),
      ],
      podpisi: false,
    }),
    r({
      tochki: pryamougolnyy(30, 'katety'),
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        ug('A', 'B', 'C', { znachenie: '30°' }),
        ug('C', 'A', 'B', { znachenie: '60°', dugi: 2 }),
        bk('A', 'C', 'a', ISK),
        bk('C', 'B', 'a√3'),
        bk('A', 'B', '2a'),
      ],
      podpisi: false,
    }),
  ],
  'osnovnoe-tozhdestvo': () =>
    r({
      tochki: pryamougolnyy(37, 'katety'),
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        otr('C', 'B', ISK),
        ug('C', 'A', 'B'),
        ug('A', 'B', 'C', { dugi: 2 }),
      ],
    }),
  'trig-tupogo-ugla': () =>
    r({
      tochki: { A: [-5, 0], O: [0, 0], B: [5, 0], C: polar(55, 5) },
      elementy: [
        otr('A', 'B'),
        otr('O', 'C'),
        ug('C', 'O', 'B', { znachenie: 'α' }),
        ug('A', 'O', 'C', { znachenie: '180° − α', dugi: 2, ...ISK }),
      ],
      podpisi: false,
    }),
  'ugol-30': () =>
    r({
      tochki: pryamougolnyy(60, 'katety'),
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        ug('C', 'A', 'B', { znachenie: '30°' }),
        otr('C', 'B', ISK),
      ],
    }),
  'mediana-k-gipotenuze': () =>
    r({
      tochki: { ...pryamougolnyy(37, 'katety'), M: { seredina: ['A', 'B'] } },
      okruzhnosti: { w: { centr: 'M', cherez: 'C' } },
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        otr('C', 'M', { ...ISK, shtrihi: 1 }),
        shtrih('A', 'M', 1),
        shtrih('M', 'B', 1),
        okr('w', { stil: 'punktir', sloy: 'reshenie' }),
      ],
    }),
  'vysota-k-gipotenuze': () =>
    r({
      tochki: { ...poUglam(36, 54), H: { osnovanie: ['C', 'A', 'B'] } },
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        otr('C', 'H', ISK),
        pryam('C', 'H', 'B'),
        ug('C', 'A', 'B'),
        ug('H', 'C', 'B'),
      ],
    }),

  /* 5. Равенство и подобие */
  ravenstvo: () => {
    const para = (sdvig: number) => {
      const t = poUglam(58, 50, 6);
      return {
        A: t.A,
        B: t.B,
        C: t.C,
        A1: add(t.A, [sdvig, 0]),
        B1: add(t.B, [sdvig, 0]),
        C1: add(t.C, [sdvig, 0]),
      };
    };
    return [
      r({
        tochki: para(8),
        elementy: [
          tri('A', 'B', 'C'),
          tri('A1', 'B1', 'C1'),
          shtrih('A', 'B', 1),
          shtrih('A1', 'B1', 1),
          shtrih('A', 'C', 2),
          shtrih('A1', 'C1', 2),
          ug('C', 'A', 'B', ISK),
          ug('C1', 'A1', 'B1', ISK),
        ],
        podpisi: false,
      }),
      r({
        tochki: para(8),
        elementy: [
          tri('A', 'B', 'C'),
          tri('A1', 'B1', 'C1'),
          otr('A', 'B', { ...ISK, shtrihi: 1 }),
          otr('A1', 'B1', { ...ISK, shtrihi: 1 }),
          ug('C', 'A', 'B'),
          ug('C1', 'A1', 'B1'),
          ug('A', 'B', 'C', { dugi: 2 }),
          ug('A1', 'B1', 'C1', { dugi: 2 }),
        ],
        podpisi: false,
      }),
      r({
        tochki: para(8),
        elementy: [
          tri('A', 'B', 'C'),
          tri('A1', 'B1', 'C1'),
          shtrih('A', 'B', 1),
          shtrih('A1', 'B1', 1),
          shtrih('A', 'C', 2),
          shtrih('A1', 'C1', 2),
          shtrih('B', 'C', 3),
          shtrih('B1', 'C1', 3),
        ],
        podpisi: false,
      }),
    ];
  },
  podobie: () => {
    const t = poUglam(56, 48, 5);
    const s = (p: T2): T2 => add(mul(p, 1.6), [7.5, 0]);
    return r({
      tochki: { A: t.A, B: t.B, C: t.C, A1: s(t.A), B1: s(t.B), C1: s(t.C) },
      elementy: [
        tri('A', 'B', 'C'),
        tri('A1', 'B1', 'C1'),
        ug('C', 'A', 'B'),
        ug('C1', 'A1', 'B1'),
        ug('A', 'B', 'C', { dugi: 2 }),
        ug('A1', 'B1', 'C1', { dugi: 2 }),
        bk('A', 'B', 'c', ISK),
        bk('A1', 'B1', 'c₁', ISK),
      ],
    });
  },
  'otnoshenie-ploshchadey': () =>
    r({
      tochki: {
        ...poUglam(56, 62),
        D: { naPryamoy: ['C', 'A', 0.5] },
        E: { naPryamoy: ['C', 'B', 0.5] },
      },
      elementy: [tri('A', 'B', 'C'), otr('D', 'E'), oblast(['C', 'D', 'E'], ISK)],
    }),

  /* 6. Площади */
  'ploshchad-treugolnika': () =>
    r({
      tochki: {
        B: [0, 0],
        C: [10, 0],
        A: [3.4, 5.4],
        H: { osnovanie: ['A', 'B', 'C'] },
      },
      elementy: [
        tri('A', 'B', 'C'),
        otr('A', 'H', ISK),
        pryam('A', 'H', 'C'),
        bk('B', 'C', 'a', { a: 'H', b: 'C' }),
        bk('A', 'C', 'b'),
        bk('A', 'B', 'c'),
        bk('A', 'H', 'hₐ'),
        ug('A', 'C', 'B', { znachenie: 'γ' }),
      ],
    }),
  'ploshchad-parallelogramma': () =>
    r({
      tochki: { ...parallelogramm(62), H: { osnovanie: ['B', 'A', 'D'] } },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('B', 'H', ISK),
        pryam('B', 'H', 'D'),
        bk('A', 'D', 'a', { a: 'H', b: 'D' }),
        bk('A', 'B', 'b'),
        bk('B', 'H', 'hₐ'),
        ug('B', 'A', 'D', { znachenie: 'α' }),
      ],
    }),
  'ploshchad-pryamougolnika': () => [
    r({
      tochki: { A: [0, 0], B: [0, 5], C: [8, 5], D: [8, 0] },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        pryam('B', 'A', 'D'),
        bk('A', 'D', 'a'),
        bk('A', 'B', 'b'),
      ],
      podpisi: false,
    }),
    r({
      tochki: { A: [0, 0], B: [0, 5], C: [5, 5], D: [5, 0] },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        pryam('B', 'A', 'D'),
        bk('A', 'D', 'a'),
        otr('A', 'C', ISK),
        bk('A', 'C', 'd'),
      ],
      podpisi: false,
    }),
  ],
  'ploshchad-romba': () => [
    r({
      tochki: {
        ...romb(56, 6),
        O: {
          peresechenie: [
            ['A', 'C'],
            ['B', 'D'],
          ],
        },
      },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'C', ISK),
        otr('B', 'D', ISK),
        pryam('C', 'O', 'D'),
        bk('A', 'C', 'd₁', { a: 'A', b: 'O' }),
        bk('B', 'D', 'd₂', { a: 'O', b: 'D' }),
      ],
      podpisi: false,
    }),
    r({
      tochki: {
        A: [0, 0],
        B: [2, 5],
        C: [9, 4],
        D: [8, 0],
        O: {
          peresechenie: [
            ['A', 'C'],
            ['B', 'D'],
          ],
        },
      },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'C', ISK),
        otr('B', 'D', ISK),
        ug('C', 'O', 'D', { znachenie: 'φ' }),
      ],
      podpisi: false,
    }),
  ],
  'ploshchad-trapecii': () =>
    r({
      tochki: {
        ...trapeciya(10, 4.5, 4.5, 2.4),
        H: { osnovanie: ['B', 'A', 'D'] },
        M: { seredina: ['A', 'B'] },
        N: { seredina: ['C', 'D'] },
      },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('B', 'H', ISK),
        pryam('B', 'H', 'D'),
        otr('M', 'N', { stil: 'punktir', sloy: 'reshenie' }),
        bk('A', 'D', 'a', { a: 'H', b: 'D' }),
        bk('B', 'C', 'b'),
        bk('B', 'H', 'h'),
        bk('M', 'N', 'm', { a: 'M', b: 'N' }),
      ],
      podpisi: ['A', 'B', 'C', 'D'],
    }),

  /* 7. Теоремы синусов и косинусов */
  'teorema-kosinusov': () =>
    r({
      tochki: poUglam(64, 44),
      elementy: [
        tri('A', 'B', 'C'),
        otr('B', 'C', ISK),
        bk('B', 'C', 'a'),
        bk('A', 'C', 'b'),
        bk('A', 'B', 'c'),
        ug('C', 'A', 'B', { znachenie: 'α', ...ISK }),
      ],
    }),
  'teorema-sinusov': () =>
    r({
      tochki: { ...poUglam(64, 48), O: { centrOpisannoy: ['A', 'B', 'C'] } },
      okruzhnosti: { w: { opisannaya: ['A', 'B', 'C'] } },
      elementy: [
        okr('w', ISK),
        tri('A', 'B', 'C'),
        bk('B', 'C', 'a'),
        bk('A', 'C', 'b'),
        bk('A', 'B', 'c'),
        ug('C', 'A', 'B', { znachenie: 'α' }),
        ug('A', 'B', 'C', { znachenie: 'β', dugi: 2 }),
        ug('B', 'C', 'A', { znachenie: 'γ', dugi: 3 }),
        tochka('O'),
      ],
    }),

  /* 8. Четырёхугольники */
  'summa-uglov-chetyrehugolnika': () =>
    r({
      tochki: { A: [0, 0], B: [1.6, 5], C: [7.4, 6], D: [9.4, 0] },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'C', ISK),
        ug('D', 'A', 'B'),
        ug('A', 'B', 'C', { dugi: 2 }),
        ug('B', 'C', 'D', { dugi: 3 }),
        ug('C', 'D', 'A'),
      ],
    }),
  parallelogramm: () =>
    r({
      tochki: {
        ...parallelogramm(64),
        O: {
          peresechenie: [
            ['A', 'C'],
            ['B', 'D'],
          ],
        },
      },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'C'),
        otr('B', 'D'),
        shtrih('A', 'O', 1),
        shtrih('O', 'C', 1),
        shtrih('B', 'O', 2),
        shtrih('O', 'D', 2),
        ug('D', 'A', 'B'),
        ug('B', 'C', 'D'),
        tochka('O', ISK),
      ],
    }),
  pryamougolnik: () =>
    r({
      tochki: {
        A: [0, 0],
        B: [0, 5],
        C: [9, 5],
        D: [9, 0],
        O: {
          peresechenie: [
            ['A', 'C'],
            ['B', 'D'],
          ],
        },
      },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        pryam('B', 'A', 'D'),
        otr('A', 'C', ISK),
        otr('B', 'D', ISK),
        shtrih('A', 'O', 1),
        shtrih('O', 'C', 1),
        shtrih('B', 'O', 1),
        shtrih('O', 'D', 1),
      ],
    }),
  romb: () =>
    r({
      tochki: {
        ...romb(58, 6),
        O: {
          peresechenie: [
            ['A', 'C'],
            ['B', 'D'],
          ],
        },
      },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        shtrih('A', 'B', 1),
        shtrih('B', 'C', 1),
        shtrih('C', 'D', 1),
        shtrih('D', 'A', 1),
        otr('A', 'C', ISK),
        otr('B', 'D'),
        pryam('C', 'O', 'D'),
        ug('B', 'A', 'C'),
        ug('C', 'A', 'D'),
      ],
    }),
  kvadrat: () =>
    r({
      tochki: {
        A: [0, 0],
        B: [0, 6],
        C: [6, 6],
        D: [6, 0],
        O: {
          peresechenie: [
            ['A', 'C'],
            ['B', 'D'],
          ],
        },
      },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        shtrih('A', 'B', 1),
        shtrih('B', 'C', 1),
        shtrih('C', 'D', 1),
        shtrih('D', 'A', 1),
        otr('A', 'C', ISK),
        otr('B', 'D'),
        pryam('C', 'O', 'D'),
        bk('A', 'D', 'a'),
        bk('A', 'O', 'd', { a: 'A', b: 'O' }),
      ],
    }),
  trapeciya: () =>
    r({
      tochki: {
        ...trapeciya(10, 4.5, 4.5, 2.4),
        M: { seredina: ['A', 'B'] },
        N: { seredina: ['C', 'D'] },
        K: {
          peresechenie: [
            ['A', 'C'],
            ['M', 'N'],
          ],
        },
      },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('M', 'N', ISK),
        otr('A', 'C'),
        shtrih('A', 'M', 1),
        shtrih('M', 'B', 1),
        shtrih('C', 'N', 2),
        shtrih('N', 'D', 2),
        tochka('K'),
      ],
    }),
  'ravnobedrennaya-trapeciya': () =>
    r({
      tochki: {
        ...trapeciya(10, 4, 4.5, 3),
        H: { osnovanie: ['B', 'A', 'D'] },
        G: { osnovanie: ['C', 'A', 'D'] },
      },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        shtrih('A', 'B', 1),
        shtrih('C', 'D', 1),
        ug('D', 'A', 'B', { dugi: 2 }),
        ug('C', 'D', 'A', { dugi: 2 }),
        otr('A', 'C', ISK),
        otr('B', 'D', ISK),
        otr('B', 'H'),
        otr('C', 'G'),
        pryam('B', 'H', 'D'),
        pryam('C', 'G', 'A'),
      ],
      bezPodpisi: ['G'],
    }),

  /* 9. Окружность */
  'okruzhnost-elementy': () =>
    r({
      tochki: {
        O: [0, 0],
        A: { naDuge: { okr: 'w', gradus: 215 } },
        B: { naDuge: { okr: 'w', gradus: 325 } },
        C: { naDuge: { okr: 'w', gradus: 90 } },
        D: { naDuge: { okr: 'w', gradus: 270 } },
        M: {
          peresechenie: [
            ['A', 'B'],
            ['C', 'D'],
          ],
        },
      },
      okruzhnosti: { w: { centr: 'O', radius: 5 } },
      elementy: [
        okr('w'),
        otr('A', 'B', ISK),
        duga('w', 'A', 'B', ISK),
        otr('C', 'D'),
        otr('O', 'A'),
        bk('O', 'A', 'R'),
        pryam('B', 'M', 'C'),
        shtrih('A', 'M', 1),
        shtrih('M', 'B', 1),
        tochka('O'),
      ],
    }),
  'dlina-okruzhnosti': () =>
    r({
      tochki: {
        O: [0, 0],
        A: { naDuge: { okr: 'w', gradus: 20 } },
        B: { naDuge: { okr: 'w', gradus: 110 } },
      },
      okruzhnosti: { w: { centr: 'O', radius: 5 } },
      elementy: [
        okr('w'),
        otr('O', 'A'),
        otr('O', 'B'),
        duga('w', 'A', 'B', ISK),
        ug('A', 'O', 'B', { znachenie: 'α' }),
        bk('O', 'A', 'R'),
      ],
      podpisi: ['O'],
    }),
  kasatelnaya: () =>
    r({
      tochki: {
        O: [0, 0],
        A: { naDuge: { okr: 'w', gradus: 270 } },
        C: { kasatelnayaV: { tochka: 'A', okr: 'w', dlina: 1.7 } },
      },
      okruzhnosti: { w: { centr: 'O', radius: 4 } },
      elementy: [
        okr('w'),
        pryamaya('A', 'C', { zaA: 0.7, zaB: 0.15 }),
        otr('O', 'A'),
        pryam('O', 'A', 'C', ISK),
        otr('C', 'O'),
        tochka('O'),
      ],
    }),
  'otrezki-kasatelnyh': () =>
    r({
      tochki: {
        O: [0, 0],
        C: [9, 0],
        A: { kasanie: { iz: 'C', okr: 'w', storona: 1 } },
        B: { kasanie: { iz: 'C', okr: 'w', storona: -1 } },
      },
      okruzhnosti: { w: { centr: 'O', radius: 3.2 } },
      elementy: [
        okr('w'),
        otr('C', 'A', { ...ISK, shtrihi: 1 }),
        otr('C', 'B', { ...ISK, shtrihi: 1 }),
        otr('O', 'A'),
        otr('O', 'B'),
        pryam('O', 'A', 'C'),
        pryam('O', 'B', 'C'),
        otr('O', 'C'),
        ug('A', 'C', 'O'),
        ug('O', 'C', 'B'),
        tochka('O'),
      ],
    }),
  'kasatelnaya-i-sekushchaya': () =>
    r({
      tochki: {
        O: [0, 0],
        A: [9, 0],
        P: [0, -1.4],
        K: { kasanie: { iz: 'A', okr: 'w', storona: 1 } },
        B: { pryamayaOkruzhnost: { pryamaya: ['A', 'P'], okr: 'w', vybor: 'blizhnyaya' } },
        C: { pryamayaOkruzhnost: { pryamaya: ['A', 'P'], okr: 'w', vybor: 'dalnyaya' } },
      },
      okruzhnosti: { w: { centr: 'O', radius: 3.4 } },
      elementy: [okr('w'), otr('A', 'K', ISK), otr('A', 'C'), tochka('B'), tochka('O')],
      bezPodpisi: ['P'],
    }),
  'centralnyy-vpisannyy': () =>
    r({
      tochki: {
        O: [0, 0],
        A: { naDuge: { okr: 'w', gradus: 205 } },
        B: { naDuge: { okr: 'w', gradus: 335 } },
        C: { naDuge: { okr: 'w', gradus: 95 } },
      },
      okruzhnosti: { w: { centr: 'O', radius: 5 } },
      elementy: [
        okr('w'),
        duga('w', 'A', 'B', ISK),
        otr('O', 'A'),
        otr('O', 'B'),
        otr('C', 'A'),
        otr('C', 'B'),
        ug('A', 'O', 'B', { dugi: 2 }),
        ug('A', 'C', 'B'),
        tochka('O'),
      ],
    }),
  'vpisannye-ugly': () =>
    r({
      tochki: {
        O: [0, 0],
        A: { naDuge: { okr: 'w', gradus: 200 } },
        B: { naDuge: { okr: 'w', gradus: 340 } },
        C: { naDuge: { okr: 'w', gradus: 65 } },
        D: { naDuge: { okr: 'w', gradus: 120 } },
        E: { naDuge: { okr: 'w', gradus: 270 } },
      },
      okruzhnosti: { w: { centr: 'O', radius: 5 } },
      elementy: [
        okr('w'),
        otr('A', 'B'),
        otr('C', 'A'),
        otr('C', 'B'),
        otr('D', 'A'),
        otr('D', 'B'),
        otr('E', 'A'),
        otr('E', 'B'),
        ug('A', 'C', 'B', ISK),
        ug('A', 'D', 'B', ISK),
        ug('B', 'E', 'A', { dugi: 2 }),
      ],
    }),
  'ugol-kasatelnoy-i-hordy': () =>
    r({
      tochki: {
        O: [0, 0],
        B: { naDuge: { okr: 'w', gradus: 270 } },
        A: { naDuge: { okr: 'w', gradus: 25 } },
        C: { kasatelnayaV: { tochka: 'B', okr: 'w', dlina: 1.5 } },
      },
      okruzhnosti: { w: { centr: 'O', radius: 4.5 } },
      elementy: [
        okr('w'),
        otr('B', 'A'),
        pryamaya('B', 'C', { zaA: 0.8, zaB: 0.1 }),
        ug('A', 'B', 'C', ISK),
        duga('w', 'B', 'A', ISK),
        tochka('O'),
      ],
    }),
  'otrezki-hord-i-sekushchih': () => [
    r({
      tochki: {
        O: [0, 0],
        A: { naDuge: { okr: 'w', gradus: 160 } },
        B: { naDuge: { okr: 'w', gradus: 330 } },
        C: { naDuge: { okr: 'w', gradus: 25 } },
        D: { naDuge: { okr: 'w', gradus: 225 } },
        M: {
          peresechenie: [
            ['A', 'B'],
            ['C', 'D'],
          ],
        },
      },
      okruzhnosti: { w: { centr: 'O', radius: 4.5 } },
      elementy: [okr('w'), otr('A', 'B'), otr('C', 'D'), tochka('M', ISK)],
    }),
    r({
      tochki: {
        O: [0, 0],
        A: [9, 0],
        P1: [0, 1.5],
        P2: [0, -1.5],
        B: { pryamayaOkruzhnost: { pryamaya: ['A', 'P1'], okr: 'w', vybor: 'blizhnyaya' } },
        C: { pryamayaOkruzhnost: { pryamaya: ['A', 'P1'], okr: 'w', vybor: 'dalnyaya' } },
        D: { pryamayaOkruzhnost: { pryamaya: ['A', 'P2'], okr: 'w', vybor: 'blizhnyaya' } },
        E: { pryamayaOkruzhnost: { pryamaya: ['A', 'P2'], okr: 'w', vybor: 'dalnyaya' } },
      },
      okruzhnosti: { w: { centr: 'O', radius: 3.4 } },
      elementy: [
        okr('w'),
        otr('A', 'C'),
        otr('A', 'E'),
        tochka('B'),
        tochka('D'),
        tochka('A', ISK),
      ],
      bezPodpisi: ['P1', 'P2', 'O'],
    }),
  ],
  'ugly-hord-i-sekushchih': () => [
    r({
      tochki: {
        O: [0, 0],
        A: { naDuge: { okr: 'w', gradus: 135 } },
        B: { naDuge: { okr: 'w', gradus: 305 } },
        C: { naDuge: { okr: 'w', gradus: 45 } },
        D: { naDuge: { okr: 'w', gradus: 235 } },
        M: {
          peresechenie: [
            ['A', 'B'],
            ['C', 'D'],
          ],
        },
      },
      okruzhnosti: { w: { centr: 'O', radius: 4.5 } },
      elementy: [
        okr('w'),
        otr('A', 'B'),
        otr('C', 'D'),
        duga('w', 'C', 'A', ISK),
        duga('w', 'D', 'B', ISK),
        ug('C', 'M', 'A'),
      ],
    }),
    r({
      tochki: {
        O: [0, 0],
        C: [9, 0],
        P1: [0, 1.5],
        P2: [0, -1.5],
        D: { pryamayaOkruzhnost: { pryamaya: ['C', 'P1'], okr: 'w', vybor: 'blizhnyaya' } },
        B: { pryamayaOkruzhnost: { pryamaya: ['C', 'P1'], okr: 'w', vybor: 'dalnyaya' } },
        E: { pryamayaOkruzhnost: { pryamaya: ['C', 'P2'], okr: 'w', vybor: 'blizhnyaya' } },
        A: { pryamayaOkruzhnost: { pryamaya: ['C', 'P2'], okr: 'w', vybor: 'dalnyaya' } },
      },
      okruzhnosti: { w: { centr: 'O', radius: 3.4 } },
      elementy: [
        okr('w'),
        otr('C', 'B'),
        otr('C', 'A'),
        duga('w', 'B', 'A', ISK),
        duga('w', 'E', 'D', ISK),
        ug('A', 'C', 'B'),
      ],
      bezPodpisi: ['P1', 'P2', 'O'],
    }),
  ],

  /* 10. Вписанные и описанные */
  'opisannaya-okruzhnost': () =>
    r({
      tochki: {
        ...poUglam(58, 50),
        O: { centrOpisannoy: ['A', 'B', 'C'] },
        M: { seredina: ['A', 'B'] },
        N: { seredina: ['B', 'C'] },
      },
      okruzhnosti: { w: { opisannaya: ['A', 'B', 'C'] } },
      elementy: [
        okr('w'),
        tri('A', 'B', 'C'),
        otr('M', 'O', { stil: 'punktir', sloy: 'reshenie' }),
        otr('N', 'O', { stil: 'punktir', sloy: 'reshenie' }),
        pryam('B', 'M', 'O'),
        pryam('C', 'N', 'O'),
        otr('O', 'A', { shtrihi: 1 }),
        otr('O', 'B', { shtrihi: 1 }),
        otr('O', 'C', { shtrihi: 1 }),
        tochka('O', ISK),
      ],
      bezPodpisi: ['M', 'N'],
    }),
  'vpisannaya-okruzhnost': () =>
    r({
      tochki: {
        ...poUglam(64, 50),
        I: { centrVpisannoy: ['A', 'B', 'C'] },
        K: { osnovanie: ['I', 'A', 'B'] },
        L: { osnovanie: ['I', 'B', 'C'] },
      },
      okruzhnosti: { w: { vpisannaya: ['A', 'B', 'C'] } },
      elementy: [
        tri('A', 'B', 'C'),
        okr('w'),
        otr('A', 'I', { stil: 'punktir', sloy: 'reshenie' }),
        otr('B', 'I', { stil: 'punktir', sloy: 'reshenie' }),
        otr('I', 'K'),
        otr('I', 'L'),
        pryam('I', 'K', 'B'),
        pryam('I', 'L', 'C'),
        bk('I', 'K', 'r'),
        tochka('I', ISK),
      ],
      bezPodpisi: ['K', 'L'],
    }),
  'vpisannyy-chetyrehugolnik': () =>
    r({
      tochki: {
        O: [0, 0],
        A: { naDuge: { okr: 'w', gradus: 205 } },
        B: { naDuge: { okr: 'w', gradus: 125 } },
        C: { naDuge: { okr: 'w', gradus: 40 } },
        D: { naDuge: { okr: 'w', gradus: 300 } },
      },
      okruzhnosti: { w: { centr: 'O', radius: 5 } },
      elementy: [
        okr('w'),
        mn(['A', 'B', 'C', 'D']),
        ug('D', 'A', 'B', ISK),
        ug('B', 'C', 'D', ISK),
        ug('A', 'B', 'C', { dugi: 2 }),
        ug('C', 'D', 'A', { dugi: 2 }),
      ],
      podpisi: ['A', 'B', 'C', 'D'],
    }),
  'opisannyy-chetyrehugolnik': () => {
    const [A, B, C, D] = opisannyy([250, 165, 85, 0], 3.5) as [T2, T2, T2, T2];
    return r({
      tochki: {
        O: [0, 0],
        A,
        B,
        C,
        D,
        P: { osnovanie: ['O', 'A', 'B'] },
        Q: { osnovanie: ['O', 'B', 'C'] },
        S: { osnovanie: ['O', 'C', 'D'] },
        T: { osnovanie: ['O', 'D', 'A'] },
      },
      okruzhnosti: { w: { centr: 'O', radius: 3.5 } },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        okr('w'),
        otr('A', 'P', { ...ISK, shtrihi: 1 }),
        otr('A', 'T', { ...ISK, shtrihi: 1 }),
        otr('C', 'Q', { ...ISK, shtrihi: 2 }),
        otr('C', 'S', { ...ISK, shtrihi: 2 }),
      ],
      podpisi: ['A', 'B', 'C', 'D'],
    });
  },
  'pravilnye-mnogougolniki': () => {
    const [A, B, C, D, E, F] = pravilnyy(6, 5) as [T2, T2, T2, T2, T2, T2];
    return r({
      tochki: { O: [0, 0], A, B, C, D, E, F },
      okruzhnosti: { w: { centr: 'O', radius: 5 }, v: { centr: 'O', kasaetsya: ['A', 'B'] } },
      elementy: [
        okr('w'),
        okr('v', { stil: 'punktir', sloy: 'reshenie' }),
        mn(['A', 'B', 'C', 'D', 'E', 'F']),
        otr('O', 'A'),
        otr('O', 'B'),
        ug('A', 'O', 'B', ISK),
        ug('A', 'B', 'C', { dugi: 2 }),
        tochka('O'),
      ],
      podpisi: ['O', 'A', 'B', 'C'],
    });
  },

  /* 11. Полезные факты */
  'ugol-mezhdu-bissektrisami': () =>
    r({
      tochki: {
        ...poUglam(64, 52),
        D: { bissektrisa: ['A', 'B', 'C'] },
        E: { bissektrisa: ['B', 'A', 'C'] },
        O: {
          peresechenie: [
            ['A', 'D'],
            ['B', 'E'],
          ],
        },
      },
      elementy: [
        tri('A', 'B', 'C'),
        otr('A', 'D'),
        otr('B', 'E'),
        ug('B', 'A', 'O'),
        ug('O', 'A', 'C'),
        ug('O', 'B', 'A', { dugi: 2 }),
        ug('C', 'B', 'O', { dugi: 2 }),
        ug('A', 'O', 'B', ISK),
      ],
    }),
  'iz-pryamogo-ugla': () =>
    r({
      tochki: {
        ...poUglam(34, 56),
        H: { osnovanie: ['C', 'A', 'B'] },
        D: { bissektrisa: ['C', 'A', 'B'] },
        M: { seredina: ['A', 'B'] },
      },
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        otr('C', 'H'),
        pryam('C', 'H', 'B'),
        otr('C', 'D', ISK),
        otr('C', 'M'),
      ],
    }),
  'vysoty-ravnobedrennogo': () =>
    r({
      tochki: {
        ...ravnobedrennyy(50),
        H: { seredina: ['A', 'B'] },
        K: { osnovanie: ['A', 'B', 'C'] },
      },
      elementy: [
        oblast(['A', 'B', 'K'], ISK),
        tri('A', 'B', 'C'),
        shtrih('A', 'C', 1),
        shtrih('B', 'C', 1),
        otr('C', 'H'),
        pryam('C', 'H', 'B'),
        otr('A', 'K'),
        pryam('A', 'K', 'B'),
        ug('C', 'A', 'B', { dugi: 2 }),
        ug('A', 'B', 'C', { dugi: 2 }),
      ],
    }),
  'bissektrisa-parallelogramma': () => {
    const p = parallelogramm(60, 10, 6);
    const K = intersect(p.A, polar(30, 1), p.B, p.C) as T2;
    return r({
      tochki: { ...p, K },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'K', ISK),
        ug('B', 'A', 'K'),
        ug('K', 'A', 'D'),
        ug('A', 'K', 'B'),
        shtrih('A', 'B', 2),
        shtrih('B', 'K', 2),
      ],
    });
  },
  'ploshchadi-chastey': () => [
    r({
      tochki: { ...poUglam(56, 60), M: { seredina: ['A', 'C'] } },
      elementy: [
        oblast(['A', 'B', 'M'], ISK),
        tri('A', 'B', 'C'),
        otr('B', 'M'),
        shtrih('A', 'M', 1),
        shtrih('M', 'C', 1),
      ],
    }),
    r({
      tochki: {
        ...poUglam(56, 60),
        D: { seredina: ['A', 'C'] },
        E: { seredina: ['B', 'C'] },
        F: { seredina: ['A', 'B'] },
      },
      elementy: [oblast(['D', 'E', 'F'], ISK), tri('A', 'B', 'C'), tri('D', 'E', 'F')],
      podpisi: false,
    }),
  ],
};

/* ── Чертежи своих примеров (с числами) ───────────────────────── */

/** Серединный перпендикуляр к AC пересекает BC: K с KA = KC. */
function tochkaK(A: T2, B: T2, C: T2): T2 {
  const M = mid(A, C);
  const n: T2 = [-(C[1] - A[1]), C[0] - A[0]];
  const K = intersect(M, add(M, n), B, C);
  if (K === null) throw new Error('серединный перпендикуляр не пересекает BC');
  return K;
}

const PRIMERY: Record<string, () => RisunokSpravochnika> = {
  'vidy-uglov:0': () =>
    r({
      tochki: { A: [-5, 0], O: [0, 0], B: [5, 0], C: polar(36, 5) },
      elementy: [
        otr('A', 'B'),
        otr('O', 'C'),
        ug('C', 'O', 'B', { znachenie: 'α', ...ISK }),
        ug('A', 'O', 'C', { znachenie: '4α', dugi: 2 }),
      ],
      podpisi: false,
    }),
  'vertikalnye:0': () =>
    r({
      tochki: { O: [0, 0], A: polar(161, 5), B: polar(-19, 5), C: polar(19, 5), D: polar(199, 5) },
      elementy: [
        otr('A', 'B'),
        otr('C', 'D'),
        ug('B', 'O', 'C', { znachenie: '38°' }),
        ug('D', 'O', 'A', { znachenie: '38°' }),
        ug('C', 'O', 'A', { znachenie: '142°', dugi: 2, ...ISK }),
      ],
      podpisi: false,
    }),
  'svoystvo-ili-priznak:0': () =>
    r({
      tochki: parallelnye(68),
      elementy: [...PARALLELNYE_LINII, ...uglyParallelnyh({ 4: '68°', 5: '112°' }, [4, 5])],
      podpisi: false,
    }),
  'svoystvo-ili-priznak:1': () =>
    r({
      tochki: parallelnye(133),
      elementy: [...PARALLELNYE_LINII, ...uglyParallelnyh({ 1: '47°', 6: '?' }, [6])],
      podpisi: false,
    }),
  'vneshniy-ugol:0': () =>
    r({
      tochki: { ...poUglam(47, 62), D: { naPryamoy: ['A', 'B', 1.45] } },
      elementy: [
        tri('A', 'B', 'C'),
        otr('B', 'D'),
        ug('C', 'A', 'B', { znachenie: '47°' }),
        ug('B', 'C', 'A', { znachenie: '71°', dugi: 2 }),
        ug('C', 'B', 'D', { znachenie: '?', ...ISK }),
      ],
    }),
  'neravenstvo:0': () =>
    r({
      tochki: poStoronam(9, 4, 11),
      elementy: [tri('A', 'B', 'C'), bk('B', 'C', '9'), bk('A', 'C', '4'), bk('A', 'B', 'c', ISK)],
      podpisi: false,
    }),
  'storony-i-ugly:0': () =>
    r({
      tochki: poStoronam(7, 9, 5),
      elementy: [
        tri('A', 'B', 'C'),
        bk('A', 'B', '5'),
        bk('B', 'C', '7'),
        bk('A', 'C', '9'),
        ug('A', 'B', 'C', ISK),
      ],
    }),
  'mediana:0': () =>
    r({
      tochki: {
        ...poUglam(58, 46),
        M: { seredina: ['A', 'C'] },
        N: { seredina: ['B', 'C'] },
        K: { seredina: ['A', 'B'] },
        O: {
          peresechenie: [
            ['B', 'M'],
            ['A', 'N'],
          ],
        },
      },
      elementy: [
        tri('A', 'B', 'C'),
        otr('B', 'M'),
        otr('A', 'N'),
        otr('C', 'K'),
        otr('B', 'O', ISK),
        bk('B', 'M', '15'),
        tochka('O'),
      ],
      bezPodpisi: ['N', 'K'],
    }),
  'seredinnyy-perpendikulyar:0': () => {
    const B: T2 = [0, 0];
    const C: T2 = [10, 0];
    const A = polar(70, 6);
    const K = tochkaK(A, B, C);
    const M = mid(A, C);
    return r({
      tochki: { A, B, C, K, M },
      elementy: [
        tri('A', 'B', 'C'),
        otr('M', 'K'),
        pryam('C', 'M', 'K'),
        shtrih('A', 'M', 1),
        shtrih('M', 'C', 1),
        otr('A', 'K', { shtrihi: 2 }),
        shtrih('K', 'C', 2),
        oblast(['A', 'B', 'K'], ISK),
        bk('A', 'B', '6'),
        bk('B', 'C', '10', { a: 'B', b: 'C' }),
      ],
      bezPodpisi: ['M'],
    });
  },
  'pryamougolnyy:0': () =>
    r({
      tochki: pryamougolnyy(57, 'katety'),
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        ug('A', 'B', 'C', { znachenie: 'x' }),
        ug('C', 'A', 'B', { znachenie: 'x + 24°', dugi: 2, ...ISK }),
      ],
      podpisi: false,
    }),
  'ravenstvo:0': () =>
    r({
      tochki: { A: [-4, 1.8], B: [4, -1.8], C: [-3, -2.6], D: [3, 2.6], O: [0, 0] },
      elementy: [
        otr('A', 'B'),
        otr('C', 'D'),
        otr('A', 'C'),
        otr('B', 'D', ISK),
        shtrih('A', 'O', 1),
        shtrih('O', 'B', 1),
        shtrih('C', 'O', 2),
        shtrih('O', 'D', 2),
        ug('A', 'O', 'C'),
        ug('B', 'O', 'D'),
        bk('A', 'C', '7'),
      ],
    }),
  'znacheniya:0': () =>
    r({
      tochki: pryamougolnyy(60, 'katety'),
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        ug('C', 'A', 'B', { znachenie: '30°' }),
        bk('A', 'B', '8√3'),
        otr('A', 'C', ISK),
      ],
    }),
  'ploshchad-pryamougolnika:0': () =>
    r({
      tochki: { A: [0, 0], B: [0, 5], C: [5, 5], D: [5, 0] },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        oblast(['A', 'B', 'C', 'D'], ISK),
        otr('A', 'C'),
        bk('A', 'C', '6'),
      ],
      podpisi: false,
    }),
  'ploshchad-romba:0': () =>
    r({
      tochki: {
        A: [-6, 0],
        B: [0, 2.5],
        C: [6, 0],
        D: [0, -2.5],
        O: [0, 0],
      },
      elementy: [
        oblast(['A', 'B', 'C', 'D'], ISK),
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'C'),
        otr('B', 'D'),
        pryam('C', 'O', 'B'),
        bk('A', 'C', '24', { a: 'A', b: 'O' }),
        bk('B', 'D', '10', { a: 'O', b: 'D' }),
      ],
      podpisi: false,
    }),
  'ploshchad-trapecii:0': () =>
    r({
      tochki: { ...trapeciya(10, 4, 6, 2.5), H: { osnovanie: ['B', 'A', 'D'] } },
      elementy: [
        oblast(['A', 'B', 'C', 'D'], ISK),
        mn(['A', 'B', 'C', 'D']),
        otr('B', 'H'),
        pryam('B', 'H', 'D'),
        bk('A', 'D', '10', { a: 'H', b: 'D' }),
        bk('B', 'C', '4'),
        bk('B', 'H', '6'),
      ],
      podpisi: false,
    }),
  'teorema-kosinusov:1': () =>
    r({
      tochki: poStoronam(7, 5, 3),
      elementy: [
        tri('A', 'B', 'C'),
        bk('A', 'B', '3'),
        bk('A', 'C', '5'),
        bk('B', 'C', '7'),
        ug('C', 'A', 'B', { znachenie: 'α', ...ISK }),
      ],
      podpisi: false,
    }),
  'teorema-sinusov:1': () =>
    r({
      tochki: poUglam(30, 45),
      elementy: [
        tri('A', 'B', 'C'),
        ug('C', 'A', 'B', { znachenie: '30°' }),
        ug('A', 'B', 'C', { znachenie: '45°', dugi: 2 }),
        bk('B', 'C', '10'),
        otr('A', 'C', ISK),
      ],
    }),
  'trig-tupogo-ugla:0': () =>
    r({
      tochki: { C: [0, 0], A: [3, 0], B: [0, 4], E: [5.2, 0] },
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        otr('A', 'E'),
        ug('B', 'A', 'C', { znachenie: 'A' }),
        ug('E', 'A', 'B', { dugi: 2, ...ISK }),
      ],
      bezPodpisi: ['E'],
    }),
  'kvadrat:0': () => {
    const s = 3 * Math.SQRT2;
    return r({
      tochki: { O: [0, 0], A: [-s, -s], B: [-s, s], C: [s, s], D: [s, -s] },
      okruzhnosti: { w: { centr: 'O', cherez: 'A' } },
      elementy: [
        okr('w'),
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'C'),
        otr('O', 'D', ISK),
        bk('A', 'D', '6√2'),
        bk('O', 'D', 'R'),
      ],
      podpisi: false,
    });
  },
  'dlina-okruzhnosti:0': () =>
    r({
      tochki: {
        O: [0, 0],
        A: { naDuge: { okr: 'w', gradus: 0 } },
        B: { naDuge: { okr: 'w', gradus: 120 } },
      },
      okruzhnosti: { w: { centr: 'O', radius: 6 } },
      elementy: [
        okr('w'),
        otr('O', 'A'),
        otr('O', 'B'),
        duga('w', 'A', 'B', ISK),
        ug('A', 'O', 'B', { znachenie: '120°' }),
        bk('O', 'A', '6'),
      ],
      podpisi: false,
    }),
  'otrezki-hord-i-sekushchih:0': () =>
    r({
      tochki: { O: [-2.5, 0], A: [4, 0], B: [-9, 0], C: [0, -6], D: [0, 6], M: [0, 0] },
      okruzhnosti: { w: { centr: 'O', radius: 6.5 } },
      elementy: [
        okr('w'),
        otr('A', 'B'),
        otr('C', 'D'),
        bk('A', 'M', '4'),
        bk('M', 'B', '9'),
        bk('C', 'M', '6'),
        otr('M', 'D', ISK),
      ],
      bezPodpisi: ['O'],
    }),
  'bissektrisa-parallelogramma:0': () => {
    const p = parallelogramm(60, 14, 9);
    const K = intersect(p.A, polar(30, 1), p.B, p.C) as T2;
    return r({
      tochki: { ...p, K },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'K'),
        ug('B', 'A', 'K'),
        ug('K', 'A', 'D'),
        bk('B', 'K', '9'),
        bk('K', 'C', '5'),
        shtrih('A', 'B', 2),
      ],
    });
  },
  'ploshchadi-chastey:0': () =>
    r({
      tochki: {
        ...poUglam(56, 60),
        M: { seredina: ['A', 'C'] },
        N: { seredina: ['B', 'C'] },
        K: { seredina: ['A', 'B'] },
        O: {
          peresechenie: [
            ['B', 'M'],
            ['A', 'N'],
          ],
        },
      },
      elementy: [
        oblast(['A', 'O', 'B'], ISK),
        tri('A', 'B', 'C'),
        otr('B', 'M'),
        otr('A', 'N'),
        otr('C', 'K'),
      ],
      bezPodpisi: ['M', 'N', 'K'],
    }),
};

/** Чертёж карточки по якорю. */
export function chertezhTemy(id: string): ChertezhSpravochnika {
  const f = TEORIYA[id];
  if (f === undefined) throw new Error(`нет чертежа карточки «${id}»`);
  return f();
}

export const KARTOCHKI_S_CHERTEZHOM: readonly string[] = Object.keys(TEORIYA);
export const SVOI_PRIMERY_S_CHERTEZHOM: readonly string[] = Object.keys(PRIMERY);

/** Чертёж примера: из банка и аналога — сцена прототипа с числами условия; свой — по ключу. */
export function chertezhPrimera(temaId: string, nomer: number, p: Primer): RisunokSpravochnika {
  const ist = p.istochnik;
  if ('svoy' in ist) {
    const f = PRIMERY[`${temaId}:${nomer}`];
    if (f === undefined) throw new Error(`нет чертежа своего примера «${temaId}:${nomer}»`);
    return f();
  }
  let proto: number;
  let nabor: object;
  if ('fipi' in ist) {
    const z = BANK_FIPI.find((x) => x.n === ist.fipi);
    if (z === undefined) throw new Error(`нет задачи ${ist.fipi}`);
    proto = z.proto;
    nabor = z.params;
  } else {
    const a = analogi(ist.analog.proto).find((x) => x.no === ist.analog.no);
    if (a === undefined)
      throw new Error(`нет аналога ${ist.analog.no} прототипа ${ist.analog.proto}`);
    proto = ist.analog.proto;
    nabor = a.params;
  }
  const pr = prototip(proto);
  return {
    scena: pr.stsena({ ...pr.primer, ...nabor } as Params, POROG),
    optsii: { rezhim: { rezhim: 'uchenik' }, chisla: true },
  };
}
