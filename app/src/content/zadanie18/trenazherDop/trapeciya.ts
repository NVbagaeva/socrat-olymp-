/**
 * Задачи тренажёра №18, тема «Трапеция». Составлены для сайта.
 * Чертежи — lib/zadanie18/trenazher/dop/trapeciya.ts, проверка —
 * scripts/verify_schemes/trenazherDop/trapeciya.mjs.
 */

import { ch, drob, type ZadachaDop18 } from './tipy';

export const TP18_RAVNOBOKAYA: ZadachaDop18 = {
  id: 'tp-ravnobokaya',
  uroven: 2,
  nazvanie: 'Проекция диагонали равнобедренной трапеции',
  /* AH = √(AC² − CH²) = (AD + BC) / 2; AD и BC — только для чертежа. */
  varianty: [
    { AC: 10, CH: 6, AH: 8, AD: 12, BC: 4 },
    { AC: 13, CH: 5, AH: 12, AD: 16, BC: 8 },
    { AC: 17, CH: 8, AH: 15, AD: 20, BC: 10 },
  ],
  uslovie:
    'В равнобедренной трапеции $ABCD$ с основаниями $AD$ и $BC$ ($AD > BC$) проведена высота $CH$.',
  a: 'Докажите, что $AH = \\dfrac{AD + BC}{2}$.',
  b: (p) => `Найдите площадь трапеции, если $AC = ${p.AC}$ и $CH = ${p.CH}$.`,
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
  reshenieB: (p) => [
    {
      tekst: `Из прямоугольного треугольника $ACH$: $AH = \\sqrt{AC^2 - CH^2} = \\sqrt{${p.AC! ** 2} - ${p.CH! ** 2}} = ${p.AH}$.`,
      gruppy: ['pl'],
    },
    {
      tekst: `По пункту а) $AH$ — полусумма оснований, поэтому $S = \\dfrac{AD + BC}{2}\\cdot CH = AH\\cdot CH = ${p.AH}\\cdot ${p.CH} = ${p.AH! * p.CH!}$.`,
      gruppy: ['pl', 'ah'],
    },
  ],
  otvet: (p) => p.AH! * p.CH!,
};

export const TP18_BABOCHKA: ZadachaDop18 = {
  id: 'tp-babochka',
  uroven: 2,
  nazvanie: 'Отрезок через точку пересечения диагоналей',
  varianty: [
    { BC: 3, AD: 6 },
    { BC: 2, AD: 8 },
    { BC: 4, AD: 12 },
  ],
  uslovie:
    'Диагонали трапеции $ABCD$ с основаниями $AD$ и $BC$ пересекаются в точке $O$. Прямая, проходящая через $O$ параллельно основаниям, пересекает боковые стороны $AB$ и $CD$ в точках $K$ и $L$.',
  a: 'Докажите, что $KO = OL$.',
  b: (p) => `Найдите $KL$, если $BC = ${p.BC}$ и $AD = ${p.AD}$.`,
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
  reshenieB: (p) => {
    const KO = (p.BC! * p.AD!) / (p.AD! + p.BC!);
    return [
      {
        tekst: `$KO = BC\\cdot\\dfrac{AD}{AD + BC} = ${p.BC}\\cdot\\dfrac{${p.AD}}{${p.AD! + p.BC!}} = ${ch(KO)}$, а по пункту а) $OL = KO$.`,
        gruppy: ['pod1'],
      },
      { tekst: `$KL = 2\\cdot ${ch(KO)} = ${ch(2 * KO)}$.`, gruppy: ['otv'] },
    ];
  },
  otvet: (p) => (2 * p.BC! * p.AD!) / (p.AD! + p.BC!),
};

export const TP18_UGOL_90: ZadachaDop18 = {
  id: 'tp-ugol-90',
  uroven: 3,
  nazvanie: 'Углы при основании дают в сумме прямой угол',
  /* PA = AB·AD / (AD − BC); треугольник APD — египетский: ответы конечные. */
  varianty: [
    { AD: 14, BC: 4, AB: 6 },
    { AD: 10, BC: 5, AB: 3 },
    { AD: 20, BC: 5, AB: 12 },
  ],
  uslovie:
    'В трапеции $ABCD$ с основаниями $AD$ и $BC$ ($AD > BC$) сумма углов при основании $AD$ равна $90^\\circ$. Точки $M$ и $N$ — середины оснований $BC$ и $AD$.',
  a: 'Докажите, что $MN = \\dfrac{AD - BC}{2}$.',
  b: (p) => `Найдите площадь трапеции, если $AD = ${p.AD}$, $BC = ${p.BC}$ и $AB = ${p.AB}$.`,
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
  reshenieB: (p) => {
    const { AD, BC, AB } = p as Record<string, number>;
    const PA = (AB! * AD!) / (AD! - BC!);
    const PD = Math.sqrt(AD! ** 2 - PA ** 2);
    const hP = (PA * PD) / AD!;
    const h = (hP * (AD! - BC!)) / AD!;
    return [
      {
        tekst: `$\\triangle PBC \\sim \\triangle PAD$ с коэффициентом $\\dfrac{BC}{AD} = ${drob(BC!, AD!)}$, поэтому $PB = ${drob(BC!, AD!)} PA$ и $AB = ${drob(AD! - BC!, AD!)} PA = ${AB}$, $PA = ${ch(PA)}$.`,
        gruppy: ['p'],
      },
      {
        tekst: `В прямоугольном треугольнике $APD$: $PD = \\sqrt{${AD}^2 - ${ch(PA)}^2} = ${ch(PD)}$, высота из вершины $P$ равна $\\dfrac{${ch(PA)}\\cdot ${ch(PD)}}{${AD}} = ${ch(hP)}$.`,
        gruppy: ['h'],
      },
      {
        tekst: `Высота трапеции составляет $${drob(AD! - BC!, AD!)}$ этой высоты: $h = ${ch(h)}$. Тогда $S = \\dfrac{${AD} + ${BC}}{2}\\cdot ${ch(h)} = ${ch(((AD! + BC!) / 2) * h)}$.`,
        gruppy: ['h'],
      },
    ];
  },
  otvet: (p) => {
    const { AD, BC, AB } = p as Record<string, number>;
    const PA = (AB! * AD!) / (AD! - BC!);
    const hP = (PA * Math.sqrt(AD! ** 2 - PA ** 2)) / AD!;
    /* Ответ — конечная десятичная дробь: убираем погрешность корня. */
    return Math.round(((AD! + BC!) / 2) * ((hP * (AD! - BC!)) / AD!) * 1e6) / 1e6;
  },
};
