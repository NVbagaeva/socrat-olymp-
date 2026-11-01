/**
 * Схема 8 «Углы между хордами и секущими». Проверка:
 * scripts/verify_schemes/uglyDugi.mjs.
 */

import type { Skhema18 } from './tipy';

export const SKHEMA_UGLY_DUGI: Skhema18 = {
  id: 'ugly-i-dugi',
  no: 8,
  gruppa: 'okruzhnost',
  nazvanie: 'Углы между хордами и секущими',
  sut: 'Угол между хордами — полусумма дуг, угол между секущими — полуразность дуг.',
  dano: 'Прямые $AB$ и $CD$ пересекают окружность и пересекаются в точке $M$. Дуги $AD$ и $BC$ — те, что заключены между сторонами угла $AMD$ и вертикального к нему (или между сторонами угла, если $M$ снаружи).',
  sledstviya: [
    {
      tekst:
        '**Хорды** пересекаются внутри круга: $\\angle AMD = \\dfrac{\\smile AD + \\smile BC}{2}$.',
      gruppy: ['hordy'],
    },
    {
      tekst:
        '**Секущие** пересекаются вне круга: $\\angle AMD = \\dfrac{\\smile AD - \\smile BC}{2}$ (бо́льшая дуга минус меньшая). Перетащи $M$ из круга наружу.',
      gruppy: ['sekushchie'],
    },
  ],
  dokazatelstvo: [
    {
      tekst:
        'Оба случая доказываются одним дополнительным построением — хордой $BD$. Вписанные углы: $\\angle ABD = \\dfrac{\\smile AD}{2}$, $\\angle CDB = \\dfrac{\\smile BC}{2}$.',
      gruppy: ['vpisannyy'],
    },
    {
      tekst:
        '$M$ внутри круга: $\\angle AMD$ — внешний угол треугольника $BMD$, он равен сумме двух углов, не смежных с ним: $\\angle AMD = \\angle MBD + \\angle MDB = \\dfrac{\\smile AD}{2} + \\dfrac{\\smile BC}{2}$.',
      gruppy: ['dok', 'hordy'],
    },
    {
      tekst:
        '$M$ вне круга: теперь внешний угол треугольника $BMD$ — это $\\angle ABD$: $\\angle ABD = \\angle BMD + \\angle BDM$. Отсюда $\\angle AMD = \\angle ABD - \\angle BDC = \\dfrac{\\smile AD}{2} - \\dfrac{\\smile BC}{2}$.',
      gruppy: ['dok', 'sekushchie'],
    },
  ],
  kakUznat: [
    'Дан **угол с вершиной не на окружности**, а его стороны пересекают окружность.',
    'Известны градусные меры дуг или вписанных углов, а спрашивают угол между хордами или секущими.',
  ],
  gde: [
    {
      punkt: 'а',
      tekst:
        'Докажите, что угол между хордами равен данному углу или что две прямые перпендикулярны.',
    },
    {
      punkt: 'б',
      tekst: 'Найдите угол между хордами или секущими по дугам (или найдите дугу по углу).',
    },
  ],
  zapominalka:
    '**Внутри — полусумма, снаружи — полуразность.** Вершина на окружности — просто половина дуги.',
  kartochka: [
    'хорды: $\\angle = \\dfrac{\\smile AD + \\smile BC}{2}$',
    'секущие: $\\angle = \\dfrac{\\smile AD - \\smile BC}{2}$',
    'доп. построение — хорда $BD$',
  ],
};
