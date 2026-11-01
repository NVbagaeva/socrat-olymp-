/**
 * Опорные задачи №18, тема «Отношения отрезков». Составлены для сайта.
 * Проверка: scripts/verify_opornye18/otnosheniya.mjs.
 */

import type { Opornaya18 } from './tipy';

export const OP18_MENELAY: Opornaya18 = {
  id: 'menelay-ploshchad',
  no: 13,
  gruppa: 'otnosheniya',
  nazvanie: 'Прямая через середину чевианы',
  uslovie:
    'На стороне $BC$ треугольника $ABC$ отмечена точка $M$ так, что $BM : MC = 2 : 1$, точка $K$ — середина отрезка $AM$. Прямая $BK$ пересекает сторону $AC$ в точке $N$.',
  a: 'Докажите, что $AN : NC = 2 : 3$.',
  b: 'Найдите площадь четырёхугольника $KMCN$, если площадь треугольника $ABC$ равна $30$.',
  skhemy: [
    { id: 'menelay-cheva', zachem: 'теорема Менелая для треугольника $AMC$ и прямой $BN$' },
    {
      id: 'obshchaya-vysota',
      zachem: 'площади треугольников с общей высотой относятся как основания',
    },
    {
      id: 'obshchiy-ugol',
      zachem: 'площади треугольников с общим углом относятся как произведения сторон',
    },
  ],
  reshenieA: [
    {
      tekst:
        'Прямая $BN$ пересекает стороны $AM$ и $AC$ треугольника $AMC$ в точках $K$ и $N$, а продолжение стороны $MC$ — в точке $B$.',
      gruppy: ['men'],
    },
    {
      tekst:
        'По теореме Менелая $\\dfrac{AK}{KM}\\cdot\\dfrac{MB}{BC}\\cdot\\dfrac{CN}{NA} = 1$, то есть $1\\cdot\\dfrac23\\cdot\\dfrac{CN}{NA} = 1$. Отсюда $\\dfrac{CN}{NA} = \\dfrac32$ и $AN : NC = 2 : 3$.',
      gruppy: ['men'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'У треугольников $AMC$ и $ABC$ общая высота из $A$, поэтому $S_{AMC} = \\dfrac{MC}{BC}\\cdot S_{ABC} = \\dfrac13\\cdot 30 = 10$.',
      gruppy: ['amc'],
    },
    {
      tekst:
        'У треугольников $AKN$ и $AMC$ общий угол $A$: $S_{AKN} = \\dfrac{AK}{AM}\\cdot\\dfrac{AN}{AC}\\cdot S_{AMC} = \\dfrac12\\cdot\\dfrac25\\cdot 10 = 2$ (по пункту а) $AN : AC = 2 : 5$).',
      gruppy: ['akn'],
    },
    {
      tekst: '$S_{KMCN} = S_{AMC} - S_{AKN} = 10 - 2 = 8$.',
      gruppy: ['itog'],
    },
  ],
  otvet: '$8$',
};

export const OP18_BISS_MED: Opornaya18 = {
  id: 'bissektrisa-i-mediana',
  no: 14,
  gruppa: 'otnosheniya',
  nazvanie: 'Биссектриса делит медиану',
  uslovie: 'В треугольнике $ABC$ биссектриса $AL$ пересекает медиану $BM$ в точке $P$.',
  a: 'Докажите, что $BP : PM = 2AB : AC$.',
  b: 'Найдите площадь треугольника $ABP$, если $AB = 6$, $AC = 8$, а площадь треугольника $ABC$ равна $20$.',
  skhemy: [
    {
      id: 'bissektrisa',
      zachem: 'биссектриса делит противоположную сторону в отношении прилежащих сторон',
    },
    {
      id: 'obshchaya-vysota',
      zachem: 'медиана делит площадь пополам, а отрезки на $BM$ делят площадь $ABM$',
    },
  ],
  reshenieA: [
    {
      tekst: '$M$ — середина $AC$, поэтому $AM = \\dfrac{AC}{2}$.',
      gruppy: ['am'],
    },
    {
      tekst:
        'Точка $M$ лежит на стороне $AC$, поэтому луч $AL$ — биссектриса и угла $BAM$ треугольника $ABM$; он пересекает сторону $BM$ в точке $P$. По свойству биссектрисы $\\dfrac{BP}{PM} = \\dfrac{AB}{AM} = \\dfrac{2AB}{AC}$.',
      gruppy: ['bis'],
    },
  ],
  reshenieB: [
    {
      tekst: 'По пункту а) $BP : PM = 12 : 8 = 3 : 2$, то есть $BP = \\dfrac35\\,BM$.',
      gruppy: ['bis'],
    },
    {
      tekst: 'Медиана делит треугольник на два равновеликих: $S_{ABM} = \\dfrac{20}{2} = 10$.',
      gruppy: ['abm'],
    },
    {
      tekst:
        'У треугольников $ABP$ и $ABM$ общая высота из $A$: $S_{ABP} = \\dfrac{BP}{BM}\\cdot S_{ABM} = \\dfrac35\\cdot 10 = 6$.',
      gruppy: ['abp'],
    },
  ],
  otvet: '$6$',
};
