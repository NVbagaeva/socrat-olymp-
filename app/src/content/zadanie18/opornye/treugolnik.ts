/**
 * Опорные задачи №18, тема «Треугольник». Составлены для сайта.
 * Проверка: scripts/verify_opornye18/treugolnik.mjs.
 */

import type { Opornaya18 } from './tipy';

export const OP18_VYSOTY: Opornaya18 = {
  id: 'vysoty-radius',
  no: 1,
  gruppa: 'treugolnik',
  nazvanie: 'Две высоты и окружность через их основания',
  uslovie: 'В остроугольном треугольнике $ABC$ проведены высоты $AA_1$ и $CC_1$.',
  a: 'Докажите, что треугольник $A_1BC_1$ подобен треугольнику $ABC$.',
  b: 'Найдите радиус окружности, описанной около треугольника $A_1BC_1$, если $AC = 12$ и $\\angle ABC = 60^\\circ$.',
  skhemy: [
    {
      id: 'vysoty',
      zachem: 'две высоты отсекают треугольник, подобный исходному с коэффициентом $\\cos B$',
    },
    { id: 'pryamye-ugly', zachem: 'точки $A_1$ и $C_1$ видят отрезок $BH$ под прямым углом' },
  ],
  reshenieA: [
    {
      tekst:
        'Треугольники $ABA_1$ и $CBC_1$ прямоугольные, угол $B$ у них общий. Из них $BA_1 = AB\\cos B$ и $BC_1 = BC\\cos B$.',
      gruppy: ['pr'],
    },
    {
      tekst:
        'Значит, $\\dfrac{BA_1}{BA} = \\dfrac{BC_1}{BC} = \\cos B$, а угол $B$ у треугольников $A_1BC_1$ и $ABC$ общий. По двум пропорциональным сторонам и углу между ними $\\triangle A_1BC_1 \\sim \\triangle ABC$ с коэффициентом $k = \\cos B$ (вершина $A_1$ соответствует $A$, а $C_1$ — вершине $C$).',
      gruppy: ['podobie'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'По пункту а) треугольник $A_1BC_1$ подобен $ABC$ с коэффициентом $k = \\cos 60^\\circ = \\dfrac12$. При подобии все линейные размеры, в том числе радиус описанной окружности, умножаются на $k$.',
      gruppy: ['podobie'],
    },
    {
      tekst:
        'Радиус окружности, описанной около $ABC$, — по теореме синусов: $R = \\dfrac{AC}{2\\sin B} = \\dfrac{12}{2\\cdot\\frac{\\sqrt3}{2}} = 4\\sqrt3$.',
      gruppy: ['sinusy'],
    },
    {
      tekst:
        'Искомый радиус $r = kR = \\dfrac12\\cdot 4\\sqrt3 = 2\\sqrt3$. Проверка другим путём: $\\angle BA_1H = \\angle BC_1H = 90^\\circ$, поэтому окружность через $A_1$, $B$, $C_1$ построена на $BH$ как на диаметре, и $BH = 2r = 4\\sqrt3$.',
      gruppy: ['radius', 'okr-bh'],
    },
  ],
  otvet: '$2\\sqrt3$',
};

export const OP18_BISSEKTRISA: Opornaya18 = {
  id: 'bissektrisa-parallel',
  no: 2,
  gruppa: 'treugolnik',
  nazvanie: 'Биссектриса и параллельная прямая',
  uslovie:
    'В треугольнике $ABC$ проведена биссектриса $AL$. Прямая, проходящая через точку $L$ параллельно $AB$, пересекает сторону $AC$ в точке $K$.',
  a: 'Докажите, что треугольник $AKL$ равнобедренный.',
  b: 'Найдите $KL$, если $AB = 15$ и $AC = 10$.',
  skhemy: [
    {
      id: 'bissektrisa',
      zachem:
        'прямая через основание биссектрисы параллельно стороне отсекает равнобедренный треугольник; биссектриса делит $BC$ в отношении $AB : AC$',
    },
  ],
  reshenieA: [
    {
      tekst:
        '$\\angle KLA = \\angle LAB$ как накрест лежащие при параллельных $KL$ и $AB$ и секущей $AL$.',
      gruppy: ['par'],
    },
    {
      tekst:
        '$\\angle LAB = \\angle LAK$, потому что $AL$ — биссектриса. Значит, $\\angle KLA = \\angle KAL$, и треугольник $AKL$ равнобедренный: $AK = KL$.',
      gruppy: ['rb'],
    },
  ],
  reshenieB: [
    {
      tekst: 'Обозначим $KL = x$. По пункту а) $AK = x$, тогда $KC = AC - AK = 10 - x$.',
      gruppy: ['rb'],
    },
    {
      tekst:
        'Так как $KL \\parallel AB$, треугольник $CKL$ подобен треугольнику $CAB$: $\\dfrac{KL}{AB} = \\dfrac{CK}{CA}$, то есть $\\dfrac{x}{15} = \\dfrac{10 - x}{10}$. Отсюда $10x = 150 - 15x$ и $x = 6$.',
      gruppy: ['pod'],
    },
  ],
  otvet: '$6$',
};

export const OP18_MEDIANA: Opornaya18 = {
  id: 'mediana-ploshchad',
  no: 3,
  gruppa: 'treugolnik',
  nazvanie: 'Удвоение медианы',
  uslovie: 'В треугольнике $ABC$ проведена медиана $AM$.',
  a: 'Докажите, что $AM < \\dfrac{AB + AC}{2}$.',
  b: 'Найдите площадь треугольника $ABC$, если $AB = 13$, $AC = 15$ и $AM = 7$.',
  skhemy: [
    {
      id: 'udvoenie-mediany',
      zachem: 'продолжение медианы на её длину даёт треугольник со сторонами $AB$, $AC$ и $2AM$',
    },
  ],
  reshenieA: [
    {
      tekst:
        'Продлим медиану за точку $M$ на отрезок $MD = AM$. Треугольники $AMC$ и $DMB$ равны: $BM = MC$, $AM = MD$, углы при $M$ вертикальные. Значит, $BD = AC$.',
      gruppy: ['udv'],
    },
    {
      tekst:
        'По неравенству треугольника для $ABD$: $AD < AB + BD$, то есть $2AM < AB + AC$ и $AM < \\dfrac{AB + AC}{2}$.',
      gruppy: ['ner'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'Сделаем то же построение. У треугольника $ABD$ стороны $AB = 13$, $BD = AC = 15$, $AD = 2AM = 14$.',
      gruppy: ['udv'],
    },
    {
      tekst:
        'Площади $ABC$ и $ABD$ равны: $S_{ABC} = S_{ABM} + S_{AMC}$, $S_{ABD} = S_{ABM} + S_{DMB}$, а $S_{AMC} = S_{DMB}$, потому что треугольники равны.',
      gruppy: ['pl'],
    },
    {
      tekst:
        'По формуле Герона для $ABD$: $p = \\dfrac{13 + 15 + 14}{2} = 21$, $S = \\sqrt{21\\cdot 8\\cdot 6\\cdot 7} = 84$.',
      gruppy: ['geron'],
    },
  ],
  otvet: '$84$',
};
