/**
 * Задачи тренажёра №18, тема «Окружность и вписанные углы». Составлены
 * для сайта. Чертежи — lib/zadanie18/trenazher/dop/okruzhnost.ts, проверка —
 * scripts/verify_schemes/trenazherDop/okruzhnost.mjs.
 */

import { ch, drob, type ZadachaDop18 } from './tipy';

export const OK18_ORTOCENTR: ZadachaDop18 = {
  id: 'ok-ortocentr',
  uroven: 2,
  nazvanie: 'Высота и радиус описанной окружности',
  /* k = √(4R² − BC²) — целое: cos A = k / 2R. */
  varianty: [
    { BC: 8, R: 5, k: 6 },
    { BC: 24, R: 13, k: 10 },
    { BC: 16, R: 10, k: 12 },
  ],
  uslovie:
    'Точка $O$ — центр окружности, описанной около остроугольного треугольника $ABC$, точка $H$ — точка пересечения его высот.',
  a: 'Докажите, что $\\angle BAH = \\angle OAC$.',
  b: (p) => `Найдите $AH$, если $BC = ${p.BC}$, а радиус описанной окружности равен $${p.R}$.`,
  skhemy: [
    {
      id: 'ugly-i-dugi',
      zachem: 'центральный угол $AOC$ вдвое больше вписанного угла $B$, опирающегося на ту же дугу',
    },
    { id: 'vysoty', zachem: 'высоты дают прямоугольные треугольники с углами треугольника $ABC$' },
  ],
  podskazka:
    'Вырази оба угла через $\\angle B$: один — из прямоугольного треугольника с высотой, другой — из равнобедренного треугольника $AOC$.',
  dokazatelstvo: [
    {
      tekst:
        'Пусть $AA_1$ — высота. В прямоугольном треугольнике $ABA_1$: $\\angle BAH = \\angle BAA_1 = 90^\\circ - \\angle B$.',
      gruppy: ['bah'],
    },
    {
      tekst:
        'Центральный угол $AOC$ опирается на ту же дугу, что и вписанный угол $B$, поэтому $\\angle AOC = 2\\angle B$. Треугольник $AOC$ равнобедренный ($OA = OC$), и $\\angle OAC = \\dfrac{180^\\circ - 2\\angle B}{2} = 90^\\circ - \\angle B$.',
      gruppy: ['oac'],
    },
    {
      tekst: 'Значит, $\\angle BAH = \\angle OAC$.',
      gruppy: ['itog'],
    },
  ],
  reshenieB: (p) => [
    {
      tekst: `По теореме синусов $\\sin A = \\dfrac{BC}{2R} = \\dfrac{${p.BC}}{${2 * p.R!}} = ${drob(p.BC!, 2 * p.R!)}$; угол $A$ острый, поэтому $\\cos A = \\sqrt{1 - \\sin^2 A} = ${drob(p.k!, 2 * p.R!)}$.`,
      gruppy: ['om'],
    },
    {
      tekst:
        'Пусть $BB_1$ — вторая высота. Из прямоугольного треугольника $ABB_1$: $AB_1 = AB\\cos A$. В прямоугольном треугольнике $AHB_1$ угол $HAB_1$ равен $90^\\circ - \\angle C$, поэтому $AH = \\dfrac{AB_1}{\\sin C} = \\dfrac{AB\\cos A}{\\sin C}$.',
      gruppy: ['ah'],
    },
    {
      tekst: `По теореме синусов $AB = 2R\\sin C$, значит, $AH = 2R\\cos A = ${2 * p.R!}\\cdot${drob(p.k!, 2 * p.R!)} = ${ch(p.k!)}$.`,
      gruppy: ['ah'],
    },
  ],
  otvet: (p) => p.k!,
};

