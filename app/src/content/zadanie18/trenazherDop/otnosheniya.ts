/**
 * Задачи тренажёра №18, тема «Отношения отрезков». Составлены для
 * сайта. Чертежи — lib/zadanie18/trenazher/dop/otnosheniya.ts, проверка —
 * scripts/verify_schemes/trenazherDop/otnosheniya.mjs.
 */

import type { ZadachaDop18 } from './tipy';

export const OT18_MEDIANY: ZadachaDop18 = {
  id: 'ot-mediany',
  uroven: 1,
  nazvanie: 'Точка пересечения медиан',
  uslovie: 'Медианы $AM$ и $BN$ треугольника $ABC$ пересекаются в точке $G$.',
  a: 'Докажите, что $AG : GM = 2 : 1$.',
  b: 'Найдите площадь треугольника $AGB$, если площадь треугольника $ABC$ равна $24$.',
  skhemy: [
    {
      id: 'sredlin-treug',
      zachem: '$MN$ — средняя линия: $MN \\parallel AB$ и $MN = \\dfrac12 AB$',
    },
    {
      id: 'obshchaya-vysota',
      zachem: 'медиана делит площадь пополам, чевиана — в отношении отрезков',
    },
  ],
  podskazka: 'Соедини середины $M$ и $N$. Какие треугольники с вершиной $G$ стали подобны?',
  dokazatelstvo: [
    {
      tekst: '$MN$ — средняя линия треугольника $ABC$: $MN \\parallel AB$, $MN = \\dfrac12 AB$.',
      gruppy: ['sredlin'],
    },
    {
      tekst:
        'Треугольники $GMN$ и $GAB$ подобны (накрест лежащие углы при $MN \\parallel AB$) с коэффициентом $\\dfrac{MN}{AB} = \\dfrac12$. Поэтому $GM : AG = 1 : 2$.',
      gruppy: ['pod'],
    },
  ],
  reshenieB: [
    {
      tekst: 'Медиана $AM$ делит площадь пополам: $S_{ABM} = \\dfrac12\\cdot 24 = 12$.',
      gruppy: ['pl'],
    },
    {
      tekst:
        'У треугольников $AGB$ и $ABM$ общая высота из вершины $B$, а $AG = \\dfrac23 AM$ по пункту а). Значит, $S_{AGB} = \\dfrac23\\cdot 12 = 8$.',
      gruppy: ['pl'],
    },
  ],
  otvet: 8,
};

