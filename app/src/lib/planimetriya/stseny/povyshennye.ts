/**
 * Прототипы раздела «Варианты повышенной сложности»: той же формы, что
 * прототипы Блока 1, но с «подвохом» задачи варианта (данные с корнем
 * и т. п.). В общий реестр PROTOTIPY они не входят — в банк, тренажёр
 * и генератор №1 не попадают; `prototip(id)` и `reshenie(id)` находят
 * их по номеру, поэтому чертёж, решение и разбор строит тот же движок.
 *
 * Номера — от 101.
 */

import { RAD } from '../geom';
import {
  opisannyyPoStoronam,
  parallelogramm,
  poUglam,
  ravnobedrennyy,
  trapeciya,
  uglyTreugolnika,
} from '../figury';
import type { Element } from '../types';
import {
  type PrototipChertezha,
  chislo,
  clamp,
  gr,
  grTex,
  koren,
  korenTex,
  mn,
  oblast,
  okr,
  otr,
  prod,
  scena,
  shtrih,
  tex,
  tri,
  ug,
  vysota,
} from './dsl';
import type { Params } from './dsl';

const VGRADUSAH = 'Ответ дайте в градусах.';

/** Значение у стороны без линии (сторона уже нарисована многоугольником). */
const storona = (a: string, b: string, zn: string, o: Partial<Element> = {}): Element =>
  ({
    tip: 'otrezok',
    a,
    b,
    tolkoShtrihi: true,
    vydelit: 'dano',
    znachenie: zn,
    ...o,
  }) as Element;

/** Равнобедренный AC = BC с углом A при основании: на рисунке не уже порога и не круче 78°. */
function ravnobedrennyyPoUglu(ugolA: number, porog: number) {
  const aV = clamp(ugolA, porog, 78);
  return {
    tochki: { ...ravnobedrennyy(180 - 2 * aV), H: { seredina: ['A', 'B'] as const } },
    sk: Math.abs(aV - ugolA) > 1e-9,
  };
}

/** Проверка «AC = BC» у сцен 105, 106. */
const AC_RAVNO_BC = {
  ravny: [
    ['A', 'C'],
    ['B', 'C'],
  ],
} as const;

/** Углы равнобедренного с основанием AC и биссектрисой AF (прототипы 107, 108). */
export function ugly107(b: number) {
  const pri = (180 - b) / 2;
  const fac = pri / 2;
  return { pri, fac, afc: 180 - fac - pri, afb: fac + pri };
}

/**
 * Равнобедренный ABC с основанием AC (B — вершина сверху) и
 * биссектрисой AF; искомый — угол AFC или AFB.
 */
function bissektrisaStsena(p: Params, porog: number, iskomyy: 'C' | 'B') {
  const u = ugly107(p.b);
  const ans = iskomyy === 'C' ? u.afc : u.afb;
  /* Половина угла при основании тоже не уже порога. */
  const bV = clamp(p.b, porog, 180 - 4 * porog);
  const t = ravnobedrennyy(bV);
  return scena(
    {
      tochki: { A: t.A, C: t.B, B: t.C, F: { bissektrisa: ['A', 'B', 'C'] } },
      elementy: [
        tri('A', 'C', 'B'),
        shtrih('A', 'B', 1),
        shtrih('C', 'B', 1),
        otr('A', 'F'),
        ug('A', 'B', 'C', { vydelit: 'dano', znachenie: gr(p.b) }),
        ug('B', 'C', 'A', { sloy: 1, dugi: 2, znachenie: gr(u.pri) }),
        ug('C', 'A', 'F', { sloy: 2, znachenie: gr(u.fac) }),
        ug('F', 'A', 'B', { sloy: 2 }),
        ug('A', 'F', iskomyy, {
          vydelit: 'iskomoe',
          dugi: 3,
          znachenie: gr(ans),
          otvet: true,
        }),
      ],
      proverki: [
        {
          ravny: [
            ['A', 'B'],
            ['C', 'B'],
          ],
        },
        { ugol: ['A', 'B', 'C'], gradusy: bV },
        { naPryamoy: ['B', 'F', 'C'] },
      ],
      otvet: gr(ans),
    },
    bV !== p.b,
  );
}

