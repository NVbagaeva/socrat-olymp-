/**
 * Опорные задачи №18: задачи уровня ЕГЭ, которые решаются через
 * ключевые схемы. Условия составлены заново. Чертёж каждой задачи —
 * lib/zadanie18/opornye.ts, построен по числам условия; проверка
 * scripts/verify_schemes/opornye.mjs пересчитывает по нему каждый
 * промежуточный факт и ответ.
 *
 * Шаг решения подсвечивает на чертеже свои группы — как шаг
 * доказательства на странице схемы.
 */

import type { Podsvechennoe } from './tipy';

export interface Opornaya18 {
  id: string;
  no: number;
  nazvanie: string;
  /** Общая часть условия (фигура). */
  uslovie: string;
  a: string;
  b: string;
  /** Ключевые схемы, которые нужно узнать: id из spisok.ts. */
  skhemy: readonly string[];
  /** Что в условии подсказывает схему. */
  signal: string;
  reshenieA: readonly Podsvechennoe[];
  reshenieB: readonly Podsvechennoe[];
  /** Ответ пункта б), TeX. */
  otvet: string;
  /** Тот же ответ числом — для проверки по чертежу. */
  otvetChislo: number;
}

export const OPORNYE_18: readonly Opornaya18[] = [
  {
    id: 'vysoty-podobie',
    no: 1,
    nazvanie: 'Две высоты отсекают подобный треугольник',
    uslovie: 'В остроугольном треугольнике $ABC$ проведены высоты $AA_1$ и $CC_1$.',
    a: 'Докажите, что треугольник $A_1BC_1$ подобен треугольнику $ABC$.',
    b: 'Найдите $A_1C_1$, если $AC = 10$, $\\angle ABC = 60^\\circ$.',
    skhemy: ['vysoty'],
    signal:
      'Две высоты и отрезок между их основаниями — схема «Высоты треугольника»: отсечённый треугольник подобен исходному с коэффициентом $\\cos B$.',
    reshenieA: [
      {
        tekst:
          'Треугольник $ABA_1$ прямоугольный ($\\angle AA_1B = 90^\\circ$), поэтому $BA_1 = AB\\cos B$. Так же в прямоугольном треугольнике $CBC_1$: $BC_1 = BC\\cos B$. Треугольник остроугольный, поэтому основания высот лежат на сторонах, а не на продолжениях.',
        gruppy: ['h', 'koef'],
      },
      {
        tekst:
          'Значит, $\\dfrac{BA_1}{BA} = \\dfrac{BC_1}{BC} = \\cos B$, а угол $B$ у треугольников $A_1BC_1$ и $ABC$ общий. По двум пропорциональным сторонам и углу между ними $\\triangle A_1BC_1 \\sim \\triangle ABC$ с коэффициентом $\\cos B$.',
        gruppy: ['podobie'],
      },
    ],
    reshenieB: [
      {
        tekst: 'Коэффициент подобия $k = \\cos 60^\\circ = \\dfrac12$.',
        gruppy: ['koef'],
      },
      {
        tekst:
          'Сторона $A_1C_1$ соответствует стороне $AC$: $A_1C_1 = k\\cdot AC = \\dfrac12\\cdot 10 = 5$.',
        gruppy: ['otvet'],
      },
    ],
    otvet: '$5$',
    otvetChislo: 5,
  },
  {
    id: 'trezubec-wb-wi',
    no: 2,
    nazvanie: 'Биссектриса и описанная окружность',
    uslovie:
      'Биссектриса угла $A$ треугольника $ABC$ пересекает описанную около него окружность в точке $W$. Точка $I$ — центр вписанной окружности треугольника $ABC$.',
    a: 'Докажите, что $WB = WI$.',
    b: 'Найдите $WI$, если $\\angle BAC = 60^\\circ$, $BC = 6\\sqrt3$.',
    skhemy: ['trezubec'],
    signal:
      'Биссектриса продолжена до описанной окружности, и в задаче есть центр вписанной окружности — лемма о трезубце: $WB = WC = WI$.',
    reshenieA: [
      {
        tekst:
          '$AW$ — биссектриса: $\\angle BAW = \\angle WAC = \\dfrac{\\angle A}{2}$. Центр вписанной окружности лежит на биссектрисах, поэтому $I$ на $AW$ и $BI$ — биссектриса угла $B$.',
        gruppy: ['bis'],
      },
      {
        tekst:
          'Вписанные углы $WBC$ и $WAC$ опираются на одну дугу $WC$: $\\angle WBC = \\dfrac{\\angle A}{2}$. Тогда $\\angle WBI = \\angle WBC + \\angle CBI = \\dfrac{\\angle A}{2} + \\dfrac{\\angle B}{2}$.',
        gruppy: ['ugly'],
      },
      {
        tekst:
          'Угол $WIB$ — внешний угол треугольника $ABI$: $\\angle WIB = \\angle BAI + \\angle ABI = \\dfrac{\\angle A}{2} + \\dfrac{\\angle B}{2}$. Углы $WBI$ и $WIB$ равны, треугольник $WBI$ равнобедренный: $WB = WI$.',
        gruppy: ['ravnobed'],
      },
    ],
    reshenieB: [
      {
        tekst:
          'По теореме синусов в треугольнике $ABC$: $BC = 2R\\sin A$, откуда $R = \\dfrac{6\\sqrt3}{2\\cdot\\frac{\\sqrt3}{2}} = 6$.',
        gruppy: ['bis'],
      },
      {
        tekst:
          'Хорда $WB$ видна из точки $A$ под углом $\\angle BAW = 30^\\circ$, поэтому $WB = 2R\\sin 30^\\circ = 6$.',
        gruppy: ['otvet'],
      },
      {
        tekst: 'По пункту а) $WI = WB = 6$.',
        gruppy: ['ravnobed'],
      },
    ],
    otvet: '$6$',
    otvetChislo: 6,
  },
  {
    id: 'kasatelnaya-sekushchaya',
    no: 3,
    nazvanie: 'Касательная и секущая из одной точки',
    uslovie:
      'Из точки $M$, лежащей вне окружности, проведены касательная $MA$ ($A$ — точка касания) и секущая, которая пересекает окружность в точках $B$ и $C$ ($B$ лежит между $M$ и $C$).',
    a: 'Докажите, что треугольники $MAB$ и $MCA$ подобны.',
    b: 'Найдите $BC$, если $MA = 6$, $MB = 4$.',
    skhemy: ['kasatelnaya-sekushchaya'],
    signal:
      'Из одной точки — касательная и секущая: угол между касательной и хордой равен вписанному углу, отсюда подобие и $MA^2 = MB\\cdot MC$.',
    reshenieA: [
      {
        tekst:
          'Угол между касательной $MA$ и хордой $AB$ равен половине дуги $AB$, которая лежит внутри этого угла. Вписанный угол $ACB$ опирается на ту же дугу. Значит, $\\angle MAB = \\angle MCA$.',
        gruppy: ['ugol'],
      },
      {
        tekst:
          'Угол $M$ у треугольников $MAB$ и $MCA$ общий. По двум углам $\\triangle MAB \\sim \\triangle MCA$ (вершины соответствуют в этом порядке: $M \\to M$, $A \\to C$, $B \\to A$).',
        gruppy: ['podobie'],
      },
    ],
    reshenieB: [
      {
        tekst: 'Из подобия $\\dfrac{MA}{MC} = \\dfrac{MB}{MA}$, то есть $MA^2 = MB\\cdot MC$.',
        gruppy: ['podobie'],
      },
      {
        tekst: '$MC = \\dfrac{MA^2}{MB} = \\dfrac{36}{4} = 9$, откуда $BC = MC - MB = 9 - 4 = 5$.',
        gruppy: ['otvet'],
      },
    ],
    otvet: '$5$',
    otvetChislo: 5,
  },
  {
    id: 'babochka-ploshchad',
    no: 4,
    nazvanie: 'Площадь трапеции по двум треугольникам',
    uslovie: 'Диагонали трапеции $ABCD$ с основаниями $AD$ и $BC$ пересекаются в точке $O$.',
    a: 'Докажите, что площади треугольников $AOB$ и $COD$ равны.',
    b: 'Найдите площадь трапеции, если площади треугольников $BOC$ и $AOD$ равны $4$ и $9$.',
    skhemy: ['babochka', 'obshchaya-vysota'],
    signal:
      'Трапеция и точка пересечения диагоналей — «бабочка»: боковые треугольники равновелики, треугольники у оснований подобны.',
    reshenieA: [
      {
        tekst:
          'У треугольников $ABD$ и $ACD$ общее основание $AD$, а высоты равны расстоянию между параллельными прямыми $BC$ и $AD$. Значит, $S_{ABD} = S_{ACD}$.',
        gruppy: ['abd'],
      },
      {
        tekst:
          'Вычтем из обеих площадей площадь треугольника $AOD$: $S_{AOB} = S_{ABD} - S_{AOD} = S_{ACD} - S_{AOD} = S_{COD}$.',
        gruppy: ['kryla'],
      },
    ],
    reshenieB: [
      {
        tekst:
          '$BC \\parallel AD$, поэтому $\\triangle BOC \\sim \\triangle DOA$. Площади подобных треугольников относятся как квадрат коэффициента: $k^2 = \\dfrac49$, $k = \\dfrac{OB}{OD} = \\dfrac23$.',
        gruppy: ['podobie'],
      },
      {
        tekst:
          'У треугольников $BOC$ и $COD$ общая высота из вершины $C$ на прямую $BD$, поэтому $\\dfrac{S_{COD}}{S_{BOC}} = \\dfrac{OD}{OB} = \\dfrac32$ и $S_{COD} = 6$. По пункту а) $S_{AOB} = 6$.',
        gruppy: ['kryla'],
      },
      {
        tekst: '$S_{ABCD} = 4 + 9 + 6 + 6 = 25$.',
        gruppy: ['summa'],
      },
    ],
    otvet: '$25$',
    otvetChislo: 25,
  },
  {
    id: 'menelay-otnoshenie',
    no: 5,
    nazvanie: 'Отношение отрезков по теореме Менелая',
    uslovie:
      'На стороне $AC$ треугольника $ABC$ взята точка $K$ так, что $AK : KC = 2 : 1$, точка $M$ — середина стороны $BC$. Отрезки $AM$ и $BK$ пересекаются в точке $P$.',
    a: 'Докажите, что $BP : PK = 3 : 2$.',
    b: 'Найдите площадь треугольника $ABP$, если площадь треугольника $ABC$ равна $30$.',
    skhemy: ['menelay-cheva', 'obshchaya-vysota'],
    signal:
      'Известны отношения, в которых точки делят стороны, а спрашивают отношение на отрезке внутри треугольника — теорема Менелая.',
    reshenieA: [
      {
        tekst:
          'Рассмотрим треугольник $BKC$ и прямую $AM$: она пересекает сторону $BC$ в точке $M$, сторону $BK$ в точке $P$ и продолжение стороны $KC$ в точке $A$.',
        gruppy: ['men'],
      },
      {
        tekst:
          'По теореме Менелая («из города в город через заправку»): $\\dfrac{BM}{MC}\\cdot\\dfrac{CA}{AK}\\cdot\\dfrac{KP}{PB} = 1$. Здесь $\\dfrac{BM}{MC} = 1$ и $\\dfrac{CA}{AK} = \\dfrac32$, поэтому $\\dfrac{KP}{PB} = \\dfrac23$, то есть $BP : PK = 3 : 2$.',
        gruppy: ['men'],
      },
    ],
    reshenieB: [
      {
        tekst:
          'У треугольников $ABK$ и $ABC$ общая высота из вершины $B$: $\\dfrac{S_{ABK}}{S_{ABC}} = \\dfrac{AK}{AC} = \\dfrac23$, $S_{ABK} = 20$.',
        gruppy: ['abk'],
      },
      {
        tekst:
          'У треугольников $ABP$ и $ABK$ общая высота из вершины $A$: $\\dfrac{S_{ABP}}{S_{ABK}} = \\dfrac{BP}{BK} = \\dfrac35$, $S_{ABP} = \\dfrac35\\cdot 20 = 12$.',
        gruppy: ['ploshchad'],
      },
    ],
    otvet: '$12$',
    otvetChislo: 12,
  },
  {
    id: 'kasayushchiesya-pryamoy-ugol',
    no: 6,
    nazvanie: 'Две касающиеся окружности и общая касательная',
    uslovie:
      'Окружности с центрами $O_1$ и $O_2$ касаются внешним образом в точке $K$. Прямая касается первой окружности в точке $A$, а второй — в точке $B$.',
    a: 'Докажите, что $\\angle AKB = 90^\\circ$.',
    b: 'Найдите $AB$, если радиусы окружностей равны $4$ и $9$.',
    skhemy: ['obshchaya-kasatelnaya', 'otrezki-kasatelnyh'],
    signal:
      'Две касающиеся окружности и их общая касательная — проводим общую касательную через точку касания и пользуемся равенством отрезков касательных.',
    reshenieA: [
      {
        tekst:
          'Проведём через $K$ общую касательную окружностей; она пересечёт $AB$ в точке $M$. Отрезки касательных из одной точки равны: $MA = MK$ (первая окружность) и $MK = MB$ (вторая).',
        gruppy: ['kas'],
      },
      {
        tekst:
          'Значит, $MA = MB = MK$: точка $K$ лежит на окружности с диаметром $AB$ (медиана $KM$ треугольника $AKB$ равна половине $AB$). Поэтому $\\angle AKB = 90^\\circ$.',
        gruppy: ['pryamoy'],
      },
    ],
    reshenieB: [
      {
        tekst:
          'Радиусы в точки касания перпендикулярны касательной: $O_1A \\perp AB$, $O_2B \\perp AB$, и $O_1ABO_2$ — прямоугольная трапеция. Точка касания $K$ лежит на линии центров, поэтому $O_1O_2 = 4 + 9 = 13$.',
        gruppy: ['trapeciya'],
      },
      {
        tekst:
          'Опустим перпендикуляр из $O_1$ на $O_2B$: получится прямоугольный треугольник с гипотенузой $13$ и катетами $AB$ и $9 - 4 = 5$. $AB = \\sqrt{13^2 - 5^2} = 12$. В общем виде $AB = 2\\sqrt{rR}$.',
        gruppy: ['otvet'],
      },
    ],
    otvet: '$12$',
    otvetChislo: 12,
  },
];

