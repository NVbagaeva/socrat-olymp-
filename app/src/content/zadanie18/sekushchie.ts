/**
 * Схема 4 «Две секущие из одной точки» (и пересекающиеся хорды).
 * Каждое утверждение проверено численно: scripts/verify_schemes/sekushchie.mjs.
 */

import type { Skhema18 } from './tipy';

export const SKHEMA_SEKUSHCHIE: Skhema18 = {
  id: 'dve-sekushchie',
  no: 4,
  gruppa: 'okruzhnost',
  nazvanie: 'Две секущие из одной точки',
  sut: 'Две секущие из одной точки дают подобные треугольники и равенство $MA\\cdot MB = MC\\cdot MD$. Для пересекающихся хорд — то же самое.',
  dano: 'Из точки $M$ проведены две секущие: луч $MA$ пересекает окружность в точках $B$ и $A$, луч $MD$ — в точках $C$ и $D$; $MA > MB$, $MD > MC$.',
  sledstviya: [
    {
      tekst:
        '$\\triangle BMC \\sim \\triangle DMA$: $\\angle MBC = \\angle MDA$, $\\angle MCB = \\angle MAD$.',
      gruppy: ['podobie'],
    },
    {
      tekst:
        '$MA\\cdot MB = MC\\cdot MD$: произведение секущей на её внешнюю часть одно и то же для всех секущих из точки $M$.',
      gruppy: ['proizv'],
    },
    {
      tekst:
        'Если $M$ внутри окружности (хорды $AB$ и $CD$ пересекаются в $M$), то тоже $\\triangle BMC \\sim \\triangle DMA$ и $MA\\cdot MB = MC\\cdot MD$ — произведения отрезков хорд равны. Перетащи $M$ внутрь круга.',
      gruppy: ['hordy'],
    },
  ],
  dokazatelstvo: [
    {
      tekst:
        'Четырёхугольник $ABCD$ вписан в окружность, поэтому $\\angle BAD + \\angle BCD = 180^\\circ$. Угол $BCM$ смежный с углом $BCD$, значит, $\\angle MCB = \\angle BAD = \\angle MAD$.',
      gruppy: ['vpisannyy'],
    },
    {
      tekst:
        'В треугольниках $BMC$ и $DMA$ угол $M$ общий и $\\angle MCB = \\angle MAD$. Они подобны по двум углам ($B \\to D$, $M \\to M$, $C \\to A$), и заодно $\\angle MBC = \\angle MDA$.',
      gruppy: ['podobie'],
    },
    {
      tekst: 'Из подобия $\\dfrac{MB}{MD} = \\dfrac{MC}{MA}$, то есть $MA\\cdot MB = MC\\cdot MD$.',
      gruppy: ['proizv', 'podobie'],
    },
    {
      tekst:
        'Для хорд, пересекающихся в $M$: углы $BMC$ и $DMA$ вертикальные, а $\\angle MCB = \\angle DCB$ и $\\angle MAD = \\angle BAD$ — вписанные углы, опирающиеся на одну дугу $BD$. Треугольники снова подобны, и $MA\\cdot MB = MC\\cdot MD$.',
      gruppy: ['hordy'],
    },
  ],
  kakUznat: [
    'Из одной точки к окружности проведены **две прямые**, и каждая пересекает её дважды.',
    'Две **хорды пересекаются**, и известны отрезки одной из них.',
    'Нужно найти отрезок секущей или хорды по трём другим отрезкам.',
  ],
  gde: [
    { punkt: 'а', tekst: 'Докажите, что треугольники с общей вершиной $M$ подобны.' },
    { punkt: 'а', tekst: 'Докажите, что $MA\\cdot MB = MC\\cdot MD$.' },
    { punkt: 'б', tekst: 'Найдите отрезок секущей или хорды, если известны три остальных.' },
    {
      punkt: 'б',
      tekst: 'Найдите отношение площадей треугольников $BMC$ и $DMA$ через коэффициент подобия.',
    },
  ],
  zapominalka:
    '**Ближний отрезок на дальний — одно и то же** для любой секущей из точки $M$: $MA\\cdot MB = MC\\cdot MD$.',
  kartochka: [
    '$\\triangle BMC \\sim \\triangle DMA$',
    '$MA\\cdot MB = MC\\cdot MD$',
    'для пересекающихся хорд — то же самое',
  ],
};