/** Случайный угол при вершине, кратный 4: все углы задачи целые. */
const ugolVershiny = (r: { int(a: number, b: number): number }) => 4 * r.int(5, 38);

const PROTOTIPY_PARTIYA_1_2: readonly PrototipChertezha[] = [
  {
    id: 101,
    blok: 'III',
    nazvanie:
      'Равнобедренный с углом $30^\\circ$ при вершине: боковая сторона $\\sqrt{n}$ → площадь',
    fipi: [],
    uslovie: (p) =>
      `В равнобедренном треугольнике угол между боковыми сторонами равен $30^\\circ$, а каждая боковая сторона равна $\\sqrt{${p.a}}$. Найдите площадь треугольника.`,
    otvet: (p) => p.a / 4,
    primer: { a: 10 },
    sluchaynye: (r) => ({ a: r.int(2, 60) }),
    stsena: (p) => ({
      tochki: { ...ravnobedrennyy(30), H: { osnovanie: ['A', 'B', 'C'] } },
      elementy: [
        tri('A', 'B', 'C'),
        shtrih('A', 'C', 1),
        shtrih('B', 'C', 1, { znachenie: `√${p.a}`, vydelit: 'dano' }),
        ug('A', 'C', 'B', { vydelit: 'dano', znachenie: '30°' }),
        oblast(['A', 'B', 'C'], { vydelit: 'iskomoe' }),
        ...vysota('A', 'B', 'C', 'H', null, {
          sloy: 1,
          znachenie: `√${p.a}/2`,
        }),
      ],
      proverki: [
        {
          ravny: [
            ['A', 'C'],
            ['B', 'C'],
          ],
        },
        { ugol: ['A', 'C', 'B'], gradusy: 30 },
      ],
      otvet: chislo(p.a / 4),
    }),
  },
  {
    id: 102,
    blok: 'III',
    nazvanie:
      'Равнобедренный с углом $150^\\circ$ при вершине: боковая сторона $\\sqrt{n}$ → площадь',
    fipi: [],
    uslovie: (p) =>
      `Угол при вершине равнобедренного треугольника, противолежащий основанию, равен $150^\\circ$, а боковая сторона равна $\\sqrt{${p.a}}$. Найдите площадь треугольника.`,
    otvet: (p) => p.a / 4,
    primer: { a: 10 },
    sluchaynye: (r) => ({ a: r.int(2, 60) }),
    stsena: (p) => ({
      tochki: ravnobedrennyy(150),
      elementy: [
        tri('A', 'B', 'C'),
        shtrih('A', 'C', 1),
        shtrih('B', 'C', 1, { znachenie: `√${p.a}`, vydelit: 'dano' }),
        ug('A', 'C', 'B', { vydelit: 'dano', znachenie: '150°' }),
        oblast(['A', 'B', 'C'], { vydelit: 'iskomoe' }),
      ],
      proverki: [
        {
          ravny: [
            ['A', 'C'],
            ['B', 'C'],
          ],
        },
        { ugol: ['A', 'C', 'B'], gradusy: 150 },
      ],
      otvet: chislo(p.a / 4),
    }),
  },
  {
    id: 103,
    blok: 'IV',
    nazvanie: 'Трапеция: основания → меньший отрезок средней линии',
    fipi: [],
    uslovie: (p) =>
      `Основания трапеции равны $${tex(p.a)}$ и $${tex(p.b)}$. Диагональ трапеции делит её среднюю линию на два отрезка. Найдите меньший из них.`,
    otvet: (p) => Math.min(p.a, p.b) / 2,
    primer: { a: 13, b: 19 },
    sluchaynye: (r) => {
      const a = r.int(1, 20);
      return { a, b: r.int(a + 1, a + 30) };
    },
    stsena: (p) => {
      const mal = Math.min(p.a, p.b);
      const bol = Math.max(p.a, p.b);
      const verh = clamp(mal / bol, 0.3, 0.8) * 10;
      return scena(
        {
          tochki: {
            ...trapeciya(10, verh, 5, (10 - verh) * 0.35),
            M: { seredina: ['A', 'B'] },
            N: { seredina: ['D', 'C'] },
            K: {
              peresechenie: [
                ['M', 'N'],
                ['A', 'C'],
              ],
            },
          },
          elementy: [
            mn(['A', 'B', 'C', 'D']),
            otr('M', 'K', { vydelit: 'iskomoe', znachenie: chislo(mal / 2), otvet: true }),
            otr('K', 'N'),
            otr('A', 'C'),
            storona('A', 'D', chislo(bol)),
            storona('B', 'C', chislo(mal)),
            shtrih('A', 'M', 1, { sloy: 1 }),
            shtrih('M', 'B', 1, { sloy: 1 }),
            shtrih('D', 'N', 2, { sloy: 1 }),
            shtrih('N', 'C', 2, { sloy: 1 }),
            oblast(['A', 'B', 'C'], { sloy: 2 }),
          ],
          podpisi: false,
          proverki: [
            {
              parallelny: [
                ['A', 'D'],
                ['B', 'C'],
              ],
            },
          ],
          otvet: chislo(mal / 2),
        },
        Math.abs(verh - (mal / bol) * 10) > 1e-9,
      );
    },
  },
  {
    id: 104,
    blok: 'X',
    nazvanie: 'Внешние углы при $A$ и $C$ → угол $B$',
    fipi: [],
    uslovie: (p) =>
      `В треугольнике $ABC$ внешний угол при вершине $A$ равен $${grTex(p.a)}$, а внешний угол при вершине $C$ равен $${grTex(p.c)}$. Найдите угол $ABC$. ${VGRADUSAH}`,
    otvet: (p) => p.a + p.c - 180,
    primer: { a: 138, c: 61 },
    sluchaynye: (r) => {
      const a = r.int(100, 170);
      return { a, c: r.int(Math.max(192 - a, 20), 168) };
    },
    stsena: (p, porog) => {
      const A = 180 - p.a;
      const C = 180 - p.c;
      const B = p.a + p.c - 180;
      const v = uglyTreugolnika([A, C, B], porog);
      const t = poUglam(v[0], v[1]);
      return scena(
        {
          tochki: {
            A: t.A,
            C: t.B,
            B: t.C,
            D: { naPryamoy: ['C', 'A', 1.35] },
            E: { naPryamoy: ['A', 'C', 1.35] },
          },
          elementy: [
            tri('A', 'C', 'B'),
            prod('C', 'A', { doTochki: 'D', sploshnoe: true }),
            prod('A', 'C', { doTochki: 'E', sploshnoe: true }),
            ug('B', 'A', 'D', { vydelit: 'dano', znachenie: gr(p.a) }),
            ug('B', 'C', 'E', { vydelit: 'dano', dugi: 2, znachenie: gr(p.c) }),
            ug('A', 'B', 'C', { vydelit: 'iskomoe', znachenie: gr(B), otvet: true }),
            ug('C', 'A', 'B', { sloy: 1, dugi: 3, znachenie: gr(A) }),
            ug('A', 'C', 'B', { sloy: 1, dugi: 3, znachenie: gr(C) }),
          ],
          otvet: gr(B),
        },
        v.some((x, i) => Math.abs(x - [A, C, B][i]!) > 1e-9),
      );
    },
  },
  {
    id: 105,
    blok: 'V',
    nazvanie: '$AC=BC$ и $\\cos A$ → основание $AB$',
    fipi: [],
    uslovie: (p) =>
      `В равнобедренном треугольнике $ABC$ боковые стороны $AC$ и $BC$ равны $${tex(p.l)}$, а косинус угла $A$ при основании равен $${tex(p.c)}$. Найдите основание $AB$.`,
    otvet: (p) => 2 * p.l * p.c,
    primer: { l: 20, c: 0.8 },
    sluchaynye: (r) => ({ l: r.int(2, 40), c: r.int(1, 99) / 100 }),
    stsena: (p, porog) => {
      const ah = p.l * p.c;
      const { tochki, sk } = ravnobedrennyyPoUglu(Math.acos(p.c) / RAD, porog);
      return scena(
        {
          tochki,
          elementy: [
            tri('A', 'B', 'C'),
            shtrih('A', 'C', 1, { znachenie: chislo(p.l), vydelit: 'dano' }),
            shtrih('B', 'C', 1),
            ug('C', 'A', 'B', { vydelit: 'dano' }),
            otr('A', 'B', { vydelit: 'iskomoe', znachenie: chislo(2 * ah), otvet: true }),
            ...vysota('C', 'A', 'B', 'H', null, { sloy: 1 }),
            storona('A', 'H', chislo(ah), { sloy: 2, vydelit: undefined }),
          ],
          proverki: [AC_RAVNO_BC],
          otvet: chislo(2 * ah),
        },
        sk,
      );
    },
  },
  {
    id: 106,
    blok: 'V',
    nazvanie: '$AC=BC$, $AB$ и $\\sin A$ → боковая сторона $AC$',
    fipi: [],
    uslovie: (p) =>
      `В треугольнике $ABC$ стороны $AC$ и $BC$ равны, основание $AB$ равно $${tex(p.c)}$, $\\sin A=${tex(p.s)}$. Найдите $AC$.`,
    otvet: (p) => p.c / (2 * Math.sqrt(1 - p.s * p.s)),
    primer: { c: 16, s: 0.6 },
    sluchaynye: (r) => ({ c: 2 * r.int(1, 30), s: r.pick([0.6, 0.8, 0.28, 0.96]) }),
    stsena: (p, porog) => {
      const ac = p.c / (2 * Math.sqrt(1 - p.s * p.s));
      const { tochki, sk } = ravnobedrennyyPoUglu(Math.asin(p.s) / RAD, porog);
      return scena(
        {
          tochki,
          elementy: [
            tri('A', 'B', 'C'),
            storona('A', 'B', chislo(p.c)),
            ug('C', 'A', 'B', { vydelit: 'dano' }),
            otr('A', 'C', {
              vydelit: 'iskomoe',
              shtrihi: 1,
              znachenie: chislo(ac),
              otvet: true,
            }),
            shtrih('B', 'C', 1),
            ...vysota('C', 'A', 'B', 'H', null, { sloy: 1 }),
            storona('A', 'H', chislo(p.c / 2), { sloy: 2, vydelit: undefined }),
          ],
          proverki: [AC_RAVNO_BC],
          otvet: chislo(ac),
        },
        sk,
      );
    },
  },
  {
    id: 107,
    blok: 'I',
    nazvanie: 'Равнобедренный с основанием $AC$, биссектриса $AF$: угол $B$ → угол $AFC$',
    fipi: [],
    uslovie: (p) =>
      `Треугольник $ABC$ — равнобедренный с основанием $AC$, отрезок $AF$ — его биссектриса. Угол $ABC$ равен $${grTex(p.b)}$. Найдите угол $AFC$. ${VGRADUSAH}`,
    otvet: (p) => ugly107(p.b).afc,
    primer: { b: 68 },
    sluchaynye: (r) => ({ b: ugolVershiny(r) }),
    stsena: (p, porog) => bissektrisaStsena(p, porog, 'C'),
  },
  {
    id: 108,
    blok: 'I',
    nazvanie: 'Равнобедренный с основанием $AC$, биссектриса $AF$: угол $B$ → угол $AFB$',
    fipi: [],
    uslovie: (p) =>
      `Треугольник $ABC$ — равнобедренный с основанием $AC$, отрезок $AF$ — его биссектриса. Угол $ABC$ равен $${grTex(p.b)}$. Найдите угол $AFB$. ${VGRADUSAH}`,
    otvet: (p) => ugly107(p.b).afb,
    primer: { b: 68 },
    sluchaynye: (r) => ({ b: ugolVershiny(r) }),
    stsena: (p, porog) => bissektrisaStsena(p, porog, 'B'),
  },
];

