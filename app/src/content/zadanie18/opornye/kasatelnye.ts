/**
 * Опорные задачи №18, тема «Касательные». Составлены для сайта.
 * Проверка: scripts/verify_opornye18/kasatelnye.mjs.
 */

import type { Opornaya18 } from './tipy';

export const OP18_KAS_SEK: Opornaya18 = {
  id: 'kasatelnaya-sekushchaya',
  no: 7,
  gruppa: 'kasatelnye',
  nazvanie: 'Касательная и секущая из одной точки',
  uslovie:
    'Из точки $A$ проведены касательная к окружности ($B$ — точка касания) и секущая, которая пересекает окружность в точках $C$ и $D$, причём $C$ лежит между $A$ и $D$.',
  a: 'Докажите, что треугольники $ABC$ и $ADB$ подобны.',
  b: 'Найдите $BC$, если $AB = 6$, $AC = 4$ и $BD = 9$.',
  skhemy: [
    {
      id: 'kasatelnaya-sekushchaya',
      zachem:
        'угол между касательной и хордой равен вписанному углу, отсюда подобие и $AB^2 = AC\\cdot AD$',
    },
  ],
  reshenieA: [
    {
      tekst:
        'Угол $ABC$ между касательной $AB$ и хордой $BC$ равен половине дуги $BC$ — как и вписанный угол $BDC$, опирающийся на ту же дугу. Значит, $\\angle ABC = \\angle ADB$.',
      gruppy: ['kas'],
    },
    {
      tekst:
        'Угол $A$ у треугольников $ABC$ и $ADB$ общий. По двум углам $\\triangle ABC \\sim \\triangle ADB$ (вершина $B$ соответствует $D$, вершина $C$ — вершине $B$).',
      gruppy: ['pod'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'Из подобия $\\dfrac{AB}{AD} = \\dfrac{AC}{AB} = \\dfrac{BC}{DB}$. Из второго равенства $AD = \\dfrac{AB^2}{AC} = \\dfrac{36}{4} = 9$.',
      gruppy: ['pod'],
    },
    {
      tekst: '$BC = DB\\cdot\\dfrac{AB}{AD} = 9\\cdot\\dfrac{6}{9} = 6$.',
      gruppy: ['otn'],
    },
  ],
  otvet: '$6$',
};

export const OP18_OPIS_TRAP: Opornaya18 = {
  id: 'opisannaya-trapeciya',
  no: 8,
  gruppa: 'kasatelnye',
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
};

export const OP18_KAS_OKR: Opornaya18 = {
  id: 'kasayushchiesya-okruzhnosti',
  no: 9,
  gruppa: 'kasatelnye',
  nazvanie: 'Две окружности и общая касательная',
  uslovie:
    'Две окружности касаются внешним образом в точке $K$. Прямая касается первой окружности в точке $A$, а второй — в точке $B$.',
  a: 'Докажите, что угол $AKB$ прямой.',
  b: 'Найдите $AK$, если радиусы окружностей равны $9$ и $4$.',
  skhemy: [
    { id: 'kasayushchiesya', zachem: 'общая касательная в точке $K$ делит $AB$ пополам' },
    { id: 'obshchaya-kasatelnaya', zachem: 'длина общей внешней касательной: $AB = 2\\sqrt{Rr}$' },
    { id: 'otrezki-kasatelnyh', zachem: 'отрезки касательных из точки $M$ равны' },
  ],
  reshenieA: [
    {
      tekst:
        'Проведём через $K$ общую касательную окружностей; пусть она пересекает $AB$ в точке $M$. Отрезки касательных из точки $M$ к первой окружности равны: $MA = MK$; ко второй: $MK = MB$.',
      gruppy: ['kas-m'],
    },
    {
      tekst:
        'В треугольнике $AKB$ медиана $KM$ равна половине стороны $AB$. Значит, $K$ лежит на окружности с диаметром $AB$, и $\\angle AKB = 90^\\circ$.',
      gruppy: ['pr'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'Пусть $O_1$ и $O_2$ — центры, $O_1A = 9$, $O_2B = 4$, $O_1O_2 = 9 + 4 = 13$. Радиусы $O_1A$ и $O_2B$ перпендикулярны $AB$; опустим $O_2H \\perp O_1A$. Тогда $O_1H = 9 - 4 = 5$ и $AB = O_2H = \\sqrt{13^2 - 5^2} = 12$, $AM = 6$.',
      gruppy: ['trap'],
    },
    {
      tekst:
        '$O_1A = O_1K$ и $MA = MK$, поэтому $O_1M$ — серединный перпендикуляр к $AK$; пусть $L$ — середина $AK$. В прямоугольном треугольнике $O_1AM$: $O_1M = \\sqrt{81 + 36} = 3\\sqrt{13}$, высота $AL = \\dfrac{O_1A\\cdot AM}{O_1M} = \\dfrac{54}{3\\sqrt{13}} = \\dfrac{18}{\\sqrt{13}}$.',
      gruppy: ['o1m'],
    },
    {
      tekst: '$AK = 2AL = \\dfrac{36}{\\sqrt{13}} = \\dfrac{36\\sqrt{13}}{13}$.',
      gruppy: ['o1m'],
    },
  ],
  otvet: '$\\dfrac{36\\sqrt{13}}{13}$',
};
