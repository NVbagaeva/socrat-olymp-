/**
 * Опорные задачи №18, тема «Окружность и вписанные углы». Составлены
 * для сайта. Проверка: scripts/verify_opornye18/okruzhnost.mjs.
 */

import type { Opornaya18 } from './tipy';

export const OP18_TREZUBEC: Opornaya18 = {
  id: 'trezubec-incentr',
  no: 4,
  gruppa: 'okruzhnost',
  nazvanie: 'Биссектриса до описанной окружности',
  uslovie:
    'Биссектриса угла $A$ треугольника $ABC$ пересекает описанную около него окружность в точке $W$, точка $I$ — центр окружности, вписанной в треугольник $ABC$.',
  a: 'Докажите, что $WB = WI = WC$.',
  b: 'Найдите $WI$, если $BC = 8$ и $\\angle BAC = 60^\\circ$.',
  skhemy: [
    { id: 'trezubec', zachem: 'это и есть лемма о трезубце: $W$ равноудалена от $B$, $C$ и $I$' },
    { id: 'ugly-i-dugi', zachem: 'равные вписанные углы опираются на равные дуги и хорды' },
  ],
  reshenieA: [
    {
      tekst:
        'Вписанные углы $BAW$ и $WAC$ равны (биссектриса), значит, равны дуги $BW$ и $WC$, на которые они опираются, и стягивающие их хорды: $WB = WC$.',
      gruppy: ['dugi'],
    },
    {
      tekst:
        'Обозначим углы треугольника $2\\alpha$, $2\\beta$, $2\\gamma$ при вершинах $A$, $B$, $C$. Точка $I$ лежит на биссектрисе $BI$, поэтому $\\angle WBI = \\angle WBC + \\angle CBI$. Вписанные углы $WBC$ и $WAC$ опираются на одну дугу $WC$, так что $\\angle WBI = \\alpha + \\beta$.',
      gruppy: ['ugly-b'],
    },
    {
      tekst:
        'Угол $WIB$ — внешний угол треугольника $ABI$: $\\angle WIB = \\angle BAI + \\angle ABI = \\alpha + \\beta$.',
      gruppy: ['ugly-i'],
    },
    {
      tekst:
        'В треугольнике $WBI$ углы при $B$ и $I$ равны, он равнобедренный: $WB = WI$. Вместе с первым шагом $WB = WI = WC$.',
      gruppy: ['rb'],
    },
  ],
  reshenieB: [
    {
      tekst:
        '$\\angle WBC = \\angle WAC = 30^\\circ$ (опираются на дугу $WC$), и так же $\\angle WCB = \\angle WAB = 30^\\circ$. Треугольник $BWC$ равнобедренный с основанием $BC = 8$ и углами при основании $30^\\circ$.',
      gruppy: ['bwc'],
    },
    {
      tekst:
        'Высота из $W$ делит основание пополам: $WB = \\dfrac{BC/2}{\\cos 30^\\circ} = \\dfrac{4}{\\frac{\\sqrt3}{2}} = \\dfrac{8\\sqrt3}{3}$.',
      gruppy: ['bwc'],
    },
    {
      tekst: 'По пункту а) $WI = WB = \\dfrac{8\\sqrt3}{3}$.',
      gruppy: ['rb'],
    },
  ],
  otvet: '$\\dfrac{8\\sqrt3}{3}$',
};

