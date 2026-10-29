/**
 * Теоремы справочника для решений вариантов 13–18 части 2 (№18).
 */

import { mn, otr, pr, pun, tch, ug } from './elementy';
import type { Teorema } from './index';

export const SPISOK_G: Teorema[] = [
  {
    id: 'teorema-sinusov',
    razdel: 'planimetriya',
    nazvanie: 'Теорема синусов',
    formulirovka:
      'Стороны треугольника пропорциональны синусам противолежащих углов: $\\dfrac{a}{\\sin\\alpha}=\\dfrac{b}{\\sin\\beta}=\\dfrac{c}{\\sin\\gamma}=2R$, где $R$ — радиус описанной окружности.',
    dokazatelstvo: [
      'Пусть в треугольнике $ABC$ угол $A$ острый, $O$ — центр описанной окружности. Проведём диаметр $BD$; вписанные углы $BDC$ и $BAC$ опираются на одну дугу и равны $\\alpha$.',
      'Угол $BCD$ опирается на диаметр, он прямой. В прямоугольном треугольнике $BCD$: $BC=BD\\sin\\angle BDC=2R\\sin\\alpha$.',
      'Для тупого угла $A$ вписанный угол $BDC$ равен $180^\\circ-\\alpha$, а $\\sin(180^\\circ-\\alpha)=\\sin\\alpha$; для прямого — $BC=2R$. Так же для остальных сторон.',
    ],
    scena: () => {
      const R = 2;
      const pt = (deg: number): [number, number] => [
        R * Math.cos((deg * Math.PI) / 180),
        R * Math.sin((deg * Math.PI) / 180),
      ];
      return {
        tochki: { O: [0, 0], A: pt(115), B: pt(210), C: pt(330), D: pt(30) },
        okruzhnosti: { w: { centr: 'O', radius: R } },
        elementy: [
          { tip: 'okruzhnost', okr: 'w' },
          mn('A', 'B', 'C'),
          pun('B', 'D'),
          otr('D', 'C'),
          pr('B', 'C', 'D'),
          ug('B', 'A', 'C'),
          ug('B', 'D', 'C'),
          tch('O'),
        ],
      };
    },
  },
  {
    id: 'kasatelnaya-sekushchaya',
    razdel: 'planimetriya',
    nazvanie: 'Касательная и секущая',
    formulirovka:
      'Если из точки $B$ к окружности проведены касательная $BA$ и секущая, пересекающая окружность в точках $N$ и $D$, то $BA^2=BN\\cdot BD$.',
    dokazatelstvo: [
      'Угол между касательной $BA$ и хордой $AN$ равен половине дуги $AN$, то есть вписанному углу $ADN$: $\\angle BAN=\\angle BDA$.',
      'У треугольников $BAN$ и $BDA$ общий угол $B$, значит, они подобны по двум углам.',
      'Из подобия $\\dfrac{BA}{BD}=\\dfrac{BN}{BA}$, то есть $BA^2=BN\\cdot BD$.',
    ],
    scena: () => {
      const R = 1.8;
      const B: [number, number] = [-5, -0.6];
      const d = Math.hypot(B[0], B[1]);
      const t = Math.acos(R / d);
      const fi = Math.atan2(B[1], B[0]);
      const A: [number, number] = [R * Math.cos(fi + t), R * Math.sin(fi + t)];
      /* Секущая через точку окружности D. */
      const D: [number, number] = [R * Math.cos(-0.5), R * Math.sin(-0.5)];
      const dx = D[0] - B[0];
      const dy = D[1] - B[1];
      const a = dx * dx + dy * dy;
      const b = 2 * (B[0] * dx + B[1] * dy);
      const c = B[0] * B[0] + B[1] * B[1] - R * R;
      const s = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
      const N: [number, number] = [B[0] + s * dx, B[1] + s * dy];
      return {
        tochki: { O: [0, 0], B, A, D, N },
        okruzhnosti: { w: { centr: 'O', radius: R } },
        elementy: [
          { tip: 'okruzhnost', okr: 'w' },
          otr('B', 'A'),
          otr('B', 'D'),
          pun('A', 'N'),
          pun('A', 'D'),
          ug('B', 'A', 'N'),
          ug('B', 'D', 'A'),
          tch('O'),
        ],
      };
    },
  },
  {
    id: 'vysota-pryamougolnogo',
    razdel: 'planimetriya',
    nazvanie: 'Высота прямоугольного треугольника',
    formulirovka:
      'Высота прямоугольного треугольника, проведённая к гипотенузе, есть среднее пропорциональное отрезков, на которые она делит гипотенузу: $h^2=AH\\cdot HB$.',
    dokazatelstvo: [
      'Пусть в треугольнике $ABC$ угол $C$ прямой, $CH$ — высота. Треугольники $ACH$ и $CBH$ прямоугольные, и $\\angle ACH=90^\\circ-\\angle A=\\angle B$.',
      'Значит, они подобны по двум углам: $\\dfrac{AH}{CH}=\\dfrac{CH}{HB}$.',
      'Отсюда $CH^2=AH\\cdot HB$.',
    ],
    scena: () => ({
      tochki: { A: [0, 0], B: [6, 0], C: [1.5, 2.6], H: [1.5, 0] },
      elementy: [mn('A', 'B', 'C'), otr('C', 'H'), pr('A', 'C', 'B'), pr('C', 'H', 'B'), tch('H')],
    }),
  },
];
