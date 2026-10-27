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
import { poUglam, ravnobedrennyy, trapeciya, uglyTreugolnika } from '../figury';
import type { Element } from '../types';
import {
  type PrototipChertezha,
  chislo,
  clamp,
  gr,
  grTex,
  mn,
  oblast,
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

export const PROTOTIPY_POVYSHENNYE: readonly PrototipChertezha[] = [
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
