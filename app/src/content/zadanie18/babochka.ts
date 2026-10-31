/** Схема 16 «Бабочка» в трапеции. Проверка: scripts/verify_schemes/trapecii.mjs. */

import type { Skhema18 } from './tipy';

export const SKHEMA_BABOCHKA: Skhema18 = {
  id: 'babochka',
  no: 16,
  gruppa: 'trapeciya',
  nazvanie: '«Бабочка» в трапеции',
  sut: 'Диагонали трапеции дают подобные треугольники при основаниях и равновеликие — при боковых сторонах.',
  dano: 'В трапеции $ABCD$ ($AD \\parallel BC$) диагонали пересекаются в точке $O$.',
  sledstviya: [
    {
      tekst:
        '$\\triangle AOD \\sim \\triangle COB$ с коэффициентом $k = \\dfrac{AD}{BC}$; диагонали делятся точкой $O$ в отношении оснований: $\\dfrac{AO}{OC} = \\dfrac{DO}{OB} = \\dfrac{AD}{BC}$.',
      gruppy: ['podobie'],
    },
    {
      tekst: 'Треугольники при боковых сторонах равновелики: $S_{AOB} = S_{COD}$.',
      gruppy: ['bokovye'],
    },
    {
      tekst: '$S_{AOB}^2 = S_{AOD}\\cdot S_{BOC}$, а $S_{AOD} : S_{BOC} = k^2$.',
      gruppy: ['ploshchadi'],
    },
  ],
  dokazatelstvo: [
    {
      tekst:
        '$AD \\parallel BC$, поэтому $\\angle OAD = \\angle OCB$ и $\\angle ODA = \\angle OBC$ (накрест лежащие). Треугольники $AOD$ и $COB$ подобны по двум углам, $k = \\dfrac{AD}{BC} = \\dfrac{AO}{OC} = \\dfrac{DO}{OB}$.',
      gruppy: ['podobie'],
    },
    {
      tekst:
        'Треугольники $ABD$ и $ACD$ имеют общее основание $AD$ и равные высоты (расстояние между параллельными основаниями), поэтому их площади равны. Вычтем из обеих общую часть $AOD$: $S_{AOB} = S_{COD}$.',
      gruppy: ['bokovye-dok', 'bokovye'],
    },
    {
      tekst:
        'У треугольников $AOB$ и $BOC$ общая высота из $B$, поэтому $\\dfrac{S_{AOB}}{S_{BOC}} = \\dfrac{AO}{OC} = k$. Так же $\\dfrac{S_{AOD}}{S_{COD}} = \\dfrac{AO}{OC} = k$. Отсюда $S_{AOB} = k\\,S_{BOC}$, $S_{AOD} = k\\,S_{COD} = k\\,S_{AOB} = k^2 S_{BOC}$, и $S_{AOB}^2 = S_{AOD}\\cdot S_{BOC}$.',
      gruppy: ['ploshchadi'],
    },
  ],
  kakUznat: [
    'В трапеции проведены **обе диагонали**.',
    'Даны площади части треугольников, на которые диагонали делят трапецию.',
  ],
  gde: [
    { punkt: 'а', tekst: 'Докажите, что треугольники при боковых сторонах равновелики.' },
    {
      punkt: 'б',
      tekst:
        'Найдите площадь трапеции по площадям двух треугольников при основаниях: $S = (\\sqrt{S_1} + \\sqrt{S_2})^2$.',
    },
  ],
  zapominalka:
    '**Крылья бабочки равны** ($S_{AOB} = S_{COD}$), а **тельце** — подобные треугольники с $k = AD : BC$.',
  kartochka: [
    '$\\triangle AOD \\sim \\triangle COB$, $k = \\dfrac{AD}{BC}$',
    '$S_{AOB} = S_{COD}$',
    '$S_{AOB}^2 = S_{AOD}\\cdot S_{BOC}$',
  ],
};
