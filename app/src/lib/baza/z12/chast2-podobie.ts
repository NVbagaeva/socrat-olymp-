/**
 * База, задание №12, часть 2: подобные треугольники и средняя линия
 * (задачи 215–242 задачника, прототипы P55–P60).
 */

import { parallelogramm } from '@/lib/planimetriya/figury';
import { mn, otr, pryam, shtrih, tri } from '@/lib/planimetriya/stseny/dsl';
import type { Prototip } from '../types';
import { DANNYE_12_2 as D } from './chast2-dannye';
import {
  type T,
  iskomyy,
  iz,
  koren,
  kv,
  minus,
  plus,
  prototip,
  prov,
  q,
  rasst,
  storona,
  tq,
  umn,
  vopros,
  zq,
} from './chast2-obshchee';

const dannye = (id: string): readonly (readonly number[])[] => {
  const d = D[id];
  if (d === undefined) throw new Error(`нет данных ${id}`);
  return d;
};

const ser = (a: T, b: T): T => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/* ── P55. Параллелограмм: середина стороны и диагональ (215–218) ── */

/** Параллелограмм рисунка: форма любая — в условии дана только BD. */
const PAR = parallelogramm(62, 10, 6.5);

const P55 = prototip({
  id: 'P55',
  gruppa: '2F',
  title: 'Параллелограмм: $AM$ делит диагональ $BD$',
  dannye: dannye('P55'),
  polya: ['d'],
  text: (c) =>
    `В параллелограмме $ABCD$ отмечена точка $M$ — середина стороны $BC$. Отрезки $BD$ и $AM$ пересекаются в точке $K$. Найдите длину отрезка $BK$, если $BD = ${c.d}$.`,
  solve(c, sd) {
    const bk = q(c.d!, 3);
    return {
      otvet: zq(bk),
      etapy: [
        {
          title: 'Подобные треугольники',
          lines: [
            '$BC \\parallel AD$, поэтому $\\angle KBM = \\angle KDA$ и $\\angle KMB = \\angle KAD$ (накрест лежащие).',
            'Значит, $\\triangle BKM \\sim \\triangle DKA$ по двум углам.',
          ],
        },
        {
          title: 'Коэффициент подобия',
          lines: [
            '$BM = \\dfrac{BC}{2} = \\dfrac{AD}{2}$, поэтому $BM : AD = 1 : 2$ и $BK : KD = 1 : 2$.',
          ],
        },
        {
          title: 'Отрезок BK',
          lines: [
            `$BD$ состоит из трёх равных частей, $BK$ — одна из них: $BK = \\dfrac{${c.d}}{3} = ${tq(bk)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Каков коэффициент подобия треугольников $BKM$ и $DKA$?',
          '$\\dfrac{1}{2}$',
          ['$\\dfrac{1}{3}$', '$1$'],
          sd,
          '$BM$ — половина $BC$, а $BC = AD$.',
        ),
        vopros(
          'Какую часть диагонали $BD$ составляет $BK$?',
          '$\\dfrac{1}{3}$',
          ['$\\dfrac{1}{2}$', '$\\dfrac{2}{3}$'],
          sd + 1,
          '$BK : KD = 1 : 2$ — всего три части.',
        ),
      ],
    };
  },
  proverka(c) {
    /* Пересечение прямых AM и BD на координатах; BK — доля BD. */
    const { A, B, C, D: Dt } = PAR;
    const M = ser(B, C);
    const [x1, y1] = A;
    const [x2, y2] = M;
    const [x3, y3] = B;
    const [x4, y4] = Dt;
    const zn = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    const px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / zn;
    const py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / zn;
    return prov((rasst(B, [px, py]) / rasst(B, Dt)) * c.d!);
  },
  scena(c) {
    const bk = zq(q(c.d!, 3));
    return {
      tochki: {
        ...PAR,
        M: { seredina: ['B', 'C'] },
        K: {
          peresechenie: [
            ['A', 'M'],
            ['B', 'D'],
          ],
        },
      },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'M'),
        otr('B', 'D', { vydelit: 'dano', znachenie: String(c.d) }),
        iskomyy('B', 'K', bk),
        shtrih('B', 'M', 1),
        shtrih('M', 'C', 1),
      ],
      proverki: [{ naPryamoy: ['B', 'K', 'D'] }, { naPryamoy: ['A', 'K', 'M'] }],
      otvet: bk,
    };
  },
  bukvy: () => ['A', 'B', 'C', 'D', 'M', 'K'],
});

/* ── Прямоугольный треугольник: C — прямой угол, CA = a по оси x, CB = b ── */

const pt = (a: number, b: number) => ({ C: [0, 0] as T, A: [a, 0] as T, B: [0, b] as T });

/** Средние линии треугольника по координатам. */
function srednie(t: { A: T; B: T; C: T }): number[] {
  const { A, B, C } = t;
  return [rasst(ser(A, C), ser(B, C)), rasst(ser(A, B), ser(A, C)), rasst(ser(A, B), ser(B, C))];
}

const SREDNYAYA =
  'Средняя линия треугольника соединяет середины двух сторон, параллельна третьей стороне и равна её половине.';

/* ── P56. Наибольшая средняя линия (219–222) ───────────────────── */

const P56 = prototip({
  id: 'P56',
  gruppa: '2F',
  title: 'Прямоугольный треугольник: наибольшая средняя линия',
  dannye: dannye('P56'),
  polya: ['a', 'b'],
  text: (c) =>
    `Катеты прямоугольного треугольника равны $${c.a}$ и $${c.b}$. Найдите наибольшую среднюю линию треугольника.`,
  solve(c, sd) {
    const c2 = c.a! * c.a! + c.b! * c.b!;
    const g = koren(q(c2));
    const x = umn(g, q(1, 2));
    return {
      otvet: zq(x),
      etapy: [
        {
          title: 'Какая средняя линия больше',
          lines: [
            SREDNYAYA,
            'Наибольшая средняя линия — половина наибольшей стороны, а наибольшая сторона прямоугольного треугольника — гипотенуза.',
          ],
        },
        {
          title: 'Гипотенуза',
          lines: [`$c^2 = ${c.a}^2 + ${c.b}^2 = ${c2}$, $\\;c = ${tq(g)}$.`],
        },
        { title: 'Средняя линия', lines: [`$\\dfrac{c}{2} = \\dfrac{${tq(g)}}{2} = ${tq(x)}$.`] },
      ],
      hints: [
        vopros(
          'Какой стороне параллельна наибольшая средняя линия?',
          'гипотенузе',
          ['большему катету', 'меньшему катету'],
          sd,
          'Средняя линия — половина параллельной стороны.',
        ),
        vopros('Чему равна гипотенуза?', `$${tq(g)}$`, [`$${c.a! + c.b!}$`, `$${tq(x)}$`], sd + 1),
      ],
    };
  },
  proverka: (c) => prov(Math.max(...srednie(pt(c.a!, c.b!)))),
  scena(c) {
    const x = zq(umn(koren(q(c.a! * c.a! + c.b! * c.b!)), q(1, 2)));
    return {
      tochki: { ...pt(c.a!, c.b!), P: { seredina: ['C', 'A'] }, Q: { seredina: ['C', 'B'] } },
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        storona('C', 'A', String(c.a)),
        storona('C', 'B', String(c.b)),
        iskomyy('P', 'Q', x),
        shtrih('C', 'P', 1),
        shtrih('P', 'A', 1),
        shtrih('C', 'Q', 2),
        shtrih('Q', 'B', 2),
      ],
      podpisi: false,
      otvet: x,
    };
  },
  bukvy: () => [],
});

/* ── P57. Катет и средняя линия → гипотенуза (223–226, 231–234) ── */

const P57 = prototip({
  id: 'P57',
  gruppa: '2F',
  title: 'Катет и средняя линия → гипотенуза',
  dannye: dannye('P57'),
  polya: ['v', 'a', 'm2'],
  text: (c) => {
    const m = tq(iz(c.m2!, true));
    return c.v === 0
      ? `Катет прямоугольного треугольника равен $${c.a}$, одна из средних линий равна $${m}$. Найдите гипотенузу этого треугольника.`
      : `Катет прямоугольного треугольника равен $${c.a}$, отрезок, соединяющий середину гипотенузы и середину этого катета, равен $${m}$. Найдите длину гипотенузы этого треугольника.`;
  },
  solve(c, sd) {
    const m = iz(c.m2!, true);
    const b = q(c.m2!);
    const c2 = plus(q(c.a! * c.a!), kv(b));
    const g = koren(c2);
    const pol = q(c.a!, 2);
    return {
      otvet: zq(g),
      etapy: [
        {
          title: 'Какая это средняя линия',
          lines:
            c.v === 0
              ? [
                  SREDNYAYA,
                  `Средняя линия, параллельная данному катету, равна $${tq(pol)}$, а параллельная гипотенузе — ещё больше. Значит, $${tq(m)}$ — половина второго катета.`,
                ]
              : [
                  `Отрезок соединяет середины гипотенузы и данного катета — это средняя линия, она параллельна второму катету и равна его половине.`,
                ],
        },
        {
          title: 'Второй катет',
          lines: [`$b = 2 \\cdot ${tq(m)} = ${tq(b)}$.`],
        },
        {
          title: 'Теорема Пифагора',
          lines: [`$c^2 = ${c.a}^2 + ${tq(b)}^2 = ${tq(c2)}$, $\\;c = ${tq(g)}$.`],
        },
      ],
      hints: [
        vopros(
          'Чему равен второй катет?',
          `$${tq(b)}$`,
          [`$${tq(m)}$`, `$${tq(minus(q(c.a!), m))}$`],
          sd,
          'Средняя линия — половина параллельной ей стороны: второго катета.',
        ),
        vopros(
          'Как найти гипотенузу?',
          `$c^2 = ${c.a}^2 + ${tq(b)}^2$`,
          [`$c^2 = ${c.a}^2 + ${tq(m)}^2$`, `$c = ${c.a} + ${tq(b)}$`],
          sd + 1,
        ),
      ],
    };
  },
  proverka(c) {
    /* Строим треугольник так, чтобы средняя линия, параллельная катету CB, была m. */
    const t = pt(c.a!, c.m2!);
    if (Math.abs(rasst(ser(t.A, t.C), ser(t.A, t.B)) - c.m2! / 2) > 1e-9) throw new Error('P57');
    return prov(rasst(t.A, t.B));
  },
  scena(c) {
    const g = zq(koren(plus(q(c.a! * c.a!), kv(q(c.m2!)))));
    return {
      tochki: { ...pt(c.a!, c.m2!), P: { seredina: ['C', 'A'] }, Q: { seredina: ['A', 'B'] } },
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        storona('C', 'A', String(c.a)),
        otr('P', 'Q', { vydelit: 'dano', znachenie: zq(iz(c.m2!, true)) }),
        iskomyy('A', 'B', g),
        shtrih('C', 'P', 1),
        shtrih('P', 'A', 1),
        shtrih('A', 'Q', 2),
        shtrih('Q', 'B', 2),
      ],
      podpisi: false,
      otvet: g,
    };
  },
  bukvy: () => [],
});

/* ── P58. Наименьшая средняя линия (227–230) ───────────────────── */

const P58 = prototip({
  id: 'P58',
  gruppa: '2F',
  title: 'Прямоугольный треугольник: наименьшая средняя линия',
  dannye: dannye('P58'),
  polya: ['a', 'c'],
  text: (c) =>
    `В прямоугольном треугольнике наибольший из катетов равен $${c.a}$. Гипотенуза равна $${c.c}$. Найдите наименьшую среднюю линию этого треугольника.`,
  solve(c, sd) {
    const b2 = c.c! * c.c! - c.a! * c.a!;
    const b = koren(q(b2));
    const x = umn(b, q(1, 2));
    return {
      otvet: zq(x),
      etapy: [
        {
          title: 'Какая средняя линия меньше',
          lines: [
            SREDNYAYA,
            'Наименьшая средняя линия — половина наименьшей стороны, то есть меньшего катета.',
          ],
        },
        {
          title: 'Меньший катет',
          lines: [`$b^2 = ${c.c}^2 - ${c.a}^2 = ${b2}$, $\\;b = ${tq(b)}$.`],
        },
        { title: 'Средняя линия', lines: [`$\\dfrac{b}{2} = \\dfrac{${tq(b)}}{2} = ${tq(x)}$.`] },
      ],
      hints: [
        vopros(
          'Какой стороне параллельна наименьшая средняя линия?',
          'меньшему катету',
          ['большему катету', 'гипотенузе'],
          sd,
        ),
        vopros(
          'Чему равен меньший катет?',
          `$${tq(b)}$`,
          [`$${c.c! - c.a!}$`, `$${tq(x)}$`],
          sd + 1,
          'Теорема Пифагора: из квадрата гипотенузы вычитаем квадрат большего катета.',
        ),
      ],
    };
  },
  proverka: (c) => prov(Math.min(...srednie(pt(c.a!, Math.sqrt(c.c! * c.c! - c.a! * c.a!))))),
  scena(c) {
    const b = koren(q(c.c! * c.c! - c.a! * c.a!));
    const x = zq(umn(b, q(1, 2)));
    return {
      tochki: {
        ...pt(c.a!, b[0] / b[1]),
        P: { seredina: ['C', 'A'] },
        Q: { seredina: ['A', 'B'] },
      },
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        storona('C', 'A', String(c.a)),
        storona('A', 'B', String(c.c)),
        iskomyy('P', 'Q', x),
        shtrih('C', 'P', 1),
        shtrih('P', 'A', 1),
        shtrih('A', 'Q', 2),
        shtrih('Q', 'B', 2),
      ],
      podpisi: false,
      otvet: x,
    };
  },
  bukvy: () => [],
});

/* ── Равнобедренный ABC с медианой BK и средней линией MN ──────── */

/**
 * Точки рисунка. Плоский треугольник (высота меньше половины KC)
 * рисуется выше — иначе MN ложится на основание; рисунок тогда
 * схематичный.
 */
function rbMN(kc: number, h: number) {
  const hV = Math.max(h, kc / 2);
  return {
    tochki: {
      A: [-kc, 0] as T,
      C: [kc, 0] as T,
      B: [0, hV] as T,
      K: [0, 0] as T,
      M: { seredina: ['A', 'B'] as const },
      N: { seredina: ['B', 'C'] as const },
    },
    ...(hV === h ? {} : { skhematichno: true }),
  };
}

const rbMNelementy = () => [
  tri('A', 'B', 'C'),
  shtrih('A', 'M', 1),
  shtrih('M', 'B', 1),
  shtrih('B', 'N', 1),
  shtrih('N', 'C', 1),
  shtrih('A', 'K', 2),
  shtrih('K', 'C', 2),
];

/* ── P59. Медиана и боковая сторона → MN (235–238) ─────────────── */

const P59 = prototip({
  id: 'P59',
  gruppa: '2F',
  title: 'Равнобедренный треугольник: медиана и боковая сторона → $MN$',
  dannye: dannye('P59'),
  polya: ['h', 'l'],
  text: (c) =>
    `В равнобедренном треугольнике $ABC$ медиана $BK = ${c.h}$, боковая сторона $BC = ${c.l}$. Найдите длину отрезка $MN$, если известно, что он соединяет середины боковых сторон.`,
  solve(c, sd) {
    const kc2 = c.l! * c.l! - c.h! * c.h!;
    const kc = koren(q(kc2));
    const ac = umn(kc, q(2));
    return {
      otvet: zq(kc),
      etapy: [
        {
          title: 'Медиана — высота',
          lines: [
            'Медиана $BK$, проведённая к основанию $AC$ равнобедренного треугольника, является высотой: $BK \\perp AC$.',
            `$KC^2 = BC^2 - BK^2 = ${c.l}^2 - ${c.h}^2 = ${kc2}$, $\\;KC = ${tq(kc)}$.`,
          ],
        },
        {
          title: 'Средняя линия',
          lines: [
            `$AC = 2 \\cdot KC = ${tq(ac)}$. $MN$ — средняя линия, она равна половине $AC$:`,
            `$MN = \\dfrac{${tq(ac)}}{2} = ${tq(kc)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен $KC$?',
          `$${tq(kc)}$`,
          [`$${c.l! - c.h!}$`, `$${kc2}$`],
          sd,
          '$BKC$ — прямоугольный треугольник с гипотенузой $BC$.',
        ),
        vopros(
          'Чему равна средняя линия $MN$?',
          '$\\dfrac{AC}{2}$',
          ['$AC$', '$\\dfrac{BC}{2}$'],
          sd + 1,
          '$MN$ параллельна основанию $AC$.',
        ),
      ],
    };
  },
  proverka(c) {
    const kc = Math.sqrt(c.l! * c.l! - c.h! * c.h!);
    const A: T = [-kc, 0];
    const B: T = [0, c.h!];
    const C: T = [kc, 0];
    return prov(rasst(ser(A, B), ser(B, C)));
  },
  scena(c) {
    const kc = koren(q(c.l! * c.l! - c.h! * c.h!));
    return {
      ...rbMN(kc[0] / kc[1], c.h!),
      elementy: [
        ...rbMNelementy(),
        otr('B', 'K', { vydelit: 'dano', znachenie: String(c.h) }),
        storona('B', 'C', String(c.l)),
        iskomyy('M', 'N', zq(kc)),
      ],
      proverki: [
        {
          ravny: [
            ['A', 'B'],
            ['B', 'C'],
          ],
        },
      ],
      otvet: zq(kc),
    };
  },
  bukvy: () => ['A', 'B', 'C', 'K', 'M', 'N'],
});

/* ── P60. Медиана и MN → боковая сторона (239–242) ─────────────── */

const P60 = prototip({
  id: 'P60',
  gruppa: '2F',
  title: 'Равнобедренный треугольник: медиана и $MN$ → боковая сторона',
  dannye: dannye('P60'),
  polya: ['h', 'm'],
  text: (c) =>
    `В равнобедренном треугольнике $ABC$ с основанием $AC$ медиана $BK = ${c.h}$, отрезок $MN$, соединяющий середины боковых сторон, равен $${c.m}$. Найдите боковую сторону $AB$.`,
  solve(c, sd) {
    const ab2 = c.h! * c.h! + c.m! * c.m!;
    const ab = koren(q(ab2));
    return {
      otvet: zq(ab),
      etapy: [
        {
          title: 'Половина основания',
          lines: [
            `$MN$ — средняя линия, поэтому $AC = 2 \\cdot MN = ${2 * c.m!}$ и $AK = ${2 * c.m!} : 2 = ${c.m}$.`,
          ],
        },
        {
          title: 'Теорема Пифагора',
          lines: [
            'Медиана $BK$ к основанию равнобедренного треугольника — высота, треугольник $ABK$ прямоугольный.',
            `$AB^2 = BK^2 + AK^2 = ${c.h}^2 + ${c.m}^2 = ${ab2}$, $\\;AB = ${tq(ab)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен $AK$?',
          `$${c.m}$`,
          [`$${2 * c.m!}$`, `$${tq(q(c.m!, 2))}$`],
          sd,
          '$AC = 2 \\cdot MN$, а $K$ — середина $AC$.',
        ),
        vopros(
          'Как найти $AB$?',
          '$AB^2 = BK^2 + AK^2$',
          ['$AB^2 = BK^2 - AK^2$', '$AB = BK + AK$'],
          sd + 1,
          'Угол $K$ прямой: медиана к основанию — высота.',
        ),
      ],
    };
  },
  proverka(c) {
    /* Строим по MN: середины боковых сторон на высоте h/2, MN = m. */
    const M: T = [-c.m! / 2, c.h! / 2];
    const B: T = [0, c.h!];
    const A: T = [2 * M[0] - B[0], 2 * M[1] - B[1]];
    return prov(rasst(A, B));
  },
  scena(c) {
    const ab = zq(koren(q(c.h! * c.h! + c.m! * c.m!)));
    return {
      ...rbMN(c.m!, c.h!),
      elementy: [
        ...rbMNelementy(),
        otr('B', 'K', { vydelit: 'dano', znachenie: String(c.h) }),
        otr('M', 'N', { vydelit: 'dano', znachenie: String(c.m) }),
        iskomyy('A', 'B', ab),
      ],
      proverki: [
        {
          ravny: [
            ['A', 'B'],
            ['B', 'C'],
          ],
        },
      ],
      otvet: ab,
    };
  },
  bukvy: () => ['A', 'B', 'C', 'K', 'M', 'N'],
});

export const PODOBIE_12_2: Prototip[] = [P55, P56, P57, P58, P59, P60];
