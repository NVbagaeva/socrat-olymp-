/**
 * Задачи тренажёра №18, тема «Окружность и вписанные углы». Составлены
 * для сайта. Чертежи — lib/zadanie18/trenazher/okruzhnost.ts, проверка —
 * scripts/verify_trenazher18/okruzhnost.mjs.
 */

import type { Zadacha18 } from './tipy';

export const OK18_HORDY: Zadacha18 = {
  id: 'ok-hordy',
  no: 5,
  gruppa: 'okruzhnost',
  uroven: 'razminka',
  nazvanie: 'Пересекающиеся хорды',
  uslovie: 'Хорды $AB$ и $CD$ окружности пересекаются в точке $P$.',
  a: 'Докажите, что треугольники $APC$ и $DPB$ подобны.',
  b: 'Найдите $PD$, если $AP = 6$, $PB = 4$ и $CP = 3$.',
  skhemy: [
    {
      id: 'dve-sekushchie',
      zachem: 'для пересекающихся хорд — те же подобные треугольники и $PA\\cdot PB = PC\\cdot PD$',
    },
    { id: 'stepen-tochki', zachem: 'произведение отрезков хорд через точку $P$ одно и то же' },
  ],
  podskazka: 'Ищи пару вписанных углов, которые опираются на одну дугу $BC$.',
  dokazatelstvo: [
    {
      tekst:
        '$\\angle CAB$ и $\\angle CDB$ — вписанные углы, опирающиеся на дугу $BC$, поэтому $\\angle PAC = \\angle PDB$.',
      gruppy: ['ugly'],
    },
    {
      tekst:
        '$\\angle APC = \\angle DPB$ как вертикальные. По двум углам $\\triangle APC \\sim \\triangle DPB$ ($A \\leftrightarrow D$, $C \\leftrightarrow B$).',
      gruppy: ['vert', 'pod'],
    },
  ],
  reshenieB: [
    {
      tekst: 'Из подобия $\\dfrac{AP}{DP} = \\dfrac{CP}{BP}$, то есть $AP\\cdot PB = CP\\cdot PD$.',
      gruppy: ['pod'],
    },
    {
      tekst: '$6\\cdot 4 = 3\\cdot PD$, откуда $PD = 8$.',
      gruppy: ['otv'],
    },
  ],
  otvet: '$8$',
};

export const OK18_ORTOCENTR: Zadacha18 = {
  id: 'ok-ortocentr',
  no: 6,
  gruppa: 'okruzhnost',
  uroven: 'ege',
  nazvanie: 'Высота и радиус описанной окружности',
  uslovie:
    'Точка $O$ — центр окружности, описанной около остроугольного треугольника $ABC$, точка $H$ — точка пересечения его высот.',
  a: 'Докажите, что $\\angle BAH = \\angle OAC$.',
  b: 'Найдите $AH$, если $BC = 8$, а радиус описанной окружности равен $5$.',
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
  reshenieB: [
    {
      tekst:
        'По теореме синусов $\\sin A = \\dfrac{BC}{2R} = \\dfrac{8}{10} = \\dfrac45$; угол $A$ острый, поэтому $\\cos A = \\dfrac35$.',
      gruppy: ['om'],
    },
    {
      tekst:
        'Пусть $BB_1$ — вторая высота. Из прямоугольного треугольника $ABB_1$: $AB_1 = AB\\cos A$. В прямоугольном треугольнике $AHB_1$ угол $HAB_1$ равен $90^\\circ - \\angle C$, поэтому $AH = \\dfrac{AB_1}{\\sin C} = \\dfrac{AB\\cos A}{\\sin C}$.',
      gruppy: ['ah'],
    },
    {
      tekst:
        'По теореме синусов $AB = 2R\\sin C$, значит, $AH = 2R\\cos A = 10\\cdot\\dfrac35 = 6$.',
      gruppy: ['ah'],
    },
  ],
  otvet: '$6$',
};

export const OK18_SEKUSHCHIE: Zadacha18 = {
  id: 'ok-sekushchie',
  no: 7,
  gruppa: 'okruzhnost',
  uroven: 'ege',
  nazvanie: 'Две секущие и хорды между ними',
  uslovie:
    'Через точку $P$, лежащую вне окружности, проведены две секущие. Первая пересекает окружность в точках $A$ и $B$, вторая — в точках $C$ и $D$, причём $A$ лежит между $P$ и $B$, а $C$ — между $P$ и $D$.',
  a: 'Докажите, что треугольники $PAC$ и $PDB$ подобны.',
  b: 'Найдите $AC$, если $PA = 4$, $PB = 9$, $PC = 3$ и $BD = 12$.',
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
  reshenieB: [
    {
      tekst:
        'Из подобия $\\dfrac{PA}{PD} = \\dfrac{PC}{PB}$, то есть $PA\\cdot PB = PC\\cdot PD$: $4\\cdot 9 = 3\\cdot PD$ и $PD = 12$.',
      gruppy: ['stepen'],
    },
    {
      tekst:
        'Коэффициент подобия $k = \\dfrac{PA}{PD} = \\dfrac{4}{12} = \\dfrac13$, поэтому $AC = k\\cdot DB = \\dfrac13\\cdot 12 = 4$.',
      gruppy: ['otv'],
    },
  ],
  otvet: '$4$',
};

export const OK18_BRAHMAGUPTA: Zadacha18 = {
  id: 'ok-brahmagupta',
  no: 8,
  gruppa: 'okruzhnost',
  uroven: 'povyshennyy',
  nazvanie: 'Перпендикулярные диагонали вписанного четырёхугольника',
  uslovie:
    'Диагонали четырёхугольника $ABCD$, вписанного в окружность, перпендикулярны и пересекаются в точке $P$. Точка $M$ — середина стороны $BC$, прямая $MP$ пересекает сторону $AD$ в точке $K$.',
  a: 'Докажите, что $MK \\perp AD$.',
  b: 'Найдите радиус окружности, если $BC = 6$ и $AD = 8$.',
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
  reshenieB: [
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
      tekst: 'Значит, $BC^2 + AD^2 = 4R^2$: $36 + 64 = 4R^2$, $R = 5$.',
      gruppy: ['R'],
    },
  ],
  otvet: '$5$',
};
