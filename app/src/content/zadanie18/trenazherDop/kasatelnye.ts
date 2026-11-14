/**
 * Задачи тренажёра №18, тема «Касательные». Составлены для сайта.
 * Чертежи — lib/zadanie18/trenazher/dop/kasatelnye.ts, проверка —
 * scripts/verify_schemes/trenazherDop/kasatelnye.mjs.
 */

import { ch, drob, type ZadachaDop18 } from './tipy';

export const KS18_OTREZKI: ZadachaDop18 = {
  id: 'ks-otrezki',
  uroven: 1,
  nazvanie: 'Точка касания вписанной окружности',
  varianty: [
    { AB: 7, BC: 8, CA: 9 },
    { AB: 5, BC: 6, CA: 7 },
    { AB: 13, BC: 14, CA: 15 },
  ],
  uslovie:
    'Окружность, вписанная в треугольник $ABC$, касается сторон $AB$, $BC$ и $CA$ в точках $K$, $L$ и $M$; $p$ — полупериметр треугольника.',
  a: 'Докажите, что $AK = p - BC$.',
  b: (p) => `Найдите $AK$, если $AB = ${p.AB}$, $BC = ${p.BC}$ и $CA = ${p.CA}$.`,
  skhemy: [
    {
      id: 'otrezki-kasatelnyh',
      zachem: 'отрезки касательных из одной вершины равны: $AK = AM$, $BK = BL$, $CL = CM$',
    },
  ],
  podskazka: 'Обозначь три пары равных отрезков касательных буквами $x$, $y$, $z$ и сложи стороны.',
  dokazatelstvo: [
    {
      tekst:
        'Отрезки касательных, проведённых из одной точки, равны: $AK = AM = x$, $BK = BL = y$, $CL = CM = z$.',
      gruppy: ['ravny'],
    },
    {
      tekst:
        'Периметр $2p = 2x + 2y + 2z$, то есть $p = x + y + z$. А $BC = BL + LC = y + z$, поэтому $AK = x = p - BC$.',
      gruppy: ['p'],
    },
  ],
  reshenieB: (p) => {
    const pp = (p.AB! + p.BC! + p.CA!) / 2;
    return [
      {
        tekst: `$p = \\dfrac{${p.AB} + ${p.BC} + ${p.CA}}{2} = ${ch(pp)}$, и по пункту а) $AK = ${ch(pp)} - ${p.BC} = ${ch(pp - p.BC!)}$.`,
        gruppy: ['p'],
      },
    ];
  },
  otvet: (p) => (p.AB! + p.CA! - p.BC!) / 2,
};

export const KS18_DVE_KASATELNYE: ZadachaDop18 = {
  id: 'ks-dve-kasatelnye',
  uroven: 2,
  nazvanie: 'Две касательные из одной точки',
  /* AB = √(AO² − r²) — целое. */
  varianty: [
    { r: 6, AO: 10, AB: 8 },
    { r: 3, AO: 5, AB: 4 },
    { r: 9, AO: 15, AB: 12 },
  ],
  uslovie:
    'Из точки $A$ к окружности с центром $O$ проведены касательные $AB$ и $AC$ ($B$ и $C$ — точки касания).',
  a: 'Докажите, что прямые $AO$ и $BC$ перпендикулярны.',
  b: (p) => `Найдите $BC$, если радиус окружности равен $${p.r}$, а $AO = ${p.AO}$.`,
  skhemy: [
    {
      id: 'otrezki-kasatelnyh',
      zachem: 'касательные из одной точки равны, а центр лежит на биссектрисе угла между ними',
    },
    {
      id: 'metod-ploshchadey',
      zachem: 'высота прямоугольного треугольника — через произведение катетов и гипотенузу',
    },
  ],
  podskazka:
    'Треугольник $ABC$ равнобедренный. Чем для него служит прямая $AO$? Для б) — рассмотри прямоугольный треугольник $OBA$.',
  dokazatelstvo: [
    {
      tekst:
        'Прямоугольные треугольники $OBA$ и $OCA$ равны (общая гипотенуза $AO$, катеты $OB = OC$). Значит, $AB = AC$ и $\\angle BAO = \\angle CAO$.',
      gruppy: ['rb'],
    },
    {
      tekst:
        'В равнобедренном треугольнике $ABC$ биссектриса $AO$ угла при вершине — она же высота. Поэтому $AO \\perp BC$.',
      gruppy: ['perp'],
    },
  ],
  reshenieB: (p) => [
    {
      tekst: `В прямоугольном треугольнике $OBA$: $AB = \\sqrt{AO^2 - OB^2} = \\sqrt{${p.AO! ** 2} - ${p.r! ** 2}} = ${p.AB}$.`,
      gruppy: ['pr'],
    },
    {
      tekst: `По пункту а) $BH$ ($H$ — точка пересечения $AO$ и $BC$) — высота этого треугольника: $BH = \\dfrac{OB\\cdot AB}{AO} = \\dfrac{${p.r}\\cdot ${p.AB}}{${p.AO}} = ${drob(p.r! * p.AB!, p.AO!)}$.`,
      gruppy: ['pr', 'perp'],
    },
    {
      tekst: `$H$ — середина $BC$ (высота равнобедренного треугольника — и медиана), поэтому $BC = 2BH = ${ch((2 * p.r! * p.AB!) / p.AO!)}$.`,
      gruppy: ['perp'],
    },
  ],
  otvet: (p) => (2 * p.r! * p.AB!) / p.AO!,
};