export function opornaya18(id: string): Opornaya18 | undefined {
  return OPORNYE_18.find((z) => z.id === id);
}

/* ── Тексты вкладки ─────────────────────────────────────────────── */

export const OPORNYE_18_UI = {
  lead: 'Задачи уровня ЕГЭ, которые решаются через ключевые схемы. Сначала узнай схему в условии, потом реши сам и сверься с решением по шагам — каждый шаг подсвечивается на чертеже.',
  zadacha: (n: number) => `Задача ${n}`,
  otkryt: 'Решать',
  nazad: 'Все опорные задачи',
  uslovie: 'Условие',
  kakieSkhemy: 'Какие схемы узнать',
  pokazatSkhemy: 'Подсказка: какие схемы',
  skrytSkhemy: 'Скрыть подсказку',
  sam: 'Реши сам: нарисуй чертёж, найди схему и докажи пункт а). Открывай решение, когда застрянешь или чтобы сверить ход.',
  reshenieA: 'Решение пункта а)',
  reshenieB: 'Решение пункта б)',
  pokazat: 'Показать решение',
  skryt: 'Скрыть решение',
  shag: (i: number, n: number) => `Шаг ${i} из ${n}`,
  nazadShag: 'Назад',
  dalee: 'Далее',
  otvet: 'Ответ',
  pokazatOtvet: 'Показать ответ',
  chertezh: (n: number) => `Чертёж к опорной задаче ${n}`,
  predydushchaya: 'Предыдущая задача',
  sleduyushchaya: 'Следующая задача',
} as const;
