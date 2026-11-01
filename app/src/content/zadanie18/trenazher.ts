/**
 * Тренажёр №18: задачи уровня ЕГЭ, у каждой — три набора чисел
 * (у 18 перенесённых задач trenazherDop/ — один). Условия составлены
 * заново. Задача решается через ключевую схему (podtip — id схемы из
 * spisok.ts), тема — группа схемы.
 *
 * Проверяется ответ пункта б): он уходит в браузер отпечатком
 * (lib/zadanie18/trenazher/bank.ts), этот модуль в браузер не попадает.
 * Доказательство пункта а) ученик сверяет с разбором. Чертёж задачи
 * построен по числам варианта (lib/zadanie18/trenazher/sceny.ts);
 * scripts/verify_schemes/trenazher.mjs пересчитывает по нему условие
 * и ответ.
 */

import type { ShagVoprosa } from '@/components/trenazher/ShagiVoprosy';
import type { Uroven } from '@/lib/trenazher/types';
import type { Parametry } from '@/lib/zadanie18/trenazher/sceny';
import type { Podsvechennoe } from './tipy';
import { TIPY_DOP_18 } from './trenazherDop';

export interface Tekst18 {
  uslovie: string;
  a: string;
  b: string;
}

export interface TipZadachi18 {
  /** Тип задачи; он же ключ чертежа (sceny.ts). */
  id: string;
  /** Ключевая схема — чип фильтра. */
  skhema: string;
  uroven: Uroven;
  varianty: readonly Parametry[];
  tekst: (p: Parametry) => Tekst18;
  otvet: (p: Parametry) => number;
  podskazka: (p: Parametry) => ShagVoprosa[];
  reshenieA: (p: Parametry) => Podsvechennoe[];
  reshenieB: (p: Parametry) => Podsvechennoe[];
}

/** Число в TeX: десятичная запятая. */
const ch = (x: number) => String(Math.round(x * 1e6) / 1e6).replace('.', '{,}');
/** Корень в TeX: точный квадрат — числом. */
function koren(x: number): string {
  const r = Math.round(Math.sqrt(x));
  return r * r === x ? String(r) : `\\sqrt{${x}}`;
}
const v = (question: string, options: string[], comment: string | null = null): ShagVoprosa => ({
  question,
  options,
  correct: 0,
  comment,
});
const sh = (tekst: string, ...gruppy: string[]): Podsvechennoe => ({ tekst, gruppy });