export const KS18_VNUTR_KASANIE: ZadachaDop18 = {
  id: 'ks-vnutr-kasanie',
  uroven: 2,
  nazvanie: 'Хорда, касающаяся вписанной окружности',
  varianty: [
    { KA: 6, KB: 9, AC: 4 },
    { KA: 4, KB: 6, AC: 2 },
    { KA: 5, KB: 10, AC: 3 },
  ],
  uslovie:
    'Две окружности касаются внутренним образом в точке $K$. Хорда $AB$ большей окружности касается меньшей окружности в точке $C$.',
  a: 'Докажите, что $KC$ — биссектриса угла $AKB$.',
  b: (p) => `Найдите $AB$, если $KA = ${p.KA}$, $KB = ${p.KB}$ и $AC = ${p.AC}$.`,
  skhemy: [
    {
      id: 'kasayushchiesya',
      zachem: 'центры касающихся окружностей и точка касания лежат на одной прямой',
    },
    {
      id: 'bissektrisa',
      zachem: 'биссектриса делит сторону $AB$ в отношении $KA : KB$',
    },
  ],
  podskazka:
    'Продли $KC$ до второго пересечения с большей окружностью в точке $W$. Сравни радиусы $QC$ и $OW$ ($Q$ и $O$ — центры).',
  dokazatelstvo: [
    {
      tekst:
        'Центры $Q$ (малой) и $O$ (большой окружности) лежат на одной прямой с $K$. Пусть $KC$ пересекает большую окружность ещё в точке $W$. Треугольники $QKC$ и $OKW$ равнобедренные ($QK = QC$, $OK = OW$), и угол при основании $K$ у них общий. Поэтому $\\angle QCK = \\angle OWK$ и $QC \\parallel OW$.',
      gruppy: ['centry'],
    },
    {
      tekst:
        'Радиус $QC$ перпендикулярен касательной $AB$, значит, и $OW \\perp AB$. Радиус, перпендикулярный хорде, делит её дугу пополам: $W$ — середина дуги $AB$.',
      gruppy: ['parall'],
    },
    {
      tekst:
        'Вписанные углы $AKW$ и $WKB$ опираются на равные дуги $AW$ и $WB$, поэтому $\\angle AKC = \\angle CKB$: $KC$ — биссектриса угла $AKB$.',
      gruppy: ['duga'],
    },
  ],
  reshenieB: (p) => {
    const CB = (p.KB! * p.AC!) / p.KA!;
    return [
      {
        tekst: `По пункту а) $KC$ — биссектриса треугольника $AKB$: $\\dfrac{AC}{CB} = \\dfrac{KA}{KB} = \\dfrac{${p.KA}}{${p.KB}}$, откуда $CB = \\dfrac{${p.KB}\\cdot ${p.AC}}{${p.KA}} = ${ch(CB)}$.`,
        gruppy: ['otv'],
      },
      { tekst: `$AB = AC + CB = ${p.AC} + ${ch(CB)} = ${ch(p.AC! + CB)}$.`, gruppy: ['otv'] },
    ];
  },
  otvet: (p) => p.AC! + (p.KB! * p.AC!) / p.KA!,
};