/** Параллелограмм с острым углом u при A, AB : AD = ab : ad; на рисунке отношение — в пределах 0,3…0,8. */
function parallelogrammPo(u: number | undefined, ab: number, ad: number) {
  const ratio = clamp(ab / ad, 0.3, 0.8);
  return { t: parallelogramm(u ?? 60, 10, 10 * ratio), ratio, sk: Math.abs(ratio - ab / ad) > 1e-9 };
}

/** Прототип 109: AB = AK = m частей, AD = m + n частей, периметр → AD. */
export function storony109(p: Params) {
  const x = p.per / (2 * (2 * p.m + p.n));
  return { ab: p.m * x, ad: (p.m + p.n) * x };
}

/** Партия 3 (варианты 13–18). */
const PROTOTIPY_PARTIYA_3: readonly PrototipChertezha[] = [
  {
    id: 109,
    blok: 'X',
    nazvanie:
      'Биссектриса тупого угла параллелограмма делит сторону в отношении $m:n$ от острого угла, периметр → большая сторона',
    fipi: [],
    uslovie: (p) =>
      `Биссектриса тупого угла параллелограмма делит противоположную сторону в отношении $${p.m}:${p.n}$, считая от вершины острого угла. Найдите большую сторону параллелограмма, если его периметр равен $${tex(p.per)}$.`,
    otvet: (p) => storony109(p).ad,
    primer: { m: 2, n: 5, per: 36 },
    sluchaynye: (r) => ({ m: r.int(1, 6), n: r.int(1, 6), per: 2 * r.int(5, 60) }),
    stsena: (p) => {
      const s = storony109(p);
      const { t, ratio, sk } = parallelogrammPo(p.u, p.m, p.m + p.n);
      return scena(
        {
          tochki: { ...t, K: { naPryamoy: ['A', 'D', ratio] } },
          elementy: [
            mn(['A', 'B', 'C', 'D']),
            otr('B', 'K'),
            ug('A', 'B', 'K'),
            ug('K', 'B', 'C'),
            otr('A', 'D', {
              tolkoShtrihi: true,
              vydelit: 'iskomoe',
              znachenie: chislo(s.ad),
              otvet: true,
            }),
            ug('B', 'K', 'A', { sloy: 1 }),
            shtrih('A', 'B', 1, { sloy: 2 }),
            shtrih('A', 'K', 1, { sloy: 2 }),
          ],
          proverki: [
            {
              parallelny: [
                ['A', 'D'],
                ['B', 'C'],
              ],
            },
          ],
          otvet: chislo(s.ad),
        },
        sk,
      );
    },
  },
  {
    id: 110,
    blok: 'X',
    nazvanie:
      'Биссектрисы двух углов параллелограмма при одной стороне пересекаются на противоположной стороне, периметр → сторона',
    fipi: [],
    uslovie: (p) =>
      `Точка пересечения биссектрис двух углов параллелограмма, прилежащих к одной стороне, принадлежит противоположной стороне. Найдите ${p.k ? 'большую' : 'меньшую'} сторону параллелограмма, если его периметр равен $${tex(p.per)}$.`,
    otvet: (p) => (p.k ? p.per / 3 : p.per / 6),
    primer: { per: 24, k: 0 },
    sluchaynye: (r) => ({ per: 6 * r.int(1, 30), k: r.int(0, 1) }),
    stsena: (p) => {
      const t = parallelogramm(p.u ?? 60, 10, 5);
      const ans = p.k ? p.per / 3 : p.per / 6;
      const isk = p.k ? (['A', 'D'] as const) : (['A', 'B'] as const);
      return {
        tochki: { ...t, K: { seredina: ['B', 'C'] } },
        elementy: [
          mn(['A', 'B', 'C', 'D']),
          otr('A', 'K'),
          otr('D', 'K'),
          ug('B', 'A', 'K'),
          ug('K', 'A', 'D'),
          ug('A', 'D', 'K', { dugi: 2 }),
          ug('K', 'D', 'C', { dugi: 2 }),
          otr(isk[0], isk[1], {
            tolkoShtrihi: true,
            vydelit: 'iskomoe',
            znachenie: chislo(ans),
            otvet: true,
          }),
          shtrih('A', 'B', 1, { sloy: 1 }),
          shtrih('B', 'K', 1, { sloy: 1 }),
          shtrih('K', 'C', 1, { sloy: 2 }),
          shtrih('C', 'D', 1, { sloy: 2 }),
        ],
        proverki: [
          {
            parallelny: [
              ['A', 'D'],
              ['B', 'C'],
            ],
          },
        ],
        otvet: chislo(ans),
      };
    },
  },
  {
    id: 111,
    blok: 'V',
    nazvanie: '$AB=BC$, $AC$ и высота $AH=k\\sqrt m$ → $\\cos\\angle CAB$',
    fipi: [],
    uslovie: (p) =>
      `В треугольнике $ABC$ высота $AH$ равна $${korenTex(p.h, p.m)}$, $AB=BC$, $AC=${tex(p.a)}$. Найдите косинус угла $CAB$.`,
    otvet: (p) => Math.sqrt(p.a * p.a - p.h * p.h * p.m) / p.a,
    primer: { a: 25, h: 7, m: 1 },
    sluchaynye: (r) =>
      r.pick([
        { a: 25, h: 7, m: 1 },
        { a: 10, h: 2, m: 9 },
        { a: 20, h: 4, m: 6 },
      ]),
    stsena: (p, porog) => {
      const cosA = Math.sqrt(p.a * p.a - p.h * p.h * p.m) / p.a;
      const a0 = Math.acos(cosA) / RAD;
      let aV = clamp(a0, porog, 78);
      if (Math.abs(aV - 45) < 7) aV = aV < 45 ? 38 : 52;
      const t = ravnobedrennyy(180 - 2 * aV);
      const vne = 180 - 2 * aV > 90 ? 'b' : null;
      return scena(
        {
          tochki: { A: t.A, C: t.B, B: t.C, H: { osnovanie: ['A', 'C', 'B'] } },
          elementy: [
            tri('A', 'B', 'C'),
            shtrih('A', 'B', 1),
            shtrih('B', 'C', 1),
            ...vysota('A', 'C', 'B', 'H', vne, {
              vydelit: 'dano',
              znachenie: koren(p.h, p.m),
            }),
            storona('A', 'C', chislo(p.a)),
            ug('C', 'A', 'B', { vydelit: 'iskomoe' }),
            ug('A', 'C', 'B', { sloy: 1 }),
            otr('C', 'H', { sloy: 2, tolkoShtrihi: true, znachenie: chislo(cosA * p.a) }),
          ],
          proverki: [
            {
              ravny: [
                ['A', 'B'],
                ['B', 'C'],
              ],
            },
          ],
        },
        Math.abs(aV - a0) > 1e-9,
      );
    },
  },
];