export const OP18_KVADRAT: Opornaya18 = {
  id: 'kvadrat-na-gipotenuze',
  no: 5,
  gruppa: 'okruzhnost',
  nazvanie: 'Квадрат на гипотенузе',
  uslovie:
    'На гипотенузе $AB$ прямоугольного треугольника $ABC$ вне его построен квадрат $ABDE$; $O$ — центр квадрата.',
  a: 'Докажите, что $CO$ — биссектриса угла $ACB$.',
  b: 'Найдите $CO$, если $AC = 6$ и $BC = 8$.',
  skhemy: [
    {
      id: 'pryamye-ugly',
      zachem:
        'из $C$ и $O$ гипотенуза видна под прямым углом — обе точки на окружности с диаметром $AB$',
    },
    {
      id: 'ugly-i-dugi',
      zachem: 'равные хорды $OA$ и $OB$ стягивают равные дуги, на них опираются равные углы',
    },
  ],
  reshenieA: [
    {
      tekst:
        '$\\angle ACB = 90^\\circ$ по условию, $\\angle AOB = 90^\\circ$, потому что диагонали квадрата перпендикулярны. Значит, точки $C$ и $O$ лежат на окружности с диаметром $AB$, причём по разные стороны от $AB$.',
      gruppy: ['okr'],
    },
    {
      tekst:
        '$OA = OB$ (половины равных диагоналей квадрата). Равные хорды стягивают равные дуги, поэтому вписанные углы $ACO$ и $OCB$, которые на них опираются, равны. Значит, $CO$ — биссектриса угла $ACB$.',
      gruppy: ['hord', 'bis'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'По теореме Пифагора $AB = \\sqrt{6^2 + 8^2} = 10$, поэтому $AO = \\dfrac{AB}{\\sqrt2} = 5\\sqrt2$. По пункту а) $\\angle ACO = 45^\\circ$.',
      gruppy: ['aco'],
    },
    {
      tekst:
        'Пусть $CO = x$. Теорема косинусов в треугольнике $ACO$: $AO^2 = AC^2 + CO^2 - 2\\cdot AC\\cdot CO\\cos 45^\\circ$, то есть $50 = 36 + x^2 - 6\\sqrt2\\,x$.',
      gruppy: ['aco'],
    },
    {
      tekst:
        '$x^2 - 6\\sqrt2\\,x - 14 = 0$, $x = \\dfrac{6\\sqrt2 + \\sqrt{72 + 56}}{2} = \\dfrac{6\\sqrt2 + 8\\sqrt2}{2} = 7\\sqrt2$; второй корень отрицательный.',
      gruppy: ['aco', 'bis'],
    },
  ],
  otvet: '$7\\sqrt2$',
};

export const OP18_DVE_VERSHINY: Opornaya18 = {
  id: 'okruzhnost-cherez-dve-vershiny',
  no: 6,
  gruppa: 'okruzhnost',
  nazvanie: 'Окружность через две вершины треугольника',
  uslovie:
    'Окружность проходит через вершины $A$ и $C$ треугольника $ABC$ и пересекает стороны $AB$ и $BC$ в точках $K$ и $M$ соответственно.',
  a: 'Докажите, что треугольник $BMK$ подобен треугольнику $BAC$.',
  b: 'Найдите $KM$, если $AB = 15$, $BC = 10$, $AC = 12$ и $BK = 4$.',
  skhemy: [
    {
      id: 'chetyrekhugolniki',
      zachem:
        'у вписанного четырёхугольника $AKMC$ внешний угол равен внутреннему противоположному',
    },
    {
      id: 'dve-sekushchie',
      zachem: 'две секущие $BA$ и $BC$ из одной точки отсекают подобные треугольники',
    },
  ],
  reshenieA: [
    {
      tekst:
        'Четырёхугольник $AKMC$ вписан в окружность, поэтому $\\angle AKM + \\angle ACM = 180^\\circ$. Смежный угол $BKM = 180^\\circ - \\angle AKM = \\angle ACB$.',
      gruppy: ['ugol'],
    },
    {
      tekst:
        'Угол $B$ у треугольников $BMK$ и $BAC$ общий, и $\\angle BKM = \\angle BCA$. По двум углам $\\triangle BMK \\sim \\triangle BAC$ (вершина $K$ соответствует $C$, вершина $M$ — вершине $A$).',
      gruppy: ['pod'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'Из соответствия вершин: $\\dfrac{BK}{BC} = \\dfrac{BM}{BA} = \\dfrac{KM}{CA} = k$, и $k = \\dfrac{BK}{BC} = \\dfrac{4}{10} = \\dfrac25$.',
      gruppy: ['pod'],
    },
    {
      tekst:
        '$KM = k\\cdot AC = \\dfrac25\\cdot 12 = \\dfrac{24}{5}$. Заодно $BM = k\\cdot BA = 6 < BC$: точка $M$ действительно на стороне $BC$.',
      gruppy: ['koef'],
    },
  ],
  otvet: '$\\dfrac{24}{5}$',
};