export const KS18_PRYAM_TRAP: ZadachaDop18 = {
  id: 'ks-pryam-trap',
  uroven: 3,
  nazvanie: 'Вписанная окружность прямоугольной трапеции',
  /* OC : OD = 3 : 4 — CD целое, r и площадь — конечные десятичные. */
  varianty: [
    { OC: 15, OD: 20 },
    { OC: 6, OD: 8 },
    { OC: 9, OD: 12 },
  ],
  uslovie:
    'В прямоугольную трапецию $ABCD$ с основаниями $AD$ и $BC$ и прямыми углами при вершинах $A$ и $B$ вписана окружность с центром $O$.',
  a: 'Докажите, что угол $COD$ прямой.',
  b: (p) => `Найдите площадь трапеции, если $OC = ${p.OC}$ и $OD = ${p.OD}$.`,
  skhemy: [
    {
      id: 'otrezki-kasatelnyh',
      zachem:
        'центр вписанной окружности лежит на биссектрисах углов, а у описанного четырёхугольника суммы противоположных сторон равны',
    },
    {
      id: 'metod-ploshchadey',
      zachem: 'радиус — высота прямоугольного треугольника $COD$, проведённая к гипотенузе',
    },
  ],
  podskazka:
    'Центр вписанной окружности лежит на биссектрисах углов $C$ и $D$. Чему равна сумма углов $C$ и $D$ трапеции?',
  dokazatelstvo: [
    {
      tekst:
        'Центр вписанной окружности равноудалён от сторон угла, поэтому $CO$ и $DO$ — биссектрисы углов $BCD$ и $CDA$.',
      gruppy: ['bis'],
    },
    {
      tekst:
        'Углы $C$ и $D$ — односторонние при параллельных $BC$ и $AD$: $\\angle C + \\angle D = 180^\\circ$. Тогда $\\angle OCD + \\angle ODC = 90^\\circ$, и в треугольнике $COD$ угол $COD$ равен $90^\\circ$.',
      gruppy: ['prya'],
    },
  ],
  reshenieB: (p) => {
    const CD = Math.sqrt(p.OC! ** 2 + p.OD! ** 2);
    const r = (p.OC! * p.OD!) / CD;
    return [
      {
        tekst: `По пункту а) треугольник $COD$ прямоугольный: $CD = \\sqrt{${p.OC}^2 + ${p.OD}^2} = ${ch(CD)}$. Радиус $OE$, проведённый в точку касания $E$ на $CD$, — высота этого треугольника: $r = \\dfrac{${p.OC}\\cdot ${p.OD}}{${ch(CD)}} = ${ch(r)}$.`,
        gruppy: ['r'],
      },
      {
        tekst: `Высота трапеции — диаметр: $AB = 2r = ${ch(2 * r)}$. Суммы противоположных сторон описанного четырёхугольника равны: $AD + BC = AB + CD = ${ch(2 * r + CD)}$.`,
        gruppy: ['pito'],
      },
      {
        tekst: `$S = \\dfrac{AD + BC}{2}\\cdot AB = \\dfrac{${ch(2 * r + CD)}}{2}\\cdot ${ch(2 * r)} = ${ch((2 * r + CD) * r)}$.`,
        gruppy: ['pito'],
      },
    ];
  },
  otvet: (p) => {
    const CD = Math.sqrt(p.OC! ** 2 + p.OD! ** 2);
    const r = (p.OC! * p.OD!) / CD;
    /* Ответ — конечная десятичная дробь: убираем погрешность корня. */
    return Math.round((2 * r + CD) * r * 1e6) / 1e6;
  },
};