/** Основания трапеции по средней линии m, разделённой диагональю в отношении p : q (прототип 112). */
export function osnovaniya112(p: Params) {
  const chast1 = (p.m * p.p) / (p.p + p.q);
  const chast2 = (p.m * p.q) / (p.p + p.q);
  return { mal: 2 * Math.min(chast1, chast2), bol: 2 * Math.max(chast1, chast2), chast1, chast2 };
}

/** Партия 4 (варианты 19–24). */
const PROTOTIPY_PARTIYA_4: readonly PrototipChertezha[] = [
  {
    id: 112,
    blok: 'IV',
    nazvanie:
      'Трапеция: средняя линия и отношение, в котором её делит диагональ → большее или меньшее основание',
    fipi: [],
    uslovie: (p) =>
      `Средняя линия трапеции равна $${tex(p.m)}$, а одна из её диагоналей делит среднюю линию в отношении $${p.p}:${p.q}$. Найдите ${p.k ? 'большее' : 'меньшее'} основание трапеции.`,
    otvet: (p) => (p.k ? osnovaniya112(p).bol : osnovaniya112(p).mal),
    primer: { m: 20, p: 3, q: 7, k: 1 },
    sluchaynye: (r) => ({ m: 5 * r.int(2, 12), p: r.int(1, 4), q: r.int(5, 9), k: r.int(0, 1) }),
    stsena: (p) => {
      const o = osnovaniya112(p);
      const ans = p.k ? o.bol : o.mal;
      const verh = clamp(o.mal / o.bol, 0.3, 0.8) * 10;
      return scena(
        {
          tochki: {
            ...trapeciya(10, verh, 5, (10 - verh) * 0.35),
            M: { seredina: ['A', 'B'] },
            N: { seredina: ['D', 'C'] },
            K: {
              peresechenie: [
                ['M', 'N'],
                ['A', 'C'],
              ],
            },
          },
          elementy: [
            mn(['A', 'B', 'C', 'D']),
            otr('M', 'K', { vydelit: 'dano', znachenie: chislo(o.mal / 2) }),
            otr('K', 'N', { vydelit: 'dano', znachenie: chislo(o.bol / 2) }),
            otr('A', 'C'),
            storona(p.k ? 'A' : 'B', p.k ? 'D' : 'C', chislo(ans), {
              vydelit: 'iskomoe',
              otvet: true,
            }),
            shtrih('A', 'M', 1, { sloy: 1 }),
            shtrih('M', 'B', 1, { sloy: 1 }),
            shtrih('D', 'N', 2, { sloy: 1 }),
            shtrih('N', 'C', 2, { sloy: 1 }),
            oblast(['A', 'B', 'C'], { sloy: 2 }),
          ],
          podpisi: false,
          proverki: [
            {
              parallelny: [
                ['A', 'D'],
                ['B', 'C'],
              ],
            },
          ],
          otvet: chislo(ans),
        },
        Math.abs(verh - (o.mal / o.bol) * 10) > 1e-9,
      );
    },
  },
];

