/**
 * Задачи тренажёра №18, тема «Трапеция». Составлены для сайта.
 * Чертежи — lib/zadanie18/trenazher/trapeciya.ts, проверка —
 * scripts/verify_trenazher18/trapeciya.mjs.
 */

import type { Zadacha18 } from './tipy';

export const TP18_SREDLIN: Zadacha18 = {
  id: 'tp-sredlin',
  no: 13,
  gruppa: 'trapeciya',
  uroven: 'razminka',
  nazvanie: 'Средняя линия между диагоналями',
  uslovie:
    'Средняя линия $MN$ трапеции $ABCD$ ($M$ на стороне $AB$, $N$ на стороне $CD$, основания $AD > BC$) пересекает диагонали $BD$ и $AC$ в точках $P$ и $Q$.',
  a: 'Докажите, что $PQ = \\dfrac{AD - BC}{2}$.',
  b: 'Найдите $PQ$, если $AD = 11$ и $BC = 5$.',
  skhemy: [
    {
      id: 'sredlin-treug',
      zachem: '$MP$ и $MQ$ — средние линии треугольников $ABD$ и $ABC$',
    },
    {
      id: 'sredlin-trap',
      zachem: 'средняя линия трапеции параллельна основаниям и делит диагонали пополам',
    },
  ],
  podskazka:
    'Средняя линия трапеции проходит через середины диагоналей. Отрезки $MP$ и $MQ$ — средние линии каких треугольников?',
  dokazatelstvo: [
    {
      tekst:
        '$MN \\parallel AD$, а $M$ — середина $AB$; значит, в треугольнике $ABD$ прямая $MN$ проходит через середину $P$ стороны $BD$, и $MP$ — средняя линия: $MP = \\dfrac12 AD$.',
      gruppy: ['mp'],
    },
    {
      tekst:
        'Так же в треугольнике $ABC$: $Q$ — середина $AC$, $MQ$ — средняя линия, $MQ = \\dfrac12 BC$.',
      gruppy: ['mq'],
    },
    {
      tekst:
        'Точки $Q$ и $P$ лежат на луче $MN$, и $MQ < MP$. Поэтому $PQ = MP - MQ = \\dfrac{AD - BC}{2}$.',
      gruppy: ['pq'],
    },
  ],
  reshenieB: [{ tekst: 'По пункту а) $PQ = \\dfrac{11 - 5}{2} = 3$.', gruppy: ['pq'] }],
  otvet: '$3$',
};

