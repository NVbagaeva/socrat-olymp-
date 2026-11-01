/**
 * Задачи тренажёра №18, тема «Площади». Составлены для сайта.
 * Чертежи — lib/zadanie18/trenazher/ploshchadi.ts, проверка —
 * scripts/verify_trenazher18/ploshchadi.mjs.
 */

import type { Zadacha18 } from './tipy';

export const PL18_OBSHCHAYA_VYSOTA: Zadacha18 = {
  id: 'pl-obshchaya-vysota',
  no: 21,
  gruppa: 'ploshchadi',
  uroven: 'razminka',
  nazvanie: 'Чевиана и медиана внутри треугольника',
  uslovie:
    'Точка $M$ лежит на стороне $BC$ треугольника $ABC$, причём $BM : MC = 2 : 3$. Точка $N$ — середина отрезка $AM$.',
  a: 'Докажите, что площади треугольников $ABM$ и $AMC$ относятся как $2 : 3$.',
  b: 'Найдите площадь треугольника $ABN$, если площадь треугольника $ABC$ равна $40$.',
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
  reshenieB: [
    {
      tekst: 'По пункту а) $S_{ABM} = \\dfrac25 S_{ABC} = \\dfrac25\\cdot 40 = 16$.',
      gruppy: ['h'],
    },
    {
      tekst:
        '$BN$ — медиана треугольника $ABM$: она делит его площадь пополам, $S_{ABN} = \\dfrac12\\cdot 16 = 8$.',
      gruppy: ['n'],
    },
  ],
  otvet: '$8$',
};

export const PL18_OBSHCHIY_UGOL: Zadacha18 = {
  id: 'pl-obshchiy-ugol',
  no: 22,
  gruppa: 'ploshchadi',
  uroven: 'ege',
  nazvanie: 'Треугольник с общим углом',
  uslovie:
    'На сторонах $AB$ и $AC$ треугольника $ABC$ отмечены точки $K$ и $L$ так, что $AK : KB = 1 : 2$ и $AL : LC = 3 : 1$.',
  a: 'Докажите, что площадь треугольника $AKL$ равна четверти площади треугольника $ABC$.',
  b: 'Найдите площадь четырёхугольника $KBCL$, если $AB = 9$, $AC = 8$ и $\\angle BAC = 30^\\circ$.',
  skhemy: [
    {
      id: 'obshchiy-ugol',
      zachem: 'площади треугольников с общим углом относятся как произведения сторон при этом угле',
    },
  ],
  podskazka: 'Запиши обе площади по формуле $S = \\dfrac12 ab\\sin\\gamma$ с углом $A$.',
  dokazatelstvo: [
    {
      tekst:
        '$S_{AKL} = \\dfrac12 AK\\cdot AL\\sin A$ и $S_{ABC} = \\dfrac12 AB\\cdot AC\\sin A$, поэтому $\\dfrac{S_{AKL}}{S_{ABC}} = \\dfrac{AK}{AB}\\cdot\\dfrac{AL}{AC}$.',
      gruppy: ['ugol'],
    },
    {
      tekst:
        '$\\dfrac{AK}{AB} = \\dfrac13$, $\\dfrac{AL}{AC} = \\dfrac34$, их произведение $\\dfrac14$.',
      gruppy: ['ugol'],
    },
  ],
  reshenieB: [
    {
      tekst: '$S_{ABC} = \\dfrac12\\cdot 9\\cdot 8\\cdot\\sin 30^\\circ = 18$.',
      gruppy: ['pl'],
    },
    {
      tekst:
        'По пункту а) $S_{AKL} = \\dfrac{18}{4} = 4{,}5$, поэтому $S_{KBCL} = 18 - 4{,}5 = 13{,}5$.',
      gruppy: ['pl'],
    },
  ],
  otvet: '$13{,}5$',
};

export const PL18_RELSY: Zadacha18 = {
  id: 'pl-relsy',
  no: 23,
  gruppa: 'ploshchadi',
  uroven: 'ege',
  nazvanie: 'Середина боковой стороны трапеции',
  uslovie: 'В трапеции $ABCD$ с основаниями $AD$ и $BC$ точка $M$ — середина боковой стороны $CD$.',
  a: 'Докажите, что площадь треугольника $ABM$ равна половине площади трапеции.',
  b: 'Найдите расстояние от точки $M$ до прямой $AB$, если $AD = 10$, $BC = 6$, $AB = 10$, а высота трапеции равна $8$.',
  skhemy: [
    {
      id: 'obshchaya-vysota',
      zachem: 'высоты треугольников $BCM$ и $AMD$ — половины высоты трапеции',
    },
    {
      id: 'metod-ploshchadey',
      zachem: 'расстояние до прямой — высота треугольника $ABM$, известна его площадь',
    },
  ],
  podskazka:
    'Отрежь от трапеции треугольники $BCM$ и $AMD$. Какие у них высоты, если $M$ — середина $CD$?',
  dokazatelstvo: [
    {
      tekst:
        'Пусть $h$ — высота трапеции. Точка $M$ — середина $CD$, поэтому она удалена от прямых $BC$ и $AD$ на $\\dfrac h2$. Тогда $S_{BCM} = \\dfrac12 BC\\cdot\\dfrac h2$ и $S_{AMD} = \\dfrac12 AD\\cdot\\dfrac h2$.',
      gruppy: ['ostatok'],
    },
    {
      tekst:
        '$S_{BCM} + S_{AMD} = \\dfrac{(AD + BC)h}{4} = \\dfrac12 S_{ABCD}$, значит, на треугольник $ABM$ остаётся тоже $\\dfrac12 S_{ABCD}$.',
      gruppy: ['abm'],
    },
  ],
  reshenieB: [
    {
      tekst: '$S_{ABCD} = \\dfrac{10 + 6}{2}\\cdot 8 = 64$, по пункту а) $S_{ABM} = 32$.',
      gruppy: ['abm'],
    },
    {
      tekst:
        'Расстояние $MH$ от $M$ до прямой $AB$ — высота треугольника $ABM$: $MH = \\dfrac{2S_{ABM}}{AB} = \\dfrac{64}{10} = 6{,}4$.',
      gruppy: ['d'],
    },
  ],
  otvet: '$6{,}4$',
};

export const PL18_BISSEKTRISA: Zadacha18 = {
  id: 'pl-bissektrisa',
  no: 24,
  gruppa: 'ploshchadi',
  uroven: 'povyshennyy',
  nazvanie: 'Длина биссектрисы через площади',
  uslovie: 'В треугольнике $ABC$ проведена биссектриса $AL$.',
  a: 'Докажите, что $AL = \\dfrac{2\\,AB\\cdot AC\\cos\\frac{A}{2}}{AB + AC}$.',
  b: 'Найдите $AL$, если $AB = 3$, $AC = 6$ и $\\angle BAC = 120^\\circ$.',
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
  reshenieB: [
    {
      tekst:
        '$\\dfrac A2 = 60^\\circ$, $\\cos 60^\\circ = \\dfrac12$. По пункту а) $AL = \\dfrac{2\\cdot 3\\cdot 6\\cdot\\frac12}{3 + 6} = \\dfrac{18}{9} = 2$.',
      gruppy: ['otv'],
    },
  ],
  otvet: '$2$',
};
