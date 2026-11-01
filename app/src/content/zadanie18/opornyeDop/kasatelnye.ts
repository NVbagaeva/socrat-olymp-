/**
 * Опорные задачи №18, тема «Касательные». Составлены для сайта.
 * Проверка: scripts/verify_schemes/opornyeDop/kasatelnye.mjs.
 */

import type { OpornayaDop18 } from './tipy';

export const OP18_OPIS_TRAP: OpornayaDop18 = {
  id: 'opisannaya-trapeciya',
  no: 10,
  nazvanie: 'Окружность, вписанная в равнобедренную трапецию',
  uslovie:
    'В равнобедренную трапецию $ABCD$ с основаниями $AD$ и $BC$ вписана окружность. Она касается боковых сторон $AB$ и $CD$ в точках $K$ и $N$, оснований $AD$ и $BC$ — в точках $P$ и $Q$.',
  a: 'Докажите, что боковая сторона трапеции равна полусумме оснований.',
  b: 'Найдите $KN$, если $AD = 8$ и $BC = 2$.',
  skhemy: [
    { id: 'otrezki-kasatelnyh', zachem: 'отрезки касательных из одной вершины равны' },
    {
      id: 'ravnobokaya',
      zachem:
        'симметрия равнобедренной трапеции: $P$ и $Q$ — середины оснований, $KN \\parallel AD$',
    },
  ],
  reshenieA: [
    {
      tekst:
        'Отрезки касательных, проведённых из одной точки, равны: $AK = AP$, $BK = BQ$, $CN = CQ$, $DN = DP$.',
      gruppy: ['kas'],
    },
    {
      tekst:
        'Сложим: $AB + CD = (AP + PD) + (BQ + QC) = AD + BC$. В равнобедренной трапеции $AB = CD$, поэтому $AB = \\dfrac{AD + BC}{2}$.',
      gruppy: ['bok'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'По пункту а) $AB = \\dfrac{8 + 2}{2} = 5$. Трапеция симметрична относительно прямой $PQ$, поэтому $P$ и $Q$ — середины оснований: $AK = AP = 4$, $BK = BQ = 1$.',
      gruppy: ['kas'],
    },
    {
      tekst:
        'Точки $K$ и $N$ симметричны, поэтому $KN \\parallel AD$. Пусть $KN$ пересекает диагональ $BD$ в точке $X$. Треугольник $BKX$ подобен $BAD$ с коэффициентом $\\dfrac{BK}{BA} = \\dfrac15$: $KX = \\dfrac{AD}{5} = \\dfrac85$, и $BX : XD = 1 : 4$.',
      gruppy: ['kx'],
    },
    {
      tekst:
        'Треугольник $DXN$ подобен $DBC$ с коэффициентом $\\dfrac{DX}{DB} = \\dfrac45$: $XN = \\dfrac45\\cdot BC = \\dfrac85$. Итого $KN = KX + XN = \\dfrac{16}{5}$.',
      gruppy: ['xn'],
    },
  ],
  otvet: '$\\dfrac{16}{5}$',
  otvetChislo: 16 / 5,
};
