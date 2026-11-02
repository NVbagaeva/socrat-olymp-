/**
 * Тренажёр №18: типы задач по новым опорным задачам (656–669; условия —
 * из курса подготовки, решения — content/zadanie18/opornye/novye.ts).
 * У каждого типа три набора чисел; чертёж — сцена опорной задачи с
 * этими числами (lib/zadanie18/trenazher/sceny.ts). Ответ б) уходит в
 * браузер только отпечатком; scripts/verify_schemes/trenazher.mjs
 * пересчитывает условие и ответ по точкам чертежа.
 *
 * Решение а) не зависит от чисел — оно то же, что у опорной задачи;
 * решение б) пересчитано для каждого набора.
 */

import type { ShagVoprosa } from '@/components/trenazher/ShagiVoprosy';
import {
  OP18_BISS_SRED,
  OP18_CHEREZ_CENTR,
  OP18_DVE_OKR,
  OP18_KAS_EF,
  OP18_KV_GIP_OTN,
  OP18_KVADRAT_PER,
  OP18_KVADRATY,
  OP18_SER_VYS,
  OP18_VNEVPIS,
  OP18_VPIS_KLM,
  OP18_VPIS_LMN,
  OP18_VYS_PERP,
} from './opornye/novye';
import type { Podsvechennoe } from './tipy';
import type { TipZadachi18 } from './trenazher';

/** Число в TeX: десятичная запятая. */
const ch = (x: number) => String(Math.round(x * 1e6) / 1e6).replace('.', '{,}');
const v = (question: string, options: string[], comment: string | null = null): ShagVoprosa => ({
  question,
  options,
  correct: 0,
  comment,
});
const sh = (tekst: string, ...gruppy: string[]): Podsvechennoe => ({ tekst, gruppy });
/** «2\sqrt3», «4\sqrt3». */
const koren3 = (k: number) => `${k}\\sqrt3`;
const k2 = (x: number) => {
  const r = Math.round(Math.sqrt(x));
  return r * r === x ? String(r) : `\\sqrt{${x}}`;
};

