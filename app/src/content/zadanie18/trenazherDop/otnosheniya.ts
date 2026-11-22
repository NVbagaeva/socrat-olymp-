/**
 * Задачи тренажёра №18, тема «Отношения отрезков». Составлены для
 * сайта. Чертежи — lib/zadanie18/trenazher/dop/otnosheniya.ts, проверка —
 * scripts/verify_schemes/trenazherDop/otnosheniya.mjs.
 */

import { ch, drob, type ZadachaDop18 } from './tipy';

export const OT18_MEDIANY: ZadachaDop18 = {
  id: 'ot-mediany',
  uroven: 1,
  nazvanie: 'Точка пересечения медиан',
  varianty: [{ S: 24 }, { S: 36 }, { S: 45 }],
  uslovie: 'Медианы $AM$ и $BN$ треугольника $ABC$ пересекаются в точке $G$.',
  a: 'Докажите, что $AG : GM = 2 : 1$.',
  b: (p) => `Найдите площадь треугольника $AGB$, если площадь треугольника $ABC$ равна $${p.S}$.`,
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
  reshenieB: (p) => [
    {
      tekst: `Медиана $AM$ делит площадь пополам: $S_{ABM} = \\dfrac12\\cdot ${p.S} = ${ch(p.S! / 2)}$.`,
      gruppy: ['pl'],
    },
    {
      tekst: `У треугольников $AGB$ и $ABM$ общая высота из вершины $B$, а $AG = \\dfrac23 AM$ по пункту а). Значит, $S_{AGB} = \\dfrac23\\cdot ${ch(p.S! / 2)} = ${ch(p.S! / 3)}$.`,
      gruppy: ['pl'],
    },
  ],
  otvet: (p) => p.S! / 3,
};

export const OT18_MENELAY: ZadachaDop18 = {
  id: 'ot-menelay',
  uroven: 2,
  nazvanie: 'Прямая через середину стороны',
  varianty: [{ AC: 8 }, { AC: 10 }, { AC: 7 }],
  uslovie:
    'Точка $M$ — середина стороны $AB$ треугольника $ABC$, точка $K$ лежит на стороне $BC$, причём $BK : KC = 3 : 1$. Прямая $MK$ пересекает продолжение стороны $AC$ за точку $C$ в точке $P$.',
  a: 'Докажите, что $CP : PA = 1 : 3$.',
  b: (p) => `Найдите $CP$, если $AC = ${p.AC}$.`,
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
  reshenieB: (p) => [
    {
      tekst: `Точка $P$ — за точкой $C$, поэтому $PA = AC + CP = ${p.AC} + CP$. По пункту а) $3CP = ${p.AC} + CP$, откуда $CP = ${ch(p.AC! / 2)}$.`,
      gruppy: ['otv'],
    },
  ],
  otvet: (p) => p.AC! / 2,
};

export const OT18_CHEVA: ZadachaDop18 = {
  id: 'ot-cheva',
  uroven: 2,
  nazvanie: 'Три чевианы через одну точку',
  /* BA₁ : A₁C = m : n, CB₁ : B₁A = n : m — по Чеве C₁ всегда середина AB.
     Ответ (m + n) / n — конечная десятичная дробь. */
  varianty: [
    { m: 1, n: 2 },
    { m: 1, n: 4 },
    { m: 3, n: 2 },
  ],
  uslovie: (p) =>
    `На сторонах $BC$ и $CA$ треугольника $ABC$ отмечены точки $A_1$ и $B_1$ так, что $BA_1 : A_1C = ${p.m} : ${p.n}$ и $CB_1 : B_1A = ${p.n} : ${p.m}$. Отрезки $AA_1$ и $BB_1$ пересекаются в точке $P$, прямая $CP$ пересекает сторону $AB$ в точке $C_1$.`,
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
  dokazatelstvo: (p) => [
    {
      tekst:
        'Чевианы $AA_1$, $BB_1$, $CC_1$ проходят через одну точку $P$, поэтому по теореме Чевы $\\dfrac{AC_1}{C_1B}\\cdot\\dfrac{BA_1}{A_1C}\\cdot\\dfrac{CB_1}{B_1A} = 1$.',
      gruppy: ['cheva'],
    },
    {
      tekst: `$\\dfrac{AC_1}{C_1B}\\cdot ${drob(p.m!, p.n!)}\\cdot ${drob(p.n!, p.m!)} = 1$, то есть $AC_1 = C_1B$: точка $C_1$ — середина $AB$.`,
      gruppy: ['cheva'],
    },
  ],
  reshenieB: (p) => [
    {
      tekst:
        'Прямая $CC_1$ пересекает стороны треугольника $ABA_1$ в точках $C_1$, $P$ и продолжение стороны $BA_1$ в точке $C$. По теореме Менелая $\\dfrac{AC_1}{C_1B}\\cdot\\dfrac{BC}{CA_1}\\cdot\\dfrac{A_1P}{PA} = 1$.',
      gruppy: ['menelay'],
    },
    {
      tekst: `$\\dfrac{AC_1}{C_1B} = 1$ по пункту а), $\\dfrac{BC}{CA_1} = ${drob(p.m! + p.n!, p.n!)}$, поэтому $\\dfrac{A_1P}{PA} = ${drob(p.n!, p.m! + p.n!)}$ и $AP : PA_1 = ${drob(p.m! + p.n!, p.n!)}$.`,
      gruppy: ['menelay'],
    },
  ],
  otvet: (p) => (p.m! + p.n!) / p.n!,
};

export const OT18_PARALLELOGRAMM: ZadachaDop18 = {
  id: 'ot-parallelogramm',
  uroven: 3,
  nazvanie: 'Диагональ параллелограмма и два отрезка из вершины',
  varianty: [{ S: 60 }, { S: 90 }, { S: 45 }],
  uslovie:
    'В параллелограмме $ABCD$ точка $K$ — середина стороны $BC$, точка $M$ лежит на стороне $CD$, причём $CM : MD = 1 : 2$. Отрезки $AK$ и $AM$ пересекают диагональ $BD$ в точках $P$ и $Q$.',
  a: 'Докажите, что $BP = \\dfrac13 BD$.',
  b: (p) => `Найдите площадь треугольника $APQ$, если площадь параллелограмма равна $${p.S}$.`,
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
  reshenieB: (p) => [
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
      tekst: `У треугольников $APQ$ и $ABD$ общая высота из $A$, а $S_{ABD} = \\dfrac12\\cdot ${p.S} = ${ch(p.S! / 2)}$. Значит, $S_{APQ} = \\dfrac{4}{15}\\cdot ${ch(p.S! / 2)} = ${ch((p.S! * 2) / 15)}$.`,
      gruppy: ['pl'],
    },
  ],
  otvet: (p) => (p.S! * 2) / 15,
};