/** Прототип 113: стороны описанного четырёхугольника по AB, BC, CD; DA — из равенства сумм. */
export function storony113(p: Params) {
  const da = p.ab + p.cd - p.bc;
  return { da, per: 2 * (p.ab + p.cd), ans: p.k ? p.ab : p.cd, dano: p.k ? p.cd : p.ab };
}

/** Прототип 114: площадь S и стороны a < b параллелограмма → меньшая (k = 0) или большая (k = 1) высота. */
export function vysota114(p: Params) {
  return p.k ? p.s / p.a : p.s / p.b;
}

/** Партия 5 (варианты 25–30). */
const PROTOTIPY_PARTIYA_5: readonly PrototipChertezha[] = [
  {
    id: 113,
    blok: 'VII',
    nazvanie: 'Описанный четырёхугольник: периметр и одна сторона → противолежащая сторона',
    fipi: [],
    uslovie: (p) => {
      const s = storony113(p);
      return `Около окружности описан четырёхугольник $ABCD$, его периметр равен $${tex(s.per)}$, $${p.k ? 'CD' : 'AB'}=${tex(s.dano)}$. Найдите сторону $${p.k ? 'AB' : 'CD'}$.`;
    },
    otvet: (p) => storony113(p).ans,
    primer: { ab: 9, bc: 8, cd: 11, k: 0 },
    sluchaynye: (r) => {
      const t = [r.int(3, 12), r.int(3, 12), r.int(3, 12), r.int(3, 12)];
      return { ab: t[0]! + t[1]!, bc: t[1]! + t[2]!, cd: t[2]! + t[3]!, k: r.int(0, 1) };
    },
    stsena: (p) => {
      const s = storony113(p);
      const f = opisannyyPoStoronam(p.ab, p.bc, p.cd, s.da);
      const [iA, iB] = p.k ? (['A', 'B'] as const) : (['C', 'D'] as const);
      const [dA, dB] = p.k ? (['C', 'D'] as const) : (['A', 'B'] as const);
      return {
        tochki: { O: [0, 0], A: f.A, B: f.B, C: f.C, D: f.D },
        okruzhnosti: { w: { centr: 'O', radius: f.r } },
        elementy: [
          mn(['A', 'B', 'C', 'D']),
          okr('w'),
          storona(dA, dB, chislo(s.dano)),
          otr(iA, iB, { vydelit: 'iskomoe', znachenie: chislo(s.ans), otvet: true }),
        ],
        proverki: [],
        otvet: chislo(s.ans),
      };
    },
  },
  {
    id: 114,
    blok: 'III',
    nazvanie: 'Параллелограмм: площадь и две стороны → меньшая или большая высота',
    fipi: [],
    uslovie: (p) =>
      `Стороны параллелограмма равны $${tex(p.a)}$ и $${tex(p.b)}$, а его площадь равна $${tex(p.s)}$. Найдите ${p.k ? 'бо́льшую' : 'меньшую'} высоту параллелограмма.`,
    otvet: (p) => vysota114(p),
    primer: { a: 12, b: 20, s: 150, k: 0 },
    sluchaynye: (r) => {
      const a = r.int(4, 20);
      const b = r.int(a + 1, a + 20);
      return { a, b, s: r.int(2, a - 1) * b, k: r.int(0, 1) };
    },
    stsena: (p, porog) => {
      /* AD = b (бо́льшая сторона, внизу), AB = a; угол A — по высоте h_b = S/b. */
      const u0 = Math.asin(Math.min(1, p.s / (p.a * p.b))) / RAD;
      const u = clamp(u0, Math.max(porog, 35), 75);
      const { t, sk } = parallelogrammPo(u, p.a, p.b);
      const ans = vysota114(p);
      const hB = p.s / p.b;
      const hA = p.s / p.a;
      return scena(
        {
          tochki: {
            ...t,
            H: { osnovanie: ['B', 'A', 'D'] },
            K: { osnovanie: ['B', 'C', 'D'] },
          },
          elementy: [
            mn(['A', 'B', 'C', 'D']),
            storona('A', 'B', chislo(p.a)),
            storona('A', 'D', chislo(p.b)),
            ...vysota('B', 'A', 'D', 'H', null, {
              vydelit: p.k ? undefined : 'iskomoe',
              znachenie: p.k ? undefined : chislo(hB),
              otvet: !p.k,
            }),
            /* Основание K от C на расстоянии b·cos u; дальше D — продолжаем CD пунктиром. */
            ...vysota('B', 'C', 'D', 'K', p.b * Math.cos(u * RAD) > p.a + 1e-9 ? 'b' : null, {
              vydelit: p.k ? 'iskomoe' : undefined,
              znachenie: p.k ? chislo(hA) : undefined,
              otvet: !!p.k,
            }),
          ],
          proverki: [
            {
              parallelny: [
                ['A', 'D'],
                ['B', 'C'],
              ],
            },
          ],
          otvet: chislo(ans),
        },
        sk || Math.abs(u - u0) > 1e-9,
      );
    },
  },
];

export const PROTOTIPY_POVYSHENNYE: readonly PrototipChertezha[] = [
  ...PROTOTIPY_PARTIYA_1_2,
  ...PROTOTIPY_PARTIYA_3,
  ...PROTOTIPY_PARTIYA_4,
  ...PROTOTIPY_PARTIYA_5,
];
