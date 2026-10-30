/**
 * Прототипы раздела «Ежемесячные варианты» для задания №1: той же
 * формы, что прототипы Блока 1. В общий реестр PROTOTIPY не входят —
 * в банк, тренажёр и генератор №1 не попадают; `prototip(id)` и
 * `reshenie(id)` находят их по номеру, поэтому чертёж, решение и
 * разбор строит тот же движок.
 *
 * Номера — от 201.
 */

import { RAD } from '../geom';
import { poUglam, pryamougolnyy } from '../figury';
import type { Element } from '../types';
import {
  type PrototipChertezha,
  chislo,
  clamp,
  koren,
  korenTex,
  okr,
  otr,
  pryam,
  scena,
  shtrih,
  tex,
  tochka,
  tri,
  ug,
} from './dsl';

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

/** Гипотенуза прямоугольного треугольника с катетами k√m и b. */
export function gipotenuza201(p: { k: number; m: number; b: number }): number {
  return Math.sqrt(p.k * p.k * p.m + p.b * p.b);
}

/** Угол подъёма (в градусах) по длине пути l и высоте подъёма h. */
export function ugol202(p: { l: number; h: number }): number {
  return Math.asin(p.h / p.l) / RAD;
}

/**
 * Радиус вписанной в равнобедренный прямоугольный с катетом a + b√2:
 * гипотенуза a√2 + 2b, r = (2a − 2b + (2b − a)√2)/2; при a = 2b корни
 * сокращаются и r = a − b.
 */
export function radius204(p: { a: number; b: number }): number {
  if (p.a === 2 * p.b) return p.a - p.b;
  return (2 * p.a - 2 * p.b + (2 * p.b - p.a) * Math.SQRT2) / 2;
}