export const TP18_RAVNOBOKAYA: Zadacha18 = {
  id: 'tp-ravnobokaya',
  no: 14,
  gruppa: 'trapeciya',
  uroven: 'ege',
  nazvanie: 'Проекция диагонали равнобедренной трапеции',
  uslovie:
    'В равнобедренной трапеции $ABCD$ с основаниями $AD$ и $BC$ ($AD > BC$) проведена высота $CH$.',
  a: 'Докажите, что $AH = \\dfrac{AD + BC}{2}$.',
  b: 'Найдите площадь трапеции, если $AC = 10$ и $CH = 6$.',
  skhemy: [
    {
      id: 'ravnobokaya',
      zachem: 'проекция боковой стороны — полуразность оснований, проекция диагонали — полусумма',
    },
  ],
  podskazka: 'Опусти вторую высоту $BG$. На какие три части высоты делят основание $AD$?',
  dokazatelstvo: [
    {
      tekst:
        'Проведём ещё высоту $BG$. Прямоугольные треугольники $ABG$ и $DCH$ равны (гипотенузы $AB = CD$, катеты $BG = CH$), поэтому $AG = HD$; $GBCH$ — прямоугольник, $GH = BC$.',
      gruppy: ['proekcii'],
    },
    {
      tekst:
        'Тогда $AD = 2HD + BC$, то есть $HD = \\dfrac{AD - BC}{2}$, и $AH = AD - HD = \\dfrac{AD + BC}{2}$.',
      gruppy: ['ah'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'Из прямоугольного треугольника $ACH$: $AH = \\sqrt{AC^2 - CH^2} = \\sqrt{100 - 36} = 8$.',
      gruppy: ['pl'],
    },
    {
      tekst:
        'По пункту а) $AH$ — полусумма оснований, поэтому $S = \\dfrac{AD + BC}{2}\\cdot CH = AH\\cdot CH = 8\\cdot 6 = 48$.',
      gruppy: ['pl', 'ah'],
    },
  ],
  otvet: '$48$',
};

export const TP18_BABOCHKA: Zadacha18 = {
  id: 'tp-babochka',
  no: 15,
  gruppa: 'trapeciya',
  uroven: 'ege',
  nazvanie: 'Отрезок через точку пересечения диагоналей',
  uslovie:
    'Диагонали трапеции $ABCD$ с основаниями $AD$ и $BC$ пересекаются в точке $O$. Прямая, проходящая через $O$ параллельно основаниям, пересекает боковые стороны $AB$ и $CD$ в точках $K$ и $L$.',
  a: 'Докажите, что $KO = OL$.',
  b: 'Найдите $KL$, если $BC = 3$ и $AD = 6$.',
  skhemy: [
    {
      id: 'babochka',
      zachem: 'треугольники $BOC$ и $DOA$ подобны: диагонали делятся в отношении $BC : AD$',
    },
  ],
  podskazka:
    'Вырази $KO$ через $BC$ из треугольника $ABC$, а $OL$ — через $BC$ из треугольника $DCB$. Какие отношения при этом появляются?',
  dokazatelstvo: [
    {
      tekst:
        '$\\triangle BOC \\sim \\triangle DOA$ (накрест лежащие углы при $BC \\parallel AD$), поэтому $\\dfrac{AO}{OC} = \\dfrac{DO}{OB} = \\dfrac{AD}{BC}$, а значит, $\\dfrac{AO}{AC} = \\dfrac{DO}{DB} = \\dfrac{AD}{AD + BC}$.',
      gruppy: ['bab'],
    },
    {
      tekst:
        '$KO \\parallel BC$: $\\triangle AKO \\sim \\triangle ABC$, $KO = BC\\cdot\\dfrac{AO}{AC}$. Так же $\\triangle DLO \\sim \\triangle DCB$, $OL = BC\\cdot\\dfrac{DO}{DB}$.',
      gruppy: ['pod1', 'pod2'],
    },
    {
      tekst: 'Отношения $\\dfrac{AO}{AC}$ и $\\dfrac{DO}{DB}$ равны, поэтому $KO = OL$.',
      gruppy: ['otv'],
    },
  ],
  reshenieB: [
    {
      tekst:
        '$KO = BC\\cdot\\dfrac{AD}{AD + BC} = 3\\cdot\\dfrac{6}{9} = 2$, а по пункту а) $OL = KO$.',
      gruppy: ['pod1'],
    },
    { tekst: '$KL = 2\\cdot 2 = 4$.', gruppy: ['otv'] },
  ],
  otvet: '$4$',
};

export const TP18_UGOL_90: Zadacha18 = {
  id: 'tp-ugol-90',
  no: 16,
  gruppa: 'trapeciya',
  uroven: 'povyshennyy',
  nazvanie: 'Углы при основании дают в сумме прямой угол',
  uslovie:
    'В трапеции $ABCD$ с основаниями $AD$ и $BC$ ($AD > BC$) сумма углов при основании $AD$ равна $90^\\circ$. Точки $M$ и $N$ — середины оснований $BC$ и $AD$.',
  a: 'Докажите, что $MN = \\dfrac{AD - BC}{2}$.',
  b: 'Найдите площадь трапеции, если $AD = 14$, $BC = 4$ и $AB = 6$.',
  skhemy: [
    {
      id: 'chetyre-tochki',
      zachem:
        'середины оснований лежат на одной прямой с точкой пересечения продолжений боковых сторон',
    },
    {
      id: 'pryamye-ugly',
      zachem: 'медиана прямоугольного треугольника равна половине гипотенузы',
    },
  ],
  podskazka:
    'Продли боковые стороны до пересечения в точке $P$. Какой угол при $P$? Что можно сказать о медианах $PN$ и $PM$?',
  dokazatelstvo: [
    {
      tekst:
        'Продолжения боковых сторон пересекаются в точке $P$. В треугольнике $APD$: $\\angle APD = 180^\\circ - (\\angle A + \\angle D) = 90^\\circ$; треугольник $BPC$ тоже прямоугольный.',
      gruppy: ['p'],
    },
    {
      tekst:
        'Медианы к гипотенузам: $PN = \\dfrac12 AD$, $PM = \\dfrac12 BC$. Точки $P$, $M$, $N$ лежат на одной прямой (замечательное свойство трапеции), причём $M$ — между $P$ и $N$.',
      gruppy: ['med', 'pryamaya'],
    },
    {
      tekst: 'Поэтому $MN = PN - PM = \\dfrac{AD - BC}{2}$.',
      gruppy: ['pryamaya'],
    },
  ],
  reshenieB: [
    {
      tekst:
        '$\\triangle PBC \\sim \\triangle PAD$ с коэффициентом $\\dfrac{BC}{AD} = \\dfrac27$, поэтому $PB = \\dfrac27 PA$ и $AB = \\dfrac57 PA = 6$, $PA = 8{,}4$.',
      gruppy: ['p'],
    },
    {
      tekst:
        'В прямоугольном треугольнике $APD$: $PD = \\sqrt{14^2 - 8{,}4^2} = 11{,}2$, высота из вершины $P$ равна $\\dfrac{8{,}4\\cdot 11{,}2}{14} = 6{,}72$.',
      gruppy: ['h'],
    },
    {
      tekst:
        'Высота трапеции составляет $\\dfrac57$ этой высоты: $h = 4{,}8$. Тогда $S = \\dfrac{14 + 4}{2}\\cdot 4{,}8 = 43{,}2$.',
      gruppy: ['h'],
    },
  ],
  otvet: '$43{,}2$',
};
