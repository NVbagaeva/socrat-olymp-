/**
 * Задачи тренажёра №18, тема «Площади». Составлены для сайта.
 * Чертежи — lib/zadanie18/trenazher/dop/ploshchadi.ts, проверка —
 * scripts/verify_schemes/trenazherDop/ploshchadi.mjs.
 */

import { ch, drob, type ZadachaDop18 } from './tipy';

export const PL18_OBSHCHAYA_VYSOTA: ZadachaDop18 = {
  id: 'pl-obshchaya-vysota',
  uroven: 1,
  nazvanie: 'Чевиана и медиана внутри треугольника',
  varianty: [{ S: 40 }, { S: 50 }, { S: 30 }],
  uslovie:
    'Точка $M$ лежит на стороне $BC$ треугольника $ABC$, причём $BM : MC = 2 : 3$. Точка $N$ — середина отрезка $AM$.',
  a: 'Докажите, что площади треугольников $ABM$ и $AMC$ относятся как $2 : 3$.',
  b: (p) => `Найдите площадь треугольника $ABN$, если площадь треугольника $ABC$ равна $${p.S}$.`,
  skhemy: [
    {
      id: 'obshchaya-vysota',
      zachem: 'треугольники с общей высотой относятся как основания; медиана делит площадь пополам',
    },
  ],
  podskazka: 'Какая высота общая у треугольников $ABM$ и $AMC$? А у $ABN$ и $NBM$?',
  dokazatelstvo: [
    {
      tekst:
        'У треугольников $ABM$ и $AMC$ общая высота $AH$, проведённая из вершины $A$ к прямой $BC$. Поэтому $\\dfrac{S_{ABM}}{S_{AMC}} = \\dfrac{\\frac12 BM\\cdot AH}{\\frac12 MC\\cdot AH} = \\dfrac{BM}{MC} = \\dfrac23$.',
      gruppy: ['h'],
    },
  ],
  reshenieB: (p) => [
    {
      tekst: `По пункту а) $S_{ABM} = \\dfrac25 S_{ABC} = \\dfrac25\\cdot ${p.S} = ${ch((2 * p.S!) / 5)}$.`,
      gruppy: ['h'],
    },
    {
      tekst: `$BN$ — медиана треугольника $ABM$: она делит его площадь пополам, $S_{ABN} = \\dfrac12\\cdot ${ch((2 * p.S!) / 5)} = ${ch(p.S! / 5)}$.`,
      gruppy: ['n'],
    },
  ],
  otvet: (p) => p.S! / 5,
};

export const PL18_BISSEKTRISA: ZadachaDop18 = {
  id: 'pl-bissektrisa',
  uroven: 3,
  nazvanie: 'Длина биссектрисы через площади',
  varianty: [
    { AB: 3, AC: 6 },
    { AB: 4, AC: 12 },
    { AB: 10, AC: 15 },
  ],
  uslovie: 'В треугольнике $ABC$ проведена биссектриса $AL$.',
  a: 'Докажите, что $AL = \\dfrac{2\\,AB\\cdot AC\\cos\\frac{A}{2}}{AB + AC}$.',
  b: (p) => `Найдите $AL$, если $AB = ${p.AB}$, $AC = ${p.AC}$ и $\\angle BAC = 120^\\circ$.`,
  skhemy: [
    {
      id: 'metod-ploshchadey',
      zachem: 'площадь треугольника $ABC$ — сумма площадей $ABL$ и $ALC$',
    },
    { id: 'obshchiy-ugol', zachem: 'площадь через две стороны и синус угла между ними' },
  ],
  podskazka:
    'Биссектриса делит треугольник на два. Запиши площадь каждого и всего треугольника через синусы углов при вершине $A$.',
  dokazatelstvo: [
    {
      tekst:
        '$S_{ABC} = S_{ABL} + S_{ALC}$: $\\dfrac12 AB\\cdot AC\\sin A = \\dfrac12 AB\\cdot AL\\sin\\dfrac A2 + \\dfrac12 AL\\cdot AC\\sin\\dfrac A2$.',
      gruppy: ['pl'],
    },
    {
      tekst:
        'Подставим $\\sin A = 2\\sin\\dfrac A2\\cos\\dfrac A2$ и сократим на $\\dfrac12\\sin\\dfrac A2$: $2AB\\cdot AC\\cos\\dfrac A2 = AL\\,(AB + AC)$. Отсюда формула для $AL$.',
      gruppy: ['otv'],
    },
  ],
  reshenieB: (p) => [
    {
      tekst: `$\\dfrac A2 = 60^\\circ$, $\\cos 60^\\circ = \\dfrac12$. По пункту а) $AL = \\dfrac{2\\cdot ${p.AB}\\cdot ${p.AC}\\cdot\\frac12}{${p.AB} + ${p.AC}} = ${drob(p.AB! * p.AC!, p.AB! + p.AC!)}$.`,
      gruppy: ['otv'],
    },
  ],
  otvet: (p) => (p.AB! * p.AC!) / (p.AB! + p.AC!),
};