export const OT18_MENELAY: ZadachaDop18 = {
  id: 'ot-menelay',
  uroven: 2,
  nazvanie: 'Прямая через середину стороны',
  uslovie:
    'Точка $M$ — середина стороны $AB$ треугольника $ABC$, точка $K$ лежит на стороне $BC$, причём $BK : KC = 3 : 1$. Прямая $MK$ пересекает продолжение стороны $AC$ за точку $C$ в точке $P$.',
  a: 'Докажите, что $CP : PA = 1 : 3$.',
  b: 'Найдите $CP$, если $AC = 8$.',
  skhemy: [
    {
      id: 'menelay-cheva',
      zachem:
        'прямая $MKP$ пересекает стороны треугольника $ABC$ (или их продолжения) — теорема Менелая',
    },
  ],
  podskazka:
    'Обойди треугольник $ABC$ по вершинам, «заезжая» в точки прямой: $A \\to M \\to B \\to K \\to C \\to P \\to A$.',
  dokazatelstvo: [
    {
      tekst:
        'Прямая $MP$ пересекает прямые $AB$, $BC$, $CA$ в точках $M$, $K$, $P$. По теореме Менелая $\\dfrac{AM}{MB}\\cdot\\dfrac{BK}{KC}\\cdot\\dfrac{CP}{PA} = 1$.',
      gruppy: ['menelay'],
    },
    {
      tekst: '$\\dfrac{AM}{MB} = 1$, $\\dfrac{BK}{KC} = 3$, поэтому $\\dfrac{CP}{PA} = \\dfrac13$.',
      gruppy: ['menelay'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'Точка $P$ — за точкой $C$, поэтому $PA = AC + CP = 8 + CP$. По пункту а) $3CP = 8 + CP$, откуда $CP = 4$.',
      gruppy: ['otv'],
    },
  ],
  otvet: 4,
};

export const OT18_CHEVA: ZadachaDop18 = {
  id: 'ot-cheva',
  uroven: 2,
  nazvanie: 'Три чевианы через одну точку',
  uslovie:
    'На сторонах $BC$ и $CA$ треугольника $ABC$ отмечены точки $A_1$ и $B_1$ так, что $BA_1 : A_1C = 1 : 2$ и $CB_1 : B_1A = 2 : 1$. Отрезки $AA_1$ и $BB_1$ пересекаются в точке $P$, прямая $CP$ пересекает сторону $AB$ в точке $C_1$.',
  a: 'Докажите, что $C_1$ — середина стороны $AB$.',
  b: 'Найдите отношение $AP : PA_1$.',
  skhemy: [
    {
      id: 'menelay-cheva',
      zachem:
        'теорема Чевы — для трёх чевиан через одну точку, теорема Менелая — для отношения на чевиане',
    },
  ],
  podskazka:
    'Для а) — теорема Чевы. Для б) — теорема Менелая в треугольнике $ABA_1$ и прямой $C_1PC$.',
  dokazatelstvo: [
    {
      tekst:
        'Чевианы $AA_1$, $BB_1$, $CC_1$ проходят через одну точку $P$, поэтому по теореме Чевы $\\dfrac{AC_1}{C_1B}\\cdot\\dfrac{BA_1}{A_1C}\\cdot\\dfrac{CB_1}{B_1A} = 1$.',
      gruppy: ['cheva'],
    },
    {
      tekst:
        '$\\dfrac{AC_1}{C_1B}\\cdot\\dfrac12\\cdot 2 = 1$, то есть $AC_1 = C_1B$: точка $C_1$ — середина $AB$.',
      gruppy: ['cheva'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'Прямая $CC_1$ пересекает стороны треугольника $ABA_1$ в точках $C_1$, $P$ и продолжение стороны $BA_1$ в точке $C$. По теореме Менелая $\\dfrac{AC_1}{C_1B}\\cdot\\dfrac{BC}{CA_1}\\cdot\\dfrac{A_1P}{PA} = 1$.',
      gruppy: ['menelay'],
    },
    {
      tekst:
        '$\\dfrac{AC_1}{C_1B} = 1$ по пункту а), $\\dfrac{BC}{CA_1} = \\dfrac32$, поэтому $\\dfrac{A_1P}{PA} = \\dfrac23$ и $AP : PA_1 = \\dfrac32$.',
      gruppy: ['menelay'],
    },
  ],
  otvet: 3 / 2,
};

export const OT18_PARALLELOGRAMM: ZadachaDop18 = {
  id: 'ot-parallelogramm',
  uroven: 3,
  nazvanie: 'Диагональ параллелограмма и два отрезка из вершины',
  uslovie:
    'В параллелограмме $ABCD$ точка $K$ — середина стороны $BC$, точка $M$ лежит на стороне $CD$, причём $CM : MD = 1 : 2$. Отрезки $AK$ и $AM$ пересекают диагональ $BD$ в точках $P$ и $Q$.',
  a: 'Докажите, что $BP = \\dfrac13 BD$.',
  b: 'Найдите площадь треугольника $APQ$, если площадь параллелограмма равна $60$.',
  skhemy: [
    {
      id: 'babochka',
      zachem:
        'параллельные стороны и диагональ дают подобные треугольники — «бабочки» $BPK$ и $DPA$, $DQM$ и $BQA$',
    },
    {
      id: 'obshchaya-vysota',
      zachem: 'треугольники с вершиной $A$ и основаниями на $BD$ относятся как основания',
    },
  ],
  podskazka:
    '$BK \\parallel AD$ и $DM \\parallel AB$. Найди, в каком отношении точки $P$ и $Q$ делят диагональ $BD$.',
  dokazatelstvo: [
    {
      tekst:
        '$BK \\parallel AD$, поэтому $\\triangle BPK \\sim \\triangle DPA$ и $\\dfrac{BP}{PD} = \\dfrac{BK}{AD} = \\dfrac12$.',
      gruppy: ['bab1'],
    },
    {
      tekst: 'Значит, $BP = \\dfrac13 BD$.',
      gruppy: ['bab1'],
    },
  ],
  reshenieB: [
    {
      tekst:
        '$DM \\parallel AB$ и $DM = \\dfrac23 CD = \\dfrac23 AB$, поэтому $\\triangle DQM \\sim \\triangle BQA$ и $\\dfrac{DQ}{QB} = \\dfrac23$, то есть $DQ = \\dfrac25 BD$.',
      gruppy: ['bab2'],
    },
    {
      tekst: 'С учётом пункта а) $PQ = BD - \\dfrac13 BD - \\dfrac25 BD = \\dfrac{4}{15} BD$.',
      gruppy: ['pl'],
    },
    {
      tekst:
        'У треугольников $APQ$ и $ABD$ общая высота из $A$, а $S_{ABD} = \\dfrac12\\cdot 60 = 30$. Значит, $S_{APQ} = \\dfrac{4}{15}\\cdot 30 = 8$.',
      gruppy: ['pl'],
    },
  ],
  otvet: 8,
};