export const PROTOTIPY_EZHEMESYACHNYE: readonly PrototipChertezha[] = [
  {
    id: 201,
    blok: 'V',
    nazvanie: '$AC=k\\sqrt m$ и $BC$ → $\\sin A$ (гипотенуза — по теореме Пифагора)',
    fipi: [],
    uslovie: (p) =>
      `В треугольнике $ABC$ угол $C$ равен $90^\\circ$, $AC=${korenTex(p.k, p.m)}$, $BC=${tex(p.b)}$. Найдите $\\sin A$.`,
    otvet: (p) => p.b / gipotenuza201(p),
    primer: { k: 4, m: 7, b: 12 },
    sluchaynye: (r) => ({ k: r.int(1, 6), m: r.int(2, 30), b: r.int(2, 30) }),
    stsena: (p, porog) => {
      const A0 = Math.atan(p.b / (p.k * Math.sqrt(p.m))) / RAD;
      const bV = clamp(90 - A0, porog, 90 - porog);
      return scena(
        {
          tochki: pryamougolnyy(bV, 'gipotenuza'),
          elementy: [
            tri('A', 'B', 'C'),
            pryam('A', 'C', 'B'),
            storona('A', 'C', koren(p.k, p.m)),
            storona('C', 'B', chislo(p.b)),
            ug('C', 'A', 'B', { vydelit: 'iskomoe' }),
            storona('A', 'B', 'AB', { sloy: 1, vydelit: undefined }),
          ],
          otvet: chislo(p.b / gipotenuza201(p)),
        },
        Math.abs(bV - (90 - A0)) > 1e-9,
      );
    },
  },
  {
    id: 202,
    blok: 'V',
    nazvanie: 'Угол подъёма по длине пути и высоте: синус и таблица синусов',
    fipi: [],
    uslovie: (p) =>
      `Вагончик фуникулёра в горном парке едет по прямым рельсам длиной $${tex(p.l)}$ м и поднимается при этом на $${tex(p.h)}$ м. Найдите угол наклона рельсов к горизонту. Фрагмент таблицы синусов дан ниже, одна угловая минута равна $\\dfrac{1}{60}$ градуса. Ответ округлите до целого числа градусов.`,
    otvet: (p) => Math.round(ugol202(p)),
    primer: { l: 250, h: 31 },
    sluchaynye: (r) => ({ l: 10 * r.int(15, 40), h: r.int(15, 45) }),
    stsena: (p, porog) => {
      const u = ugol202(p);
      /* Угол в несколько градусов на чертеже неразличим: рисуем круче. */
      const uV = clamp(u, Math.max(porog, 18), 60);
      return scena(
        {
          tochki: { A: [0, 0], C: [10, 0], B: [10, 10 * Math.tan(uV * RAD)] },
          elementy: [
            tri('A', 'C', 'B'),
            pryam('A', 'C', 'B'),
            storona('A', 'B', `${chislo(p.l)} м`),
            storona('C', 'B', `${chislo(p.h)} м`),
            ug('C', 'A', 'B', { vydelit: 'iskomoe', znachenie: 'α' }),
          ],
          podpisi: false,
          otvet: `${Math.round(u)}°`,
        },
        Math.abs(uV - u) > 1e-9,
      );
    },
  },
  {
    id: 203,
    blok: 'VII',
    nazvanie: 'Вписанная окружность и касательная $EH$: отрезок $BP$ → периметр треугольника $BEH$',
    fipi: [],
    uslovie: (p) =>
      `В треугольник $ABC$ вписана окружность, она касается сторон $AB$ и $BC$ в точках $L$ и $P$. Касательная к этой окружности пересекает стороны $AB$ и $BC$ в точках $E$ и $H$ соответственно. Найдите периметр треугольника $BEH$, если $BP=${tex(p.a)}$.`,
    otvet: (p) => 2 * p.a,
    primer: { a: 9.5 },
    sluchaynye: (r) => ({ a: r.int(2, 40) / 2 }),
    stsena: (p) => ({
      tochki: {
        ...poUglam(62, 70),
        O: { centrVpisannoy: ['A', 'B', 'C'] },
        L: { osnovanie: ['O', 'A', 'B'] },
        P: { osnovanie: ['O', 'B', 'C'] },
        T: { pryamayaOkruzhnost: { pryamaya: ['O', 'B'], okr: 'w', vybor: 'dalnyaya' } },
        T2: { kasatelnayaV: { tochka: 'T', okr: 'w', dlina: 1 } },
        E: {
          peresechenie: [
            ['T', 'T2'],
            ['A', 'B'],
          ],
        },
        H: {
          peresechenie: [
            ['T', 'T2'],
            ['B', 'C'],
          ],
        },
      },
      okruzhnosti: { w: { vpisannaya: ['A', 'B', 'C'] } },
      elementy: [
        tri('A', 'B', 'C'),
        okr('w'),
        otr('E', 'H'),
        tochka('L'),
        tochka('P'),
        tochka('T'),
        otr('B', 'P', { vydelit: 'dano', znachenie: chislo(p.a) }),
        tri('B', 'E', 'H', { vydelit: 'iskomoe' }),
        shtrih('E', 'L', 1, { sloy: 1 }),
        shtrih('E', 'T', 1, { sloy: 1 }),
        shtrih('H', 'P', 2, { sloy: 1 }),
        shtrih('H', 'T', 2, { sloy: 1 }),
        shtrih('B', 'L', 3, { sloy: 2 }),
        shtrih('B', 'P', 3, { sloy: 2 }),
      ],
      bezPodpisi: ['T2', 'O'],
      proverki: [
        {
          ravny: [
            ['E', 'L'],
            ['E', 'T'],
          ],
        },
        {
          ravny: [
            ['H', 'P'],
            ['H', 'T'],
          ],
        },
        { naPryamoy: ['E', 'T', 'H'] },
      ],
      otvet: chislo(2 * p.a),
    }),
  },
  {
    id: 204,
    blok: 'X',
    nazvanie: 'Равнобедренный прямоугольный: катет $a+b\\sqrt2$ → радиус вписанной окружности',
    fipi: [],
    uslovie: (p) =>
      `Катеты равнобедренного прямоугольного треугольника равны $${tex(p.a)}+${korenTex(p.b, 2)}$. Найдите радиус окружности, вписанной в этот треугольник.`,
    otvet: (p) => radius204(p),
    primer: { a: 18, b: 9 },
    sluchaynye: (r) => {
      const b = r.int(1, 20);
      return { a: 2 * b, b };
    },
    stsena: (p) => ({
      tochki: {
        ...poUglam(45, 45),
        O: { centrVpisannoy: ['A', 'B', 'C'] },
        K: { osnovanie: ['O', 'A', 'C'] },
        M: { osnovanie: ['O', 'B', 'C'] },
        T: { osnovanie: ['O', 'A', 'B'] },
      },
      okruzhnosti: { w: { vpisannaya: ['A', 'B', 'C'] } },
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        okr('w'),
        tochka('O'),
        shtrih('A', 'C', 1),
        shtrih('B', 'C', 1),
        storona('A', 'C', `${chislo(p.a)}+${koren(p.b, 2)}`),
        otr('O', 'K', { vydelit: 'iskomoe' }),
        pryam('O', 'K', 'C', { sloy: 1 }),
        otr('O', 'M', { sloy: 1, stil: 'punktir' }),
        pryam('O', 'M', 'C', { sloy: 1 }),
        otr('O', 'T', { sloy: 2, stil: 'punktir' }),
      ],
      podpisi: ['A', 'B', 'C', 'O'],
      proverki: [
        {
          ravny: [
            ['A', 'C'],
            ['B', 'C'],
          ],
        },
        { ugol: ['A', 'C', 'B'], gradusy: 90 },
      ],
      otvet: chislo(radius204(p)),
    }),
  },
];