export const TIPY_18_NOVYE: readonly TipZadachi18[] = [
  {
    id: 'diag-trap',
    nazvanie: 'Диагонали трапеции: перенос диагонали',
    skhema: 'sredlin-trap',
    uroven: 2,
    varianty: [
      { a: 9, b: 4, d1: 12, d2: 5 },
      { a: 11, b: 4, d1: 9, d2: 12 },
      { a: 16, b: 9, d1: 7, d2: 24 },
    ],
    tekst: (p) => ({
      uslovie: `Основания трапеции равны $${p.b}$ и $${p.a}$, а её диагонали равны $${p.d2}$ и $${p.d1}$.`,
      a: 'Докажите, что диагонали трапеции перпендикулярны.',
      b: 'Найдите площадь трапеции.',
    }),
    otvet: (p) => (p.d1! * p.d2!) / 2,
    podskazka: (p) => [
      v(
        'Какое построение собирает обе диагонали и сумму оснований в одном треугольнике?',
        [
          'прямая через $C$, параллельная $BD$, до прямой $AD$',
          'средняя линия трапеции',
          'высота из вершины $B$',
        ],
        `Получится треугольник $ACE$ со сторонами $${p.d1}$, $${p.d2}$ и $${p.a} + ${p.b} = ${p.a! + p.b!}$.`,
      ),
      v('Чему равна площадь трапеции?', [
        'площади треугольника $ACE$',
        'половине площади треугольника $ACE$',
        'произведению диагоналей',
      ]),
    ],
    reshenieA: (p) => [
      sh(
        `Проведём через $C$ прямую, параллельную $BD$, до пересечения с прямой $AD$ в точке $E$. $BCED$ — параллелограмм, поэтому $CE = BD = ${p.d2}$ и $DE = BC = ${p.b}$.`,
        'perenos',
      ),
      sh(
        `В треугольнике $ACE$: $AC = ${p.d1}$, $CE = ${p.d2}$, $AE = ${p.a} + ${p.b} = ${p.a! + p.b!}$, и $${p.d1}^2 + ${p.d2}^2 = ${p.d1! ** 2 + p.d2! ** 2} = ${p.a! + p.b!}^2$. По теореме, обратной теореме Пифагора, $\\angle ACE = 90^\\circ$.`,
        'treug',
      ),
      sh('$AC \\perp CE$ и $CE \\parallel BD$, значит, $AC \\perp BD$.', 'ugol'),
    ],
    reshenieB: (p) => [
      sh(
        'Площадь трапеции равна площади треугольника $ACE$: основание $AE = AD + BC$, высота та же.',
        'ploshchad',
      ),
      sh(
        `$S = \\dfrac12\\cdot ${p.d1}\\cdot ${p.d2} = ${ch((p.d1! * p.d2!) / 2)}$.`,
        'ploshchad',
        'treug',
      ),
    ],
  },
  {
    id: 'kas-ef',
    nazvanie: 'Касающиеся окружности и средняя линия',
    skhema: 'kasayushchiesya',
    uroven: 2,
    varianty: [
      { R1: 8, R2: 2 },
      { R1: 9, R2: 4 },
      { R1: 25, R2: 4 },
    ],
    tekst: (p) => ({
      uslovie: OP18_KAS_EF.uslovie,
      a: OP18_KAS_EF.a,
      b: `Пусть $E$ — точка пересечения $AK$ и $O_1N$, $F$ — точка пересечения $BK$ и $O_2N$, радиусы окружностей равны $${p.R1}$ и $${p.R2}$. Найдите $EF$.`,
    }),
    otvet: (p) => Math.sqrt(p.R1! * p.R2!),
    podskazka: () => [
      v('Чем являются точки $E$ и $F$?', [
        'серединами $AK$ и $BK$',
        'точками касания',
        'центрами окружностей',
      ]),
      v('Чему равна длина общей внешней касательной $AB$?', [
        '$2\\sqrt{R_1R_2}$',
        '$R_1 + R_2$',
        '$R_1 - R_2$',
      ]),
    ],
    reshenieA: () => [...OP18_KAS_EF.reshenieA],
    reshenieB: (p) => [
      sh(
        '$O_1N$ — серединный перпендикуляр к $AK$, $O_2N$ — к $BK$, поэтому $E$ и $F$ — середины $AK$ и $BK$, и $EF = \\tfrac12 AB$.',
        'ef',
      ),
      sh(
        `$AB = \\sqrt{(${p.R1} + ${p.R2})^2 - (${p.R1} - ${p.R2})^2} = 2\\sqrt{${p.R1}\\cdot ${p.R2}} = ${ch(2 * Math.sqrt(p.R1! * p.R2!))}$, $EF = ${ch(Math.sqrt(p.R1! * p.R2!))}$.`,
        'ab',
        'otvet',
      ),
    ],
  },
  {
    id: 'kvadraty',
    nazvanie: 'Квадраты на сторонах треугольника',
    skhema: 'udvoenie-mediany',
    uroven: 3,
    varianty: [
      { AC: 14, BC: 16 },
      { AC: 3, BC: 5 },
      { AC: 7, BC: 8 },
    ],
    tekst: (p) => ({
      uslovie: OP18_KVADRATY.uslovie,
      a: OP18_KVADRATY.a,
      b: `Найдите расстояние от точки $M$ до центра квадрата $ACDE$, если $AC = ${p.AC}$, $BC = ${p.BC}$ и $\\angle ACB = 150^\\circ$.`,
    }),
    otvet: (p) => Math.sqrt(p.AC! ** 2 + p.BC! ** 2 + p.AC! * p.BC!) / 2,
    podskazka: () => [
      v('Где центр $O_1$ квадрата $ACDE$?', [
        'в середине диагонали $AD$',
        'в вершине $D$',
        'в середине стороны $CD$',
      ]),
      v('Чему равен угол $BCD$?', ['$120^\\circ$', '$240^\\circ$', '$60^\\circ$']),
    ],
    reshenieA: () => [...OP18_KVADRATY.reshenieA],
    reshenieB: (p) => {
      const bd2 = p.AC! ** 2 + p.BC! ** 2 + p.AC! * p.BC!;
      return [
        sh(
          '$O_1$ — середина $AD$, поэтому $MO_1$ — средняя линия треугольника $ABD$: $MO_1 = \\tfrac12 BD$.',
          'bd',
        ),
        sh(
          `$\\angle BCD = 360^\\circ - 150^\\circ - 90^\\circ = 120^\\circ$, $BD^2 = ${p.BC}^2 + ${p.AC}^2 + ${p.BC}\\cdot ${p.AC} = ${bd2}$, $BD = ${k2(bd2)}$, $MO_1 = ${ch(Math.sqrt(bd2) / 2)}$.`,
          'bd',
          'otvet',
        ),
      ];
    },
  },
  {
    id: 'dve-okr',
    nazvanie: 'Две окружности и диаметр одной из них',
    skhema: 'ugly-i-dugi',
    uroven: 3,
    varianty: [
      { k: 4, AB: 2 },
      { k: 3, AB: 2 },
      { k: 4, AB: 3 },
    ],
    tekst: (p) => ({
      uslovie: OP18_DVE_OKR.uslovie,
      a: OP18_DVE_OKR.a,
      b: `Найдите $AD$, если углы $DAE$ и $BAC$ равны, радиус второй окружности в $${p.k}$ раза больше радиуса первой и $AB = ${p.AB}$.`,
    }),
    otvet: (p) => p.k! * p.AB!,
    podskazka: () => [
      v('Почему $AE$ — диаметр второй окружности?', [
        '$\\angle ABE = 90^\\circ$, так как $\\angle ABC$ опирается на диаметр $AC$',
        '$AE$ проходит через $O_1$',
        '$AE = AC$',
      ]),
      v('Как связаны $AD$ и $AB$?', [
        'отношение такое же, как у диаметров $AE$ и $AC$',
        '$AD = AB$',
        '$AD = 2AB$',
      ]),
    ],
    reshenieA: () => [...OP18_DVE_OKR.reshenieA],
    reshenieB: (p) => [
      sh(
        '$\\angle ABC = 90^\\circ$, значит, и $\\angle ABE = 90^\\circ$: $AE$ — диаметр второй окружности, $\\angle ADE = 90^\\circ$.',
        'diam',
        'b',
      ),
      sh(
        `Пусть $\\angle BAC = \\angle DAE = \\alpha$, $r$ — радиус первой окружности. $AB = 2r\\cos\\alpha$, $AD = 2\\cdot ${p.k}r\\cos\\alpha$, поэтому $AD = ${p.k}\\cdot AB = ${ch(p.k! * p.AB!)}$.`,
        'b',
      ),
    ],
  },
  {
    id: 'cherez-centr',
    nazvanie: 'Окружность через центр большей окружности',
    skhema: 'pryamye-ugly',
    uroven: 3,
    varianty: [{ d: 4 }, { d: 2 }, { d: 6 }],
    tekst: (p) => ({
      uslovie: OP18_CHEREZ_CENTR.uslovie,
      a: OP18_CHEREZ_CENTR.a,
      b: `Известно, что $\\sin\\angle AOC = \\dfrac{\\sqrt{${p.d! ** 2 - 1}}}{${p.d}}$. Прямые $PC$ и $AQ$ пересекаются в точке $K$. Найдите, во сколько раз $KA$ больше $QK$.`,
    }),
    otvet: (p) => p.d!,
    podskazka: () => [
      v('Где лежит точка $C$ на дуге $AQ$?', [
        'в её середине: $BC \\perp AQ$',
        'в точке $Q$',
        'в точке $P$',
      ]),
      v('Какие треугольники подобны?', ['$KQP$ и $KMC$', '$AMO$ и $APQ$', '$KAO$ и $KQP$']),
    ],
    reshenieA: () => [...OP18_CHEREZ_CENTR.reshenieA],
    reshenieB: (p) => [
      sh(
        `$C$ — середина дуги $AQ$, не содержащей $P$, поэтому $\\angle AOC < 90^\\circ$ и $\\cos\\angle AOC = \\dfrac{1}{${p.d}}$.`,
        'dugi',
      ),
      sh(
        `Пусть $R$ — радиус большей окружности: $OM = \\dfrac{R}{${p.d}}$, $PQ = 2OM = \\dfrac{2R}{${p.d}}$, $MC = R - \\dfrac{R}{${p.d}}$.`,
        'om',
      ),
      sh(
        `$\\triangle KQP \\sim \\triangle KMC$: $\\dfrac{QK}{KM} = \\dfrac{PQ}{MC} = \\dfrac{2}{${p.d! - 1}}$. Так как $AM = QM = QK + KM$, то $\\dfrac{KA}{QK} = \\dfrac{KM + QM}{QK} = ${p.d}$.`,
        'pod',
      ),
    ],
  },
  {
    id: 'vpis-klm',
    nazvanie: 'Отрезки касательных вписанной окружности',
    skhema: 'otrezki-kasatelnyh',
    uroven: 2,
    varianty: [
      { m: 3, n: 2 },
      { m: 2, n: 1 },
      { m: 1, n: 2 },
    ],
    tekst: (p) => ({
      uslovie: OP18_VPIS_KLM.uslovie,
      a: OP18_VPIS_KLM.a,
      b: `Найдите отношение $BL : BM$, если известно, что $KC : CM = ${p.m} : ${p.n}$ и $\\angle MKL = 60^\\circ$. В ответ запишите, во сколько раз $BL$ больше, чем $BM$. Ответ запишите в виде десятичной дроби.`,
    }),
    otvet: (p) => (p.m! * (p.m! + p.n!)) / (p.n! * (3 * p.n! - p.m!)),
    podskazka: () => [
      v('Какие отрезки касательных равны?', [
        '$KA = KC$, $LA = LB$, $MB = MC$',
        '$KA = LB$',
        '$KC = CM$',
      ]),
      v('Какая теорема свяжет стороны с углом $60^\\circ$?', [
        'теорема косинусов',
        'теорема синусов',
        'теорема Пифагора',
      ]),
    ],
    reshenieA: () => [...OP18_VPIS_KLM.reshenieA],
    reshenieB: (p) => {
      const u = (p.m! * (p.m! + p.n!)) / (3 * p.n! - p.m!);
      return [
        sh(
          `Пусть $KC = KA = ${p.m}t$, $CM = MB = ${p.n}t$, $LA = LB = u$. Тогда $KM = ${p.m! + p.n!}t$, $KL = ${p.m}t + u$, $LM = ${p.n}t + u$.`,
          'b',
        ),
        sh(
          `Теорема косинусов для угла $60^\\circ$: $LM^2 = KL^2 + KM^2 - KL\\cdot KM$. Раскрываем скобки: $u = ${ch(u)}t$.`,
          'b',
        ),
        sh(`$\\dfrac{BL}{BM} = \\dfrac{u}{${p.n}t} = ${ch(u / p.n!)}$.`, 'b'),
      ];
    },
  },
  {
    id: 'vys-perp',
    nazvanie: 'Перпендикуляры к высотам треугольника',
    skhema: 'vysoty',
    uroven: 3,
    varianty: [{ B: 30 }, { B: 60 }, { B: 45 }],
    tekst: (p) => ({
      uslovie: OP18_VYS_PERP.uslovie,
      a: OP18_VYS_PERP.a,
      b: `Найдите отношение $EH : AC$, если угол $ABC$ равен $${p.B}^\\circ$. В ответе запишите это отношение в виде десятичной дроби.`,
    }),
    otvet: (p) => Math.round(Math.cos((p.B! * Math.PI) / 180) ** 2 * 1e9) / 1e9,
    podskazka: () => [
      v('Чему равно $MK$?', ['$AC\\cos B$', '$AC\\sin B$', '$AC$']),
      v('Чему равно $EH$?', ['$MK\\cos B$', '$MK\\sin B$', '$MK$']),
    ],
    reshenieA: () => [...OP18_VYS_PERP.reshenieA],
    reshenieB: (p) => [
      sh('$MK = AC\\cos B$ (ключевая схема «Высоты треугольника»).', 'mk'),
      sh(
        '$EH = MK\\cos B$: хорда окружности с диаметром $MK$, вписанный угол $EKH = 90^\\circ - B$.',
        'eh',
      ),
      sh(
        `$\\dfrac{EH}{AC} = \\cos^2 ${p.B}^\\circ = ${ch(Math.round(Math.cos((p.B! * Math.PI) / 180) ** 2 * 1e9) / 1e9)}$.`,
        'otvet',
      ),
    ],
  },
  {
    id: 'biss-sred',
    nazvanie: 'Биссектриса и средняя линия прямоугольного треугольника',
    skhema: 'sredlin-treug',
    uroven: 3,
    varianty: [
      { b: 7, a: 24 },
      { b: 3, a: 4 },
      { b: 4, a: 3 },
    ],
    tekst: (p) => ({
      uslovie: OP18_BISS_SRED.uslovie,
      a: OP18_BISS_SRED.a,
      b: `Найдите отношение площадей этих треугольников, если $\\cos\\angle BAC = \\dfrac{${p.b}}{${Math.hypot(p.a!, p.b!)}}$. В ответ запишите отношение площади треугольника $BLC$ к площади треугольника $AML$ в виде десятичной дроби.`,
    }),
    otvet: (p) => Math.round(2 * (1 - p.b! / Math.hypot(p.a!, p.b!)) * 1e9) / 1e9,
    podskazka: () => [
      v('Чему равен коэффициент подобия $BLC$ и $AML$?', [
        '$2\\sin\\dfrac A2$',
        '$\\cos A$',
        '$\\dfrac12$',
      ]),
      v('Как относятся площади подобных треугольников?', [
        'как квадрат коэффициента',
        'как коэффициент',
        'равны',
      ]),
    ],
    reshenieA: () => [...OP18_BISS_SRED.reshenieA],
    reshenieB: (p) => {
      const c = p.b! / Math.hypot(p.a!, p.b!);
      return [
        sh('$k = \\dfrac{BC}{AL} = \\dfrac{AB\\sin A}{AB\\cos\\frac A2} = 2\\sin\\dfrac A2$.', 'k'),
        sh(
          `$k^2 = 4\\sin^2\\dfrac A2 = 2(1 - \\cos A) = 2\\left(1 - ${ch(c)}\\right) = ${ch(Math.round(2 * (1 - c) * 1e9) / 1e9)}$ — это и есть отношение площадей.`,
          'pod',
        ),
      ];
    },
  },
  {
    id: 'vnevpis',
    nazvanie: 'Две вневписанные окружности прямоугольного треугольника',
    skhema: 'otrezki-kasatelnyh',
    uroven: 3,
    varianty: [
      { r1: 4, r2: 8 },
      { r1: 3, r2: 10 },
      { r1: 2, r2: 6 },
    ],
    tekst: (p) => ({
      uslovie: `Прямые, содержащие катеты $AC$ и $CB$ прямоугольного треугольника $ABC$, являются общими внутренними касательными к окружностям радиусов $${p.r1}$ и $${p.r2}$. Прямая, содержащая гипотенузу $AB$, является их общей внешней касательной.`,
      a: OP18_VNEVPIS.a,
      b: 'Найдите площадь треугольника $ACB$.',
    }),
    otvet: (p) => p.r1! * p.r2!,
    podskazka: () => [
      v('Какие это окружности?', [
        'вневписанные, касающиеся катетов',
        'вписанная и описанная',
        'вписанная и вневписанная',
      ]),
      v('Чему равны их радиусы?', [
        '$p - a$ и $p - b$',
        '$p$ и $p - c$',
        '$\\dfrac a2$ и $\\dfrac b2$',
      ]),
    ],
    reshenieA: () => [...OP18_VNEVPIS.reshenieA],
    reshenieB: (p) => [
      sh(
        'Центр окружности, точки касания с прямыми $CA$, $CB$ и вершина $C$ — квадрат: радиусы равны $p - b$ и $p - a$.',
        'kv',
      ),
      sh(
        `$(p - a)(p - b) = \\dfrac{c^2 - (a - b)^2}{4} = \\dfrac{ab}{2} = S$, поэтому $S = ${p.r1}\\cdot ${p.r2} = ${p.r1! * p.r2!}$.`,
        'kv',
      ),
    ],
  },
  {
    id: 'kvadrat-per',
    nazvanie: 'Квадрат и треугольник с периметром в две стороны',
    skhema: 'otrezki-kasatelnyh',
    uroven: 2,
    varianty: [
      { s: 7, m: 3 },
      { s: 5, m: 2 },
      { s: 9, m: 4 },
    ],
    tekst: (p) => ({
      uslovie: `Дан квадрат $ABCD$ со стороной $${p.s}$. На сторонах $BC$ и $CD$ даны точки $M$ и $N$ такие, что периметр треугольника $CMN$ равен $${2 * p.s!}$.`,
      a: OP18_KVADRAT_PER.a,
      b: 'Найдите угол $MAN$. Ответ дайте в градусах.',
    }),
    otvet: () => 45,
    podskazka: () => [
      v('Чему равна касательная из $C$ до вневписанной окружности треугольника $CMN$?', [
        'полупериметру — стороне квадрата',
        'стороне $MN$',
        'диагонали квадрата',
      ]),
      v('Что такое $AM$ и $AN$?', ['биссектрисы углов $BAP$ и $PAD$', 'медианы', 'высоты']),
    ],
    reshenieA: () => [...OP18_KVADRAT_PER.reshenieA],
    reshenieB: () => [...OP18_KVADRAT_PER.reshenieB],
  },
  {
    id: 'ser-vys',
    nazvanie: 'Середины сторон и основание высоты',
    skhema: 'sredlin-treug',
    uroven: 2,
    varianty: [{ k: 1 }, { k: 2 }, { k: 3 }],
    tekst: (p) => ({
      uslovie: OP18_SER_VYS.uslovie,
      a: OP18_SER_VYS.a,
      b: `Найдите $A_1H$, если $BC = ${koren3(2 * p.k!)}$.`,
    }),
    otvet: (p) => p.k!,
    podskazka: () => [
      v('Чему равен $\\angle ABC$?', ['$75^\\circ$', '$60^\\circ$', '$45^\\circ$']),
      v('Как найти $A_1H$?', ['$BA_1 - BH$', '$BA_1 + BH$', '$AH$']),
    ],
    reshenieA: () => [...OP18_SER_VYS.reshenieA],
    reshenieB: (p) => [
      sh(
        `$\\angle B = 75^\\circ$, по теореме синусов $AB = \\dfrac{BC\\sin 45^\\circ}{\\sin 60^\\circ} = \\dfrac{${koren3(2 * p.k!)}\\cdot\\frac{\\sqrt2}{2}}{\\frac{\\sqrt3}{2}} = ${p.k === 1 ? '' : 2 * p.k!}${p.k === 1 ? '2' : ''}\\sqrt2$.`,
        'hc1',
      ),
      sh(
        `$BH = AB\\cos 75^\\circ = ${p.k === 1 ? '\\sqrt3 - 1' : `${p.k}(\\sqrt3 - 1)`}$, $BA_1 = \\dfrac{BC}{2} = ${p.k === 1 ? '' : p.k}\\sqrt3$.`,
        'trap',
      ),
      sh(`$A_1H = BA_1 - BH = ${p.k}$.`, 'trap'),
    ],
  },
  {
    id: 'kv-gip',
    nazvanie: 'Квадрат на гипотенузе: где центр вписанной окружности',
    skhema: 'pryamye-ugly',
    uroven: 3,
    varianty: [
      { b: 4, a: 3 },
      { b: 24, a: 7 },
      { b: 117, a: 44 },
    ],
    tekst: (p) => ({
      uslovie: OP18_KV_GIP_OTN.uslovie,
      a: OP18_KV_GIP_OTN.a,
      b: `Найдите отношение $CM : OM$, если $\\sin A = ${ch(p.a! / Math.hypot(p.a!, p.b!))}$. В ответе запишите это отношение в виде десятичной дроби.`,
    }),
    otvet: (p) => Math.round(((2 * p.a! * p.b!) / (p.a! ** 2 + p.b! ** 2)) * 1e9) / 1e9,
    podskazka: () => [
      v('Какие хорды пересекаются в точке $M$?', ['$CO$ и $AB$', '$AC$ и $BO$', '$AO$ и $BC$']),
      v('В каком отношении $CM$ делит $AB$?', ['$AC : BC$', '$1 : 1$', '$AB : AC$']),
    ],
    reshenieA: () => [...OP18_KV_GIP_OTN.reshenieA],
    reshenieB: (p) => {
      const c = Math.hypot(p.a!, p.b!);
      return [
        sh(
          `$\\sin A = \\dfrac{BC}{AB}$: пусть $BC = ${p.a}x$, $AB = ${c}x$, $AC = ${p.b}x$. $AM : MB = AC : BC$, $CM = \\dfrac{\\sqrt2\\, AC\\cdot BC}{AC + BC}$.`,
          'biss',
        ),
        sh(
          `$CM\\cdot MO = AM\\cdot MB$, поэтому $\\dfrac{CM}{OM} = \\dfrac{CM^2}{AM\\cdot MB} = \\dfrac{2\\,AC\\cdot BC}{AB^2} = \\dfrac{2\\cdot ${p.a}\\cdot ${p.b}}{${c}^2} = ${ch(Math.round(((2 * p.a! * p.b!) / (c * c)) * 1e9) / 1e9)}$.`,
          'hordy',
        ),
      ];
    },
  },
  {
    id: 'vpis-lmn',
    nazvanie: 'Вписанный четырёхугольник с двумя равными сторонами',
    skhema: 'ravnye-ugly',
    uroven: 3,
    varianty: [{ KM: 8 }, { KM: 6 }, { KM: 12 }],
    tekst: (p) => ({
      uslovie: OP18_VPIS_LMN.uslovie,
      a: OP18_VPIS_LMN.a,
      b: `Известно, что $KM = ${p.KM}$, угол $LMN$ равен $150^\\circ$. Найдите площадь четырёхугольника $KLMN$.`,
    }),
    otvet: (p) => p.KM! ** 2 / 4,
    podskazka: () => [
      v('Чему равен угол $LKN$?', ['$30^\\circ$', '$150^\\circ$', '$15^\\circ$']),
      v('Зависит ли площадь от положения $K$ на дуге?', ['нет', 'да', 'только при $LK = NK$']),
    ],
    reshenieA: () => [...OP18_VPIS_LMN.reshenieA],
    reshenieB: (p) => [
      sh(
        '$\\angle LKN = 30^\\circ$, $KM$ — биссектриса: $S = \\tfrac12 KM\\sin 15^\\circ(KL + KN)$.',
        'pl',
      ),
      sh('По теореме Птолемея $KL + KN = 2KM\\cos 15^\\circ$.', 'ptol'),
      sh(
        `$S = KM^2\\sin 15^\\circ\\cos 15^\\circ = \\tfrac14 KM^2 = ${ch(p.KM! ** 2 / 4)}$.`,
        'otvet',
      ),
    ],
  },
];
