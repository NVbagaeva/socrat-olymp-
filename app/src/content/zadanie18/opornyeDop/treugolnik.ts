/**
 * Опорные задачи №18, тема «Треугольник». Составлены для сайта.
 * Проверка: scripts/verify_schemes/opornyeDop/treugolnik.mjs.
 */

import type { OpornayaDop18 } from './tipy';

export const OP18_MEDIANA: OpornayaDop18 = {
  id: 'mediana-ploshchad',
  no: 7,
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
  otvetChislo: 84,
};
