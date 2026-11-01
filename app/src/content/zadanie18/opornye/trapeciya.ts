/**
 * Опорные задачи №18, тема «Трапеция». Составлены для сайта.
 * Проверка: scripts/verify_opornye18/trapeciya.mjs.
 */

import type { Opornaya18 } from './tipy';

export const OP18_BABOCHKA: Opornaya18 = {
  id: 'babochka-ploshchad',
  no: 10,
  gruppa: 'trapeciya',
  nazvanie: 'Площади четырёх треугольников при диагоналях',
  uslovie: 'Диагонали трапеции $ABCD$ с основаниями $AD$ и $BC$ пересекаются в точке $O$.',
  a: 'Докажите, что площади треугольников $AOB$ и $COD$ равны.',
  b: 'Найдите площадь трапеции, если площади треугольников $BOC$ и $AOD$ равны $4$ и $9$.',
  skhemy: [
    {
      id: 'babochka',
      zachem:
        'треугольники при основаниях подобны, боковые — равновелики, $S_{AOB}^2 = S_{BOC}\\cdot S_{AOD}$',
    },
    {
      id: 'obshchaya-vysota',
      zachem: 'площади треугольников с общей высотой относятся как основания',
    },
  ],
  reshenieA: [
    {
      tekst:
        'У треугольников $ABD$ и $ACD$ общее основание $AD$, а высоты равны высоте трапеции, потому что $B$ и $C$ лежат на прямой, параллельной $AD$. Значит, $S_{ABD} = S_{ACD}$.',
      gruppy: ['obsh'],
    },
    {
      tekst:
        'Вычтем из обеих площадей $S_{AOD}$: $S_{AOB} = S_{ABD} - S_{AOD} = S_{ACD} - S_{AOD} = S_{COD}$.',
      gruppy: ['rav'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'Треугольники $BOC$ и $DOA$ подобны (накрест лежащие углы при $BC \\parallel AD$). Площади подобных фигур относятся как квадрат коэффициента: $k^2 = \\dfrac49$, $k = \\dfrac{BO}{OD} = \\dfrac23$.',
      gruppy: ['pod'],
    },
    {
      tekst:
        'У треугольников $AOB$ и $AOD$ общая высота из вершины $A$, поэтому $\\dfrac{S_{AOB}}{S_{AOD}} = \\dfrac{BO}{OD} = \\dfrac23$ и $S_{AOB} = 6$.',
      gruppy: ['vys'],
    },
    {
      tekst: 'По пункту а) $S_{COD} = 6$. Площадь трапеции $4 + 9 + 6 + 6 = 25$.',
      gruppy: ['itog'],
    },
  ],
  otvet: '$25$',
};

export const OP18_CHETYRE: Opornaya18 = {
  id: 'chetyre-tochki-trapecii',
  no: 11,
  gruppa: 'trapeciya',
  nazvanie: 'Четыре точки трапеции на одной прямой',
  uslovie:
    'Продолжения боковых сторон $AB$ и $CD$ трапеции $ABCD$ пересекаются в точке $P$, диагонали — в точке $O$; $M$ и $N$ — середины оснований $BC$ и $AD$.',
  a: 'Докажите, что точки $P$, $M$, $O$ и $N$ лежат на одной прямой.',
  b: 'Найдите $PO$, если $BC = 2$, $AD = 6$ и $MN = 4$.',
  skhemy: [
    { id: 'chetyre-tochki', zachem: 'это замечательное свойство трапеции' },
    { id: 'babochka', zachem: 'треугольники $BOC$ и $DOA$ подобны с коэффициентом $BC : AD$' },
  ],
  reshenieA: [
    {
      tekst:
        "Пусть прямая $PN$ пересекает $BC$ в точке $M'$. Так как $BC \\parallel AD$, $\\triangle PBM' \\sim \\triangle PAN$ и $\\triangle PM'C \\sim \\triangle PND$, откуда $\\dfrac{BM'}{AN} = \\dfrac{PM'}{PN} = \\dfrac{M'C}{ND}$. Но $AN = ND$, значит, $BM' = M'C$ и $M' = M$: точки $P$, $M$, $N$ на одной прямой.",
      gruppy: ['p'],
    },
    {
      tekst:
        "Пусть прямая $ON$ пересекает $BC$ в точке $M''$. Углы при $O$ вертикальные, а $BC \\parallel AD$, поэтому $\\triangle OBM'' \\sim \\triangle ODN$ и $\\triangle OCM'' \\sim \\triangle OAN$: $\\dfrac{BM''}{DN} = \\dfrac{OM''}{ON} = \\dfrac{CM''}{AN}$, и снова $M'' = M$. Точка $O$ тоже лежит на прямой $MN$.",
      gruppy: ['o'],
    },
  ],
  reshenieB: [
    {
      tekst:
        '$\\triangle PBC \\sim \\triangle PAD$ с коэффициентом $\\dfrac{BC}{AD} = \\dfrac13$, и медианы $PM$ и $PN$ относятся так же: $PN = 3PM$. Так как $PN = PM + MN$, получаем $2PM = 4$, $PM = 2$.',
      gruppy: ['p'],
    },
    {
      tekst:
        '$\\triangle BOC \\sim \\triangle DOA$ с коэффициентом $\\dfrac13$, и $OM$, $ON$ — их соответственные медианы: $ON = 3OM$, $OM + ON = MN = 4$, $OM = 1$.',
      gruppy: ['o'],
    },
    {
      tekst: 'Точка $M$ лежит между $P$ и $O$, поэтому $PO = PM + MO = 2 + 1 = 3$.',
      gruppy: ['itog'],
    },
  ],
  otvet: '$3$',
};

export const OP18_PERP_DIAG: Opornaya18 = {
  id: 'perpendikulyarnye-diagonali',
  no: 12,
  gruppa: 'trapeciya',
  nazvanie: 'Перпендикулярные диагонали равнобедренной трапеции',
  uslovie:
    'Диагонали равнобедренной трапеции $ABCD$ с основаниями $AD$ и $BC$ перпендикулярны и пересекаются в точке $O$.',
  a: 'Докажите, что высота трапеции равна её средней линии.',
  b: 'Найдите площадь трапеции, если её боковая сторона равна $5$, а основание $AD$ вдвое больше основания $BC$.',
  skhemy: [
    { id: 'ravnobokaya', zachem: 'диагонали равны, треугольники $AOD$ и $BOC$ равнобедренные' },
    {
      id: 'sredlin-trap',
      zachem: 'средняя линия равна полусумме оснований, площадь — средняя линия на высоту',
    },
  ],
  reshenieA: [
    {
      tekst:
        'В равнобедренной трапеции $\\angle OAD = \\angle ODA$ и $\\angle OBC = \\angle OCB$, так что треугольники $AOD$ и $BOC$ равнобедренные, а по условию ещё и прямоугольные.',
      gruppy: ['pr'],
    },
    {
      tekst:
        'Проведём через $O$ высоту $PQ$ ($P$ на $AD$, $Q$ на $BC$). В равнобедренном прямоугольном треугольнике высота к гипотенузе — она же медиана — равна половине гипотенузы: $OP = \\dfrac{AD}{2}$, $OQ = \\dfrac{BC}{2}$. Значит, $PQ = \\dfrac{AD + BC}{2}$ — это средняя линия.',
      gruppy: ['vys'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'Пусть $BC = x$, $AD = 2x$; по пункту а) высота $h = \\dfrac{3x}{2}$. Опустим высоту $BH$: $AH = \\dfrac{AD - BC}{2} = \\dfrac{x}{2}$.',
      gruppy: ['ah'],
    },
    {
      tekst:
        'В прямоугольном треугольнике $ABH$: $AB^2 = AH^2 + BH^2$, $25 = \\dfrac{x^2}{4} + \\dfrac{9x^2}{4} = \\dfrac{5x^2}{2}$, откуда $x^2 = 10$.',
      gruppy: ['ah'],
    },
    {
      tekst:
        'Площадь — средняя линия на высоту, а они равны: $S = h^2 = \\dfrac{9x^2}{4} = \\dfrac{90}{4} = \\dfrac{45}{2}$.',
      gruppy: ['pl'],
    },
  ],
  otvet: '$\\dfrac{45}{2}$',
};
