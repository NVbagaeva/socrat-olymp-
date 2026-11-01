/**
 * Опорные задачи №18, тема «Трапеция». Составлены для сайта.
 * Проверка: scripts/verify_schemes/opornyeDop/trapeciya.mjs.
 */

import type { OpornayaDop18 } from './tipy';

export const OP18_CHETYRE: OpornayaDop18 = {
  id: 'chetyre-tochki-trapecii',
  no: 11,
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
  otvetChislo: 3,
};
