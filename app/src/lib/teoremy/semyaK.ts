/**
 * Теоремы справочника для решений вариантов 19–24 части 2 (№15 и №18).
 */

import { mn, otr, pun, tch, ug } from './elementy';
import type { Teorema } from './index';

export const SPISOK_K: Teorema[] = [
  {
    id: 'bissektrisa-otrezki',
    razdel: 'planimetriya',
    nazvanie: 'Свойство биссектрисы треугольника',
    formulirovka:
      'Биссектриса угла треугольника делит противоположную сторону на отрезки, пропорциональные прилежащим сторонам: если $BL$ — биссектриса треугольника $ABC$, то $\\dfrac{AL}{LC}=\\dfrac{AB}{BC}$.',
    dokazatelstvo: [
      'Проведём через $C$ прямую, параллельную $BL$, до пересечения с прямой $AB$ в точке $D$.',
      'Углы $BCD$ и $CBL$ — накрест лежащие, а $BDC$ и $ABL$ — соответственные; оба равны половине угла $B$, поэтому треугольник $BCD$ равнобедренный: $BD=BC$.',
      'По теореме о пропорциональных отрезках (прямые $BL$ и $DC$ параллельны) $\\dfrac{AL}{LC}=\\dfrac{AB}{BD}=\\dfrac{AB}{BC}$.',
    ],
    scena: () => ({
      tochki: { A: [0, 0], B: [1.6, 3], C: [6, 0], L: [2.62, 0], D: [3.3, 6.2] },
      elementy: [
        mn('A', 'B', 'C'),
        otr('B', 'L'),
        pun('B', 'D'),
        pun('C', 'D'),
        ug('A', 'B', 'L'),
        ug('L', 'B', 'C'),
        tch('L'),
        tch('D'),
      ],
    }),
  },
  {
    id: 'teorema-menelaya',
    razdel: 'planimetriya',
    nazvanie: 'Теорема Менелая',
    formulirovka:
      'Если прямая пересекает прямые $AB$, $BC$ и $CA$, на которых лежат стороны треугольника $ABC$, в точках $T$, $M$ и $N$, то $\\dfrac{AT}{TB}\\cdot\\dfrac{BM}{MC}\\cdot\\dfrac{CN}{NA}=1$.',
    dokazatelstvo: [
      'Проведём через $C$ прямую, параллельную $AB$, до пересечения с секущей в точке $P$.',
      'Треугольники $CMP$ и $BMT$ подобны (углы при $M$ вертикальные, при $P$ и $T$ — накрест лежащие): $\\dfrac{BM}{MC}=\\dfrac{TB}{CP}$.',
      'Треугольники $CNP$ и $ANT$ подобны: $\\dfrac{CN}{NA}=\\dfrac{CP}{AT}$. Перемножив, получаем $\\dfrac{AT}{TB}\\cdot\\dfrac{TB}{CP}\\cdot\\dfrac{CP}{AT}=1$.',
    ],
    scena: () => ({
      tochki: { A: [0, 0], B: [4, 0], C: [1.5, 3], T: [7, 0], M: [3.1, 1.1], N: [0.9, 1.8] },
      elementy: [mn('A', 'B', 'C'), pun('B', 'T'), otr('T', 'N'), tch('T'), tch('M'), tch('N')],
    }),
  },
];