export const OK18_SEKUSHCHIE: ZadachaDop18 = {
  id: 'ok-sekushchie',
  uroven: 2,
  nazvanie: 'Две секущие и хорды между ними',
  /* PD = PA·PB / PC; C между P и D: PC < PD. */
  varianty: [
    { PA: 4, PB: 9, PC: 3, BD: 12 },
    { PA: 3, PB: 8, PC: 4, BD: 10 },
    { PA: 6, PB: 10, PC: 5, BD: 9 },
  ],
  uslovie:
    'Через точку $P$, лежащую вне окружности, проведены две секущие. Первая пересекает окружность в точках $A$ и $B$, вторая — в точках $C$ и $D$, причём $A$ лежит между $P$ и $B$, а $C$ — между $P$ и $D$.',
  a: 'Докажите, что треугольники $PAC$ и $PDB$ подобны.',
  b: (p) => `Найдите $AC$, если $PA = ${p.PA}$, $PB = ${p.PB}$, $PC = ${p.PC}$ и $BD = ${p.BD}$.`,
  skhemy: [
    {
      id: 'dve-sekushchie',
      zachem: 'две секущие из одной точки дают подобные треугольники и $PA\\cdot PB = PC\\cdot PD$',
    },
    {
      id: 'chetyrekhugolniki',
      zachem: 'у вписанного четырёхугольника $ABDC$ сумма противоположных углов $180^\\circ$',
    },
  ],
  podskazka:
    'Четырёхугольник $ABDC$ вписан в окружность. Как связаны его внешний угол при вершине $C$ и внутренний угол при противоположной вершине $B$?',
  dokazatelstvo: [
    {
      tekst:
        'Четырёхугольник $ABDC$ вписан: $\\angle ACD + \\angle ABD = 180^\\circ$. Угол $PCA$ смежен с $\\angle ACD$, поэтому $\\angle PCA = \\angle ABD = \\angle PBD$.',
      gruppy: ['ugly'],
    },
    {
      tekst:
        'Угол $P$ у треугольников $PAC$ и $PDB$ общий. По двум углам $\\triangle PAC \\sim \\triangle PDB$ ($A \\leftrightarrow D$, $C \\leftrightarrow B$).',
      gruppy: ['pod'],
    },
  ],
  reshenieB: (p) => {
    const PD = (p.PA! * p.PB!) / p.PC!;
    return [
      {
        tekst: `Из подобия $\\dfrac{PA}{PD} = \\dfrac{PC}{PB}$, то есть $PA\\cdot PB = PC\\cdot PD$: $${p.PA}\\cdot ${p.PB} = ${p.PC}\\cdot PD$ и $PD = ${ch(PD)}$.`,
        gruppy: ['stepen'],
      },
      {
        tekst: `Коэффициент подобия $k = \\dfrac{PA}{PD} = \\dfrac{${p.PA}}{${ch(PD)}} = ${drob(p.PA! * p.PC!, p.PA! * p.PB!)}$, поэтому $AC = k\\cdot DB = ${drob(p.PC!, p.PB!)}\\cdot ${p.BD} = ${ch((p.BD! * p.PC!) / p.PB!)}$.`,
        gruppy: ['otv'],
      },
    ];
  },
  otvet: (p) => (p.BD! * p.PC!) / p.PB!,
};

export const OK18_BRAHMAGUPTA: ZadachaDop18 = {
  id: 'ok-brahmagupta',
  uroven: 3,
  nazvanie: 'Перпендикулярные диагонали вписанного четырёхугольника',
  varianty: [
    { BC: 6, AD: 8 },
    { BC: 10, AD: 24 },
    { BC: 12, AD: 16 },
  ],
  uslovie:
    'Диагонали четырёхугольника $ABCD$, вписанного в окружность, перпендикулярны и пересекаются в точке $P$. Точка $M$ — середина стороны $BC$, прямая $MP$ пересекает сторону $AD$ в точке $K$.',
  a: 'Докажите, что $MK \\perp AD$.',
  b: (p) => `Найдите радиус окружности, если $BC = ${p.BC}$ и $AD = ${p.AD}$.`,
  skhemy: [
    {
      id: 'pryamye-ugly',
      zachem: 'медиана прямоугольного треугольника $BPC$ равна половине гипотенузы: $PM = MB = MC$',
    },
    {
      id: 'ravnye-ugly',
      zachem: 'вписанные углы $CBD$ и $CAD$ опираются на одну дугу $CD$',
    },
  ],
  podskazka:
    'В прямоугольном треугольнике $BPC$ проведена медиана $PM$. Какие углы при вершине $P$ получаются равными?',
  dokazatelstvo: [
    {
      tekst:
        'Треугольник $BPC$ прямоугольный, $PM$ — медиана к гипотенузе: $PM = MB = MC$. Значит, $\\triangle MPB$ равнобедренный и $\\angle MPB = \\angle MBP = \\angle CBD$.',
      gruppy: ['med'],
    },
    {
      tekst:
        '$\\angle KPD = \\angle MPB$ как вертикальные, а $\\angle CBD = \\angle CAD$ — вписанные углы, опирающиеся на дугу $CD$. Значит, $\\angle KPD = \\angle PAD$.',
      gruppy: ['ugly'],
    },
    {
      tekst:
        'Треугольник $APD$ прямоугольный: $\\angle PAD + \\angle PDA = 90^\\circ$. Тогда в треугольнике $PKD$ сумма $\\angle KPD + \\angle KDP = \\angle PAD + \\angle PDA = 90^\\circ$, поэтому $\\angle PKD = 90^\\circ$, то есть $MK \\perp AD$.',
      gruppy: ['perp'],
    },
  ],
  reshenieB: (p) => [
    {
      tekst: 'В прямоугольном треугольнике $APB$: $\\angle BAC + \\angle ABD = 90^\\circ$.',
      gruppy: ['R'],
    },
    {
      tekst:
        'По теореме синусов $BC = 2R\\sin\\angle BAC$ и $AD = 2R\\sin\\angle ABD = 2R\\cos\\angle BAC$.',
      gruppy: ['R'],
    },
    {
      tekst: `Значит, $BC^2 + AD^2 = 4R^2$: $${p.BC! ** 2} + ${p.AD! ** 2} = 4R^2$, $R = ${ch(Math.sqrt(p.BC! ** 2 + p.AD! ** 2) / 2)}$.`,
      gruppy: ['R'],
    },
  ],
  otvet: (p) => Math.sqrt(p.BC! ** 2 + p.AD! ** 2) / 2,
};