export const TIPY_18: readonly TipZadachi18[] = [
  {
    id: 'vysoty-cos',
    skhema: 'vysoty',
    uroven: 1,
    varianty: [
      { AB: 15, cosC: 0.6 },
      { AB: 10, cosC: 0.8 },
      { AB: 25, cosC: 0.4 },
    ],
    tekst: (p) => ({
      uslovie: 'В остроугольном треугольнике $ABC$ проведены высоты $AA_1$ и $BB_1$.',
      a: 'Докажите, что треугольник $A_1B_1C$ подобен треугольнику $ABC$.',
      b: `Найдите $A_1B_1$, если $AB = ${ch(p.AB!)}$, $\\cos\\angle ACB = ${ch(p.cosC!)}$.`,
    }),
    otvet: (p) => p.AB! * p.cosC!,
    podskazka: () => [
      v(
        'Что общего у треугольников $A_1B_1C$ и $ABC$?',
        ['общий угол $C$', 'общая сторона $AC$', 'равные площади'],
        'И стороны при нём пропорциональны.',
      ),
      v('Чему равен коэффициент подобия?', ['$\\cos C$', '$\\sin C$', '$\\tfrac12$']),
    ],
    reshenieA: () => [
      sh(
        'В прямоугольном треугольнике $AA_1C$: $CA_1 = AC\\cos C$. В прямоугольном треугольнике $BB_1C$: $CB_1 = BC\\cos C$. Треугольник остроугольный, поэтому основания высот лежат на сторонах.',
        'h',
        'koef',
      ),
      sh(
        'Значит, $\\dfrac{CA_1}{CA} = \\dfrac{CB_1}{CB} = \\cos C$, а угол $C$ общий. По двум пропорциональным сторонам и углу между ними $\\triangle A_1B_1C \\sim \\triangle ABC$ ($A_1 \\to A$, $B_1 \\to B$).',
        'podobie',
      ),
    ],
    reshenieB: (p) => [
      sh(
        `Коэффициент подобия $k = \\cos C = ${ch(p.cosC!)}$, сторона $A_1B_1$ соответствует стороне $AB$.`,
        'koef',
      ),
      sh(
        `$A_1B_1 = AB\\cos C = ${ch(p.AB!)}\\cdot ${ch(p.cosC!)} = ${ch(p.AB! * p.cosC!)}$.`,
        'otvet',
      ),
    ],
  },
  {
    id: 'bis-par',
    skhema: 'bissektrisa',
    uroven: 2,
    varianty: [
      { AB: 6, AC: 9 },
      { AB: 4, AC: 12 },
      { AB: 10, AC: 15 },
    ],
    tekst: (p) => ({
      uslovie:
        'В треугольнике $ABC$ проведена биссектриса $AL$. Прямая, проходящая через точку $L$ параллельно $AB$, пересекает сторону $AC$ в точке $M$.',
      a: 'Докажите, что $AM = ML$.',
      b: `Найдите $LM$, если $AB = ${ch(p.AB!)}$, $AC = ${ch(p.AC!)}$.`,
    }),
    otvet: (p) => (p.AB! * p.AC!) / (p.AB! + p.AC!),
    podskazka: () => [
      v(
        'Какой угол равен углу $MLA$?',
        ['$\\angle LAB$ — накрест лежащий', '$\\angle ACB$', '$\\angle ABC$'],
        'А $\\angle LAB = \\angle LAM$ — биссектриса.',
      ),
      v('Как найти отношение $CL : CB$?', [
        'по свойству биссектрисы $BL : LC = AB : AC$',
        '$L$ — середина $BC$',
        'по теореме Пифагора',
      ]),
    ],
    reshenieA: () => [
      sh(
        '$LM \\parallel AB$, поэтому $\\angle MLA = \\angle LAB$ как накрест лежащие углы при секущей $AL$.',
        'par',
      ),
      sh(
        '$AL$ — биссектриса: $\\angle LAB = \\angle LAM$. Значит, $\\angle MLA = \\angle MAL$, треугольник $AML$ равнобедренный и $AM = ML$.',
        'ravnobed',
      ),
    ],
    reshenieB: (p) => {
      const s = p.AB! + p.AC!;
      return [
        sh(
          `По свойству биссектрисы $BL : LC = AB : AC = ${ch(p.AB!)} : ${ch(p.AC!)}$, поэтому $\\dfrac{CL}{CB} = \\dfrac{${ch(p.AC!)}}{${ch(s)}}$.`,
          'bis',
        ),
        sh(
          `$LM \\parallel AB$, поэтому $\\triangle CML \\sim \\triangle CAB$ с коэффициентом $\\dfrac{CL}{CB}$: $LM = AB\\cdot\\dfrac{CL}{CB} = ${ch(p.AB!)}\\cdot\\dfrac{${ch(p.AC!)}}{${ch(s)}} = ${ch((p.AB! * p.AC!) / s)}$.`,
          'podobie',
          'otvet',
        ),
      ];
    },
  },
  {
    id: 'mediana',
    skhema: 'udvoenie-mediany',
    uroven: 2,
    varianty: [
      { AB: 5, AC: 7, BC: 8 },
      { AB: 6, AC: 8, BC: 10 },
      { AB: 4, AC: 6, BC: 8 },
    ],
    tekst: (p) => {
      const m2 = (2 * p.AB! ** 2 + 2 * p.AC! ** 2 - p.BC! ** 2) / 4;
      return {
        uslovie:
          'В треугольнике $ABC$ проведена медиана $AM$. На продолжении медианы за точку $M$ отложен отрезок $MD = AM$.',
        a: 'Докажите, что $ABDC$ — параллелограмм.',
        b: `Найдите $BC$, если $AB = ${p.AB}$, $AC = ${p.AC}$, $AM = ${koren(m2)}$.`,
      };
    },
    otvet: (p) => p.BC!,
    podskazka: () => [
      v('Почему $ABDC$ — параллелограмм?', [
        'диагонали $AD$ и $BC$ точкой $M$ делятся пополам',
        '$AB = AC$',
        '$AD \\perp BC$',
      ]),
      v('Что связывает стороны и диагонали параллелограмма?', [
        '$AD^2 + BC^2 = 2(AB^2 + AC^2)$',
        '$AD = BC$',
        '$AD\\cdot BC = AB\\cdot AC$',
      ]),
    ],
    reshenieA: () => [
      sh(
        '$BM = MC$, потому что $AM$ — медиана, и $AM = MD$ по построению. Диагонали $AD$ и $BC$ четырёхугольника $ABDC$ точкой пересечения делятся пополам — значит, это параллелограмм.',
        'par',
        'diag',
      ),
    ],
    reshenieB: (p) => {
      const m2 = (2 * p.AB! ** 2 + 2 * p.AC! ** 2 - p.BC! ** 2) / 4;
      return [
        sh(
          'В параллелограмме сумма квадратов диагоналей равна сумме квадратов всех сторон: $AD^2 + BC^2 = 2(AB^2 + AC^2)$.',
          'par',
          'diag',
        ),
        sh(
          `$AD = 2AM$, $AD^2 = 4\\cdot ${m2} = ${4 * m2}$. Тогда $BC^2 = 2(${p.AB! ** 2} + ${p.AC! ** 2}) - ${4 * m2} = ${p.BC! ** 2}$ и $BC = ${p.BC}$.`,
          'otvet',
        ),
      ];
    },
  },
  {
    id: 'vysoty-okr',
    skhema: 'pryamye-ugly',
    uroven: 1,
    varianty: [
      { uB: 70, uC: 60 },
      { uB: 65, uC: 55 },
      { uB: 50, uC: 70 },
    ],
    tekst: (p) => ({
      uslovie: 'В остроугольном треугольнике $ABC$ проведены высоты $BB_1$ и $CC_1$.',
      a: 'Докажите, что точки $B$, $C$, $B_1$ и $C_1$ лежат на одной окружности.',
      b: `Найдите угол $BB_1C_1$, если $\\angle ABC = ${p.uB}^\\circ$. Ответ дайте в градусах.`,
    }),
    otvet: (p) => 90 - p.uB!,
    podskazka: () => [
      v(
        'Под каким углом отрезок $BC$ виден из точек $B_1$ и $C_1$?',
        ['под прямым', 'под углом $A$', 'под углом $B$'],
        'Значит, обе точки лежат на окружности с диаметром $BC$.',
      ),
      v('Какой угол равен углу $BB_1C_1$?', [
        '$\\angle BCC_1$ — опирается на ту же дугу',
        '$\\angle ABC$',
        '$\\angle BAC$',
      ]),
    ],
    reshenieA: () => [
      sh(
        '$\\angle BB_1C = 90^\\circ$ и $\\angle BC_1C = 90^\\circ$: отрезок $BC$ виден из точек $B_1$ и $C_1$ под прямым углом. Поэтому обе точки лежат на окружности с диаметром $BC$.',
        'pryamye',
        'okr',
      ),
    ],
    reshenieB: (p) => [
      sh(
        'Вписанные углы $BB_1C_1$ и $BCC_1$ опираются на одну дугу $BC_1$, поэтому они равны.',
        'ugly',
      ),
      sh(
        `В прямоугольном треугольнике $BCC_1$: $\\angle BCC_1 = 90^\\circ - \\angle B = 90^\\circ - ${p.uB}^\\circ = ${90 - p.uB!}^\\circ$.`,
        'otvet',
      ),
    ],
  },
  {
    id: 'trezubec-centr',
    skhema: 'trezubec',
    uroven: 3,
    varianty: [
      { k: 10, uA: 35 },
      { k: 8, uA: 25 },
      { k: 6, uA: 40 },
    ],
    tekst: (p) => ({
      uslovie:
        'В треугольнике $ABC$ угол $B$ прямой. Биссектриса угла $B$ пересекает окружность, описанную около треугольника $ABC$, в точке $W$; точка $I$ — центр вписанной окружности треугольника $ABC$.',
      a: 'Докажите, что $W$ — центр окружности, описанной около треугольника $AIC$.',
      b: `Найдите радиус окружности, описанной около треугольника $AIC$, если $AC = ${p.k}\\sqrt2$.`,
    }),
    otvet: (p) => p.k!,
    podskazka: () => [
      v('Почему $WA = WC$?', [
        '$BW$ — биссектриса, дуги $AW$ и $WC$ равны',
        '$W$ — середина $AC$',
        '$WA \\perp WC$',
      ]),
      v(
        'Каким углом удобно сравнить $\\angle WAI$ и $\\angle WIA$?',
        [
          'оба равны $\\tfrac{\\angle A}{2} + \\tfrac{\\angle B}{2}$',
          'оба прямые',
          'оба равны $\\angle C$',
        ],
        'Это лемма о трезубце.',
      ),
    ],
    reshenieA: () => [
      sh(
        '$BW$ — биссектриса, поэтому вписанные углы $ABW$ и $WBC$ равны и опираются на равные дуги $AW$ и $WC$. Значит, $WA = WC$.',
        'bis',
        'ravn',
      ),
      sh(
        '$\\angle WAI = \\angle WAC + \\angle CAI = \\angle WBC + \\tfrac{\\angle A}{2} = \\tfrac{\\angle B}{2} + \\tfrac{\\angle A}{2}$. Угол $WIA$ — внешний угол треугольника $ABI$: $\\angle WIA = \\tfrac{\\angle A}{2} + \\tfrac{\\angle B}{2}$. Треугольник $WAI$ равнобедренный: $WA = WI$.',
        'ugly',
        'ravn',
      ),
      sh(
        '$WA = WI = WC$, поэтому $W$ — центр окружности, проходящей через $A$, $I$ и $C$.',
        'okr2',
      ),
    ],
    reshenieB: (p) => [
      sh(
        '$\\angle B = 90^\\circ$, поэтому $AC$ — диаметр описанной окружности. Угол $AWC$ опирается на диаметр и прямой, а $WA = WC$: треугольник $AWC$ — равнобедренный прямоугольный.',
        'ravn',
      ),
      sh(
        `Радиус окружности $AIC$ равен $WA = \\dfrac{AC}{\\sqrt2} = \\dfrac{${p.k}\\sqrt2}{\\sqrt2} = ${p.k}$.`,
        'otvet',
      ),
    ],
  },
  {
    id: 'vpis-hordy',
    skhema: 'chetyrekhugolniki',
    uroven: 1,
    varianty: [
      { AB: 6, AP: 4, DP: 6, BP: 5 },
      { AB: 8, AP: 6, DP: 9, BP: 7 },
      { AB: 5, AP: 2, DP: 4, BP: 4 },
    ],
    tekst: (p) => ({
      uslovie:
        'Четырёхугольник $ABCD$ вписан в окружность, его диагонали $AC$ и $BD$ пересекаются в точке $P$.',
      a: 'Докажите, что треугольники $APB$ и $DPC$ подобны.',
      b: `Найдите $CD$, если $AB = ${p.AB}$, $AP = ${p.AP}$, $DP = ${p.DP}$.`,
    }),
    otvet: (p) => (p.AB! * p.DP!) / p.AP!,
    podskazka: () => [
      v('Какой угол равен углу $BAC$?', [
        '$\\angle BDC$ — опирается на ту же дугу $BC$',
        '$\\angle ACD$',
        '$\\angle ABD$',
      ]),
      v('Какое отношение даёт подобие?', [
        '$\\dfrac{CD}{AB} = \\dfrac{DP}{AP}$',
        '$\\dfrac{CD}{AB} = \\dfrac{AP}{DP}$',
        '$CD = AB$',
      ]),
    ],
    reshenieA: () => [
      sh(
        'Вписанные углы $BAC$ и $BDC$ опираются на одну дугу $BC$, поэтому $\\angle BAP = \\angle CDP$. Углы $APB$ и $DPC$ вертикальные. По двум углам $\\triangle APB \\sim \\triangle DPC$ ($A \\to D$, $P \\to P$, $B \\to C$).',
        'ugly',
        'podobie',
      ),
    ],
    reshenieB: (p) => [
      sh(
        `Из подобия $\\dfrac{CD}{AB} = \\dfrac{DP}{AP}$, откуда $CD = \\dfrac{${p.AB}\\cdot ${p.DP}}{${p.AP}} = ${ch((p.AB! * p.DP!) / p.AP!)}$.`,
        'podobie',
        'otvet',
      ),
    ],
  },
  {
    id: 'vpis-pryam',
    skhema: 'otrezki-kasatelnyh',
    uroven: 2,
    varianty: [
      { AK: 3, BK: 10 },
      { AK: 2, BK: 3 },
      { AK: 4, BK: 6 },
    ],
    tekst: (p) => ({
      uslovie:
        'В прямоугольный треугольник $ABC$ с прямым углом $C$ вписана окружность, которая касается гипотенузы $AB$ в точке $K$.',
      a: 'Докажите, что площадь треугольника $ABC$ равна $AK\\cdot BK$.',
      b: `Найдите радиус вписанной окружности, если $AK = ${p.AK}$, $BK = ${p.BK}$.`,
    }),
    otvet: (p) => (-(p.AK! + p.BK!) + Math.sqrt((p.AK! + p.BK!) ** 2 + 4 * p.AK! * p.BK!)) / 2,
    podskazka: () => [
      v(
        'Чему равны катеты, если $r$ — радиус?',
        ['$AC = AK + r$, $BC = BK + r$', '$AC = AK$, $BC = BK$', '$AC = 2r$, $BC = 2r$'],
        'Отрезки касательных из одной вершины равны.',
      ),
      v('Какая теорема свяжет $r$ с $AK$ и $BK$?', [
        'теорема Пифагора',
        'теорема синусов',
        'свойство биссектрисы',
      ]),
    ],
    reshenieA: () => [
      sh(
        'Отрезки касательных из одной вершины равны. Из вершины $C$ оба отрезка равны $r$: радиусы в точки касания образуют с катетами квадрат. Поэтому $AC = AK + r$, $BC = BK + r$.',
        'kas',
      ),
      sh(
        'По теореме Пифагора $(AK + r)^2 + (BK + r)^2 = (AK + BK)^2$, откуда $r^2 + r(AK + BK) = AK\\cdot BK$.',
        'pifagor',
      ),
      sh(
        '$S = \\tfrac12(AK + r)(BK + r) = \\tfrac12\\bigl(AK\\cdot BK + r(AK + BK) + r^2\\bigr) = \\tfrac12\\cdot 2AK\\cdot BK = AK\\cdot BK$.',
        'pifagor',
      ),
    ],
    reshenieB: (p) => {
      const r = (-(p.AK! + p.BK!) + Math.sqrt((p.AK! + p.BK!) ** 2 + 4 * p.AK! * p.BK!)) / 2;
      return [
        sh(`Из пункта а): $r^2 + ${p.AK! + p.BK!}r = ${p.AK! * p.BK!}$.`, 'pifagor'),
        sh(
          `Корни уравнения $r^2 + ${p.AK! + p.BK!}r - ${p.AK! * p.BK!} = 0$: $r = ${ch(r)}$ и отрицательный. Радиус $r = ${ch(r)}$.`,
          'kas',
        ),
      ];
    },
  },
  {
    id: 'hordy',
    skhema: 'stepen-tochki',
    uroven: 1,
    varianty: [
      { AP: 4, PB: 9, CP: 3 },
      { AP: 6, PB: 8, CP: 4 },
      { AP: 3, PB: 10, CP: 5 },
    ],
    tekst: (p) => ({
      uslovie: 'Хорды $AB$ и $CD$ окружности пересекаются в точке $P$.',
      a: 'Докажите, что $AP\\cdot PB = CP\\cdot PD$.',
      b: `Найдите $CD$, если $AP = ${p.AP}$, $PB = ${p.PB}$, $CP = ${p.CP}$.`,
    }),
    otvet: (p) => p.CP! + (p.AP! * p.PB!) / p.CP!,
    podskazka: () => [
      v(
        'Какие треугольники подобны?',
        ['$APC$ и $DPB$', '$APB$ и $CPD$', '$ABC$ и $ABD$'],
        'Вписанные углы $CAB$ и $CDB$ опираются на одну дугу.',
      ),
      v('Как найти $PD$?', [
        '$PD = \\dfrac{AP\\cdot PB}{CP}$',
        '$PD = AP + PB - CP$',
        '$PD = \\dfrac{CP\\cdot PB}{AP}$',
      ]),
    ],
    reshenieA: () => [
      sh(
        'Вписанные углы $CAB$ и $CDB$ опираются на дугу $CB$ и равны, углы $APC$ и $DPB$ вертикальные. По двум углам $\\triangle APC \\sim \\triangle DPB$, откуда $\\dfrac{AP}{DP} = \\dfrac{CP}{BP}$, то есть $AP\\cdot PB = CP\\cdot PD$.',
        'podobie',
      ),
    ],
    reshenieB: (p) => {
      const pd = (p.AP! * p.PB!) / p.CP!;
      return [
        sh(
          `$PD = \\dfrac{AP\\cdot PB}{CP} = \\dfrac{${p.AP! * p.PB!}}{${p.CP}} = ${ch(pd)}$.`,
          'otrezki',
        ),
        sh(`$CD = CP + PD = ${p.CP} + ${ch(pd)} = ${ch(p.CP! + pd)}$.`, 'otvet'),
      ];
    },
  },
  {
    id: 'sredlin-trap',
    skhema: 'sredlin-trap',
    uroven: 1,
    varianty: [
      { AD: 11, BC: 5 },
      { AD: 14, BC: 6 },
      { AD: 9, BC: 4 },
    ],
    tekst: (p) => ({
      uslovie:
        'Точки $M$ и $N$ — середины диагоналей $AC$ и $BD$ трапеции $ABCD$ с основаниями $AD$ и $BC$.',
      a: 'Докажите, что прямая $MN$ параллельна основаниям трапеции.',
      b: `Найдите $MN$, если $AD = ${p.AD}$, $BC = ${p.BC}$.`,
    }),
    otvet: (p) => (p.AD! - p.BC!) / 2,
    podskazka: () => [
      v(
        'Какую точку удобно добавить?',
        [
          'середину $K$ боковой стороны $CD$',
          'точку пересечения диагоналей',
          'середину основания $AD$',
        ],
        'Тогда $MK$ и $NK$ — средние линии треугольников.',
      ),
      v('Чему равен $MN$?', [
        '$MK - NK = \\dfrac{AD - BC}{2}$',
        '$\\dfrac{AD + BC}{2}$',
        '$\\dfrac{AD}{2}$',
      ]),
    ],
    reshenieA: () => [
      sh(
        'Пусть $K$ — середина $CD$. Отрезок $MK$ — средняя линия треугольника $ACD$: $MK \\parallel AD$ и $MK = \\tfrac12 AD$.',
        'acd',
      ),
      sh(
        'Отрезок $NK$ — средняя линия треугольника $BCD$: $NK \\parallel BC \\parallel AD$ и $NK = \\tfrac12 BC$. Через $K$ проходит только одна прямая, параллельная $AD$, поэтому $M$, $N$, $K$ лежат на ней и $MN \\parallel AD$.',
        'bcd',
      ),
    ],
    reshenieB: (p) => [
      sh(
        `Точки $M$ и $N$ лежат на одном луче от $K$, поэтому $MN = MK - NK = \\dfrac{AD - BC}{2} = \\dfrac{${p.AD} - ${p.BC}}{2} = ${ch((p.AD! - p.BC!) / 2)}$.`,
        'otvet',
      ),
    ],
  },
  {
    id: 'ravnobok-perp',
    skhema: 'ravnobokaya',
    uroven: 2,
    varianty: [{ h: 7 }, { h: 6 }, { h: 9 }],
    tekst: (p) => ({
      uslovie:
        'Диагонали равнобедренной трапеции $ABCD$ с основаниями $AD$ и $BC$ перпендикулярны.',
      a: 'Докажите, что высота трапеции равна её средней линии.',
      b: `Найдите площадь трапеции, если её высота равна $${p.h}$.`,
    }),
    otvet: (p) => p.h! ** 2,
    podskazka: () => [
      v(
        'Какие углы у треугольника $AOD$?',
        ['$90^\\circ$, $45^\\circ$ и $45^\\circ$', '$60^\\circ$ у каждого', 'прямой при $A$'],
        'Трапеция равнобедренная: $OA = OD$.',
      ),
      v('Как высота через $O$ связана с основаниями?', [
        'её части равны $\\tfrac12 AD$ и $\\tfrac12 BC$',
        'она равна $AD$',
        'она равна $BC$',
      ]),
    ],
    reshenieA: () => [
      sh(
        'Трапеция равнобедренная, поэтому $OA = OD$ и $OB = OC$. С прямым углом при $O$ треугольники $AOD$ и $BOC$ равнобедренные прямоугольные.',
        'ravnobed',
        'diag',
      ),
      sh(
        'Проведём высоту $EF$ через $O$. В треугольнике $AOD$ она и медиана: $OF = \\tfrac12 AD$; так же $OE = \\tfrac12 BC$. Значит, $EF = \\dfrac{AD + BC}{2}$ — средняя линия.',
        'h',
      ),
    ],
    reshenieB: (p) => [
      sh(`$S = \\dfrac{AD + BC}{2}\\cdot h = h\\cdot h = ${p.h}^2 = ${p.h! ** 2}$.`, 'otvet'),
    ],
  },
  {
    id: 'menelay-pl',
    skhema: 'menelay-cheva',
    uroven: 3,
    varianty: [{ S: 36 }, { S: 48 }, { S: 60 }],
    tekst: (p) => ({
      uslovie:
        'На стороне $AB$ треугольника $ABC$ взята точка $K$ так, что $AK : KB = 1 : 2$, а на стороне $BC$ — точка $L$ так, что $BL : LC = 3 : 1$. Отрезки $AL$ и $CK$ пересекаются в точке $P$.',
      a: 'Докажите, что $AP : PL = 2 : 1$.',
      b: `Найдите площадь треугольника $APC$, если площадь треугольника $ABC$ равна $${p.S}$.`,
    }),
    otvet: (p) => p.S! / 6,
    podskazka: () => [
      v('Для какого треугольника и какой прямой записать теорему Менелая?', [
        'треугольник $ABL$ и прямая $KC$',
        'треугольник $ABC$ и прямая $AL$',
        'треугольник $APC$ и прямая $BK$',
      ]),
      v('Чему равно $\\dfrac{BC}{CL}$?', ['$4$', '$3$', '$\\tfrac13$']),
    ],
    reshenieA: () => [
      sh(
        'Прямая $KC$ пересекает сторону $AB$ треугольника $ABL$ в точке $K$, сторону $AL$ — в точке $P$ и продолжение стороны $BL$ — в точке $C$. По теореме Менелая $\\dfrac{AK}{KB}\\cdot\\dfrac{BC}{CL}\\cdot\\dfrac{LP}{PA} = 1$.',
        'men',
      ),
      sh(
        '$\\dfrac{AK}{KB} = \\dfrac12$, $\\dfrac{BC}{CL} = 4$, поэтому $\\dfrac{LP}{PA} = \\dfrac12$ и $AP : PL = 2 : 1$.',
        'men',
      ),
    ],
    reshenieB: (p) => [
      sh(
        `У треугольников $ALC$ и $ABC$ общая высота из $A$: $S_{ALC} = \\dfrac{LC}{BC}\\cdot S_{ABC} = \\dfrac14\\cdot ${p.S} = ${ch(p.S! / 4)}$.`,
        'alc',
      ),
      sh(
        `У треугольников $APC$ и $ALC$ общая высота из $C$: $S_{APC} = \\dfrac{AP}{AL}\\cdot S_{ALC} = \\dfrac23\\cdot ${ch(p.S! / 4)} = ${ch(p.S! / 6)}$.`,
        'pl',
      ),
    ],
  },
  {
    id: 'trap-seredina',
    skhema: 'metod-ploshchadey',
    uroven: 2,
    varianty: [{ S: 18 }, { S: 15 }, { S: 21 }],
    tekst: (p) => ({
      uslovie:
        'Точка $E$ — середина боковой стороны $CD$ трапеции $ABCD$ с основаниями $AD$ и $BC$.',
      a: 'Докажите, что площадь треугольника $ABE$ равна половине площади трапеции.',
      b: `Найдите площадь трапеции, если площадь треугольника $ABE$ равна $${p.S}$.`,
    }),
    otvet: (p) => 2 * p.S!,
    podskazka: () => [
      v(
        'Чему равны расстояния от $E$ до прямых $BC$ и $AD$?',
        ['по $\\tfrac{h}{2}$', 'по $h$', '$h$ и $0$'],
        '$E$ — середина $CD$.',
      ),
      v('Как получить $S_{ABE}$ из площади трапеции?', [
        'вычесть $S_{BCE}$ и $S_{ADE}$',
        'разделить на $3$',
        'умножить на $\\tfrac{BC}{AD}$',
      ]),
    ],
    reshenieA: () => [
      sh(
        'Пусть $h$ — высота трапеции. $E$ — середина $CD$, поэтому расстояния от $E$ до прямых $BC$ и $AD$ равны $\\tfrac h2$.',
        'ugly',
      ),
      sh(
        '$S_{BCE} + S_{ADE} = \\tfrac12\\cdot BC\\cdot\\tfrac h2 + \\tfrac12\\cdot AD\\cdot\\tfrac h2 = \\tfrac12\\cdot\\dfrac{AD + BC}{2}\\cdot h = \\tfrac12 S_{ABCD}$.',
        'ugly',
      ),
      sh('Значит, $S_{ABE} = S_{ABCD} - (S_{BCE} + S_{ADE}) = \\tfrac12 S_{ABCD}$.', 'abe'),
    ],
    reshenieB: (p) => [sh(`$S_{ABCD} = 2S_{ABE} = 2\\cdot ${p.S} = ${2 * p.S!}$.`, 'abe')],
  },
  {
    id: 'obshchiy-ugol',
    skhema: 'obshchiy-ugol',
    uroven: 1,
    varianty: [
      { m: 2, n: 3, p: 1, q: 1, S: 40 },
      { m: 1, n: 2, p: 3, q: 1, S: 48 },
      { m: 3, n: 1, p: 2, q: 3, S: 60 },
    ],
    tekst: (p) => {
      const d = drob(p.m! * p.p!, (p.m! + p.n!) * (p.p! + p.q!));
      return {
        uslovie: `На сторонах $AB$ и $AC$ треугольника $ABC$ взяты точки $M$ и $N$ так, что $AM : MB = ${p.m} : ${p.n}$, $AN : NC = ${p.p} : ${p.q}$.`,
        a: `Докажите, что площадь треугольника $AMN$ составляет $${d}$ площади треугольника $ABC$.`,
        b: `Найдите площадь четырёхугольника $MBCN$, если площадь треугольника $ABC$ равна $${p.S}$.`,
      };
    },
    otvet: (p) => p.S! * (1 - (p.m! * p.p!) / ((p.m! + p.n!) * (p.p! + p.q!))),
    podskazka: () => [
      v('Какая формула площади удобна для треугольников с общим углом $A$?', [
        '$S = \\tfrac12\\,ab\\sin A$',
        '$S = \\tfrac12\\,ah$',
        'формула Герона',
      ]),
      v('Как найти площадь $MBCN$?', ['$S_{ABC} - S_{AMN}$', '$S_{ABC} + S_{AMN}$', '$2S_{AMN}$']),
    ],
    reshenieA: (p) => {
      const d = drob(p.m! * p.p!, (p.m! + p.n!) * (p.p! + p.q!));
      return [
        sh(
          `$S_{AMN} = \\tfrac12\\,AM\\cdot AN\\sin A$ и $S_{ABC} = \\tfrac12\\,AB\\cdot AC\\sin A$, поэтому $\\dfrac{S_{AMN}}{S_{ABC}} = \\dfrac{AM}{AB}\\cdot\\dfrac{AN}{AC} = \\dfrac{${p.m}}{${p.m! + p.n!}}\\cdot\\dfrac{${p.p}}{${p.p! + p.q!}} = ${d}$.`,
          'amn',
        ),
      ];
    },
    reshenieB: (p) => {
      const amn = (p.S! * p.m! * p.p!) / ((p.m! + p.n!) * (p.p! + p.q!));
      return [
        sh(
          `$S_{AMN} = ${drob(p.m! * p.p!, (p.m! + p.n!) * (p.p! + p.q!))}\\cdot ${p.S} = ${ch(amn)}$.`,
          'amn',
        ),
        sh(`$S_{MBCN} = S_{ABC} - S_{AMN} = ${p.S} - ${ch(amn)} = ${ch(p.S! - amn)}$.`, 'otvet'),
      ];
    },
  } /* Перенесённые задачи с одним набором чисел — trenazherDop/. */,
  ...TIPY_DOP_18,
];

/** Несократимая дробь в TeX. */
function drob(a: number, b: number): string {
  const nod = (x: number, y: number): number => (y === 0 ? x : nod(y, x % y));
  const g = nod(a, b);
  return `\\tfrac{${a / g}}{${b / g}}`;
}

export function tip18(id: string): TipZadachi18 | undefined {
  return TIPY_18.find((t) => t.id === id);
}
